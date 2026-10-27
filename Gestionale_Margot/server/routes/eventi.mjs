import express from 'express';
import {
  getAllEventi,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento,
  getNotificheGrafica,
  completaNotificaGrafica,
  getNotifichePagamento,
  segnaPagato,
  iscriviVolontario,
  cancellaIscrizioneVolontario,
  getIscrittiEvento,
  getEventiIdIscrittoUtente,
  getEventiIscrittoUtente,
} from '../dao/dao_eventi.mjs';
import { avvisaIscrittiDiModifica } from '../notifiche_iscritti.mjs';

const router = express.Router();

// ---------------------------------------------------------
// MIDDLEWARE DI SICUREZZA
// ---------------------------------------------------------

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).json({ error: 'Devi effettuare il login' });
  }
};

// Ritorna un middleware che ammette solo gli utenti con uno dei ruoli indicati
const hasRole = (...ruoliAmmessi) => (req, res, next) => {
  if (req.isAuthenticated() && req.user && ruoliAmmessi.includes(req.user.ruolo)) {
    next();
  } else {
    res.status(403).json({ error: 'Permessi insufficienti per questa operazione' });
  }
};

// ---------------------------------------------------------
// ROTTE EVENTI (visibili a tutti i loggati, gestibili da Eventi/Amministrazione)
// ---------------------------------------------------------

// Toglie dalla risposta i campi di stato che l'utente loggato non ha
// titolo per vedere, così il dato non è mai presente nella risposta
// grezza, non solo nascosto nell'interfaccia.
const filtraStatiPerRuolo = (evento, ruolo) => {
  const puoVedereGrafica = ['eventi', 'amministrazione', 'grafica'].includes(ruolo);
  const puoVederePagamento = ['eventi', 'amministrazione'].includes(ruolo);

  const risultato = { ...evento };
  if (!puoVedereGrafica) delete risultato.grafica_stato;
  if (!puoVederePagamento) delete risultato.pagamento_stato;
  return risultato;
};

router.get('/eventi', isLoggedIn, async (req, res) => {
  try {
    const eventi = await getAllEventi();
    let idIscritti = [];
    if (req.user.ruolo === 'volontari') {
      idIscritti = await getEventiIdIscrittoUtente(req.user.id);
    }
    const risultato = eventi.map((ev) => {
      const filtrato = filtraStatiPerRuolo(ev, req.user.ruolo);
      if (req.user.ruolo === 'volontari') {
        filtrato.iscritto = idIscritti.includes(ev.id);
      }
      return filtrato;
    });
    res.json(risultato);
  } catch (err) {
    console.error('Errore nel recupero eventi:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// "I miei eventi" (Volontari): va PRIMA di /eventi/:id, altrimenti "miei"
// verrebbe interpretato come un id evento.
router.get('/eventi/miei', hasRole('volontari'), async (req, res) => {
  try {
    const eventi = await getEventiIscrittoUtente(req.user.id);
    res.json(eventi);
  } catch (err) {
    console.error('Errore nel recupero dei tuoi eventi:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.get('/eventi/:id', isLoggedIn, async (req, res) => {
  try {
    const evento = await getEventoById(req.params.id);
    if (evento.error) return res.status(404).json(evento);
    const filtrato = filtraStatiPerRuolo(evento, req.user.ruolo);
    if (req.user.ruolo === 'volontari') {
      const idIscritti = await getEventiIdIscrittoUtente(req.user.id);
      filtrato.iscritto = idIscritti.includes(evento.id);
    }
    res.json(filtrato);
  } catch (err) {
    console.error('Errore nel recupero evento:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.post('/eventi', hasRole('eventi', 'amministrazione'), async (req, res) => {
  const { nome, tipo, costo, data_evento, max_volontari } = req.body;

  if (!nome || !tipo || costo === undefined || !data_evento) {
    return res.status(400).json({ error: 'Nome, tipo, costo e data sono obbligatori' });
  }
  if (max_volontari !== undefined && (isNaN(max_volontari) || max_volontari < 0)) {
    return res.status(400).json({ error: 'Il numero massimo di volontari non è valido' });
  }

  try {
    const nuovoEvento = await createEvento({ nome, tipo, costo, data_evento, max_volontari: max_volontari || 0 }, req.user.id);
    res.status(201).json(nuovoEvento);
  } catch (err) {
    console.error("Errore durante la creazione dell'evento:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.put('/eventi/:id', hasRole('eventi', 'amministrazione'), async (req, res) => {
  const { nome, tipo, costo, data_evento, max_volontari } = req.body;

  if (!nome || !tipo || costo === undefined || !data_evento) {
    return res.status(400).json({ error: 'Nome, tipo, costo e data sono obbligatori' });
  }
  if (max_volontari !== undefined && (isNaN(max_volontari) || max_volontari < 0)) {
    return res.status(400).json({ error: 'Il numero massimo di volontari non è valido' });
  }

  try {
    // Lo stato prima della modifica: serve per il controllo sul massimo
    // e per capire se avvisare gli iscritti
    const eventoAttuale = await getEventoById(req.params.id);

    if (max_volontari !== undefined && !eventoAttuale.error && max_volontari < eventoAttuale.iscritti_count) {
      return res.status(400).json({
        error: `Non puoi impostare un massimo inferiore agli iscritti già presenti (${eventoAttuale.iscritti_count})`
      });
    }

    const result = await updateEvento(req.params.id, { nome, tipo, costo, data_evento, max_volontari: max_volontari || 0 });
    if (result.error) return res.status(404).json(result);

    // Se sono cambiati nome o data, avvisa i volontari iscritti. Parte "in disparte":
    // un errore qui non deve far fallire la modifica, che è già avvenuta.
    if (!eventoAttuale.error) {
      avvisaIscrittiDiModifica(req.params.id, eventoAttuale, { nome, data_evento })
        .catch((errAvviso) => console.error('Errore avvisando gli iscritti della modifica:', errAvviso));
    }

    res.status(200).json({ message: 'Evento aggiornato con successo' });
  } catch (err) {
    console.error("Errore durante l'aggiornamento dell'evento:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.delete('/eventi/:id', hasRole('eventi', 'amministrazione'), async (req, res) => {
  try {
    const result = await deleteEvento(req.params.id);
    if (result.error) return res.status(404).json(result);
    res.status(200).json({ message: 'Evento eliminato con successo' });
  } catch (err) {
    console.error("Errore durante l'eliminazione dell'evento:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ---------------------------------------------------------
// BACHECA GRAFICA (visibile e gestibile da Grafica/Amministrazione)
// ---------------------------------------------------------

router.get('/notifiche-grafica', hasRole('grafica', 'amministrazione'), async (req, res) => {
  try {
    const notifiche = await getNotificheGrafica();
    res.json(notifiche);
  } catch (err) {
    console.error('Errore nel recupero della bacheca grafica:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.put('/notifiche-grafica/:id/completa', hasRole('grafica', 'amministrazione'), async (req, res) => {
  try {
    const result = await completaNotificaGrafica(req.params.id);
    if (result.error) return res.status(404).json(result);
    res.status(200).json({ message: 'Notifica segnata come completata' });
  } catch (err) {
    console.error('Errore aggiornamento notifica:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ---------------------------------------------------------
// BACHECA PAGAMENTI (visibile e gestibile solo da Amministrazione)
// ---------------------------------------------------------

router.get('/notifiche-pagamento', hasRole('amministrazione'), async (req, res) => {
  try {
    const notifiche = await getNotifichePagamento();
    res.json(notifiche);
  } catch (err) {
    console.error('Errore nel recupero della bacheca pagamenti:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

router.put('/notifiche-pagamento/:id/paga', hasRole('amministrazione'), async (req, res) => {
  try {
    const result = await segnaPagato(req.params.id);
    if (result.error) return res.status(404).json(result);
    res.status(200).json({ message: 'Pagamento registrato' });
  } catch (err) {
    console.error('Errore aggiornamento pagamento:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// ---------------------------------------------------------
// ISCRIZIONI VOLONTARI
// ---------------------------------------------------------

// Un volontario si iscrive a un evento (solo se c'è ancora posto)
router.post('/eventi/:id/iscrizione', hasRole('volontari'), async (req, res) => {
  try {
    const result = await iscriviVolontario(req.params.id, req.user.id);
    if (result.error) return res.status(400).json(result);
    res.status(201).json({ message: 'Iscrizione registrata con successo' });
  } catch (err) {
    console.error("Errore durante l'iscrizione:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Un volontario cancella la propria iscrizione
router.delete('/eventi/:id/iscrizione', hasRole('volontari'), async (req, res) => {
  try {
    const result = await cancellaIscrizioneVolontario(req.params.id, req.user.id);
    if (result.error) return res.status(404).json(result);
    res.status(200).json({ message: 'Iscrizione annullata' });
  } catch (err) {
    console.error("Errore durante l'annullamento dell'iscrizione:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Elenco di chi si è iscritto a un evento (per chi lo organizza)
router.get('/eventi/:id/iscritti', hasRole('eventi', 'amministrazione'), async (req, res) => {
  try {
    const iscritti = await getIscrittiEvento(req.params.id);
    res.json(iscritti);
  } catch (err) {
    console.error('Errore nel recupero degli iscritti:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;
