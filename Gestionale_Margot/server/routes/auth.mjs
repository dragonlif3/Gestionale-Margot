import express from 'express';
import passport from 'passport';
import { createUser } from '../dao/dao_utenti.mjs'; // <-- Aggiunto l'import del DAO

const router = express.Router();

// ---------------------------------------------------------
// MIDDLEWARE DI SICUREZZA
// ---------------------------------------------------------

// Controlla se l'utente loggato è dell'Amministrazione
const isAmministrazione = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.ruolo === 'amministrazione') {
    next();
  } else {
    res.status(403).json({ error: "Solo l'Amministrazione può registrare nuovo personale." });
  }
};

// ---------------------------------------------------------
// ROTTE DI AUTENTICAZIONE E REGISTRAZIONE
// ---------------------------------------------------------

router.post('/sessions', passport.authenticate('local'), function(req, res) {
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

// NUOVA ROTTA: Registrazione dipendente (Protetta dal middleware isAdmin)
router.post('/sessions/register', isAmministrazione, async (req, res) => {
  const { username, password, ruolo } = req.body;
  
  // Controllo base per evitare campi vuoti
  if (!username || !password || !ruolo) {
    return res.status(400).json({ error: 'Compila tutti i campi' });
  }

  try {
    const result = await createUser(username, password, ruolo);
    
    if (result.error) {
      // Cattura errori gestiti dal DAO (es. username già esistente)
      return res.status(400).json({ error: result.error });
    }
    
    res.status(201).json({ message: 'Nuovo operatore registrato con successo!' });
  } catch (err) {
    console.error("Errore registrazione:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;