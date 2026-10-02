import express from 'express';
import {
  getConteggioConsumiPendenti,
  generaReportConsumi,
  salvaReportGenerato,
  getUltimoReportGenerato,
  getStoricoReport
} from '../dao/dao_consumi.mjs';

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

// Genera il report dall'ultima volta, SVUOTA il log grezzo (azione, non
// una semplice lettura: per questo è un POST e non una GET) e ne salva
// una copia, così resta consultabile anche dopo un refresh o il giorno dopo.
router.post('/consumi/report', hasRole('amministrazione', 'bar'), async (req, res) => {
  try {
    const report = await generaReportConsumi();
    await salvaReportGenerato(report, req.user.username);
    res.json(report);
  } catch (err) {
    console.error('Errore nella generazione del report consumi:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// L'ultimo report generato (o null se non ne è mai stato generato uno),
// per ripopolare la pagina dopo un refresh senza doverlo rigenerare.
router.get('/consumi/report/ultimo', hasRole('amministrazione', 'bar'), async (req, res) => {
  try {
    const ultimo = await getUltimoReportGenerato();
    res.json(ultimo);
  } catch (err) {
    console.error("Errore nel recupero dell'ultimo report:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// I report generati prima dell'ultimo, per consultare le settimane precedenti
router.get('/consumi/report/storico', hasRole('amministrazione', 'bar'), async (req, res) => {
  try {
    const storico = await getStoricoReport();
    res.json(storico);
  } catch (err) {
    console.error('Errore nel recupero dello storico report:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;
