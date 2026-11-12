import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { RUOLI } from '../../roles';

// Le tre finestre della pagina. Ognuna riceve i dati già pronti e chiama "onSalva(...)", che restituisce
// una promessa: true se è andata bene (la finestra si richiude da sola chi la usa), false se no.

export function ModaleNuovo({ show, onHide, onSalva }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const riuscito = await onSalva({ username: fd.get('username'), password: fd.get('password'), ruolo: fd.get('ruolo') });
    if (riuscito) form.reset();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title><i className="bi bi-person-plus me-2"></i>Nuovo membro del personale</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control name="username" type="text" required minLength={2} placeholder="Es. mario_rossi" autoComplete="off" autoCapitalize="none" spellCheck={false} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password provvisoria</Form.Label>
            <Form.Control name="password" type="password" required minLength={6} placeholder="Minimo 6 caratteri" autoComplete="new-password" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Ruolo</Form.Label>
            <Form.Select name="ruolo" required defaultValue="">
              <option value="" disabled>Seleziona un ruolo...</option>
              {RUOLI.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Annulla</Button>
          <Button variant="success" type="submit">Crea account</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export function ModaleModifica({ show, onHide, utente, sonoIo, onSalva }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await onSalva({ username: fd.get('username'), ruolo: fd.get('ruolo') });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title><i className="bi bi-pencil me-2"></i>Modifica "{utente?.username}"</Modal.Title>
      </Modal.Header>
      {utente && (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control name="username" type="text" required minLength={2} defaultValue={utente.username} autoCapitalize="none" spellCheck={false} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Ruolo</Form.Label>
              <Form.Select name="ruolo" required defaultValue={utente.ruolo}>
                {RUOLI.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Form.Select>
              {sonoIo && <Form.Text className="text-danger">Non puoi cambiare il tuo stesso ruolo.</Form.Text>}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Annulla</Button>
            <Button variant="warning" type="submit">Salva modifiche</Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
}

export function ModalePassword({ show, onHide, utente, onSalva }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const riuscito = await onSalva(new FormData(form).get('password'));
    if (riuscito) form.reset();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title><i className="bi bi-key me-2"></i>Reimposta password di "{utente?.username}"</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="warning" className="small">
            Comunica la nuova password direttamente all'utente — non viene inviata per email.
          </Alert>
          <Form.Group className="mb-3">
            <Form.Label>Nuova password</Form.Label>
            <Form.Control name="password" type="password" required minLength={6} placeholder="Minimo 6 caratteri" autoComplete="new-password" autoFocus />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Annulla</Button>
          <Button variant="primary" type="submit">Imposta password</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
