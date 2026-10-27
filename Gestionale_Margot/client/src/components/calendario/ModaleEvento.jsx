import { Modal, Form, Row, Col, Button, Alert } from 'react-bootstrap';
import { TIPI_SUGGERITI } from './calendarioUtils';

// Il form per creare o modificare un evento.
//  - evento: i dati iniziali (con "id" se si sta modificando, senza se è nuovo)
//  - onSalva(payload): riceve i dati già letti e convertiti; il salvataggio vero lo fa chi lo usa
function ModaleEvento({ show, onHide, evento, onSalva }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSalva({
      nome: formData.get('nome'),
      tipo: formData.get('tipo'),
      costo: parseFloat(formData.get('costo')) || 0,
      data_evento: formData.get('data_evento'),
      max_volontari: parseInt(formData.get('max_volontari'), 10) || 0
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-calendar-plus me-2"></i>
          {evento?.id ? 'Modifica Evento' : 'Nuovo Evento'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nome evento</Form.Label>
            <Form.Control
              name="nome"
              type="text"
              required
              defaultValue={evento?.nome}
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
                  defaultValue={evento?.tipo}
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
                  defaultValue={evento?.costo}
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
              defaultValue={evento?.data_evento}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Volontari richiesti</Form.Label>
            <Form.Control
              name="max_volontari"
              type="number"
              min="0"
              defaultValue={evento?.max_volontari || 0}
              placeholder="0"
            />
            <Form.Text className="text-muted">0 se per questo evento non servono volontari.</Form.Text>
          </Form.Group>
          {!evento?.id && (
            <Alert variant="warning" className="mb-0 py-2 small">
              <i className="bi bi-easel me-1"></i>
              Alla creazione, il team Grafica riceverà una notifica con 7 giorni di tempo per lavorarci.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Annulla</Button>
          <Button variant="success" type="submit">Salva Evento</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ModaleEvento;
