import express from 'express';
import { getAllProdotti, addProdotto, updateProdotto, updateQuantitaProdotto, deleteProdotto } from '../dao/dao_prodotti.mjs';
import { isCategoriaValida, isSottocategoriaValida } from '../categorie.mjs';
import { isUnitaValida, isUnitaMultipla } from '../unita.mjs';

const router = express.Router();

// ---------------------------------------------------------
// MIDDLEWARE DI SICUREZZA
// ---------------------------------------------------------

// Ammette solo Amministrazione e Bar per la gestione del magazzino
const hasRole = (...ruoliAmmessi) => (req, res, next) => {
  if (req.isAuthenticated() && req.user && ruoliAmmessi.includes(req.user.ruolo)) {
    next();
  } else {
    res.status(403).json({ error: 'Permessi insufficienti: solo Amministrazione e Bar possono modificare il magazzino.' });
  }
};

// Valida il corpo di una richiesta di creazione/modifica prodotto.
// Ritorna null se tutto ok, altrimenti un messaggio di errore.
const validaProdotto = (body) => {
  const { nome, prezzo, categoria, sottocategoria, unita, molteplicita } = body;

  if (!nome || String(nome).trim() === '') return 'Il nome è obbligatorio';
  if (prezzo === undefined || prezzo === null || isNaN(prezzo) || prezzo < 0) return 'Il prezzo non è valido';

  if (categoria !== undefined && categoria !== null && categoria !== '' && !isCategoriaValida(categoria)) {
    return 'Categoria non valida';
  }
  if (sottocategoria !== undefined && sottocategoria !== null && sottocategoria !== '') {
    if (!categoria || !isSottocategoriaValida(categoria, sottocategoria)) {
      return 'Sottocategoria non valida per la categoria scelta';
    }
  }

  if (!unita || !isUnitaValida(unita)) return "Unità non valida";
  if (isUnitaMultipla(unita)) {
    if (!molteplicita || isNaN(molteplicita) || molteplicita < 1) {
      return "Per un'unità multipla (confezione/scatola) la molteplicità è obbligatoria (es. 24 lattine a confezione)";
    }
  }

  return null;
};

// ---------------------------------------------------------
// ROTTE DEL MAGAZZINO
// ---------------------------------------------------------

// GET: Recupera tutti i prodotti (solo Amministrazione e Bar, che gestiscono il magazzino)
router.get('/prodotti', hasRole('amministrazione', 'bar'), async (req, res) => {
  try {
    const prodotti = await getAllProdotti();
    res.json(prodotti);
  } catch (err) {
    console.error('Errore durante il recupero dei prodotti:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// POST: Aggiunge un nuovo prodotto
router.post('/prodotti', hasRole('amministrazione', 'bar'), async (req, res) => {
  const erroreValidazione = validaProdotto(req.body);
  if (erroreValidazione) return res.status(400).json({ error: erroreValidazione });

  try {
    const { nome, quantita, quantita_ottimale, prezzo, categoria, sottocategoria, unita, molteplicita, unita_contenuto } = req.body;

    const nuovoProdotto = {
      nome,
      quantita: quantita || 0,
      quantita_ottimale: quantita_ottimale || 0,
      prezzo,
      categoria: categoria || null,
      sottocategoria: sottocategoria || null,
      unita,
      molteplicita: isUnitaMultipla(unita) ? molteplicita : null,
      unita_contenuto: isUnitaMultipla(unita) ? unita_contenuto : null
    };

    const result = await addProdotto(nuovoProdotto);
    res.status(201).json(result);
  } catch (err) {
    console.error("Errore durante l'inserimento:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT: Modifica l'anagrafica di un prodotto esistente (nome, categoria, prezzo, ecc.)
router.put('/prodotti/:id', hasRole('amministrazione', 'bar'), async (req, res) => {
  const erroreValidazione = validaProdotto(req.body);
  if (erroreValidazione) return res.status(400).json({ error: erroreValidazione });

  try {
    const { nome, quantita, quantita_ottimale, prezzo, categoria, sottocategoria, unita, molteplicita, unita_contenuto } = req.body;

    if (quantita === undefined || isNaN(quantita) || quantita < 0) {
      return res.status(400).json({ error: 'Quantità non valida' });
    }

    const prodottoAggiornato = {
      nome,
      quantita,
      quantita_ottimale: quantita_ottimale || 0,
      prezzo,
      categoria: categoria || null,
      sottocategoria: sottocategoria || null,
      unita,
      molteplicita: isUnitaMultipla(unita) ? molteplicita : null,
      unita_contenuto: isUnitaMultipla(unita) ? unita_contenuto : null
    };

    const result = await updateProdotto(req.params.id, prodottoAggiornato);
    if (result.error) return res.status(404).json(result);
    res.status(200).json({ message: 'Prodotto aggiornato con successo' });
  } catch (err) {
    console.error("Errore durante l'aggiornamento del prodotto:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// PUT: Modifica le quantità (usato dai tasti +/- e dal riassortimento rapido)
router.put('/prodotti/:id/quantita', hasRole('amministrazione', 'bar'), async (req, res) => {
  const prodottoId = req.params.id;
  const delta = req.body.delta;

  if (delta === undefined || isNaN(delta) || !Number.isInteger(delta)) {
    return res.status(400).json({ error: 'Delta non valido: deve essere un numero intero (negativo per togliere, positivo per aggiungere)' });
  }

  try {
    const result = await updateQuantitaProdotto(prodottoId, delta, req.user.username);

    if (result.error) {
      return res.status(409).json({ error: result.error });
    }

    res.status(200).json({ message: 'Quantità aggiornata con successo' });
  } catch (err) {
    console.error('Errore aggiornamento quantità:', err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// DELETE: Rimuove un prodotto
router.delete('/prodotti/:id', hasRole('amministrazione', 'bar'), async (req, res) => {
  try {
    const result = await deleteProdotto(req.params.id);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.status(200).json({ message: 'Prodotto eliminato con successo' });
  } catch (err) {
    console.error("Errore durante l'eliminazione:", err);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

export default router;
