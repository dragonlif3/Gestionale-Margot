import { Table, Button, Badge, Spinner } from 'react-bootstrap';
import { formatDataIT } from '../../dateUtils';

const giorniRimanenti = (scadenza) => {
  const diffMs = new Date(scadenza).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const badgeScadenza = (scadenza, stato) => {
  if (stato === 'completato') return <Badge bg="secondary">Completato</Badge>;
  const giorni = giorniRimanenti(scadenza);
  if (giorni < 0) return <Badge bg="danger">Scaduto</Badge>;
  if (giorni <= 2) return <Badge bg="danger">{giorni} {giorni === 1 ? 'giorno' : 'giorni'} rimasti</Badge>;
  if (giorni <= 4) return <Badge bg="warning" text="dark">{giorni} giorni rimasti</Badge>;
  return <Badge bg="success">{giorni} giorni rimasti</Badge>;
};

// La tabella dei compiti di grafica, con la scadenza e il pulsante per segnarli come completati
function BachecaGrafica({ notifiche, loading, onCompleta }) {
  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" variant="warning" /></div>;
  }

  return (
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
                  <Button size="sm" variant="outline-success" onClick={() => onCompleta(n.id)}>
                    <i className="bi bi-check-lg me-1"></i> Segna completato
                  </Button>
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}

export default BachecaGrafica;
