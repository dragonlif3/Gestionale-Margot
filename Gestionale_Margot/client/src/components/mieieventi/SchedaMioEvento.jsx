import { formatDataIT } from '../../dateUtils';
import { MESI_BREVI, coloreTipo } from '../calendario/calendarioUtils';

// Un evento a cui sei iscritto: colore del tipo, data in grande, titolo e, se è ancora in programma,
// il pulsante per annullare l'iscrizione. Un evento concluso è attenuato e senza pulsante.
function SchedaMioEvento({ evento: ev, passato, onAnnulla }) {
  const [, mese, giorno] = String(ev.data_evento).slice(0, 10).split('-');

  return (
    <li className={`mie-card mie-card--${coloreTipo(ev.tipo)}${passato ? ' mie-card--passato' : ''}`}>
      <div className="mie-top">
        <span className="mie-etichetta">{ev.tipo}</span>
        <div className="mie-data" aria-hidden="true">{Number(giorno)}<br />{MESI_BREVI[Number(mese) - 1]}</div>
      </div>

      <h3 className="mie-titolo">{ev.nome}</h3>
      <p className="mie-dettagli">{formatDataIT(ev.data_evento)}</p>

      <div className="mie-azioni">
        <span className="mie-stato">{passato ? 'Concluso' : 'In programma'}</span>
        {!passato && (
          <button type="button" className="mie-annulla" onClick={() => onAnnulla(ev.id)}>
            <i className="bi bi-x-circle"></i> Annulla iscrizione
          </button>
        )}
      </div>
    </li>
  );
}

export default SchedaMioEvento;
