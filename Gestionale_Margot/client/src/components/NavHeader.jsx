import { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Navbar, Nav, NavDropdown, Container, Modal, Form, Button, Alert, Badge, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { formatDataOraIT } from '../dateUtils';
import '../App.css';
import NotifichePushVoce from './NotifichePushVoce';
import { sincronizzaPush } from '../push';

function NavHeader(props) {
  const [showCambiaPassword, setShowCambiaPassword] = useState(false);
  const [errore, setErrore] = useState(null);
  const [messaggio, setMessaggio] = useState(null);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  const [notifiche, setNotifiche] = useState([]);
  const [nonLette, setNonLette] = useState(0);
  const [showNotifiche, setShowNotifiche] = useState(false);

  const puoAvereNotifiche = props.loggedIn && props.user?.ruolo === 'volontari';
  useEffect(() => {
      if (props.loggedIn) sincronizzaPush();
    }, [props.loggedIn]);

  const fetchConteggioNotifiche = () => {
    fetch(`${API_URL}/api/notifiche/conteggio`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { numero: 0 }))
      .then((d) => setNonLette(d.numero || 0))
      .catch(() => {});
  };

  useEffect(() => {
    if (!puoAvereNotifiche) return;
    fetchConteggioNotifiche();
    // Ricontrolla ogni minuto, così il badge si aggiorna anche se
    // qualcuno cancella un evento mentre sei già loggato e fermo su una pagina.
    const interval = setInterval(fetchConteggioNotifiche, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puoAvereNotifiche]);

  const apriNotifiche = () => {
    setShowNotifiche(true);
    fetch(`${API_URL}/api/notifiche`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then(setNotifiche)
      .catch(() => {});
  };

  const handleSegnaLetta = async (id) => {
    try {
      await fetch(`${API_URL}/api/notifiche/${id}/letta`, { method: 'PUT', credentials: 'include' });
      setNotifiche((prev) => prev.map((n) => (n.id === id ? { ...n, letta: 1 } : n)));
      fetchConteggioNotifiche();
    } catch {
      // niente di grave se fallisce: l'utente può riprovare, non blocchiamo l'interfaccia
    }
  };

  const handleSegnaTutteLette = async () => {
    try {
      await fetch(`${API_URL}/api/notifiche/tutte/lette`, { method: 'PUT', credentials: 'include' });
      setNotifiche((prev) => prev.map((n) => ({ ...n, letta: 1 })));
      setNonLette(0);
    } catch {
      // idem
    }
  };

  const chiudiModale = () => {
    setShowCambiaPassword(false);
    setErrore(null);
    setMessaggio(null);
  };

  const handleCambiaPassword = async (e) => {
    e.preventDefault();
    setErrore(null);
    setMessaggio(null);

    const formData = new FormData(e.target);
    const vecchiaPassword = formData.get('vecchiaPassword');
    const nuovaPassword = formData.get('nuovaPassword');
    const confermaPassword = formData.get('confermaPassword');

    if (nuovaPassword !== confermaPassword) {
      setErrore('Le due password nuove non coincidono');
      return;
    }

    setSalvataggioInCorso(true);
    try {
      const response = await fetch(`${API_URL}/api/account/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vecchiaPassword, nuovaPassword })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Errore durante il cambio password');

      setMessaggio('Password cambiata con successo.');
      e.target.reset();
    } catch (err) {
      setErrore(err.message);
    } finally {
      setSalvataggioInCorso(false);
    }
  };

  return (
    <Navbar sticky="top" bg="dark" variant="dark" expand="lg" className="navbar shadow-sm">
      <Container fluid>
        {/* Brand / Logo */}
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <i className="bi bi-stars text-warning me-2"></i>
          Margot
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" className="navbar-toggle"/>
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            
            {/* Link al Magazzino (solo Amministrazione e Bar, che lo gestiscono) */}
            {props.loggedIn && (props.user?.ruolo === 'amministrazione' || props.user?.ruolo === 'bar') && (
              <Nav.Link as={Link} to="/magazzino" className="navbar-link me-3">
                <i className="bi bi-box-seam me-1"></i>
                Magazzino
              </Nav.Link>
            )}

            {/* Link a Cosa Ordinare (solo Amministrazione e Bar) */}
            {props.loggedIn && (props.user?.ruolo === 'amministrazione' || props.user?.ruolo === 'bar') && (
              <Nav.Link as={Link} to="/ordini" className="navbar-link me-3">
                <i className="bi bi-cart-check me-1"></i>
                Ordini
              </Nav.Link>
            )}

            {/* Link ai Consumi (solo Amministrazione e Bar) */}
            {props.loggedIn && (props.user?.ruolo === 'amministrazione' || props.user?.ruolo === 'bar') && (
              <Nav.Link as={Link} to="/consumi" className="navbar-link me-3">
                <i className="bi bi-graph-down-arrow me-1"></i>
                Consumi
              </Nav.Link>
            )}

            {/* Link agli Eventi (visibile a tutti i loggati) */}
            {props.loggedIn && (
              <Nav.Link as={Link} to="/calendario" className="navbar-link me-3">
                <i className="bi bi-calendar-event me-1"></i>
                Eventi
              </Nav.Link>
            )}

            {/* Link a I Miei Eventi (solo Volontari) */}
            {props.loggedIn && props.user?.ruolo === 'volontari' && (
              <Nav.Link as={Link} to="/miei-eventi" className="navbar-link me-3">
                <i className="bi bi-person-check me-1"></i>
                I Miei Eventi
              </Nav.Link>
            )}

            {/* Link a Gestione Personale (solo Amministrazione) */}
            {props.loggedIn && props.user?.ruolo === 'amministrazione' && (
              <Nav.Link as={Link} to="/personale" className="navbar-link me-3">
                <i className="bi bi-people me-1"></i>
                Personale
              </Nav.Link>
            )}
            {/* Link a Storico (solo Amministrazione) */}
            {props.loggedIn && props.user?.ruolo === 'amministrazione' && (
              <Nav.Link as={Link} to="/storico" className="navbar-link me-3">
                <i className="bi bi-clock-history me-1"></i>
                Storico
              </Nav.Link>
            )}
            {/* Campanellino notifiche (solo Volontari, per ora) */}
            {puoAvereNotifiche && (
              <Nav.Link onClick={apriNotifiche} className="navbar-link me-3 position-relative" role="button">
                <i className="bi bi-bell fs-5"></i>
                {nonLette > 0 && (
                  <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">
                    {nonLette}
                  </Badge>
                )}
              </Nav.Link>
            )}

            {/* Menu utente: Cambia password + Logout, aperto a tutti i ruoli */}
            {props.loggedIn ? (
              <NavDropdown
                title={<>Ciao, <b className="text-white">{props.user?.username}</b></>}
                id="user-menu"
                align="end"
              >
                <NavDropdown.Item onClick={() => setShowCambiaPassword(true)}>
                  <i className="bi bi-key me-2"></i>Cambia password
                </NavDropdown.Item>
                <NotifichePushVoce />
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={props.handleLogout} className="text-danger">
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login" className="navbar-link">
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Login
              </Nav.Link>
            )}
            
          </Nav>
        </Navbar.Collapse>
      </Container>

      {/* MODALE: cambio password personale */}
      <Modal show={showCambiaPassword} onHide={chiudiModale} centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-key me-2"></i>Cambia password</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCambiaPassword}>
          <Modal.Body>
            {errore && <Alert variant="danger">{errore}</Alert>}
            {messaggio && <Alert variant="success">{messaggio}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Password attuale</Form.Label>
              <Form.Control name="vecchiaPassword" type="password" required autoFocus />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Nuova password</Form.Label>
              <Form.Control name="nuovaPassword" type="password" required minLength={6} placeholder="Minimo 6 caratteri" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Conferma nuova password</Form.Label>
              <Form.Control name="confermaPassword" type="password" required minLength={6} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={chiudiModale}>Chiudi</Button>
            <Button variant="warning" type="submit" disabled={salvataggioInCorso}>
              {salvataggioInCorso ? 'Salvataggio...' : 'Cambia password'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODALE: elenco notifiche */}
      <Modal show={showNotifiche} onHide={() => setShowNotifiche(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-bell me-2"></i>Notifiche</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {notifiche.length === 0 ? (
            <p className="text-muted text-center py-4 mb-0">Nessuna notifica.</p>
          ) : (
            <ListGroup variant="flush">
              {notifiche.map((n) => (
                <ListGroup.Item
                  key={n.id}
                  className={`d-flex justify-content-between align-items-start gap-2 ${n.letta ? '' : 'bg-light'}`}
                >
                  <div>
                    {!n.letta && <Badge bg="danger" pill className="me-2">nuova</Badge>}
                    <span>{n.messaggio}</span>
                    <div className="text-muted small mt-1">{formatDataOraIT(n.creato_il)}</div>
                  </div>
                  {!n.letta && (
                    <Button size="sm" variant="outline-secondary" onClick={() => handleSegnaLetta(n.id)} className="text-nowrap">
                      Segna letta
                    </Button>
                  )}
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Modal.Body>
        {notifiche.some((n) => !n.letta) && (
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={handleSegnaTutteLette}>
              Segna tutte come lette
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </Navbar>
  );
}

export default NavHeader;