/**
 * Storico delle modifiche.
 *
 * Questo middleware sta davanti alle route e registra nello storico le
 * operazioni di scrittura (creazioni, modifiche, eliminazioni) che vanno a
 * buon fine. Le route esistenti non vengono toccate: per tracciare una nuova
 * operazione basta aggiungere una regola all'elenco REGOLE qui sotto.
 *
 * Come funziona, per ogni richiesta:
 *  1. se metodo + percorso corrispondono a una regola, legge (se serve) lo
 *     stato PRIMA della modifica: dopo un UPDATE o un DELETE non sarebbe più
 *     recuperabile;
 *  2. lascia proseguire la richiesta verso la route normale;
 *  3. quando la risposta è stata inviata e il codice è 2xx (successo), scrive
 *     la riga di storico. Se la route ha risposto con un errore, non scrive nulla.
 *
 * Un errore nello storico non deve mai far fallire l'operazione vera:
 * viene solo scritto nei log del server.
 *
 * Non registriamo MAI password o dati di accesso.
 */

import db from './dao/db.mjs';
import { registraModifica } from './dao/dao_storico.mjs';

// ---------------------------------------------------------
// FUNZIONI DI SUPPORTO
// ---------------------------------------------------------

const leggiRiga = (sql, parametri) => {
  return new Promise((resolve, reject) => {
    db.get(sql, parametri, (err, riga) => (err ? reject(err) : resolve(riga || null)));
  });
};

// Confronta due valori come li vede l'utente: "2.5" e 2.5 sono uguali,
// null e "" sono "vuoto" per entrambi.
const sonoUguali = (a, b) => {
  const x = a ?? '';
  const y = b ?? '';
  if (x !== '' && y !== '' && !isNaN(x) && !isNaN(y)) return Number(x) === Number(y);
  return String(x) === String(y);
};

// Restituisce solo i campi cambiati, nel formato { campo: { da, a } }.
// Oggetto vuoto = nessuna differenza.
const trovaCambiamenti = (prima, dopo, campi) => {
  const cambiamenti = {};
  for (const campo of campi) {
    if (!sonoUguali(prima[campo], dopo[campo])) {
      cambiamenti[campo] = { da: prima[campo] ?? null, a: dopo[campo] ?? null };
    }
  }
  return cambiamenti;
};

// I valori "dopo" vanno normalizzati come fanno le route prima di salvare
// (ad esempio quantita_ottimale mancante diventa 0), altrimenti il confronto
// vedrebbe differenze che nel database non esistono.
const prodottoDopo = (body) => ({
  nome: body.nome,
  quantita: body.quantita,
  quantita_ottimale: body.quantita_ottimale || 0,
  prezzo: body.prezzo,
  categoria: body.categoria || null,
  sottocategoria: body.sottocategoria || null,
  unita: body.unita
});
const CAMPI_PRODOTTO = ['nome', 'quantita', 'quantita_ottimale', 'prezzo', 'categoria', 'sottocategoria', 'unita'];

const eventoDopo = (body) => ({
  nome: body.nome,
  tipo: body.tipo,
  costo: body.costo,
  data_evento: body.data_evento,
  max_volontari: body.max_volontari || 0
});
const CAMPI_EVENTO = ['nome', 'tipo', 'costo', 'data_evento', 'max_volontari'];

// ---------------------------------------------------------
// REGOLE: cosa tracciare
//
//  metodo / percorso : quale richiesta (percorso relativo a /api; il gruppo
//                      tra parentesi è l'id dell'oggetto)
//  entita / azione   : come viene classificata nello storico
//  leggiPrima(id)    : (opzionale) legge lo stato prima della modifica
//  costruisci(...)   : crea la riga di storico; restituisce null per NON
//                      scrivere nulla (es. modifica senza differenze)
// ---------------------------------------------------------

const REGOLE = [
  // ----- PRODOTTI (magazzino) -----
  {
    metodo: 'POST',
    percorso: /^\/prodotti$/,
    entita: 'prodotto',
    azione: 'creato',
    costruisci: ({ req, risposta }) => ({
      entitaId: risposta?.id ?? null,
      entitaNome: req.body.nome,
      dettagli: { quantita: req.body.quantita, prezzo: req.body.prezzo, unita: req.body.unita }
    })
  },
  {
    metodo: 'PUT',
    percorso: /^\/prodotti\/(\d+)$/,
    entita: 'prodotto',
    azione: 'modificato',
    leggiPrima: (id) => leggiRiga('SELECT * FROM prodotti WHERE id = ?', [id]),
    costruisci: ({ req, id, prima }) => {
      if (!prima) return null;
      const dopo = prodottoDopo(req.body);
      const cambi = trovaCambiamenti(prima, dopo, CAMPI_PRODOTTO);
      if (Object.keys(cambi).length === 0) return null;
      return { entitaId: Number(id), entitaNome: dopo.nome, dettagli: { cambi } };
    }
  },
  {
    // I tasti +/- e il riassortimento rapido. Registriamo solo la variazione (delta):
    // leggere anche la quantità finale potrebbe dare un valore già cambiato da altri.
    metodo: 'PUT',
    percorso: /^\/prodotti\/(\d+)\/quantita$/,
    entita: 'prodotto',
    azione: 'quantita_modificata',
    leggiPrima: (id) => leggiRiga('SELECT nome FROM prodotti WHERE id = ?', [id]),
    costruisci: ({ req, id, prima }) => {
      if (!prima) return null;
      return { entitaId: Number(id), entitaNome: prima.nome, dettagli: { delta: req.body.delta } };
    }
  },
  {
    // Dopo l'eliminazione il prodotto non esiste più: conserviamo una copia dei suoi dati.
    metodo: 'DELETE',
    percorso: /^\/prodotti\/(\d+)$/,
    entita: 'prodotto',
    azione: 'eliminato',
    leggiPrima: (id) => leggiRiga('SELECT * FROM prodotti WHERE id = ?', [id]),
    costruisci: ({ id, prima }) => {
      if (!prima) return null;
      const { id: _id, ...copia } = prima;
      return { entitaId: Number(id), entitaNome: prima.nome, dettagli: { prodotto: copia } };
    }
  },

  // ----- EVENTI -----
  {
    metodo: 'POST',
    percorso: /^\/eventi$/,
    entita: 'evento',
    azione: 'creato',
    costruisci: ({ req, risposta }) => ({
      entitaId: risposta?.id ?? null,
      entitaNome: req.body.nome,
      dettagli: {
        tipo: req.body.tipo,
        costo: req.body.costo,
        data_evento: req.body.data_evento,
        max_volontari: req.body.max_volontari || 0
      }
    })
  },
  {
    metodo: 'PUT',
    percorso: /^\/eventi\/(\d+)$/,
    entita: 'evento',
    azione: 'modificato',
    leggiPrima: (id) => leggiRiga('SELECT * FROM eventi WHERE id = ?', [id]),
    costruisci: ({ req, id, prima }) => {
      if (!prima) return null;
      const dopo = eventoDopo(req.body);
      const cambi = trovaCambiamenti(prima, dopo, CAMPI_EVENTO);
      if (Object.keys(cambi).length === 0) return null;
      return { entitaId: Number(id), entitaNome: dopo.nome, dettagli: { cambi } };
    }
  },
  {
    metodo: 'DELETE',
    percorso: /^\/eventi\/(\d+)$/,
    entita: 'evento',
    azione: 'eliminato',
    leggiPrima: (id) => leggiRiga('SELECT * FROM eventi WHERE id = ?', [id]),
    costruisci: ({ id, prima }) => {
      if (!prima) return null;
      return {
        entitaId: Number(id),
        entitaNome: prima.nome,
        dettagli: { tipo: prima.tipo, costo: prima.costo, data_evento: prima.data_evento }
      };
    }
  },
  {
    // Qui l'id nell'URL è quello della notifica di pagamento, non dell'evento: lo risolviamo.
    metodo: 'PUT',
    percorso: /^\/notifiche-pagamento\/(\d+)\/paga$/,
    entita: 'evento',
    azione: 'pagamento_registrato',
    leggiPrima: (id) => leggiRiga(
      `SELECT e.id AS evento_id, e.nome, e.costo
       FROM notifiche_pagamento np JOIN eventi e ON e.id = np.evento_id
       WHERE np.id = ?`,
      [id]
    ),
    costruisci: ({ prima }) => {
      if (!prima) return null;
      return { entitaId: prima.evento_id, entitaNome: prima.nome, dettagli: { costo: prima.costo } };
    }
  },
  {
    metodo: 'PUT',
    percorso: /^\/notifiche-grafica\/(\d+)\/completa$/,
    entita: 'evento',
    azione: 'grafica_completata',
    leggiPrima: (id) => leggiRiga(
      `SELECT e.id AS evento_id, e.nome
       FROM notifiche_grafica ng JOIN eventi e ON e.id = ng.evento_id
       WHERE ng.id = ?`,
      [id]
    ),
    costruisci: ({ prima }) => {
      if (!prima) return null;
      return { entitaId: prima.evento_id, entitaNome: prima.nome };
    }
  }
];

// ---------------------------------------------------------
// IL MIDDLEWARE
// Va montato in index.mjs DOPO passport e PRIMA delle route:
//   app.use('/api', tracciaModifiche);
// ---------------------------------------------------------

export const tracciaModifiche = async (req, res, next) => {
  // Cerca la regola che corrisponde a questa richiesta (e ne estrae l'id dall'URL)
  let id = null;
  const regola = REGOLE.find((r) => {
    if (r.metodo !== req.method) return false;
    const corrispondenza = req.path.match(r.percorso);
    if (!corrispondenza) return false;
    id = corrispondenza[1] ?? null;
    return true;
  });

  // Le richieste non tracciate (tutte le GET, ecc.) passano senza alcun costo.
  // Chi non è loggato verrà respinto dalla route stessa: niente da registrare.
  if (!regola || !req.isAuthenticated()) return next();

  const utente = req.user.username;

  let prima = null;
  if (regola.leggiPrima) {
    try {
      prima = await regola.leggiPrima(id);
    } catch (err) {
      console.error('Storico: lettura dello stato precedente fallita:', err.message);
    }
  }

  // Ci appendiamo a res.json per leggere la risposta della route
  // (serve ad esempio per conoscere l'id di un prodotto appena creato).
  let risposta = null;
  const jsonOriginale = res.json.bind(res);
  res.json = (corpo) => {
    risposta = corpo;
    return jsonOriginale(corpo);
  };

  res.on('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 300) return;

    try {
      const voce = regola.costruisci({ req, id, prima, risposta });
      if (!voce) return;

      registraModifica({ utente, azione: regola.azione, entita: regola.entita, ...voce })
        .catch((err) => console.error('Storico: scrittura fallita:', err.message));
    } catch (err) {
      console.error('Storico: errore nel preparare la voce:', err.message);
    }
  });

  next();
};
