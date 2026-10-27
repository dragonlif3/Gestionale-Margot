/**
 * Invio delle notifiche push.
 *
 * Servono tre variabili nel file .env del server:
 *   VAPID_PUBLIC_KEY   chiave pubblica (viene data anche al browser)
 *   VAPID_PRIVATE_KEY  chiave privata (SEGRETA: solo sul server, mai su Git)
 *   VAPID_SUBJECT      un contatto, es. mailto:tuo@indirizzo.it oppure https://margot.giize.com
 * Si generano una sola volta con:  npx web-push generate-vapid-keys
 *
 * Se mancano, l'app funziona normalmente e le push sono semplicemente spente.
 */

import webpush from 'web-push';
import { getIscrizioniUtente, rimuoviIscrizionePerEndpoint } from './dao/dao_push.mjs';

// Le variabili d'ambiente si leggono al primo uso e non all'avvio del modulo,
// così non dipendiamo dall'ordine in cui vengono caricati gli import.
let configurato = null;

const configura = () => {
  if (configurato !== null) return configurato;

  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    console.warn('Push: chiavi VAPID mancanti nel .env, le notifiche push sono disattivate.');
    configurato = false;
    return false;
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    configurato = true;
  } catch (err) {
    console.error('Push: configurazione VAPID non valida:', err.message);
    configurato = false;
  }
  return configurato;
};

// La chiave pubblica serve al browser per iscriversi. null = push non disponibili.
export const getChiavePubblica = () => (configura() ? process.env.VAPID_PUBLIC_KEY : null);

// Invia una notifica a TUTTI i dispositivi di un utente.
// payload: { titolo, testo, url }
// Non lancia mai errori verso chi la chiama: una push che non parte non deve
// far fallire l'operazione che l'ha generata.
export const inviaPushAUtente = async (utenteId, payload) => {
  if (!configura()) return;

  const iscrizioni = await getIscrizioniUtente(utenteId);
  if (iscrizioni.length === 0) return;

  const corpo = JSON.stringify(payload);

  await Promise.all(
    iscrizioni.map(async (iscrizione) => {
      try {
        await webpush.sendNotification(
          { endpoint: iscrizione.endpoint, keys: { p256dh: iscrizione.p256dh, auth: iscrizione.auth } },
          corpo,
          { TTL: 60 * 60 * 24 } // se il telefono è spento, il servizio la tiene per 24 ore
        );
      } catch (err) {
        // 404 / 410 = il dispositivo non esiste più: togliamo l'iscrizione
        if (err.statusCode === 404 || err.statusCode === 410) {
          await rimuoviIscrizionePerEndpoint(iscrizione.endpoint).catch(() => {});
        } else {
          console.error('Push: invio fallito:', err.statusCode || err.message);
        }
      }
    })
  );
};
