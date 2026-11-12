// Regole del magazzino, senza React: facili da leggere e da provare.

// Un prodotto è "da ordinare" quando ha una scorta ottimale e ne abbiamo meno.
// È la stessa regola della pagina Ordini: il numero sul pulsante e l'elenco coincidono.
export const daOrdinare = (p) => p.quantita_ottimale > 0 && p.quantita < p.quantita_ottimale;

// Livello di scorta di un prodotto:
//   'esaurito' = 0 pezzi · 'critica' = fino al 25% della scorta ottimale
//   'bassa' = fino al 50% · 'ok' = tutto il resto
// "mancano" = quanti pezzi servono per tornare alla scorta ottimale (0 se non applicabile).
export function statoScorta(p) {
  const { quantita, quantita_ottimale } = p;
  const mancano = quantita_ottimale > 0 && quantita < quantita_ottimale ? quantita_ottimale - quantita : 0;

  if (quantita === 0) return { livello: 'esaurito', mancano };
  if (quantita_ottimale > 0) {
    const percentuale = quantita / quantita_ottimale;
    if (percentuale <= 0.25) return { livello: 'critica', mancano };
    if (percentuale <= 0.5) return { livello: 'bassa', mancano };
  }
  return { livello: 'ok', mancano };
}

// Il colore con cui si disegna il pulsante di una categoria (vedi magazzino.css)
const COLORI_CATEGORIA = { alcolici: 'arancio', fusti: 'sole', vini: 'magenta', bevande: 'verde', altro: 'lime' };
export const coloreCategoria = (chiave) => COLORI_CATEGORIA[chiave] || 'lilla';

// Prodotti da mostrare per la categoria scelta ('tutto', una categoria, o 'senza_categoria')
// e per il testo cercato nel nome.
export function filtraProdotti(prodotti, tab, ricerca) {
  let lista = prodotti;
  if (tab === 'senza_categoria') {
    lista = lista.filter((p) => !p.categoria);
  } else if (tab !== 'tutto') {
    lista = lista.filter((p) => p.categoria === tab);
  }
  if (ricerca) {
    lista = lista.filter((p) => p.nome.toLowerCase().includes(ricerca.toLowerCase()));
  }
  return lista;
}
