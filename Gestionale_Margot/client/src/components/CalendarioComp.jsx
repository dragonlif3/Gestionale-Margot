import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Button, Alert, Spinner, Nav } from 'react-bootstrap';
import GrigliaMese from './calendario/GrigliaMese';
import BachecaGrafica from './calendario/BachecaGrafica';
import TabellaPagamenti from './calendario/TabellaPagamenti';
import ModaleGiorno from './calendario/ModaleGiorno';
import ModaleEvento from './calendario/ModaleEvento';
import { getPermessi, toDateKey } from './calendario/calendarioUtils';
import {
  caricaEventi,
  caricaNotificheGrafica,
  caricaPagamenti,
  salvaEvento,
  eliminaEvento,
  completaNotificaGrafica,
  segnaPagato,
  iscrivitiAEvento,
  annullaIscrizione
} from './calendario/api';

// Il "regista" del calendario: tiene lo stato, scarica i dati e decide cosa fare
// quando l'utente agisce. Come appare ogni parte è nei componenti della cartella calendario/.
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

  const permessi = getPermessi(user);
  const { puoGestireEventi, puoVedereBacheca, puoVederePagamenti } = permessi;

  // ---------- Caricamento dei dati ----------

  const fetchEventi = async () => {
    try {
      setEventi(await caricaEventi());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifiche = async () => {
    setLoadingNotifiche(true);
    try {
      setNotifiche(await caricaNotificheGrafica());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingNotifiche(false);
    }
  };

  const fetchPagamenti = async () => {
    setLoadingPagamenti(true);
    try {
      setPagamenti(await caricaPagamenti());
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

  // ---------- Navigazione e finestre ----------

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

  // ---------- Azioni ----------

  const handleSalvaEvento = async (payload) => {
    try {
      await salvaEvento(eventoInModifica?.id, payload);
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
      await eliminaEvento(id);
      setShowGiornoModal(false);
      fetchEventi();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompletaNotifica = async (id) => {
    try {
      await completaNotificaGrafica(id);
      fetchNotifiche();
      fetchEventi(); // Aggiorna anche lo stato degli eventi nel calendario
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSegnaPagato = async (id) => {
    if (!window.confirm('Confermi di aver effettuato il pagamento per questo evento?')) return;
    try {
      await segnaPagato(id);
      fetchPagamenti();
      fetchEventi(); // Aggiorna anche lo stato degli eventi nel calendario
    } catch (err) {
      alert(err.message);
    }
  };

  const handleIscriviti = async (eventoId) => {
    try {
      await iscrivitiAEvento(eventoId);
      fetchEventi();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancellaIscrizione = async (eventoId) => {
    if (!window.confirm('Vuoi annullare la tua iscrizione a questo evento?')) return;
    try {
      await annullaIscrizione(eventoId);
      fetchEventi();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---------- Aspetto ----------

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
        <GrigliaMese
          meseVisto={meseVisto}
          onCambiaMese={cambiaMese}
          eventiPerGiorno={eventiPerGiorno}
          permessi={permessi}
          onApriGiorno={apriGiorno}
          onNuovoEvento={apriNuovoEvento}
        />
      )}

      {tab === 'grafica' && (
        <BachecaGrafica notifiche={notifiche} loading={loadingNotifiche} onCompleta={handleCompletaNotifica} />
      )}

      {tab === 'pagamenti' && (
        <TabellaPagamenti pagamenti={pagamenti} loading={loadingPagamenti} onSegnaPagato={handleSegnaPagato} />
      )}

      <ModaleGiorno
        show={showGiornoModal}
        onHide={() => setShowGiornoModal(false)}
        giorno={giornoSelezionato}
        eventiPerGiorno={eventiPerGiorno}
        permessi={permessi}
        onIscriviti={handleIscriviti}
        onAnnullaIscrizione={handleCancellaIscrizione}
        onModifica={apriModificaEvento}
        onElimina={handleEliminaEvento}
        onNuovoEvento={apriNuovoEvento}
      />

      <ModaleEvento
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        evento={eventoInModifica}
        onSalva={handleSalvaEvento}
      />
    </Container>
  );
}

export { Calendario };
