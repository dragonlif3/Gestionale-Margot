/**
 * Unità di misura per i prodotti di magazzino.
 *
 * Tutte le unità sono "dirette": il prodotto si conta esattamente in
 * quell'unità, sia che si tratti di una bottiglia o di una confezione.
 * Una "Confezione" da 24 lattine si conta in confezioni (1, 2, 3...),
 * si toglie una confezione intera quando è finita, e il prezzo è quello
 * della confezione: niente più conversioni interne verso il contenuto.
 */
export const UNITA = {
  bottiglia: 'Bottiglia',
  box: 'Box',
  lattina: 'Lattina',
  fusto: 'Fusto',
  bombola: 'Bombola',
  confezione: 'Confezione',
  scatola: 'Scatola'
};

export const isUnitaValida = (unita) => Object.prototype.hasOwnProperty.call(UNITA, unita);

// Etichetta dell'unità di un prodotto. Specchio di unitaConteggio() in
// unita.js lato frontend (mantenuta con lo stesso nome per non dover
// toccare i punti che già la usano, es. il log dei consumi).
export const unitaConteggioLabel = (prodotto) => UNITA[prodotto.unita] || prodotto.unita;
