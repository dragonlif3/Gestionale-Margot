// Le chiamate al server del magazzino.
import { chiama } from '../../apiClient';

export const caricaProdotti = async () =>
  (await chiama('/api/prodotti', { erroreDefault: 'Errore nel caricamento del magazzino' })).json();

// Manda una VARIAZIONE (negativa per togliere, positiva per aggiungere) e non un valore assoluto:
// così è il server, con l'ultimo dato reale, a decidere il risultato finale, anche se nel frattempo
// qualcun altro ha già toccato lo stesso prodotto.
export const aggiornaQuantita = (id, delta) =>
  chiama(`/api/prodotti/${id}/quantita`, {
    metodo: 'PUT',
    corpo: { delta },
    erroreDefault: "Errore durante l'aggiornamento",
    usaErroreServer: true
  });

// Senza id crea un prodotto nuovo (POST), con id modifica quello esistente (PUT)
export const salvaProdotto = (id, payload) =>
  chiama(id ? `/api/prodotti/${id}` : '/api/prodotti', {
    metodo: id ? 'PUT' : 'POST',
    corpo: payload,
    erroreDefault: 'Errore durante il salvataggio',
    usaErroreServer: true
  });

export const eliminaProdotto = (id) =>
  chiama(`/api/prodotti/${id}`, { metodo: 'DELETE', erroreDefault: "Errore durante l'eliminazione" });
