// Deve restare allineata a backend/categorie.mjs.
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

export const categoriaLabel = (categoria) => CATEGORIE[categoria]?.label || 'Da categorizzare';
export const sottocategoriaLabel = (categoria, sottocategoria) =>
  CATEGORIE[categoria]?.sottocategorie?.[sottocategoria] || sottocategoria || '—';
