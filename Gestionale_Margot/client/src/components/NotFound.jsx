import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './notfound.css';

// La pagina che si vede quando l'indirizzo non esiste.
function NotFound() {
  return (
    <main className="nf-pagina container-not-found">
      <div className="nf-cerchio">
        <h1 className="nf-numero">404</h1>
      </div>
      <h2>Pagina non trovata</h2>
      <p className="lead">La pagina che stai cercando non esiste.</p>
      <Button as={Link} to="/" variant="warning">
        Torna alla Home
      </Button>
    </main>
  );
}

export default NotFound;
