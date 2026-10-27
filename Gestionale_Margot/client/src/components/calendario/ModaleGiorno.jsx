import { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import EventoDettaglio from './EventoDettaglio';
import { caricaIscritti } from './api';
import { toDateKey } from './calendarioUtils';

// La finestra che mostra gli eventi di un giorno.
// Tiene da sé quali elenchi di iscritti sono aperti e quelli già scaricati:
// sono dettagli che riguardano solo questa finestra.
function ModaleGiorno({
  show,
  onHide,
  giorno,
  eventiPerGiorno,
  permessi,
  onIscriviti,
  onAnnullaIscrizione,
  onModifica,
  onElimina,
  onNuovoEvento
}) {
  // evento_id -> array di iscritti, caricato on-demand quando lo si consulta
  const [iscrittiPerEvento, setIscrittiPerEvento] = useState({});
  const [eventoIscrittiEspanso, setEventoIscrittiEspanso] = useState(null);

  const toggleIscrittiEvento = async (eventoId) => {
    if (eventoIscrittiEspanso === eventoId) {
      setEventoIscrittiEspanso(null);
      return;
    }
    setEventoIscrittiEspanso(eventoId);
    if (!iscrittiPerEvento[eventoId]) {
      try {
        const data = await caricaIscritti(eventoId);
        setIscrittiPerEvento((prev) => ({ ...prev, [eventoId]: data }));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {giorno && giorno.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {giorno && (eventiPerGiorno[toDateKey(giorno)] || []).map((ev) => (
          <EventoDettaglio
            key={ev.id}
            ev={ev}
            permessi={permessi}
            iscrittiEspansi={eventoIscrittiEspanso === ev.id}
            iscritti={iscrittiPerEvento[ev.id]}
            onToggleIscritti={toggleIscrittiEvento}
            onIscriviti={onIscriviti}
            onAnnullaIscrizione={onAnnullaIscrizione}
            onModifica={onModifica}
            onElimina={onElimina}
          />
        ))}
        {permessi.puoGestireEventi && (
          <Button variant="success" size="sm" onClick={() => onNuovoEvento(giorno)}>
            <i className="bi bi-plus-circle me-1"></i> Aggiungi un altro evento in questo giorno
          </Button>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default ModaleGiorno;
