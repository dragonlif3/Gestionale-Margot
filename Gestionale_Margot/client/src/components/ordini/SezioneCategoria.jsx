import { CATEGORIE, sottocategoriaLabel } from '../../categorie';
import { coloreCategoria } from '../magazzino/magazzinoUtils';
import RigaOrdine from './RigaOrdine';

// Una categoria con il suo subtotale e, sotto, i prodotti da ordinare divisi per sottocategoria.
//  - sottocategorie: { sottocategoria: [prodotti] }
//  - quantitaPer(p): la quantità da ordinare per un prodotto
function SezioneCategoria({ catKey, sottocategorie, subtotale, quantitaPer, onCambia }) {
  return (
    <section className="ord-sezione">
      <div className="ord-sezione-testa">
        <h3 className={`ord-cat ord-cat--${coloreCategoria(catKey)}`}>
          {catKey === 'senza_categoria' ? 'Da categorizzare' : CATEGORIE[catKey]?.label}
        </h3>
        <span className="ord-sub">Subtotale <b>€{subtotale.toFixed(2)}</b></span>
      </div>

      {Object.entries(sottocategorie).map(([sottoKey, items]) => (
        <div key={sottoKey}>
          {catKey !== 'senza_categoria' && sottoKey !== 'senza_sottocategoria' && (
            <h5 className="ord-sottocat">{sottocategoriaLabel(catKey, sottoKey)}</h5>
          )}
          <ul className="ord-lista">
            {items.map((p) => (
              <RigaOrdine key={p.id} prodotto={p} quantita={quantitaPer(p)} onCambia={onCambia} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default SezioneCategoria;
