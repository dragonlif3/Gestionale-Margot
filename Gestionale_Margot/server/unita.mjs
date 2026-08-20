/**
 * Unità di misura per i prodotti di magazzino.
 * "Singole": il prodotto si conta direttamente in quell'unità.
 * "Multiple": il prodotto viene acquistato in confezioni/scatole ma
 * viene tracciato in magazzino nell'unità reale contenuta (es. lattine),
 * quindi richiedono anche la molteplicità (es. 24 lattine a confezione).
 */
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

export const isUnitaSingola = (unita) => Object.prototype.hasOwnProperty.call(UNITA_SINGOLE, unita);
export const isUnitaMultipla = (unita) => Object.prototype.hasOwnProperty.call(UNITA_MULTIPLE, unita);
export const isUnitaValida = (unita) => isUnitaSingola(unita) || isUnitaMultipla(unita);
