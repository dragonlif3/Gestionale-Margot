// Le chiamate al server della gestione del personale.
import { API_URL } from '../../config';

// Il server risponde sempre con un piccolo JSON: { message } se va bene, { error } se non va.
// Se il server non manda un messaggio d'errore leggibile, mostriamo quello di riserva.
async function invia(percorso, { metodo = 'GET', corpo, erroreDefault }) {
  const opzioni = { credentials: 'include' };
  if (metodo !== 'GET') opzioni.method = metodo;
  if (corpo !== undefined) {
    opzioni.headers = { 'Content-Type': 'application/json' };
    opzioni.body = JSON.stringify(corpo);
  }

  const risposta = await fetch(`${API_URL}${percorso}`, opzioni);
  const dati = await risposta.json().catch(() => ({}));
  if (!risposta.ok) throw new Error(dati.error || erroreDefault);
  return dati;
}

export const caricaPersonale = () => invia('/api/personale', { erroreDefault: 'Errore nel caricamento del personale' });

export const creaMembro = (corpo) =>
  invia('/api/personale', { metodo: 'POST', corpo, erroreDefault: "Errore durante la creazione dell'account" });

export const modificaMembro = (id, corpo) =>
  invia(`/api/personale/${id}`, { metodo: 'PUT', corpo, erroreDefault: 'Errore durante il salvataggio' });

export const reimpostaPassword = (id, password) =>
  invia(`/api/personale/${id}/password`, { metodo: 'PUT', corpo: { password }, erroreDefault: 'Errore durante il cambio password' });

export const eliminaMembro = (id) =>
  invia(`/api/personale/${id}`, { metodo: 'DELETE', erroreDefault: "Errore durante l'eliminazione" });
