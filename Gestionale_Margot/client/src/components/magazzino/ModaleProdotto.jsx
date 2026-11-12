import { Modal, Form, Row, Col, Button } from 'react-bootstrap';
import { CATEGORIE } from '../../categorie';
import { UNITA } from '../../unita';

// Il form per creare o modificare un prodotto.
//  - prodotto: i dati iniziali (con "id" se si sta modificando, null se è nuovo)
//  - categoria / unita: i valori dei due menu a tendina (li tiene chi usa questo componente)
//  - onSalva(payload): riceve i dati già letti e convertiti; il salvataggio vero lo fa chi lo usa
function ModaleProdotto({ show, onHide, prodotto, categoria, onCategoria, unita, onUnita, onSalva }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    onSalva({
      nome: formData.get('nome'),
      categoria: formData.get('categoria') || null,
      sottocategoria: formData.get('sottocategoria') || null,
      prezzo: parseFloat(formData.get('prezzo')),
      quantita_ottimale: parseInt(formData.get('quantita_ottimale'), 10) || 0,
      unita: formData.get('unita'),
      quantita: parseInt(formData.get('quantita'), 10) || 0
    });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-box-seam me-2"></i>
          {prodotto ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Nome</Form.Label>
            <Form.Control name="nome" type="text" required defaultValue={prodotto?.nome} placeholder="Es. Barolo DOCG 2018" />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoria</Form.Label>
                <Form.Select name="categoria" required value={categoria} onChange={(e) => onCategoria(e.target.value)}>
                  <option value="" disabled>Seleziona...</option>
                  {Object.entries(CATEGORIE).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Sottocategoria</Form.Label>
                <Form.Select name="sottocategoria" required disabled={!categoria} key={categoria} defaultValue={prodotto?.sottocategoria || ''}>
                  <option value="" disabled>Seleziona...</option>
                  {categoria && Object.entries(CATEGORIE[categoria].sottocategorie).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Prezzo (€)</Form.Label>
                <Form.Control name="prezzo" type="number" step="0.01" min="0" required defaultValue={prodotto?.prezzo} placeholder="0.00" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Quantità ottimale</Form.Label>
                <Form.Control name="quantita_ottimale" type="number" min="0" defaultValue={prodotto?.quantita_ottimale || 0} placeholder="0" />
                <Form.Text className="text-muted">Scorta che vorresti avere sempre disponibile.</Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Unità</Form.Label>
            <Form.Select name="unita" required value={unita} onChange={(e) => onUnita(e.target.value)}>
              {Object.entries(UNITA).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Per Confezione/Scatola si conta la confezione intera (1, 2, 3...), non il contenuto: il prezzo e la quantità sono quelli della confezione.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{prodotto ? `Quantità attuale (${UNITA[unita]})` : `Quantità iniziale (${UNITA[unita]})`}</Form.Label>
            <Form.Control name="quantita" type="number" min="0" required defaultValue={prodotto?.quantita ?? 0} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Annulla</Button>
          <Button variant="success" type="submit">Salva</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default ModaleProdotto;
