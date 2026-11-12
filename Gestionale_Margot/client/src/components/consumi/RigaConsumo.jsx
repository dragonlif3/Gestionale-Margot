import { categoriaLabel, sottocategoriaLabel } from '../../categorie';
import { formatDataOraIT } from '../../dateUtils';
import { coloreCategoria } from '../magazzino/magazzinoUtils';

// Un prodotto del report: quanto è stato consumato (in grande), da quanti movimenti
// e in che periodo. Il bordo a sinistra ha il colore della categoria, come nel Magazzino.
function RigaConsumo({ riga: r }) {
  return (
    <li className={`con-riga con-cat--${coloreCategoria(r.categoria)}`}>
      <div className="con-info">
        <b className="con-nome">{r.nome}</b>
        <span className="con-meta">
          {r.categoria ? `${categoriaLabel(r.categoria)} · ${sottocategoriaLabel(r.categoria, r.sottocategoria)}` : categoriaLabel(r.categoria)}
        </span>
        <span className="con-meta">
          <span className="con-movimenti">{r.movimenti} {r.movimenti === 1 ? 'movimento' : 'movimenti'}</span>
          {' · '}
          <span className="con-periodo">dal {formatDataOraIT(r.dal)} al {formatDataOraIT(r.al)}</span>
        </span>
      </div>
      <div className="con-quantita">
        <b>{r.quantita_totale}</b>
        <small>{r.unita_label}</small>
      </div>
    </li>
  );
}

export default RigaConsumo;
