import { unitaConteggio } from '../../unita';

// Un prodotto da ordinare: nome, scorta attuale e ottimale, e la quantità da ordinare,
// che si può correggere con − e + oppure scrivendo il numero (ad esempio per
// arrotondare a un multiplo della confezione del fornitore).
function RigaOrdine({ prodotto: p, quantita, onCambia }) {
  const unita = unitaConteggio(p);

  return (
    <li className="ord-riga">
      <div className="ord-info">
        <b className="ord-nome">{p.nome}</b>
        <span className="ord-meta">Attuale {p.quantita} · ottimale {p.quantita_ottimale} {unita}</span>
        <span className="ord-meta">
          €{Number(p.prezzo).toFixed(2)} cad. · totale <b className="ord-totale-riga">€{(quantita * Number(p.prezzo)).toFixed(2)}</b>
        </span>
      </div>

      <div className="ord-qta">
        <div className="ord-stepper">
          <button type="button" className="ord-pm" disabled={quantita <= 0} onClick={() => onCambia(p.id, quantita - 1)} title="Togli 1" aria-label={`Togli uno a ${p.nome}`}>
            <i className="bi bi-dash-lg"></i>
          </button>
          <input
            type="number"
            min="0"
            className="ordine-input-quantita ord-input"
            value={quantita}
            onChange={(e) => onCambia(p.id, e.target.value)}
            aria-label={`Quantità da ordinare di ${p.nome}`}
          />
          <button type="button" className="ord-pm" onClick={() => onCambia(p.id, quantita + 1)} title="Aggiungi 1" aria-label={`Aggiungi uno a ${p.nome}`}>
            <i className="bi bi-plus-lg"></i>
          </button>
        </div>
        <small>{unita} da ordinare</small>
      </div>
    </li>
  );
}

export default RigaOrdine;
