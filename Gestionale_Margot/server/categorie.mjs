/**
 * Tassonomia categorie/sottocategorie dei prodotti di magazzino.
 * Unica fonte di verità lato backend: importala ovunque serva
 * validare o confrontare categoria/sottocategoria.
 */
export const CATEGORIE = {
  alcolici: {
    label: 'Alcolici',
    sottocategorie: {
      liquore: 'Liquore',
      distillato: 'Distillato',
      birra_bottiglia: 'Birra bottiglia',
      vermouth: 'Vino liquoroso/Vermouth'
    }
  },
  fusti: {
    label: 'Fusti',
    sottocategorie: {
      birra: 'Birra',
      sodati: 'Sodati'
    }
  },
  vini: {
    label: 'Vini',
    sottocategorie: {
      bianco: 'Bianco',
      rosso: 'Rosso',
      spumante: 'Spumante'
    }
  },
  bevande: {
    label: 'Bevande',
    sottocategorie: {
      acqua: 'Acqua',
      bevanda: 'Bevanda',
      sodati: 'Sodati',
      succo: 'Succo'
    }
  },
  altro: {
    label: 'Altro',
    sottocategorie: {
      caffe: 'Caffè',
      bombola: 'Bombola'
    }
  }
};

export const isCategoriaValida = (categoria) => Object.prototype.hasOwnProperty.call(CATEGORIE, categoria);

export const isSottocategoriaValida = (categoria, sottocategoria) => {
  if (!isCategoriaValida(categoria)) return false;
  return Object.prototype.hasOwnProperty.call(CATEGORIE[categoria].sottocategorie, sottocategoria);
};
