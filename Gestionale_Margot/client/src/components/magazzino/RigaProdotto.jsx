import { categoriaLabel, sottocategoriaLabel } from '../../categorie';
import { unitaConteggio } from '../../unita';
import { statoScorta } from './magazzinoUtils';

const ETICHETTE_STATO = { esaurito: 'Esaurito', critica: 'Scorta critica', bassa: 'Sotto scorta' };

// Una riga del magazzino: nome e dettagli a sinistra, quantità con i pulsanti − e + a destra,
// poi le azioni meno frequenti (rifornisci in blocco, modifica, elimina).
function RigaProdotto({ prodotto: p, puoGestire, onAggiorna, onRifornisci, onModifica, onElimina }) {
  const { livello, mancano } = statoScorta(p);

  return (
    <li className={`mag-riga mag-riga--${livello}`}>
      <div className="mag-info">
        <b className="mag-nome">{p.nome}</b>
        <span className="mag-meta">
          {p.categoria ? `${categoriaLabel(p.categoria)} · ${sottocategoriaLabel(p.categoria, p.sottocategoria)}` : categoriaLabel(p.categoria)}
        </span>
        <span className="mag-meta">
          €{Number(p.prezzo).toFixed(2)}{mancano > 0 && ` · mancano ${mancano}`}
        </span>
        {ETICHETTE_STATO[livello] && <em className={`mag-stato mag-stato--${livello}`}>{ETICHETTE_STATO[livello]}</em>}
      </div>

      <div className="mag-quantita">
        {puoGestire ? (
          <div className="mag-stepper">
            <button
              type="button"
              className="mag-pm"
              disabled={p.quantita === 0}
              onClick={() => onAggiorna(p.id, -1)}
              title="Togli 1"
              aria-label={`Togli uno a ${p.nome}`}
            >
              <i className="bi bi-dash-lg"></i>
            </button>
            <span className="mag-num">{p.quantita}</span>
            <button
              type="button"
              className="mag-pm"
              onClick={() => onAggiorna(p.id, 1)}
              title="Aggiungi 1"
              aria-label={`Aggiungi uno a ${p.nome}`}
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          </div>
        ) : (
          <span className="mag-num">{p.quantita}</span>
        )}
        <small>{unitaConteggio(p)}</small>
      </div>

      {puoGestire && (
        <div className="mag-azioni">
          <button type="button" className="mag-az" onClick={() => onRifornisci(p)} title="Rifornisci in blocco" aria-label={`Rifornisci ${p.nome}`}>
            <i className="bi bi-box-arrow-in-down"></i>
          </button>
          <button type="button" className="mag-az" onClick={() => onModifica(p)} title="Modifica" aria-label={`Modifica ${p.nome}`}>
            <i className="bi bi-pencil"></i>
          </button>
          <button type="button" className="mag-az mag-az--elimina" onClick={() => onElimina(p.id)} title="Elimina" aria-label={`Elimina ${p.nome}`}>
            <i className="bi bi-trash3"></i>
          </button>
        </div>
      )}
    </li>
  );
}

export default RigaProdotto;
