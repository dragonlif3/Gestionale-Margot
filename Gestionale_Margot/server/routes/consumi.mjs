import express from 'express';
import { getConteggioConsumiPendenti, generaReportConsumi } from '../dao/dao_consumi.mjs';

const router = express.Router();

const hasRole = (...ruoliAmmessi) => (req, res, next) => {
  if (req.isAuthenticated() && req.user && ruoliAmmessi.includes(req.user.ruolo)) {
    next();
  } else {
    res.status(403).json({ error: 'Permessi insufficienti: solo Amministrazione e Bar possono vedere i consumi.' });
  }
};

// Quanti movimenti sono in attesa, senza generare né svuotare nulla
router.get('/consumi/pendenti', hasRole('amministrazione', 'bar'), async (req, res) => {
  try {
    const numero = await getConteggioConsumiPendenti();
    res.json({ numero });
  } catch (err) {
    console.error('Errore nel conteggio dei consumi:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Genera il report dall'ultima volta e SVUOTA il log (azione, non una
// semplice lettura: per questo è un POST e non una GET)
router.post('/consumi/report', hasRole('amministrazione', 'bar'), async (req, res) => {
  try {
    const report = await generaReportConsumi();
    res.json(report);
  } catch (err) {
    console.error('Errore nella generazione del report consumi:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;
