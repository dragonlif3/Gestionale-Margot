import { CATEGORIE } from '../../categorie';
import { coloreCategoria } from './magazzinoUtils';

// Barra di ricerca e pulsanti delle categorie (scorrono di lato su telefono).
function FiltriMagazzino({ ricerca, onRicerca, tab, onTab, mostraNonCategorizzati }) {
  return (
    <>
      <label className="mag-cerca">
        <i className="bi bi-search" aria-hidden="true"></i>
        <input
          type="search"
          placeholder="Cerca un prodotto per nome..."
          aria-label="Cerca un prodotto per nome"
          value={ricerca}
          onChange={(e) => onRicerca(e.target.value)}
        />
      </label>

      <div className="mag-chips" role="group" aria-label="Categorie">
        <button type="button" className="mag-chip mag-chip--tutti" aria-pressed={tab === 'tutto'} onClick={() => onTab('tutto')}>
          Tutto
        </button>
        {Object.entries(CATEGORIE).map(([chiave, categoria]) => (
          <button
            type="button"
            key={chiave}
            className={`mag-chip mag-chip--${coloreCategoria(chiave)}`}
            aria-pressed={tab === chiave}
            onClick={() => onTab(chiave)}
          >
            {categoria.label}
          </button>
        ))}
        {mostraNonCategorizzati && (
          <button type="button" className="mag-chip mag-chip--lilla" aria-pressed={tab === 'senza_categoria'} onClick={() => onTab('senza_categoria')}>
            Da categorizzare
          </button>
        )}
      </div>
    </>
  );
}

export default FiltriMagazzino;
