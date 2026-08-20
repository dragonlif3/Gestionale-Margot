import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { API_URL } from '../config';
import { formatDataIT } from '../dateUtils';

function MieiEventi() {
  const [eventi, setEventi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMieiEventi = async () => {
    try {
      const response = await fetch(`${API_URL}/api/eventi/miei`, { credentials: 'include' });
      if (!response.ok) throw new Error('Errore nel caricamento dei tuoi eventi');
      const data = await response.json();
      setEventi(data);
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
      const response = await fetch(`${API_URL}/api/eventi/${id}/iscrizione`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Errore durante l'annullamento");
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
    <Container className="mt-4 mb-5">
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
        <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
          <thead className="table-dark">
            <tr>
              <th>Evento</th>
              <th>Tipo</th>
              <th>Data</th>
              <th className="text-center">Stato</th>
              <th className="text-center">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {eventi.map((ev) => (
              <tr key={ev.id}>
                <td className="fw-bold">{ev.nome}</td>
                <td>{ev.tipo}</td>
                <td>{formatDataIT(ev.data_evento)}</td>
                <td className="text-center">
                  {eventoPassato(ev.data_evento) ? (
                    <Badge bg="secondary">Concluso</Badge>
                  ) : (
                    <Badge bg="success">In programma</Badge>
                  )}
                </td>
                <td className="text-center">
                  {!eventoPassato(ev.data_evento) && (
                    <Button size="sm" variant="outline-danger" onClick={() => handleCancellaIscrizione(ev.id)}>
                      <i className="bi bi-x-circle me-1"></i> Annulla iscrizione
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export { MieiEventi };
