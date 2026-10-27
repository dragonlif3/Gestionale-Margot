// Tutte le chiamate al server del calendario, in un posto solo.
// Ogni funzione restituisce i dati (o niente) oppure lancia un Error con il
// messaggio da mostrare all'utente: chi la chiama decide cosa farne.

import { API_URL } from '../../config';

// Esegue la chiamata e lancia un errore se il server non risponde "ok".
//  - erroreDefault: messaggio mostrato se qualcosa va storto
//  - usaErroreServer: se true, preferisce il messaggio inviato dal server (campo "error")
async function chiama(percorso, { metodo = 'GET', corpo, erroreDefault, usaErroreServer = false }) {
  const opzioni = { credentials: 'include' };
  if (metodo !== 'GET') opzioni.method = metodo;
  if (corpo !== undefined) {
    opzioni.headers = { 'Content-Type': 'application/json' };
    opzioni.body = JSON.stringify(corpo);
  }

  const risposta = await fetch(`${API_URL}${percorso}`, opzioni);

  if (!risposta.ok) {
    let messaggio = erroreDefault;
    if (usaErroreServer) {
      const dati = await risposta.json().catch(() => ({}));
      messaggio = dati.error || erroreDefault;
    }
    throw new Error(messaggio);
  }
  return risposta;
}

// ---- Lettura ----

export const caricaEventi = async () =>
  (await chiama('/api/eventi', { erroreDefault: 'Errore nel caricamento degli eventi' })).json();

export const caricaNotificheGrafica = async () =>
  (await chiama('/api/notifiche-grafica', { erroreDefault: 'Errore nel caricamento della bacheca' })).json();

export const caricaPagamenti = async () =>
  (await chiama('/api/notifiche-pagamento', { erroreDefault: 'Errore nel caricamento dei pagamenti' })).json();

export const caricaIscritti = async (eventoId) =>
  (await chiama(`/api/eventi/${eventoId}/iscritti`, { erroreDefault: 'Errore nel caricamento degli iscritti' })).json();

// ---- Scrittura ----

// Senza id crea un evento nuovo (POST), con id modifica quello esistente (PUT)
export const salvaEvento = (id, payload) =>
  chiama(id ? `/api/eventi/${id}` : '/api/eventi', {
    metodo: id ? 'PUT' : 'POST',
    corpo: payload,
    erroreDefault: 'Errore durante il salvataggio',
    usaErroreServer: true
  });

export const eliminaEvento = (id) =>
  chiama(`/api/eventi/${id}`, { metodo: 'DELETE', erroreDefault: "Errore durante l'eliminazione" });

export const completaNotificaGrafica = (id) =>
  chiama(`/api/notifiche-grafica/${id}/completa`, { metodo: 'PUT', erroreDefault: "Errore durante l'aggiornamento" });

export const segnaPagato = (id) =>
  chiama(`/api/notifiche-pagamento/${id}/paga`, { metodo: 'PUT', erroreDefault: "Errore durante l'aggiornamento" });

export const iscrivitiAEvento = (eventoId) =>
  chiama(`/api/eventi/${eventoId}/iscrizione`, {
    metodo: 'POST',
    erroreDefault: "Errore durante l'iscrizione",
    usaErroreServer: true
  });

export const annullaIscrizione = (eventoId) =>
  chiama(`/api/eventi/${eventoId}/iscrizione`, {
    metodo: 'DELETE',
    erroreDefault: "Errore durante l'annullamento",
    usaErroreServer: true
  });
