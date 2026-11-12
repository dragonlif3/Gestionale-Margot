import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import SchedaMioEvento from './mieieventi/SchedaMioEvento';
import { chiama } from '../apiClient';
import { annullaIscrizione } from './calendario/api';
import './mieieventi/mieieventi.css';

// Gli eventi a cui il volontario si è iscritto. Come appare ogni evento è in mieieventi/SchedaMioEvento.jsx.
function MieiEventi() {
  const [eventi, setEventi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMieiEventi = async () => {
    try {
      const risposta = await chiama('/api/eventi/miei', { erroreDefault: 'Errore nel caricamento dei tuoi eventi' });
      setEventi(await risposta.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMieiEventi();
  }, []);

  const handleCancellaIscrizione = async (id) => {
    if (!window.confirm('Vuoi annullare la tua iscrizione a questo evento?')) return;
    try {
      await annullaIscrizione(id);   // se il server spiega perché non si può, mostriamo il suo messaggio
      fetchMieiEventi();
    } catch (err) {
      alert(err.message);
    }
  };

  const eventoPassato = (dataEvento) => new Date(dataEvento) < new Date(new Date().toDateString());

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-2">Caricamento in corso...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5 mie-pagina">
      <Row className="mb-3">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-person-check"></i> I Miei Eventi
          </h2>
          <p className="text-muted mb-0">Gli eventi a cui ti sei iscritto come volontario.</p>
        </Col>
      </Row>

      {eventi.length === 0 ? (
        <Alert variant="warning" className="mt-3">
          <i className="bi bi-info-circle me-2"></i>
          Non sei ancora iscritto a nessun evento. Vai sul Calendario per vedere quali cercano volontari.
        </Alert>
      ) : (
        <ul className="mie-lista">
          {eventi.map((ev) => (
            <SchedaMioEvento key={ev.id} evento={ev} passato={eventoPassato(ev.data_evento)} onAnnulla={handleCancellaIscrizione} />
          ))}
        </ul>
      )}
    </Container>
  );
}

export { MieiEventi };
