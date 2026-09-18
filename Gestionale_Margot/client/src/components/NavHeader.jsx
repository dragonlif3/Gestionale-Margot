import 'bootstrap-icons/font/bootstrap-icons.css';
import { LogoutButton } from './AuthComp.jsx'; // Assicurati che il percorso sia corretto
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../App.css';

function NavHeader(props) {
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

            {/* Bottone Admin (visibile SOLO agli admin) */}
            {props.loggedIn && props.user?.ruolo === 'amministrazione' && (
              <Button 
                variant="outline-warning" 
                size="sm" 
                className="me-3 my-2 my-lg-0"
                onClick={props.handleShowAdmin} // Funzione per aprire il modale AdminPanel
              >
                <i className="bi bi-person-badge me-1"></i>
                Personale
              </Button>
            )}

            {/* Gestione Login / Logout */}
            {props.loggedIn ? (
              <>
                <Navbar.Text className="me-3 d-none d-lg-block">
                  Ciao, <b className="text-white">{props.user?.username}</b>
                </Navbar.Text>
                <LogoutButton logout={props.handleLogout} />
              </>
            ) : (
              <Nav.Link as={Link} to="/login" className="navbar-link">
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Login
              </Nav.Link>
            )}
            
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavHeader;