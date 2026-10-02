// Deve restare allineata a backend/unita.mjs.
//
// Tutte le unità sono "dirette": il prodotto si conta esattamente in
// quell'unità. Una "Confezione" da 24 lattine si conta in confezioni
// (1, 2, 3...), il prezzo è quello della confezione, e quando è finita
// si toglie 1 confezione intera - niente conversioni interne.
export const UNITA = {
  bottiglia: 'Bottiglia',
  box: 'Box',
  lattina: 'Lattina',
  fusto: 'Fusto',
  bombola: 'Bombola',
  confezione: 'Confezione',
  scatola: 'Scatola'
};

// Etichetta dell'unità di un prodotto (mantiene il nome storico
// "unitaConteggio" per non dover toccare i punti che già la usano).
export const unitaConteggio = (prodotto) => UNITA[prodotto.unita] || prodotto.unita;
