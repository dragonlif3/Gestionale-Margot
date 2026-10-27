import express from 'express';
import { getStorico, getUtentiNelloStorico } from '../dao/dao_storico.mjs';

const router = express.Router();

// ---------------------------------------------------------
// MIDDLEWARE DI SICUREZZA
// ---------------------------------------------------------

// Lo storico è visibile solo all'Amministrazione.
// (Se un giorno servirà anche al Bar, basta aggiungere qui il ruolo.)
const isAmministrazione = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.ruolo === 'amministrazione') {
    next();
  } else {
    res.status(403).json({ error: "Solo l'Amministrazione può consultare lo storico." });
  }
};

const ENTITA_AMMESSE = ['prodotto', 'evento'];

// ---------------------------------------------------------
// ROTTE DELLO STORICO
// ---------------------------------------------------------

// GET: le ultime modifiche, dalla più recente.
// Parametri (tutti facoltativi):
//   limit  = quante righe (1-100, default 50)
//   primaDi = id dell'ultima riga già vista: restituisce quelle più vecchie
//   utente = filtra per username
//   entita = filtra per tipo: prodotto | evento
router.get('/storico', isAmministrazione, async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
  const primaDi = parseInt(req.query.primaDi) || null;
  const entita = ENTITA_AMMESSE.includes(req.query.entita) ? req.query.entita : null;
  const utente = typeof req.query.utente === 'string' && req.query.utente !== '' ? req.query.utente : null;

  try {
    const voci = await getStorico({ limit, primaDi, utente, entita });
    res.json(voci);
  } catch (err) {
    console.error('Errore nel recupero dello storico:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// GET: gli utenti presenti nello storico (serve al filtro della pagina)
router.get('/storico/utenti', isAmministrazione, async (req, res) => {
  try {
    const utenti = await getUtentiNelloStorico();
    res.json(utenti);
  } catch (err) {
    console.error('Errore nel recupero degli utenti dello storico:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;
