// Deve restare allineata a backend/unita.mjs.
export const UNITA_SINGOLE = {
  bottiglia: 'Bottiglia',
  box: 'Box',
  lattina: 'Lattina',
  fusto: 'Fusto',
  bombola: 'Bombola'
};

export const UNITA_MULTIPLE = {
  confezione: 'Confezione',
  scatola: 'Scatola'
};

export const isUnitaMultipla = (unita) => Object.prototype.hasOwnProperty.call(UNITA_MULTIPLE, unita);

// Etichetta dell'unità "reale" con cui viene contato il prodotto in magazzino:
// per le unità multiple è il contenuto (es. "lattine"), altrimenti l'unità stessa.
export const unitaConteggio = (prodotto) => {
  if (isUnitaMultipla(prodotto.unita) && prodotto.unita_contenuto) {
    return prodotto.unita_contenuto;
  }
  return UNITA_SINGOLE[prodotto.unita] || prodotto.unita;
};
