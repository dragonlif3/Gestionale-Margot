import express from 'express';
import { getNotificheUtente, getConteggioNonLette, segnaComeLetta, segnaTutteComeLette } from '../dao/dao_notifiche.mjs';

const router = express.Router();

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: 'Devi effettuare il login' });
  }
};

// Tutte le notifiche dell'utente loggato (le sue, sempre e solo le sue:
// req.user.id viene dalla sessione, non da un parametro modificabile)
router.get('/notifiche', isLoggedIn, async (req, res) => {
  try {
    const notifiche = await getNotificheUtente(req.user.id);
    res.json(notifiche);
  } catch (err) {
    console.error('Errore nel recupero delle notifiche:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Solo il conteggio dei non letti, per il badge sul campanellino
router.get('/notifiche/conteggio', isLoggedIn, async (req, res) => {
  try {
    const numero = await getConteggioNonLette(req.user.id);
    res.json({ numero });
  } catch (err) {
    console.error('Errore nel conteggio delle notifiche:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.put('/notifiche/:id/letta', isLoggedIn, async (req, res) => {
  try {
    const result = await segnaComeLetta(req.params.id, req.user.id);
    if (result.error) return res.status(404).json(result);
    res.json({ message: 'Notifica segnata come letta' });
  } catch (err) {
    console.error('Errore aggiornamento notifica:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.put('/notifiche/tutte/lette', isLoggedIn, async (req, res) => {
  try {
    await segnaTutteComeLette(req.user.id);
    res.json({ message: 'Tutte le notifiche segnate come lette' });
  } catch (err) {
    console.error('Errore aggiornamento notifiche:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;
