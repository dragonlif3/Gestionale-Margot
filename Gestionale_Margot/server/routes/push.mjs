import express from 'express';
import { getChiavePubblica } from '../push.mjs';
import { salvaIscrizione, rimuoviIscrizione } from '../dao/dao_push.mjs';

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: 'Devi effettuare il login' });
  }
};

// ---------------------------------------------------------
// SICUREZZA SULL'ENDPOINT
// Il server, quando invia una notifica, fa una richiesta all'indirizzo
// (endpoint) che il client gli ha comunicato. Se accettassimo qualsiasi
// indirizzo, un utente potrebbe farci contattare siti o servizi interni a
// sua scelta. Per questo accettiamo solo i servizi di push dei browser reali.
// Se un giorno un browser usasse un servizio nuovo, basta aggiungerlo qui.
// ---------------------------------------------------------
const HOST_ESATTI = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'];
const HOST_SUFFISSI = ['.push.services.mozilla.com', '.push.apple.com', '.notify.windows.com'];

const endpointAmmesso = (endpoint) => {
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return false;
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  return HOST_ESATTI.includes(url.hostname) || HOST_SUFFISSI.some((suffisso) => url.hostname.endsWith(suffisso));
};

const chiaveValida = (valore) => typeof valore === 'string' && valore.length > 0 && valore.length < 200;

// ---------------------------------------------------------
// ROTTE
// ---------------------------------------------------------

// La chiave pubblica serve al browser per creare l'iscrizione
router.get('/push/chiave', isLoggedIn, (req, res) => {
  const chiave = getChiavePubblica();
  if (!chiave) return res.status(503).json({ error: 'Le notifiche push non sono attive sul server.' });
  res.json({ chiave });
});

// Registra (o aggiorna) il dispositivo di chi è loggato.
// Il body è l'iscrizione così come la produce il browser:
// { endpoint, keys: { p256dh, auth } }
router.post('/push/iscrizione', isLoggedIn, async (req, res) => {
  const { endpoint, keys } = req.body || {};

  if (!endpointAmmesso(endpoint) || !keys || !chiaveValida(keys.p256dh) || !chiaveValida(keys.auth)) {
    return res.status(400).json({ error: 'Iscrizione non valida.' });
  }

  try {
    await salvaIscrizione({ utenteId: req.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth });
    res.status(201).json({ message: 'Notifiche attivate su questo dispositivo.' });
  } catch (err) {
    console.error('Errore salvataggio iscrizione push:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Toglie il dispositivo. È una POST e non una DELETE perché alcuni proxy
// scartano il corpo delle DELETE, e qui ci serve l'endpoint nel corpo.
router.post('/push/disiscrizione', isLoggedIn, async (req, res) => {
  const { endpoint } = req.body || {};
  if (typeof endpoint !== 'string') return res.status(400).json({ error: 'Endpoint mancante.' });

  try {
    await rimuoviIscrizione(endpoint, req.user.id);
    res.json({ message: 'Notifiche disattivate su questo dispositivo.' });
  } catch (err) {
    console.error('Errore rimozione iscrizione push:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;
