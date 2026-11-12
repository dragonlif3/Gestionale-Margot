import { MESI_BREVI, coloreTipo } from './calendarioUtils';

// La scheda di UN evento, in stile manifesto: colore in base al tipo, data grande,
// titolo in Anton. Contiene anche i pulsanti (iscrizione, modifica, eliminazione).
//  - iscrittiEspansi: true se l'elenco degli iscritti è aperto
//  - iscritti: la lista già scaricata (undefined finché non è stata caricata)
function SchedaEvento({
  ev,
  permessi,
  iscrittiEspansi,
  iscritti,
  onToggleIscritti,
  onIscriviti,
  onAnnullaIscrizione,
  onModifica,
  onElimina
}) {
  const { puoGestireEventi, puoVedereStatoGrafica, puoVedereStatoPagamento, isVolontario } = permessi;
  const [, mese, giorno] = ev.data_evento.slice(0, 10).split('-');
  const richiedeVolontari = ev.max_volontari > 0;
  const pieno = richiedeVolontari && ev.iscritti_count >= ev.max_volontari;

  return (
    <article className={`cal-card cal-tipo--${coloreTipo(ev.tipo)}`}>
      <div className="cal-card-top">
        <span className="cal-etichetta">{ev.tipo}</span>
        <div className="cal-data" aria-label={`${Number(giorno)} ${MESI_BREVI[Number(mese) - 1]}`}>
          {Number(giorno)}<br />{MESI_BREVI[Number(mese) - 1]}
        </div>
      </div>

      <h4 className="cal-titolo">{ev.nome}</h4>
      <p className="cal-meta">€{Number(ev.costo).toFixed(2)} · Creato da {ev.creato_da_username}</p>

      <div className="cal-chips">
        {richiedeVolontari && (
          <span className={`cal-chip${pieno ? ' cal-chip--pieno' : ''}`}>
            <i className="bi bi-people me-1"></i>{ev.iscritti_count}/{ev.max_volontari} volontari
          </span>
        )}
        {puoVedereStatoGrafica && ev.grafica_stato && (
          <span className="cal-chip">
            <i className="bi bi-easel me-1"></i>
            {ev.grafica_stato === 'completato' ? 'Grafica pronta' : 'Grafica in lavorazione'}
          </span>
        )}
        {puoVedereStatoPagamento && ev.pagamento_stato && (
          <span className="cal-chip">
            <i className="bi bi-cash-coin me-1"></i>
            {ev.pagamento_stato === 'pagato' ? 'Pagato' : 'Da pagare'}
          </span>
        )}
      </div>

      <div className="cal-azioni">
        {richiedeVolontari && isVolontario && (
          ev.iscritto ? (
            <button type="button" className="cal-act" onClick={() => onAnnullaIscrizione(ev.id)}>
              <i className="bi bi-x-circle"></i> Annulla iscrizione
            </button>
          ) : pieno ? (
            <button type="button" className="cal-act" disabled>Posti esauriti</button>
          ) : (
            <button type="button" className="cal-act" onClick={() => onIscriviti(ev.id)}>
              <i className="bi bi-check-circle"></i> Iscriviti
            </button>
          )
        )}

        {richiedeVolontari && puoGestireEventi && (
          <button type="button" className="cal-link" onClick={() => onToggleIscritti(ev.id)}>
            {iscrittiEspansi ? 'Nascondi iscritti' : 'Vedi chi si è iscritto'}
          </button>
        )}

        {puoGestireEventi && (
          <>
            <button type="button" className="cal-act cal-act--icona ms-auto" onClick={() => onModifica(ev)} aria-label="Modifica evento">
              <i className="bi bi-pencil"></i>
            </button>
            <button type="button" className="cal-act cal-act--icona" onClick={() => onElimina(ev.id)} aria-label="Elimina evento">
              <i className="bi bi-trash3"></i>
            </button>
          </>
        )}
      </div>

      {richiedeVolontari && puoGestireEventi && iscrittiEspansi && (
        <ul className="cal-iscritti">
          {(iscritti || []).length === 0 ? (
            <li>Nessun iscritto ancora.</li>
          ) : (
            iscritti.map((iscritto) => <li key={iscritto.id}>{iscritto.username}</li>)
          )}
        </ul>
      )}
    </article>
  );
}

export default SchedaEvento;
