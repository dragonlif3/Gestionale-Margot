import { useState, useEffect, useRef } from 'react';
import { Container, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import RigaPersonale from './personale/RigaPersonale';
import { ModaleNuovo, ModaleModifica, ModalePassword } from './personale/ModaliPersonale';
import { caricaPersonale, creaMembro, modificaMembro, reimpostaPassword, eliminaMembro } from './personale/api';
import './personale/personale.css';

// Il "regista" della pagina: tiene lo stato e decide cosa fare quando l'utente agisce.
// Come appare ogni parte è nei componenti della cartella personale/.
function GestionePersonale({ utenteCorrente }) {
  const [personale, setPersonale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successo, setSuccesso] = useState(null);

  const [utenteInModifica, setUtenteInModifica] = useState(null);
  const [showModifica, setShowModifica] = useState(false);
  const [utentePassword, setUtentePassword] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNuovo, setShowNuovo] = useState(false);

  // Il messaggio di successo sparisce da solo dopo 4 secondi; se ne arriva un altro nel frattempo,
  // il conto alla rovescia riparte (altrimenti il primo cancellerebbe subito il secondo).
  const timer = useRef(null);
  const mostraSuccesso = (msg) => {
    clearTimeout(timer.current);
    setSuccesso(msg);
    timer.current = setTimeout(() => setSuccesso(null), 4000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const fetchPersonale = async () => {
    try {
      setPersonale(await caricaPersonale());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPersonale(); }, []);

  // Ognuna di queste restituisce true se è andata bene, così la finestra può svuotare il modulo
  const handleNuovo = async (corpo) => {
    try {
      const data = await creaMembro(corpo);
      setShowNuovo(false);
      fetchPersonale();
      mostraSuccesso(data.message);
      return true;
    } catch (err) { alert(err.message); return false; }
  };

  const handleModifica = async (corpo) => {
    try {
      const data = await modificaMembro(utenteInModifica.id, corpo);
      setShowModifica(false);
      fetchPersonale();
      mostraSuccesso(data.message);
      return true;
    } catch (err) { alert(err.message); return false; }
  };

  const handleResetPassword = async (password) => {
    try {
      await reimpostaPassword(utentePassword.id, password);
      setShowPassword(false);
      mostraSuccesso(`Password di "${utentePassword.username}" aggiornata.`);
      return true;
    } catch (err) { alert(err.message); return false; }
  };

  const handleElimina = async (utente) => {
    if (!window.confirm(`Sei sicuro di voler eliminare l'account di "${utente.username}"? L'operazione non è reversibile.`)) return;
    try {
      const data = await eliminaMembro(utente.id);
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
    <Container className="mt-4 mb-5 per-pagina">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-people"></i> Gestione Personale
          </h2>
          <p className="text-muted mb-0">{personale.length} account registrati</p>
        </Col>
        <Col xs="auto">
          <Button variant="warning" onClick={() => setShowNuovo(true)}>
            <i className="bi bi-person-plus me-1"></i> Nuovo membro
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {successo && <Alert variant="success" role="status"><i className="bi bi-check-circle me-2"></i>{successo}</Alert>}

      {personale.length === 0 ? (
        <p className="per-vuoto">Nessun utente trovato.</p>
      ) : (
        <ul className="per-lista">
          {personale.map((u) => (
            <RigaPersonale
              key={u.id}
              utente={u}
              sonoIo={u.id === utenteCorrente?.id}
              onModifica={(x) => { setUtenteInModifica(x); setShowModifica(true); }}
              onPassword={(x) => { setUtentePassword(x); setShowPassword(true); }}
              onElimina={handleElimina}
            />
          ))}
        </ul>
      )}

      <ModaleNuovo show={showNuovo} onHide={() => setShowNuovo(false)} onSalva={handleNuovo} />
      <ModaleModifica show={showModifica} onHide={() => setShowModifica(false)} utente={utenteInModifica} sonoIo={utenteInModifica?.id === utenteCorrente?.id} onSalva={handleModifica} />
      <ModalePassword show={showPassword} onHide={() => setShowPassword(false)} utente={utentePassword} onSalva={handleResetPassword} />
    </Container>
  );
}

export { GestionePersonale };
