import express from 'express';
import passport from 'passport';
import { createUser, getAllUtenti, updateUtente, resetPassword, deleteUtente, cambiaPropriaPassword } from '../dao/dao_utenti.mjs';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// ---------------------------------------------------------
// MIDDLEWARE DI SICUREZZA
// ---------------------------------------------------------

const isAmministrazione = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.ruolo === 'amministrazione') {
    next();
  } else {
    res.status(403).json({ error: "Solo l'Amministrazione può gestire il personale." });
  }
};

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: 'Devi effettuare il login' });
  }
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.body?.username ?? '').trim().toLowerCase(),
  message: { error: 'Troppi tentativi di accesso. Riprova tra qualche minuto.' }
});

// ---------------------------------------------------------
// ROTTE DI AUTENTICAZIONE
// ---------------------------------------------------------

router.post('/sessions', loginLimiter, passport.authenticate('local'), function(req, res) {
  return res.status(201).json(req.user);
});

router.get('/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(req.user);
  } else {
    res.status(401).json({ error: 'Non autenticato!' });
  }
});

router.delete('/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// ---------------------------------------------------------
// ACCOUNT PERSONALE (chiunque sia loggato, qualunque ruolo)
// ---------------------------------------------------------

// Cambio della propria password: a differenza di /personale/:id/password
// (che l'Amministrazione usa su altri account senza conoscerne la
// password), qui serve inserire la password attuale per confermarla.
router.put('/account/password', isLoggedIn, async (req, res) => {
  const { vecchiaPassword, nuovaPassword } = req.body;

  if (!vecchiaPassword || !nuovaPassword) {
    return res.status(400).json({ error: 'Inserisci sia la password attuale che quella nuova' });
  }
  if (nuovaPassword.length < 6) {
    return res.status(400).json({ error: 'La nuova password deve essere di almeno 6 caratteri' });
  }

  try {
    const result = await cambiaPropriaPassword(req.user.id, vecchiaPassword, nuovaPassword);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: 'Password cambiata con successo.' });
  } catch (err) {
    console.error('Errore cambio password personale:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ---------------------------------------------------------
// ROTTE DI GESTIONE PERSONALE (solo Amministrazione)
// ---------------------------------------------------------

// Lista di tutto il personale
router.get('/personale', isAmministrazione, async (req, res) => {
  try {
    const utenti = await getAllUtenti();
    res.json(utenti);
  } catch (err) {
    console.error('Errore nel recupero del personale:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Registra un nuovo membro del personale
router.post('/personale', isAmministrazione, async (req, res) => {
  const { username, password, ruolo } = req.body;

  if (!username || !password || !ruolo) {
    return res.status(400).json({ error: 'Compila tutti i campi' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La password deve essere di almeno 6 caratteri' });
  }

  try {
    const result = await createUser(username, password, ruolo);
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: `Account "${username}" creato con successo.` });
  } catch (err) {
    console.error('Errore registrazione:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Modifica username e/o ruolo di un membro
router.put('/personale/:id', isAmministrazione, async (req, res) => {
  const { username, ruolo } = req.body;

  if (!username || !ruolo) {
    return res.status(400).json({ error: 'Username e ruolo sono obbligatori' });
  }

  // Un admin non può togliersi il ruolo da solo (si bloccherebbe fuori)
  if (parseInt(req.params.id) === req.user.id && ruolo !== 'amministrazione') {
    return res.status(400).json({ error: 'Non puoi cambiare il tuo stesso ruolo' });
  }

  try {
    const result = await updateUtente(req.params.id, username, ruolo);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ message: 'Profilo aggiornato con successo.' });
  } catch (err) {
    console.error('Errore aggiornamento utente:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Reset password di un membro
router.put('/personale/:id/password', isAmministrazione, async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La nuova password deve essere di almeno 6 caratteri' });
  }

  try {
    const result = await resetPassword(req.params.id, password);
    if (result.error) return res.status(404).json({ error: result.error });
    res.json({ message: 'Password aggiornata con successo.' });
  } catch (err) {
    console.error('Errore reset password:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Rimuove un membro del personale
router.delete('/personale/:id', isAmministrazione, async (req, res) => {
  // Un admin non può eliminare sé stesso
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Non puoi eliminare il tuo stesso account' });
  }

  try {
    const result = await deleteUtente(req.params.id);
    if (result.error) return res.status(404).json({ error: result.error });
    res.json({ message: 'Account rimosso con successo.' });
  } catch (err) {
    console.error('Errore eliminazione utente:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Mantieni la vecchia rotta per retrocompatibilità con AdminPanelComp
// (verrà sostituita dal nuovo frontend, ma non rompe nulla nel frattempo)
router.post('/sessions/register', isAmministrazione, async (req, res) => {
  const { username, password, ruolo } = req.body;
  if (!username || !password || !ruolo) {
    return res.status(400).json({ error: 'Compila tutti i campi' });
  }
  try {
    const result = await createUser(username, password, ruolo);
    if (result.error) return res.status(400).json({ error: result.error });
    res.status(201).json({ message: 'Nuovo operatore registrato con successo!' });
  } catch (err) {
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;