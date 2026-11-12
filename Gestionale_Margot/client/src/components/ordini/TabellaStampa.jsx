import { Table } from 'react-bootstrap';
import { CATEGORIE, sottocategoriaLabel } from '../../categorie';
import { unitaConteggio } from '../../unita';

// La versione per la CARTA: una tabella compatta per categoria, senza pulsanti né campi.
// Sullo schermo non si vede (è nascosta), compare solo quando si stampa o si salva il PDF.
function TabellaStampa({ gruppi, quantitaPer, totalePer }) {
  return (
    <>
      {Object.entries(gruppi).map(([catKey, sottocategorie]) => {
        const items = Object.values(sottocategorie).flat();
        const subtotale = items.reduce((somma, p) => somma + totalePer(p), 0);
        return (
          <div key={catKey} className="mb-4 ordine-categoria">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4 className="mb-0">{catKey === 'senza_categoria' ? 'Da categorizzare' : CATEGORIE[catKey]?.label}</h4>
              <span className="small">Subtotale: <strong>€{subtotale.toFixed(2)}</strong></span>
            </div>
            <Table bordered size="sm" className="align-middle">
              <thead>
                <tr>
                  <th>Sottocategoria</th>
                  <th>Nome</th>
                  <th className="text-center">Attuale</th>
                  <th className="text-center">Ottimale</th>
                  <th className="text-center">Da ordinare</th>
                  <th className="text-end">Prezzo unit.</th>
                  <th className="text-end">Totale</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sottocategorie).map(([sottoKey, righe]) =>
                  righe.map((p, idx) => (
                    <tr key={p.id}>
                      {idx === 0 ? (
                        <td rowSpan={righe.length} className="fw-bold">
                          {catKey !== 'senza_categoria' && sottoKey !== 'senza_sottocategoria' ? sottocategoriaLabel(catKey, sottoKey) : '—'}
                        </td>
                      ) : null}
                      <td>{p.nome}</td>
                      <td className="text-center">{p.quantita} {unitaConteggio(p)}</td>
                      <td className="text-center">{p.quantita_ottimale} {unitaConteggio(p)}</td>
                      <td className="text-center">{quantitaPer(p)} {unitaConteggio(p)}</td>
                      <td className="text-end">€{Number(p.prezzo).toFixed(2)}</td>
                      <td className="text-end fw-bold">€{totalePer(p).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        );
      })}
    </>
  );
}

export default TabellaStampa;
