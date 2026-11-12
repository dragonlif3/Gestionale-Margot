import { Modal, Form, Button } from 'react-bootstrap';
import { UNITA, unitaConteggio } from '../../unita';

// Rifornimento rapido: quante unità aggiungere in un colpo solo.
//  - prodotto: il prodotto da rifornire, o null se la finestra è chiusa
//  - onConferma(numero): riceve la quantità da aggiungere
function ModaleRifornisci({ prodotto, onHide, onConferma }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onConferma(parseInt(formData.get('quantita_da_aggiungere'), 10) || 0);
  };

  return (
    <Modal show={Boolean(prodotto)} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title><i className="bi bi-box-arrow-in-down me-2"></i>Rifornisci "{prodotto?.nome}"</Modal.Title>
      </Modal.Header>
      {prodotto && (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Quante {UNITA[prodotto.unita]?.toLowerCase()} aggiungere?</Form.Label>
              <Form.Control name="quantita_da_aggiungere" type="number" min="1" required defaultValue={1} autoFocus />
            </Form.Group>
            <div className="text-muted small">Scorta attuale: {prodotto.quantita} {unitaConteggio(prodotto)}</div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Annulla</Button>
            <Button variant="success" type="submit">Aggiungi</Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
}

export default ModaleRifornisci;
