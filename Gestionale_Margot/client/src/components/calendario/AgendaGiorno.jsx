import { useState } from 'react';
import SchedaEvento from './SchedaEvento';
import { caricaIscritti } from './api';

// L'agenda del giorno selezionato: le schede degli eventi di quel giorno.
// Su telefono sta sotto la griglia, su computer in un pannello a destra.
// Tiene da sé quali elenchi di iscritti sono aperti e quelli già scaricati.
function AgendaGiorno({
  giorno,
  eventi,
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
    <aside className="cal-agenda" aria-label="Eventi del giorno">
      <div className="cal-agenda-testa">
        <h3>{giorno.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
        {permessi.puoGestireEventi && (
          <button type="button" className="btn btn-warning btn-sm" onClick={() => onNuovoEvento(giorno)}>
            <i className="bi bi-plus-circle"></i> Aggiungi evento
          </button>
        )}
      </div>

      {eventi.length === 0 ? (
        <p className="cal-vuoto">Nessun evento in questo giorno.</p>
      ) : (
        eventi.map((ev) => (
          <SchedaEvento
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
        ))
      )}
    </aside>
  );
}

export default AgendaGiorno;
