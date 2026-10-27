import { API_URL } from './config';

// Funzioni per gestire le notifiche push di QUESTO dispositivo.
// Lo stato vero sta nel browser (esiste o no un'iscrizione); il server tiene
// una copia per sapere a chi inviare.

const INTESTAZIONI_JSON = { 'Content-Type': 'application/json' };

export const pushSupportato = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// La chiave pubblica arriva dal server in base64 "url-safe": il browser la vuole in byte.
const chiaveInByte = (base64Url) => {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const testo = atob(base64);
  return Uint8Array.from(testo, (carattere) => carattere.charCodeAt(0));
};

// Il service worker può non essere registrato (ad esempio in sviluppo): in quel caso
// "ready" non si risolve mai e il resto dell'app resterebbe in attesa. Con un limite
// di tempo restituiamo null e le funzioni qui sotto semplicemente non fanno nulla.
const ottieniRegistrazione = () =>
  Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), 3000))
  ]);

const inviaIscrizioneAlServer = (iscrizione) =>
  fetch(`${API_URL}/api/push/iscrizione`, {
    method: 'POST',
    headers: INTESTAZIONI_JSON,
    credentials: 'include',
    body: JSON.stringify(iscrizione.toJSON())
  });

// 'non-supportato' | 'bloccato' | 'attivo' | 'disattivo'
export const leggiStatoPush = async () => {
  if (!pushSupportato()) return 'non-supportato';
  if (Notification.permission === 'denied') return 'bloccato';

  const registrazione = await ottieniRegistrazione();
  if (!registrazione) return 'non-supportato';
  const iscrizione = await registrazione.pushManager.getSubscription();
  return iscrizione ? 'attivo' : 'disattivo';
};

// Va chiamata da un gesto dell'utente (un clic): i browser non mostrano
// la richiesta di permesso se parte da sola.
export const attivaPush = async () => {
  const permesso = await Notification.requestPermission();
  if (permesso !== 'granted') throw new Error('Permesso per le notifiche non concesso.');

  const rispostaChiave = await fetch(`${API_URL}/api/push/chiave`, { credentials: 'include' });
  if (!rispostaChiave.ok) throw new Error('Le notifiche non sono disponibili al momento.');
  const { chiave } = await rispostaChiave.json();

  const registrazione = await ottieniRegistrazione();
  if (!registrazione) throw new Error('Il servizio delle notifiche non è ancora pronto, riprova tra poco.');

  // Un'iscrizione vecchia creata con un'altra chiave bloccherebbe quella nuova
  const esistente = await registrazione.pushManager.getSubscription();
  if (esistente) await esistente.unsubscribe();

  const iscrizione = await registrazione.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: chiaveInByte(chiave)
  });

  const risposta = await inviaIscrizioneAlServer(iscrizione);
  if (!risposta.ok) {
    await iscrizione.unsubscribe(); // niente iscrizioni a metà
    throw new Error('Non sono riuscito a registrare il dispositivo.');
  }
};

// Toglie l'iscrizione dal server e dal browser.
// Va chiamata anche al logout: altrimenti chi usa dopo lo stesso dispositivo
// riceverebbe le notifiche dell'utente precedente.
export const disattivaPush = async () => {
  if (!pushSupportato()) return;

  const registrazione = await ottieniRegistrazione();
  if (!registrazione) return;
  const iscrizione = await registrazione.pushManager.getSubscription();
  if (!iscrizione) return;

  try {
    await fetch(`${API_URL}/api/push/disiscrizione`, {
      method: 'POST',
      headers: INTESTAZIONI_JSON,
      credentials: 'include',
      body: JSON.stringify({ endpoint: iscrizione.endpoint })
    });
  } finally {
    await iscrizione.unsubscribe();
  }
};

// Dopo il login: se questo dispositivo è già iscritto, allinea il server
// (lo associa all'utente attuale e ripara eventuali iscrizioni perse).
// Non chiede nulla all'utente e non fa nulla se le notifiche non sono attive.
export const sincronizzaPush = async () => {
  try {
    if (!pushSupportato() || Notification.permission !== 'granted') return;

    const registrazione = await ottieniRegistrazione();
    if (!registrazione) return;
    const iscrizione = await registrazione.pushManager.getSubscription();
    if (iscrizione) await inviaIscrizioneAlServer(iscrizione);
  } catch {
    // è solo una sincronizzazione di cortesia: se fallisce, nessun problema
  }
};
