import { formatDataOraIT } from '../../dateUtils';
import { descriviVoce, ICONE_ENTITA, oraDiUnaVoce } from './storicoUtils';

// Una riga dello storico: icona colorata per tipo (prodotto / evento), chi ha fatto cosa, e l'ora.
// Passando il mouse (o tenendo premuto) sull'ora si vede la data completa.
function VoceStorico({ voce }) {
  return (
    <li className="sto-voce">
      <span className={`sto-icona sto-icona--${voce.entita}`} aria-hidden="true">
        <i className={`bi ${ICONE_ENTITA[voce.entita] || 'bi-dot'}`}></i>
      </span>
      <div className="sto-testo">
        <strong>{voce.utente_username}</strong> {descriviVoce(voce)}
      </div>
      <time className="sto-ora" dateTime={voce.creato_il} title={formatDataOraIT(voce.creato_il)}>
        {oraDiUnaVoce(voce)}
      </time>
    </li>
  );
}

export default VoceStorico;
