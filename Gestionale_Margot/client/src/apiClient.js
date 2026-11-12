// Piccolo aiuto condiviso per le chiamate al server.
// Esegue la chiamata e lancia un Error con il messaggio da mostrare se il server non risponde "ok".
//  - erroreDefault: messaggio mostrato se qualcosa va storto
//  - usaErroreServer: se true, preferisce il messaggio inviato dal server (campo "error")
import { API_URL } from './config';

export async function chiama(percorso, { metodo = 'GET', corpo, erroreDefault, usaErroreServer = false } = {}) {
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
