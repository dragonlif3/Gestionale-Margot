import { Table, Button, Badge, Spinner } from 'react-bootstrap';
import { formatDataIT } from '../../dateUtils';

// La tabella dei pagamenti degli eventi, con il pulsante per segnarli come pagati
function TabellaPagamenti({ pagamenti, loading, onSegnaPagato }) {
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
                  <Button size="sm" variant="outline-success" onClick={() => onSegnaPagato(p.id)}>
                    <i className="bi bi-check-lg me-1"></i> Segna come pagato
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

export default TabellaPagamenti;
