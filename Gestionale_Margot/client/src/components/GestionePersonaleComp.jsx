import React, { useState, useEffect } from 'react';
import {
  Container, Table, Button, Row, Col, Alert, Spinner,
  Modal, Form, Badge
} from 'react-bootstrap';
import { API_URL } from '../config';
import { RUOLI, RUOLI_LABEL } from '../roles';

const BADGE_RUOLO = {
  amministrazione: 'danger',
  bar: 'warning',
  eventi: 'primary',
  grafica: 'info',
  volontari: 'secondary'
};

function GestionePersonale({ utenteCorrente }) {
  const [personale, setPersonale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successo, setSuccesso] = useState(null);

  // Modal modifica
  const [showModifica, setShowModifica] = useState(false);
  const [utenteInModifica, setUtenteInModifica] = useState(null);

  // Modal reset password
  const [showPassword, setShowPassword] = useState(false);
  const [utentePassword, setUtentePassword] = useState(null);

  // Modal nuovo membro
  const [showNuovo, setShowNuovo] = useState(false);

  const mostraSuccesso = (msg) => {
    setSuccesso(msg);
    setTimeout(() => setSuccesso(null), 4000);
  };

  const fetchPersonale = async () => {
    try {
      const res = await fetch(`${API_URL}/api/personale`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento del personale');
      setPersonale(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPersonale(); }, []);

  const handleNuovo = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { username: fd.get('username'), password: fd.get('password'), ruolo: fd.get('ruolo') };

    try {
      const res = await fetch(`${API_URL}/api/personale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowNuovo(false);
      e.target.reset();
      fetchPersonale();
      mostraSuccesso(data.message);
    } catch (err) { alert(err.message); }
  };

  const handleModifica = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { username: fd.get('username'), ruolo: fd.get('ruolo') };

    try {
      const res = await fetch(`${API_URL}/api/personale/${utenteInModifica.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowModifica(false);
      fetchPersonale();
      mostraSuccesso(data.message);
    } catch (err) { alert(err.message); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const body = { password: fd.get('password') };

    try {
      const res = await fetch(`${API_URL}/api/personale/${utentePassword.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowPassword(false);
      e.target.reset();
      mostraSuccesso(`Password di "${utentePassword.username}" aggiornata.`);
    } catch (err) { alert(err.message); }
  };

  const handleElimina = async (utente) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'account di "${utente.username}"? L'operazione non è reversibile.`)) return;

    try {
      const res = await fetch(`${API_URL}/api/personale/${utente.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchPersonale();
      mostraSuccesso(data.message);
    } catch (err) { alert(err.message); }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-2">Caricamento personale in corso...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-people"></i> Gestione Personale
          </h2>
          <p className="text-muted mb-0">{personale.length} account registrati</p>
        </Col>
        <Col xs="auto">
          <Button variant="success" onClick={() => setShowNuovo(true)}>
            <i className="bi bi-person-plus me-1"></i> Nuovo membro
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {successo && <Alert variant="success"><i className="bi bi-check-circle me-2"></i>{successo}</Alert>}

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th>Username</th>
            <th>Ruolo</th>
            <th className="text-center">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {personale.length === 0 ? (
            <tr><td colSpan="3" className="text-center py-4 text-muted">Nessun utente trovato.</td></tr>
          ) : (
            personale.map((u) => (
              <tr key={u.id}>
                <td className="fw-bold">
                  {u.username}
                  {u.id === utenteCorrente?.id && (
                    <Badge bg="secondary" className="ms-2 small">tu</Badge>
                  )}
                </td>
                <td>
                  <Badge bg={BADGE_RUOLO[u.ruolo] || 'secondary'}>
                    {RUOLI_LABEL[u.ruolo] || u.ruolo}
                  </Badge>
                </td>
                <td className="text-center text-nowrap">
                  <Button
                    size="sm"
                    variant="outline-warning"
                    className="me-1"
                    onClick={() => { setUtenteInModifica(u); setShowModifica(true); }}
                    title="Modifica username / ruolo"
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-1"
                    onClick={() => { setUtentePassword(u); setShowPassword(true); }}
                    title="Reimposta password"
                  >
                    <i className="bi bi-key"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={u.id === utenteCorrente?.id}
                    onClick={() => handleElimina(u)}
                    title={u.id === utenteCorrente?.id ? 'Non puoi eliminare te stesso' : 'Elimina account'}
                  >
                    <i className="bi bi-trash3"></i>
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* MODAL: Nuovo membro */}
      <Modal show={showNuovo} onHide={() => setShowNuovo(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-person-plus me-2"></i>Nuovo membro del personale</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleNuovo}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control name="username" type="text" required minLength={2} placeholder="Es. mario_rossi" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password provvisoria</Form.Label>
              <Form.Control name="password" type="password" required minLength={6} placeholder="Minimo 6 caratteri" />
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
            <Button variant="secondary" onClick={() => setShowNuovo(false)}>Annulla</Button>
            <Button variant="success" type="submit">Crea account</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODAL: Modifica username / ruolo */}
      <Modal show={showModifica} onHide={() => setShowModifica(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-pencil me-2"></i>Modifica "{utenteInModifica?.username}"</Modal.Title>
        </Modal.Header>
        {utenteInModifica && (
          <Form onSubmit={handleModifica}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control name="username" type="text" required minLength={2} defaultValue={utenteInModifica.username} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Ruolo</Form.Label>
                <Form.Select name="ruolo" required defaultValue={utenteInModifica.ruolo}>
                  {RUOLI.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </Form.Select>
                {utenteInModifica.id === utenteCorrente?.id && (
                  <Form.Text className="text-danger">Non puoi cambiare il tuo stesso ruolo.</Form.Text>
                )}
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModifica(false)}>Annulla</Button>
              <Button variant="warning" type="submit">Salva modifiche</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>

      {/* MODAL: Reset password */}
      <Modal show={showPassword} onHide={() => setShowPassword(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-key me-2"></i>Reimposta password di "{utentePassword?.username}"</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleResetPassword}>
          <Modal.Body>
            <Alert variant="warning" className="small">
              Comunica la nuova password direttamente all'utente — non viene inviata per email.
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Nuova password</Form.Label>
              <Form.Control name="password" type="password" required minLength={6} placeholder="Minimo 6 caratteri" autoFocus />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPassword(false)}>Annulla</Button>
            <Button variant="primary" type="submit">Imposta password</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export { GestionePersonale };
