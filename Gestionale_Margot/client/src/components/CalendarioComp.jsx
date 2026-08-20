import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Button, Table, Alert, Spinner, Badge, Modal, Form, Nav } from 'react-bootstrap';
import { API_URL } from '../config';
import { formatDataIT } from '../dateUtils';

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];
const TIPI_SUGGERITI = ['Concerto', 'Festa privata', 'DJ set', 'Presentazione', 'Mostra', 'Altro'];

// Formatta una Date in 'YYYY-MM-DD' usando l'ora locale (evita i disallineamenti di toISOString con UTC)
function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Costruisce la griglia del mese: settimane di 7 giorni (lun-dom), incluso il padding
// con i giorni del mese precedente/successivo per riempire le celle vuote.
function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=domenica..6=sabato -> convertiamo a 0=lunedì..6=domenica
  const startOffset = (firstOfMonth.getDay() + 6) % 7;

  const gridStart = new Date(year, month, 1 - startOffset);

  const weeks = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function Calendario({ user }) {
  const oggi = new Date();
  const [meseVisto, setMeseVisto] = useState(new Date(oggi.getFullYear(), oggi.getMonth(), 1));
  const [eventi, setEventi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('calendario');

  const [giornoSelezionato, setGiornoSelezionato] = useState(null);
  const [showGiornoModal, setShowGiornoModal] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [eventoInModifica, setEventoInModifica] = useState(null); // null = nuovo evento

  const [notifiche, setNotifiche] = useState([]);
  const [loadingNotifiche, setLoadingNotifiche] = useState(false);

  const [pagamenti, setPagamenti] = useState([]);
  const [loadingPagamenti, setLoadingPagamenti] = useState(false);

  // evento_id -> array di iscritti, caricato on-demand quando lo si consulta
  const [iscrittiPerEvento, setIscrittiPerEvento] = useState({});
  const [eventoIscrittiEspanso, setEventoIscrittiEspanso] = useState(null);

  const puoGestireEventi = user?.ruolo === 'eventi' || user?.ruolo === 'amministrazione';
  const puoVedereBacheca = user?.ruolo === 'grafica' || user?.ruolo === 'amministrazione';
  const puoVederePagamenti = user?.ruolo === 'amministrazione';
  const isVolontario = user?.ruolo === 'volontari';

  // Chi può vedere gli indicatori di stato sui singoli eventi nel calendario
  const puoVedereStatoGrafica = ['eventi', 'amministrazione', 'grafica'].includes(user?.ruolo);
  const puoVedereStatoPagamento = ['eventi', 'amministrazione'].includes(user?.ruolo);

  const fetchEventi = async () => {
    try {
      const response = await fetch(`${API_URL}/api/eventi`, { credentials: 'include' });
      if (!response.ok) throw new Error('Errore nel caricamento degli eventi');
      const data = await response.json();
      setEventi(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifiche = async () => {
    setLoadingNotifiche(true);
    try {
      const response = await fetch(`${API_URL}/api/notifiche-grafica`, { credentials: 'include' });
      if (!response.ok) throw new Error('Errore nel caricamento della bacheca');
      const data = await response.json();
      setNotifiche(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingNotifiche(false);
    }
  };

  const fetchPagamenti = async () => {
    setLoadingPagamenti(true);
    try {
      const response = await fetch(`${API_URL}/api/notifiche-pagamento`, { credentials: 'include' });
      if (!response.ok) throw new Error('Errore nel caricamento dei pagamenti');
      const data = await response.json();
      setPagamenti(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPagamenti(false);
    }
  };

  useEffect(() => {
    fetchEventi();
  }, []);

  useEffect(() => {
    if (tab === 'grafica' && puoVedereBacheca) fetchNotifiche();
    if (tab === 'pagamenti' && puoVederePagamenti) fetchPagamenti();
  }, [tab]);

  // Raggruppa gli eventi per data (YYYY-MM-DD) per un accesso rapido dalla griglia
  const eventiPerGiorno = useMemo(() => {
    const mappa = {};
    eventi.forEach((ev) => {
      const key = ev.data_evento;
      if (!mappa[key]) mappa[key] = [];
      mappa[key].push(ev);
    });
    return mappa;
  }, [eventi]);

  const settimane = useMemo(
    () => buildMonthGrid(meseVisto.getFullYear(), meseVisto.getMonth()),
    [meseVisto]
  );

  const cambiaMese = (delta) => {
    setMeseVisto(new Date(meseVisto.getFullYear(), meseVisto.getMonth() + delta, 1));
  };

  const apriGiorno = (data) => {
    setGiornoSelezionato(data);
    setShowGiornoModal(true);
  };

  const apriNuovoEvento = (dataPrecompilata) => {
    setEventoInModifica({
      nome: '',
      tipo: '',
      costo: '',
      data_evento: dataPrecompilata ? toDateKey(dataPrecompilata) : toDateKey(new Date())
    });
    setShowFormModal(true);
  };

  const apriModificaEvento = (evento) => {
    setEventoInModifica(evento);
    setShowGiornoModal(false);
    setShowFormModal(true);
  };

  const handleSalvaEvento = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      nome: formData.get('nome'),
      tipo: formData.get('tipo'),
      costo: parseFloat(formData.get('costo')) || 0,
      data_evento: formData.get('data_evento'),
      max_volontari: parseInt(formData.get('max_volontari'), 10) || 0
    };

    const isModifica = Boolean(eventoInModifica?.id);
    const url = isModifica ? `${API_URL}/api/eventi/${eventoInModifica.id}` : `${API_URL}/api/eventi`;
    const method = isModifica ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Errore durante il salvataggio');
      }
      setShowFormModal(false);
      setEventoInModifica(null);
      fetchEventi();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEliminaEvento = async (id) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo evento? Verrà rimossa anche la notifica collegata per il team Grafica.")) return;
    try {
      const response = await fetch(`${API_URL}/api/eventi/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Errore durante l'eliminazione");
      setShowGiornoModal(false);
      fetchEventi();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompletaNotifica = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/notifiche-grafica/${id}/completa`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Errore durante l'aggiornamento");
      fetchNotifiche();
      fetchEventi(); // Aggiorna anche lo stato degli eventi nel calendario
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSegnaPagato = async (id) => {
    if (!window.confirm('Confermi di aver effettuato il pagamento per questo evento?')) return;
    try {
      const response = await fetch(`${API_URL}/api/notifiche-pagamento/${id}/paga`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Errore durante l'aggiornamento");
      fetchPagamenti();
      fetchEventi(); // Aggiorna anche lo stato degli eventi nel calendario
    } catch (err) {
      alert(err.message);
    }
  };

  const handleIscriviti = async (eventoId) => {
    try {
      const response = await fetch(`${API_URL}/api/eventi/${eventoId}/iscrizione`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Errore durante l'iscrizione");
      fetchEventi();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancellaIscrizione = async (eventoId) => {
    if (!window.confirm('Vuoi annullare la tua iscrizione a questo evento?')) return;
    try {
      const response = await fetch(`${API_URL}/api/eventi/${eventoId}/iscrizione`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Errore durante l'annullamento");
      fetchEventi();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleIscrittiEvento = async (eventoId) => {
    if (eventoIscrittiEspanso === eventoId) {
      setEventoIscrittiEspanso(null);
      return;
    }
    setEventoIscrittiEspanso(eventoId);
    if (!iscrittiPerEvento[eventoId]) {
      try {
        const response = await fetch(`${API_URL}/api/eventi/${eventoId}/iscritti`, { credentials: 'include' });
        if (!response.ok) throw new Error("Errore nel caricamento degli iscritti");
        const data = await response.json();
        setIscrittiPerEvento((prev) => ({ ...prev, [eventoId]: data }));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const giorniRimanenti = (scadenza) => {
    const diffMs = new Date(scadenza).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Icone compatte di stato da mostrare sulla pillola dell'evento nel calendario
  const iconeStato = (ev) => {
    const icone = [];
    if (puoVedereStatoGrafica && ev.grafica_stato) {
      const pronta = ev.grafica_stato === 'completato';
      icone.push(
        <i
          key="grafica"
          className={`bi ${pronta ? 'bi-easel-fill' : 'bi-easel'} calendar-status-icon ${pronta ? 'calendar-status-icon--ok' : 'calendar-status-icon--pending'}`}
          title={pronta ? 'Grafica pronta' : 'Grafica in lavorazione'}
        ></i>
      );
    }
    if (puoVedereStatoPagamento && ev.pagamento_stato) {
      const pagato = ev.pagamento_stato === 'pagato';
      icone.push(
        <i
          key="pagamento"
          className={`bi ${pagato ? 'bi-coin' : 'bi-exclamation-circle'} calendar-status-icon ${pagato ? 'calendar-status-icon--ok' : 'calendar-status-icon--pending'}`}
          title={pagato ? 'Pagato' : 'Da pagare'}
        ></i>
      );
    }
    return icone;
  };

  const badgeScadenza = (scadenza, stato) => {
    if (stato === 'completato') return <Badge bg="secondary">Completato</Badge>;
    const giorni = giorniRimanenti(scadenza);
    if (giorni < 0) return <Badge bg="danger">Scaduto</Badge>;
    if (giorni <= 2) return <Badge bg="danger">{giorni} {giorni === 1 ? 'giorno' : 'giorni'} rimasti</Badge>;
    if (giorni <= 4) return <Badge bg="warning" text="dark">{giorni} giorni rimasti</Badge>;
    return <Badge bg="success">{giorni} giorni rimasti</Badge>;
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-2">Caricamento calendario in corso...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-calendar-event"></i> Eventi Margot
          </h2>
        </Col>
        <Col xs="auto">
          {puoGestireEventi && tab === 'calendario' && (
            <Button variant="success" onClick={() => apriNuovoEvento(null)}>
              <i className="bi bi-plus-circle me-1"></i> Nuovo Evento
            </Button>
          )}
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      {(puoVedereBacheca || puoVederePagamenti) && (
        <Nav variant="tabs" activeKey={tab} onSelect={(k) => setTab(k)} className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="calendario">
              <i className="bi bi-calendar3 me-1"></i> Calendario
            </Nav.Link>
          </Nav.Item>
          {puoVedereBacheca && (
            <Nav.Item>
              <Nav.Link eventKey="grafica">
                <i className="bi bi-easel me-1"></i> Bacheca Grafica
              </Nav.Link>
            </Nav.Item>
          )}
          {puoVederePagamenti && (
            <Nav.Item>
              <Nav.Link eventKey="pagamenti">
                <i className="bi bi-cash-coin me-1"></i> Pagamenti
              </Nav.Link>
            </Nav.Item>
          )}
        </Nav>
      )}

      {tab === 'calendario' && (
        <>
          <Row className="mb-3 align-items-center">
            <Col xs="auto">
              <Button variant="outline-warning" size="sm" onClick={() => cambiaMese(-1)}>
                <i className="bi bi-chevron-left"></i>
              </Button>
            </Col>
            <Col className="text-center">
              <h4 className="mb-0 text-capitalize">{MESI[meseVisto.getMonth()]} {meseVisto.getFullYear()}</h4>
            </Col>
            <Col xs="auto">
              <Button variant="outline-warning" size="sm" onClick={() => cambiaMese(1)}>
                <i className="bi bi-chevron-right"></i>
              </Button>
            </Col>
          </Row>

          <div className="calendar-grid">
            {GIORNI_SETTIMANA.map((g) => (
              <div key={g} className="calendar-weekday">{g}</div>
            ))}

            {settimane.flat().map((data, idx) => {
              const key = toDateKey(data);
              const eventiGiorno = eventiPerGiorno[key] || [];
              const fuoriMese = data.getMonth() !== meseVisto.getMonth();
              const isOggi = key === toDateKey(oggi);

              return (
                <div
                  key={idx}
                  className={`calendar-day ${fuoriMese ? 'calendar-day--muted' : ''} ${isOggi ? 'calendar-day--today' : ''}`}
                  onClick={() => (eventiGiorno.length > 0 ? apriGiorno(data) : puoGestireEventi ? apriNuovoEvento(data) : null)}
                  role="button"
                >
                  <span className="calendar-day-number">{data.getDate()}</span>
                  <div className="calendar-day-events">
                    {eventiGiorno.slice(0, 2).map((ev) => (
                      <span key={ev.id} className="calendar-event-pill" title={ev.nome}>
                        {ev.nome}
                        {iconeStato(ev).length > 0 && (
                          <span className="calendar-status-icons">{iconeStato(ev)}</span>
                        )}
                      </span>
                    ))}
                    {eventiGiorno.length > 2 && (
                      <span className="calendar-event-more">+{eventiGiorno.length - 2} altri</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'grafica' && (
        loadingNotifiche ? (
          <div className="text-center py-5"><Spinner animation="border" variant="warning" /></div>
        ) : (
          <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
            <thead className="table-dark">
              <tr>
                <th>Evento</th>
                <th>Tipo</th>
                <th>Data evento</th>
                <th>Scadenza grafica</th>
                <th className="text-center">Stato</th>
                <th className="text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {notifiche.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">Nessuna notifica al momento.</td>
                </tr>
              ) : (
                notifiche.map((n) => (
                  <tr key={n.id}>
                    <td className="fw-bold">{n.nome}</td>
                    <td>{n.tipo}</td>
                    <td>{formatDataIT(n.data_evento)}</td>
                    <td>{formatDataIT(n.scadenza)}</td>
                    <td className="text-center">{badgeScadenza(n.scadenza, n.stato)}</td>
                    <td className="text-center">
                      {n.stato !== 'completato' && (
                        <Button size="sm" variant="outline-success" onClick={() => handleCompletaNotifica(n.id)}>
                          <i className="bi bi-check-lg me-1"></i> Segna completato
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )
      )}

      {tab === 'pagamenti' && (
        loadingPagamenti ? (
          <div className="text-center py-5"><Spinner animation="border" variant="warning" /></div>
        ) : (
          <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
            <thead className="table-dark">
              <tr>
                <th>Evento</th>
                <th>Tipo</th>
                <th>Data evento</th>
                <th className="text-end">Costo da coprire</th>
                <th className="text-center">Stato</th>
                <th className="text-center">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {pagamenti.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">Nessun pagamento da gestire al momento.</td>
                </tr>
              ) : (
                pagamenti.map((p) => (
                  <tr key={p.id}>
                    <td className="fw-bold">{p.nome}</td>
                    <td>{p.tipo}</td>
                    <td>{formatDataIT(p.data_evento)}</td>
                    <td className="text-end fw-bold">€{Number(p.costo).toFixed(2)}</td>
                    <td className="text-center">
                      {p.stato === 'pagato' ? (
                        <Badge bg="secondary">
                          <i className="bi bi-check-circle me-1"></i>Pagato
                        </Badge>
                      ) : (
                        <Badge bg="danger">Da pagare</Badge>
                      )}
                    </td>
                    <td className="text-center">
                      {p.stato !== 'pagato' && (
                        <Button size="sm" variant="outline-success" onClick={() => handleSegnaPagato(p.id)}>
                          <i className="bi bi-check-lg me-1"></i> Segna come pagato
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )
      )}

      {/* MODALE: eventi del giorno selezionato */}
      <Modal show={showGiornoModal} onHide={() => setShowGiornoModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {giornoSelezionato && giornoSelezionato.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {giornoSelezionato && (eventiPerGiorno[toDateKey(giornoSelezionato)] || []).map((ev) => (
            <div key={ev.id} className="evento-dettaglio mb-3 pb-3 border-bottom">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">{ev.nome}</h5>
                  <div className="text-muted small mb-1">{ev.tipo} · €{Number(ev.costo).toFixed(2)}</div>
                  <div className="text-muted small mb-2">Creato da {ev.creato_da_username}</div>
                  {(puoVedereStatoGrafica || puoVedereStatoPagamento) && (
                    <div className="d-flex gap-2 flex-wrap mb-2">
                      {puoVedereStatoGrafica && ev.grafica_stato && (
                        <Badge bg={ev.grafica_stato === 'completato' ? 'success' : 'warning'} text={ev.grafica_stato === 'completato' ? undefined : 'dark'}>
                          <i className="bi bi-easel me-1"></i>
                          {ev.grafica_stato === 'completato' ? 'Grafica pronta' : 'Grafica in lavorazione'}
                        </Badge>
                      )}
                      {puoVedereStatoPagamento && ev.pagamento_stato && (
                        <Badge bg={ev.pagamento_stato === 'pagato' ? 'success' : 'danger'}>
                          <i className="bi bi-cash-coin me-1"></i>
                          {ev.pagamento_stato === 'pagato' ? 'Pagato' : 'Da pagare'}
                        </Badge>
                      )}
                    </div>
                  )}

                  {ev.max_volontari > 0 && (
                    <div className="mb-2">
                      <Badge bg={ev.iscritti_count >= ev.max_volontari ? 'danger' : 'info'} text={ev.iscritti_count >= ev.max_volontari ? undefined : 'dark'}>
                        <i className="bi bi-people me-1"></i>
                        {ev.iscritti_count}/{ev.max_volontari} volontari
                      </Badge>

                      {isVolontario && (
                        <div className="mt-2">
                          {ev.iscritto ? (
                            <Button size="sm" variant="outline-danger" onClick={() => handleCancellaIscrizione(ev.id)}>
                              <i className="bi bi-x-circle me-1"></i> Annulla iscrizione
                            </Button>
                          ) : ev.iscritti_count >= ev.max_volontari ? (
                            <Button size="sm" variant="secondary" disabled>Posti esauriti</Button>
                          ) : (
                            <Button size="sm" variant="outline-success" onClick={() => handleIscriviti(ev.id)}>
                              <i className="bi bi-check-circle me-1"></i> Iscriviti
                            </Button>
                          )}
                        </div>
                      )}

                      {puoGestireEventi && (
                        <div className="mt-2">
                          <Button size="sm" variant="link" className="p-0" onClick={() => toggleIscrittiEvento(ev.id)}>
                            {eventoIscrittiEspanso === ev.id ? 'Nascondi iscritti' : 'Vedi chi si è iscritto'}
                          </Button>
                          {eventoIscrittiEspanso === ev.id && (
                            <ul className="small mb-0 mt-1">
                              {(iscrittiPerEvento[ev.id] || []).length === 0 ? (
                                <li className="text-muted">Nessun iscritto ancora.</li>
                              ) : (
                                iscrittiPerEvento[ev.id].map((iscritto) => (
                                  <li key={iscritto.id}>{iscritto.username}</li>
                                ))
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {puoGestireEventi && (
                  <div className="text-nowrap">
                    <Button size="sm" variant="outline-warning" className="me-2" onClick={() => apriModificaEvento(ev)}>
                      <i className="bi bi-pencil"></i>
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleEliminaEvento(ev.id)}>
                      <i className="bi bi-trash3"></i>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {puoGestireEventi && (
            <Button variant="success" size="sm" onClick={() => apriNuovoEvento(giornoSelezionato)}>
              <i className="bi bi-plus-circle me-1"></i> Aggiungi un altro evento in questo giorno
            </Button>
          )}
        </Modal.Body>
      </Modal>

      {/* MODALE: crea / modifica evento */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-calendar-plus me-2"></i>
            {eventoInModifica?.id ? 'Modifica Evento' : 'Nuovo Evento'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSalvaEvento}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome evento</Form.Label>
              <Form.Control
                name="nome"
                type="text"
                required
                defaultValue={eventoInModifica?.nome}
                placeholder="Es. Karaoke Night"
              />
            </Form.Group>
            <Row>
              <Col md={7}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo</Form.Label>
                  <Form.Control
                    name="tipo"
                    type="text"
                    required
                    list="tipi-evento"
                    defaultValue={eventoInModifica?.tipo}
                    placeholder="Es. Concerto"
                  />
                  <datalist id="tipi-evento">
                    {TIPI_SUGGERITI.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group className="mb-3">
                  <Form.Label>Costo (€)</Form.Label>
                  <Form.Control
                    name="costo"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={eventoInModifica?.costo}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Data evento</Form.Label>
              <Form.Control
                name="data_evento"
                type="date"
                required
                defaultValue={eventoInModifica?.data_evento}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Volontari richiesti</Form.Label>
              <Form.Control
                name="max_volontari"
                type="number"
                min="0"
                defaultValue={eventoInModifica?.max_volontari || 0}
                placeholder="0"
              />
              <Form.Text className="text-muted">0 se per questo evento non servono volontari.</Form.Text>
            </Form.Group>
            {!eventoInModifica?.id && (
              <Alert variant="warning" className="mb-0 py-2 small">
                <i className="bi bi-easel me-1"></i>
                Alla creazione, il team Grafica riceverà una notifica con 7 giorni di tempo per lavorarci.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFormModal(false)}>Annulla</Button>
            <Button variant="success" type="submit">Salva Evento</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export { Calendario };
