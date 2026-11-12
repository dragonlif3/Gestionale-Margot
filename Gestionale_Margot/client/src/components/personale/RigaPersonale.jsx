import { RUOLI_LABEL } from '../../roles';
import { coloreRuolo, iniziale } from './personaleUtils';

// Un account: avatar con l'iniziale (nel colore del ruolo), nome, etichetta del ruolo e le tre azioni.
// "sonoIo" = è l'account con cui sei entrato: non lo puoi eliminare.
function RigaPersonale({ utente: u, sonoIo, onModifica, onPassword, onElimina }) {
  return (
    <li className="per-riga">
      <div className={`per-avatar per-colore--${coloreRuolo(u.ruolo)}`} aria-hidden="true">{iniziale(u.username)}</div>

      <div className="per-info">
        <b className="per-nome">
          {u.username}
          {sonoIo && <span className="per-tu">tu</span>}
        </b>
        <span className={`per-ruolo per-colore--${coloreRuolo(u.ruolo)}`}>{RUOLI_LABEL[u.ruolo] || u.ruolo}</span>
      </div>

      <div className="per-azioni">
        <button type="button" className="per-az" onClick={() => onModifica(u)} title="Modifica username / ruolo" aria-label={`Modifica ${u.username}`}>
          <i className="bi bi-pencil"></i>
        </button>
        <button type="button" className="per-az" onClick={() => onPassword(u)} title="Reimposta password" aria-label={`Reimposta la password di ${u.username}`}>
          <i className="bi bi-key"></i>
        </button>
        <button
          type="button"
          className="per-az per-az--elimina"
          disabled={sonoIo}
          onClick={() => onElimina(u)}
          title={sonoIo ? 'Non puoi eliminare te stesso' : 'Elimina account'}
          aria-label={sonoIo ? 'Non puoi eliminare te stesso' : `Elimina ${u.username}`}
        >
          <i className="bi bi-trash3"></i>
        </button>
      </div>
    </li>
  );
}

export default RigaPersonale;
