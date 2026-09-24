import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Alert, ListGroup, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { formatDataIT } from '../dateUtils';

const oggiChiave = () => new Date(new Date().toDateString());

function Dashboard({ user }) {
  const ruolo = user?.ruolo;
  const isAmministrazione = ruolo === 'amministrazione';
  const isBar = ruolo === 'bar';
  const isEventi = ruolo === 'eventi';
  const isGrafica = ruolo === 'grafica';
  const isVolontari = ruolo === 'volontari';

  const [eventi, setEventi] = useState([]);
  const [notificheGrafica, setNotificheGrafica] = useState([]);
  const [notifichePagamento, setNotifichePagamento] = useState([]);
  const [prodotti, setProdotti] = useState([]);
  const [consumiPendenti, setConsumiPendenti] = useState(0);
  const [mieiEventi, setMieiEventi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iscrizioneInCorso, setIscrizioneInCorso] = useState(null);

  const fetchTutto = () => {
    const richieste = [
      fetch(`${API_URL}/api/eventi`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : []))
        .then(setEventi)
    ];

    if (isGrafica || isAmministrazione) {
      richieste.push(
        fetch(`${API_URL}/api/notifiche-grafica`, { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : []))
          .then(setNotificheGrafica)
      );
    }
    if (isAmministrazione) {
      richieste.push(
        fetch(`${API_URL}/api/notifiche-pagamento`, { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : []))
          .then(setNotifichePagamento)
      );
    }
    if (isAmministrazione || isBar) {
      richieste.push(
        fetch(`${API_URL}/api/prodotti`, { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : []))
          .then(setProdotti)
      );
      richieste.push(
        fetch(`${API_URL}/api/consumi/pendenti`, { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : { numero: 0 }))
          .then((d) => setConsumiPendenti(d.numero || 0))
      );
    }
    if (isVolontari) {
      richieste.push(
        fetch(`${API_URL}/api/eventi/miei`, { credentials: 'include' })
          .then((r) => (r.ok ? r.json() : []))
          .then(setMieiEventi)
      );
    }

    return Promise.all(richieste);
  };

  useEffect(() => {
    fetchTutto()
      .catch(() => setError('Errore nel caricamento della dashboard'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIscriviti = async (eventoId) => {
    setIscrizioneInCorso(eventoId);
    try {
      const response = await fetch(`${API_URL}/api/eventi/${eventoId}/iscrizione`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Errore durante l'iscrizione");
      await fetchTutto();
    } catch (err) {
      alert(err.message);
    } finally {
      setIscrizioneInCorso(null);
    }
  };

  const prossimiEventi = useMemo(() => {
    const oggi = oggiChiave();
    return eventi
      .filter((e) => new Date(e.data_evento) >= oggi)
      .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento));
  }, [eventi]);

  const mieiEventiCreati = useMemo(() => {
    if (!isEventi) return [];
    return prossimiEventi.filter((e) => e.creato_da_username === user.username);
  }, [prossimiEventi, isEventi, user]);

  const notificheGraficaDaFare = useMemo(
    () => notificheGrafica.filter((n) => n.stato !== 'completato').sort((a, b) => new Date(a.scadenza) - new Date(b.scadenza)),
    [notificheGrafica]
  );
  const notificheGraficaUrgenti = useMemo(() => {
    const traDueGiorni = new Date();
    traDueGiorni.setDate(traDueGiorni.getDate() + 2);
    return notificheGraficaDaFare.filter((n) => new Date(n.scadenza) <= traDueGiorni);
  }, [notificheGraficaDaFare]);

  const notifichePagamentoDaFare = useMemo(() => notifichePagamento.filter((n) => n.stato !== 'pagato'), [notifichePagamento]);
  const totaleDaPagare = useMemo(
    () => notifichePagamentoDaFare.reduce((somma, n) => somma + Number(n.costo || 0), 0),
    [notifichePagamentoDaFare]
  );

  const prodottiSottoScorta = useMemo(
    () => prodotti.filter((p) => p.quantita_ottimale > 0 && p.quantita < p.quantita_ottimale),
    [prodotti]
  );

  const mieiEventiFuturi = useMemo(() => {
    const oggi = oggiChiave();
    return mieiEventi
      .filter((e) => new Date(e.data_evento) >= oggi)
      .sort((a, b) => new Date(a.data_evento) - new Date(b.data_evento));
  }, [mieiEventi]);

  const eventiCercanoVolontari = useMemo(() => {
    if (!isVolontari) return [];
    return prossimiEventi.filter((e) => e.max_volontari > 0 && e.iscritti_count < e.max_volontari && !e.iscritto);
  }, [prossimiEventi, isVolontari]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-2">Caricamento dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <h2 className="text-warning mb-4">
        <i className="bi bi-house-door me-2"></i>
        Ciao, {user?.username}
      </h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ============ CARD RIEPILOGATIVE, in base al ruolo ============ */}
      <Row className="g-3 mb-4">
        {(isAmministrazione || isGrafica) && (
          <Col md={6} lg={3}>
            <Card as={Link} to="/calendario" className="h-100 text-decoration-none dashboard-card">
              <Card.Body>
                <div className="text-muted small text-uppercase">Grafica da fare</div>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="display-6 fw-bold text-wine">{notificheGraficaDaFare.length}</span>
                  {notificheGraficaUrgenti.length > 0 && (
                    <Badge bg="danger">{notificheGraficaUrgenti.length} urgenti</Badge>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {isAmministrazione && (
          <Col md={6} lg={3}>
            <Card as={Link} to="/calendario" className="h-100 text-decoration-none dashboard-card">
              <Card.Body>
                <div className="text-muted small text-uppercase">Pagamenti da fare</div>
                <div className="display-6 fw-bold text-wine">{notifichePagamentoDaFare.length}</div>
                {notifichePagamentoDaFare.length > 0 && (
                  <div className="text-muted small">totale €{totaleDaPagare.toFixed(2)}</div>
                )}
              </Card.Body>
            </Card>
          </Col>
        )}

        {(isAmministrazione || isBar) && (
          <Col md={6} lg={3}>
            <Card as={Link} to="/ordini" className="h-100 text-decoration-none dashboard-card">
              <Card.Body>
                <div className="text-muted small text-uppercase">Scorte sotto soglia</div>
                <div className="display-6 fw-bold text-wine">{prodottiSottoScorta.length}</div>
              </Card.Body>
            </Card>
          </Col>
        )}

        {(isAmministrazione || isBar) && (
          <Col md={6} lg={3}>
            <Card as={Link} to="/consumi" className="h-100 text-decoration-none dashboard-card">
              <Card.Body>
                <div className="text-muted small text-uppercase">Consumi in attesa</div>
                <div className="display-6 fw-bold text-wine">{consumiPendenti}</div>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={6} lg={3}>
          <Card as={Link} to="/calendario" className="h-100 text-decoration-none dashboard-card">
            <Card.Body>
              <div className="text-muted small text-uppercase">Prossimi eventi</div>
              <div className="display-6 fw-bold text-wine">{prossimiEventi.length}</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        {/* ============ EVENTI: i tuoi eventi creati ============ */}
        {isEventi && (
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="bg-dark text-white">I tuoi prossimi eventi</Card.Header>
              <ListGroup variant="flush">
                {mieiEventiCreati.length === 0 ? (
                  <ListGroup.Item className="text-muted">Nessun evento in programma.</ListGroup.Item>
                ) : (
                  mieiEventiCreati.slice(0, 6).map((ev) => (
                    <ListGroup.Item key={ev.id} className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div>
                        <div className="fw-bold">{ev.nome}</div>
                        <div className="text-muted small">{formatDataIT(ev.data_evento)}</div>
                      </div>
                      <div className="d-flex gap-2">
                        {ev.grafica_stato && (
                          <Badge bg={ev.grafica_stato === 'completato' ? 'success' : 'warning'} text={ev.grafica_stato === 'completato' ? undefined : 'dark'}>
                            {ev.grafica_stato === 'completato' ? 'Grafica pronta' : 'Grafica in corso'}
                          </Badge>
                        )}
                        {ev.pagamento_stato && (
                          <Badge bg={ev.pagamento_stato === 'pagato' ? 'success' : 'danger'}>
                            {ev.pagamento_stato === 'pagato' ? 'Pagato' : 'Da pagare'}
                          </Badge>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
              <Card.Footer className="text-end">
                <Link to="/calendario" className="small">Vai al calendario →</Link>
              </Card.Footer>
            </Card>
          </Col>
        )}

        {/* ============ GRAFICA: notifiche da lavorare ============ */}
        {isGrafica && (
          <Col md={6}>
            <Card className="h-100">
              <Card.Header className="bg-dark text-white">Notifiche da lavorare</Card.Header>
              <ListGroup variant="flush">
                {notificheGraficaDaFare.length === 0 ? (
                  <ListGroup.Item className="text-muted">Nessuna notifica in sospeso.</ListGroup.Item>
                ) : (
                  notificheGraficaDaFare.slice(0, 6).map((n) => (
                    <ListGroup.Item key={n.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{n.nome}</div>
                        <div className="text-muted small">{n.tipo} · evento il {formatDataIT(n.data_evento)}</div>
                      </div>
                      <Badge bg={new Date(n.scadenza) < new Date() ? 'danger' : 'warning'} text={new Date(n.scadenza) < new Date() ? undefined : 'dark'}>
                        scadenza {formatDataIT(n.scadenza)}
                      </Badge>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
              <Card.Footer className="text-end">
                <Link to="/calendario" className="small">Vai alla bacheca →</Link>
              </Card.Footer>
            </Card>
          </Col>
        )}

        {/* ============ VOLONTARI: i tuoi eventi + eventi che cercano volontari ============ */}
        {isVolontari && (
          <>
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-dark text-white">I tuoi prossimi eventi</Card.Header>
                <ListGroup variant="flush">
                  {mieiEventiFuturi.length === 0 ? (
                    <ListGroup.Item className="text-muted">Non sei iscritto a nessun evento in programma.</ListGroup.Item>
                  ) : (
                    mieiEventiFuturi.slice(0, 6).map((ev) => (
                      <ListGroup.Item key={ev.id}>
                        <div className="fw-bold">{ev.nome}</div>
                        <div className="text-muted small">{formatDataIT(ev.data_evento)}</div>
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
                <Card.Footer className="text-end">
                  <Link to="/miei-eventi" className="small">Vedi tutti →</Link>
                </Card.Footer>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-dark text-white">Cercano ancora volontari</Card.Header>
                <ListGroup variant="flush">
                  {eventiCercanoVolontari.length === 0 ? (
                    <ListGroup.Item className="text-muted">Nessun evento con posti liberi al momento.</ListGroup.Item>
                  ) : (
                    eventiCercanoVolontari.slice(0, 6).map((ev) => (
                      <ListGroup.Item key={ev.id} className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <div className="fw-bold">{ev.nome}</div>
                          <div className="text-muted small">
                            {formatDataIT(ev.data_evento)} · {ev.iscritti_count}/{ev.max_volontari} volontari
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline-success"
                          disabled={iscrizioneInCorso === ev.id}
                          onClick={() => handleIscriviti(ev.id)}
                        >
                          {iscrizioneInCorso === ev.id ? <Spinner animation="border" size="sm" /> : 'Iscriviti'}
                        </Button>
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
              </Card>
            </Col>
          </>
        )}

        {/* ============ TUTTI: prossimi eventi in generale ============ */}
        {!isEventi && !isGrafica && !isVolontari && (
          <Col md={isAmministrazione || isBar ? 12 : 6}>
            <Card className="h-100">
              <Card.Header className="bg-dark text-white">Prossimi eventi</Card.Header>
              <ListGroup variant="flush">
                {prossimiEventi.length === 0 ? (
                  <ListGroup.Item className="text-muted">Nessun evento in programma.</ListGroup.Item>
                ) : (
                  prossimiEventi.slice(0, 6).map((ev) => (
                    <ListGroup.Item key={ev.id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <div className="fw-bold">{ev.nome}</div>
                        <div className="text-muted small">{ev.tipo}</div>
                      </div>
                      <span className="text-muted small">{formatDataIT(ev.data_evento)}</span>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
              <Card.Footer className="text-end">
                <Link to="/calendario" className="small">Vai al calendario →</Link>
              </Card.Footer>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export { Dashboard };
