// Regole della pagina "Cosa Ordinare", senza React: facili da leggere e da provare.
import { categoriaLabel, sottocategoriaLabel } from '../../categorie';
import { unitaConteggio } from '../../unita';
import { daOrdinare } from '../magazzino/magazzinoUtils';

// I prodotti da ordinare, raggruppati per categoria e poi per sottocategoria:
// { categoria: { sottocategoria: [prodotti] } }
export function raggruppaMancanti(prodotti) {
  const gruppi = {};
  prodotti.filter(daOrdinare).forEach((p) => {
    const catKey = p.categoria || 'senza_categoria';
    if (!gruppi[catKey]) gruppi[catKey] = {};
    const sottoKey = p.sottocategoria || 'senza_sottocategoria';
    if (!gruppi[catKey][sottoKey]) gruppi[catKey][sottoKey] = [];
    gruppi[catKey][sottoKey].push(p);
  });
  return gruppi;
}

// Tutti i prodotti dei gruppi in un'unica lista, nello stesso ordine in cui si vedono
export const appiattisci = (gruppi) =>
  Object.values(gruppi).flatMap((sottocategorie) => Object.values(sottocategorie).flat());

// All'inizio si propone di ordinare quanto manca per tornare alla scorta ottimale
export function quantitaIniziali(prodotti) {
  const iniziale = {};
  prodotti.filter(daOrdinare).forEach((p) => {
    iniziale[p.id] = p.quantita_ottimale - p.quantita;
  });
  return iniziale;
}

// Legge quello che l'utente scrive: i numeri validi restano, il resto (vuoto, testo, negativo) diventa 0
export function leggiQuantita(valore) {
  const numero = parseInt(valore, 10);
  return isNaN(numero) || numero < 0 ? 0 : numero;
}

// Il file CSV (testo): una riga per prodotto più il totale. Il carattere speciale
// all'inizio, che serve a Excel per leggere bene gli accenti, lo aggiunge chi scarica il file.
export function creaCsv(prodotti, quantitaPer, totalePer, totaleGenerale) {
  const intestazione = ['Categoria', 'Sottocategoria', 'Nome', 'Quantità attuale', 'Quantità ottimale', 'Da ordinare', 'Unità', 'Prezzo unitario', 'Totale'];
  const righe = prodotti.map((p) => [
    categoriaLabel(p.categoria),
    p.categoria ? sottocategoriaLabel(p.categoria, p.sottocategoria) : '—',
    p.nome,
    p.quantita,
    p.quantita_ottimale,
    quantitaPer(p),
    unitaConteggio(p),
    Number(p.prezzo).toFixed(2),
    totalePer(p).toFixed(2)
  ]);
  righe.push(['', '', '', '', '', '', '', 'TOTALE', totaleGenerale.toFixed(2)]);

  return [intestazione, ...righe]
    .map((riga) => riga.map((cella) => `"${String(cella).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export const nomeFileCsv = (data) => `ordini_margot_${data.toISOString().slice(0, 10)}.csv`;
