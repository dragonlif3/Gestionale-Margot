import { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { NavDropdown, Modal, Form, Button, Alert, Badge, ListGroup, Offcanvas } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';
import { API_URL } from '../config';
import { formatDataOraIT } from '../dateUtils';
import NotifichePushVoce from './NotifichePushVoce';
import { sincronizzaPush } from '../push';
import '../App.css';

// Le sezioni dell'app. "ruoli: null" = visibile a tutti i loggati.
// "tab: true" = compare nella barra in basso del telefono; le altre finiscono nel menu "Altro".
const SEZIONI = [
  { to: '/calendario', icona: 'bi-calendar-event', etichetta: 'Eventi', ruoli: null, tab: true },
  { to: '/miei-eventi', icona: 'bi-person-check', etichetta: 'I miei eventi', ruoli: ['volontari'], tab: true },
  { to: '/magazzino', icona: 'bi-box-seam', etichetta: 'Magazzino', ruoli: ['amministrazione', 'bar'], tab: true },
  { to: '/ordini', icona: 'bi-cart-check', etichetta: 'Ordini', ruoli: ['amministrazione', 'bar'], tab: true },
  { to: '/consumi', icona: 'bi-graph-down-arrow', etichetta: 'Consumi', ruoli: ['amministrazione', 'bar'], tab: true },
  { to: '/personale', icona: 'bi-people', etichetta: 'Personale', ruoli: ['amministrazione'], tab: false },
  { to: '/storico', icona: 'bi-clock-history', etichetta: 'Storico', ruoli: ['amministrazione'], tab: false }
];

const classeLink = ({ isActive }) => `shell-link${isActive ? ' on' : ''}`;

function NavHeader(props) {
  const [showCambiaPassword, setShowCambiaPassword] = useState(false);
  const [errore, setErrore] = useState(null);
  const [messaggio, setMessaggio] = useState(null);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  const [notifiche, setNotifiche] = useState([]);
  const [nonLette, setNonLette] = useState(0);
  const [showNotifiche, setShowNotifiche] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const puoAvereNotifiche = props.loggedIn && props.user?.ruolo === 'volontari';

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

  // Dopo il login, se questo dispositivo ha già le notifiche attive, allinea il server
  useEffect(() => {
    if (props.loggedIn) sincronizzaPush();
  }, [props.loggedIn]);

  // Lascia spazio al menu (a sinistra su computer, in basso su telefono): vedi theme.css
  useEffect(() => {
    document.body.classList.toggle('con-shell', Boolean(props.loggedIn));
    return () => document.body.classList.remove('con-shell');
  }, [props.loggedIn]);

  const apriNotifiche = () => {
    setShowMenu(false);
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

  // ---------- Non loggato: solo una barretta con il logo e il link di accesso ----------
  if (!props.loggedIn) {
    return (
      <header className="shell-top shell-top--sempre">
        <Link to="/" className="shell-brand">
          <span className="shell-logo" aria-hidden="true">m</span>
          Margot
        </Link>
        <Link to="/login" className="shell-login">
          <i className="bi bi-box-arrow-in-right me-1"></i>
          Login
        </Link>
      </header>
    );
  }

  const ruolo = props.user?.ruolo;
  const visibili = SEZIONI.filter((s) => !s.ruoli || s.ruoli.includes(ruolo));
  const inTab = visibili.filter((s) => s.tab);
  const inAltro = visibili.filter((s) => !s.tab);

  const voceAvvisi = (
    <button type="button" className="shell-link" onClick={apriNotifiche}>
      <i className="bi bi-bell"></i>
      Avvisi
      {nonLette > 0 && <span className="shell-badge" aria-label={`${nonLette} non lette`}>{nonLette}</span>}
    </button>
  );

  const vociAccount = (
    <>
      <NavDropdown.Item onClick={() => { setShowMenu(false); setShowCambiaPassword(true); }}>
        <i className="bi bi-key me-2"></i>Cambia password
      </NavDropdown.Item>
      <NotifichePushVoce />
    </>
  );

  return (
    <>
      {/* TELEFONO: barra in alto con il logo */}
      <header className="shell-top">
        <Link to="/" className="shell-brand">
          <span className="shell-logo" aria-hidden="true">m</span>
          Margot
        </Link>
      </header>

      {/* TELEFONO: barra in basso con le sezioni principali */}
      <nav className="shell-tabs" aria-label="Sezioni">
        {inTab.map((s) => (
          <NavLink key={s.to} to={s.to} className={classeLink}>
            <i className={`bi ${s.icona}`}></i>
            {s.etichetta}
          </NavLink>
        ))}
        {puoAvereNotifiche && voceAvvisi}
        <button type="button" className="shell-link" onClick={() => setShowMenu(true)}>
          <i className="bi bi-three-dots"></i>
          Altro
        </button>
      </nav>

      {/* COMPUTER: menu laterale con tutte le sezioni */}
      <aside className="shell-side" aria-label="Menu">
        <Link to="/" className="shell-brand">
          <span className="shell-logo" aria-hidden="true">m</span>
          Margot
        </Link>
        {visibili.map((s) => (
          <NavLink key={s.to} to={s.to} className={classeLink}>
            <i className={`bi ${s.icona}`}></i>
            {s.etichetta}
          </NavLink>
        ))}
        {puoAvereNotifiche && voceAvvisi}
        <div className="shell-spazio"></div>
        <div className="shell-user">{props.user?.username}</div>
        {vociAccount}
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={props.handleLogout} className="text-danger">
          <i className="bi bi-box-arrow-right me-2"></i>Logout
        </NavDropdown.Item>
      </aside>

      {/* TELEFONO: menu "Altro" (sezioni rimaste fuori dalla barra e account) */}
      <Offcanvas show={showMenu} onHide={() => setShowMenu(false)} placement="bottom" className="shell-menu">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="shell-user">{props.user?.username}</div>
          {inAltro.map((s) => (
            <NavLink key={s.to} to={s.to} className={classeLink} onClick={() => setShowMenu(false)}>
              <i className={`bi ${s.icona}`}></i>
              {s.etichetta}
            </NavLink>
          ))}
          {vociAccount}
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={props.handleLogout} className="text-danger">
            <i className="bi bi-box-arrow-right me-2"></i>Logout
          </NavDropdown.Item>
        </Offcanvas.Body>
      </Offcanvas>

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
    </>
  );
}

export default NavHeader;
