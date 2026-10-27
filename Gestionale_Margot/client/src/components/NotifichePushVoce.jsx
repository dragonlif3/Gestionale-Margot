import { useState, useEffect } from 'react';
import { NavDropdown } from 'react-bootstrap';
import { leggiStatoPush, attivaPush, disattivaPush } from '../push';

// Voce del menu utente: "Attiva / Disattiva notifiche".
// Le notifiche si attivano per dispositivo: chi usa app e computer le attiva su entrambi.
function NotifichePushVoce() {
  const [stato, setStato] = useState(null); // null = sto ancora controllando
  const [occupato, setOccupato] = useState(false);
  const [errore, setErrore] = useState(null);

  useEffect(() => {
    leggiStatoPush()
      .then(setStato)
      .catch(() => setStato('non-supportato'));
  }, []);

  const cambia = async () => {
    setOccupato(true);
    setErrore(null);
    try {
      if (stato === 'attivo') await disattivaPush();
      else await attivaPush();
    } catch (err) {
      setErrore(err.message);
    } finally {
      // Rileggiamo lo stato vero dal browser invece di indovinarlo
      setStato(await leggiStatoPush().catch(() => 'non-supportato'));
      setOccupato(false);
    }
  };

  if (stato === null) return null;

  if (stato === 'non-supportato') {
    return (
      <NavDropdown.ItemText className="small text-muted">
        <i className="bi bi-bell-slash me-2"></i>
        Notifiche non disponibili qui.
        <br />
        Su iPhone installa prima l'app dalla schermata Home.
      </NavDropdown.ItemText>
    );
  }

  if (stato === 'bloccato') {
    return (
      <NavDropdown.ItemText className="small text-muted">
        <i className="bi bi-bell-slash me-2"></i>
        Notifiche bloccate: riattivale dalle impostazioni del browser.
      </NavDropdown.ItemText>
    );
  }

  return (
    <>
      <NavDropdown.Item onClick={cambia} disabled={occupato}>
        {stato === 'attivo' ? (
          <><i className="bi bi-bell-slash me-2"></i>Disattiva notifiche</>
        ) : (
          <><i className="bi bi-bell me-2"></i>Attiva notifiche</>
        )}
      </NavDropdown.Item>
      {errore && <NavDropdown.ItemText className="small text-danger">{errore}</NavDropdown.ItemText>}
    </>
  );
}

export default NotifichePushVoce;
