import db from './db.mjs';
import { creaNotifica } from './dao_notifiche.mjs';

const GIORNI_SCADENZA_GRAFICA = 7;

// Tutti gli eventi, con lo username di chi li ha creati, lo stato
// delle notifiche collegate (grafica/pagamento) e il numero di
// volontari già iscritti, utile per mostrare indicatori rapidi nel calendario.
export const getAllEventi = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        eventi.*,
        Users.username AS creato_da_username,
        notifiche_grafica.stato AS grafica_stato,
        notifiche_pagamento.stato AS pagamento_stato,
        COALESCE(iscritti.numero, 0) AS iscritti_count
      FROM eventi
      JOIN Users ON eventi.creato_da = Users.id
      LEFT JOIN notifiche_grafica ON notifiche_grafica.evento_id = eventi.id
      LEFT JOIN notifiche_pagamento ON notifiche_pagamento.evento_id = eventi.id
      LEFT JOIN (
        SELECT evento_id, COUNT(*) AS numero FROM iscrizioni_volontari GROUP BY evento_id
      ) AS iscritti ON iscritti.evento_id = eventi.id
      ORDER BY data_evento ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getEventoById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        eventi.*,
        Users.username AS creato_da_username,
        notifiche_grafica.stato AS grafica_stato,
        notifiche_pagamento.stato AS pagamento_stato,
        COALESCE(iscritti.numero, 0) AS iscritti_count
      FROM eventi
      JOIN Users ON eventi.creato_da = Users.id
      LEFT JOIN notifiche_grafica ON notifiche_grafica.evento_id = eventi.id
      LEFT JOIN notifiche_pagamento ON notifiche_pagamento.evento_id = eventi.id
      LEFT JOIN (
        SELECT evento_id, COUNT(*) AS numero FROM iscrizioni_volontari GROUP BY evento_id
      ) AS iscritti ON iscritti.evento_id = eventi.id
      WHERE eventi.id = ?
    `;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (!row) resolve({ error: 'Evento non trovato' });
      else resolve(row);
    });
  });
};

// Calcola la scadenza per il gruppo Grafica: una settimana PRIMA della
// data dell'evento (non una settimana dopo la creazione dell'evento).
// Se l'evento viene creato a meno di 7 giorni dalla data stessa, la
// scadenza risulterà già superata: è corretto così, segnala che il
// tempo a disposizione della grafica è già ridotto rispetto all'ideale.
const calcolaScadenzaGrafica = (dataEvento) => {
  const scadenza = new Date(dataEvento);
  scadenza.setDate(scadenza.getDate() - GIORNI_SCADENZA_GRAFICA);
  return scadenza.toISOString();
};

// Crea l'evento e, in automatico, le notifiche per Grafica (scadenza una
// settimana prima dell'evento) e per Amministrazione (da pagare, senza scadenza).
export const createEvento = (evento, creatoDa) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO eventi (nome, tipo, costo, data_evento, max_volontari, creato_da) VALUES (?, ?, ?, ?, ?, ?)';

    db.run(sql, [evento.nome, evento.tipo, evento.costo, evento.data_evento, evento.max_volontari || 0, creatoDa], function (err) {
      if (err) return reject(err);

      const eventoId = this.lastID;
      const scadenza = calcolaScadenzaGrafica(evento.data_evento);

      const sqlNotificaGrafica = 'INSERT INTO notifiche_grafica (evento_id, scadenza) VALUES (?, ?)';
      db.run(sqlNotificaGrafica, [eventoId, scadenza], (errGrafica) => {
        if (errGrafica) return reject(errGrafica);

        const sqlNotificaPagamento = 'INSERT INTO notifiche_pagamento (evento_id) VALUES (?)';
        db.run(sqlNotificaPagamento, [eventoId], (errPagamento) => {
          if (errPagamento) return reject(errPagamento);
          resolve({ id: eventoId, ...evento, creato_da: creatoDa });
        });
      });
    });
  });
};

// Se la data dell'evento cambia, riallinea anche la scadenza Grafica
// (solo se il lavoro non è già stato segnato completato, per non
// "spostare indietro nel tempo" un lavoro già consegnato).
export const updateEvento = (id, evento) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE eventi SET nome = ?, tipo = ?, costo = ?, data_evento = ?, max_volontari = ? WHERE id = ?';
    db.run(sql, [evento.nome, evento.tipo, evento.costo, evento.data_evento, evento.max_volontari || 0, id], function (err) {
      if (err) return reject(err);
      if (this.changes === 0) return resolve({ error: 'Evento non trovato' });

      const nuovaScadenza = calcolaScadenzaGrafica(evento.data_evento);
      const sqlNotifica = "UPDATE notifiche_grafica SET scadenza = ? WHERE evento_id = ? AND stato != 'completato'";
      db.run(sqlNotifica, [nuovaScadenza, id], (errNotifica) => {
        if (errNotifica) reject(errNotifica);
        else resolve(true);
      });
    });
  });
};

// Elimina l'evento e tutto ciò che è collegato (notifiche Grafica/Pagamento, iscrizioni volontari)
// Elimina l'evento e tutto ciò che è collegato (notifiche Grafica/Pagamento,
// iscrizioni volontari) - ma prima avvisa ogni volontario che era iscritto,
// così l'evento non "sparisce" semplicemente dalla loro vista.
export const deleteEvento = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM eventi WHERE id = ?', [id], (errGet, evento) => {
      if (errGet) return reject(errGet);
      if (!evento) return resolve({ error: 'Evento non trovato' });

      db.all('SELECT utente_id FROM iscrizioni_volontari WHERE evento_id = ?', [id], (errIscritti, iscritti) => {
        if (errIscritti) return reject(errIscritti);

        db.run('DELETE FROM notifiche_grafica WHERE evento_id = ?', [id], (errGrafica) => {
          if (errGrafica) return reject(errGrafica);

          db.run('DELETE FROM notifiche_pagamento WHERE evento_id = ?', [id], (errPagamento) => {
            if (errPagamento) return reject(errPagamento);

            db.run('DELETE FROM iscrizioni_volontari WHERE evento_id = ?', [id], (errIscrizioni) => {
              if (errIscrizioni) return reject(errIscrizioni);

              db.run('DELETE FROM eventi WHERE id = ?', [id], function (err) {
                if (err) return reject(err);
                if (this.changes === 0) return resolve({ error: 'Evento non trovato' });

                if (iscritti.length === 0) return resolve(true);

                const messaggio = `L'evento "${evento.nome}" del ${evento.data_evento} a cui eri iscritto è stato cancellato.`;

                // L'evento è comunque già cancellato a questo punto: se la
                // creazione di una notifica fallisse, lo logghiamo ma non
                // facciamo fallire l'intera operazione per questo.
                Promise.all(iscritti.map((i) => creaNotifica(i.utente_id, messaggio)))
                  .then(() => resolve(true))
                  .catch((errNotifiche) => {
                    console.error('Errore creando le notifiche ai volontari:', errNotifiche);
                    resolve(true);
                  });
              });
            });
          });
        });
      });
    });
  });
};

// Bacheca Grafica: tutte le notifiche con nome/tipo/data dell'evento collegato
export const getNotificheGrafica = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT notifiche_grafica.*, eventi.nome, eventi.tipo, eventi.data_evento
      FROM notifiche_grafica
      JOIN eventi ON notifiche_grafica.evento_id = eventi.id
      ORDER BY
        CASE WHEN notifiche_grafica.stato = 'da_fare' THEN 0 ELSE 1 END,
        notifiche_grafica.scadenza ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const completaNotificaGrafica = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE notifiche_grafica SET stato = 'completato', completato_il = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve({ error: 'Notifica non trovata' });
      else resolve(true);
    });
  });
};

// Bacheca Pagamenti (Amministrazione): tutte le notifiche con nome/costo/data dell'evento collegato
export const getNotifichePagamento = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT notifiche_pagamento.*, eventi.nome, eventi.tipo, eventi.costo, eventi.data_evento
      FROM notifiche_pagamento
      JOIN eventi ON notifiche_pagamento.evento_id = eventi.id
      ORDER BY
        CASE WHEN notifiche_pagamento.stato = 'da_pagare' THEN 0 ELSE 1 END,
        eventi.data_evento ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const segnaPagato = (id) => {
  return new Promise((resolve, reject) => {
    const sql = "UPDATE notifiche_pagamento SET stato = 'pagato', pagato_il = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve({ error: 'Notifica non trovata' });
      else resolve(true);
    });
  });
};

// ---------------------------------------------------------
// ISCRIZIONI VOLONTARI
// ---------------------------------------------------------

// Iscrive un volontario a un evento, controllando che ci sia ancora posto
// e che non sia già iscritto. Fa tutto in una singola transazione logica
// leggendo prima lo stato attuale, per dare un messaggio d'errore chiaro.
// L'INSERT stesso porta con sé la condizione "c'è ancora posto?", verificata
// nello stesso istante in cui si scrive - non più "leggi il conteggio, poi
// scrivi" in due passaggi separati, che lascerebbe una finestra in cui due
// persone potrebbero prendere l'ultimo posto contemporaneamente.
export const iscriviVolontario = (eventoId, utenteId) => {
  return new Promise((resolve, reject) => {
    const sqlInsert = `
      INSERT INTO iscrizioni_volontari (evento_id, utente_id)
      SELECT ?, ?
      WHERE (SELECT COUNT(*) FROM iscrizioni_volontari WHERE evento_id = ?)
          < (SELECT max_volontari FROM eventi WHERE id = ?)
    `;
    db.run(sqlInsert, [eventoId, utenteId, eventoId, eventoId], function (errInsert) {
      if (errInsert) {
        if (errInsert.message.includes('UNIQUE')) {
          return resolve({ error: 'Sei già iscritto a questo evento' });
        }
        return reject(errInsert);
      }

      if (this.changes > 0) {
        return resolve(true);
      }

      // Niente inserito: o l'evento non esiste, o i posti sono esauriti.
      // Li distinguiamo con una query separata solo per dare un errore chiaro.
      db.get('SELECT max_volontari FROM eventi WHERE id = ?', [eventoId], (errEvento, evento) => {
        if (errEvento) return reject(errEvento);
        if (!evento) return resolve({ error: 'Evento non trovato' });
        resolve({ error: 'Posti esauriti per questo evento' });
      });
    });
  });
};

export const cancellaIscrizioneVolontario = (eventoId, utenteId) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM iscrizioni_volontari WHERE evento_id = ? AND utente_id = ?';
    db.run(sql, [eventoId, utenteId], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve({ error: 'Non risulti iscritto a questo evento' });
      else resolve(true);
    });
  });
};

// Elenco degli username iscritti a un evento (per chi organizza)
export const getIscrittiEvento = (eventoId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT Users.id, Users.username, iscrizioni_volontari.creato_il
      FROM iscrizioni_volontari
      JOIN Users ON iscrizioni_volontari.utente_id = Users.id
      WHERE iscrizioni_volontari.evento_id = ?
      ORDER BY iscrizioni_volontari.creato_il ASC
    `;
    db.all(sql, [eventoId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Tutti gli evento_id a cui un utente è iscritto, per marcare "iscritto" nella lista eventi
export const getEventiIdIscrittoUtente = (utenteId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT evento_id FROM iscrizioni_volontari WHERE utente_id = ?', [utenteId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((r) => r.evento_id));
    });
  });
};

// Eventi a cui un volontario è iscritto, con i dettagli dell'evento ("I miei eventi")
export const getEventiIscrittoUtente = (utenteId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT eventi.*, iscrizioni_volontari.creato_il AS iscritto_il
      FROM iscrizioni_volontari
      JOIN eventi ON iscrizioni_volontari.evento_id = eventi.id
      WHERE iscrizioni_volontari.utente_id = ?
      ORDER BY eventi.data_evento ASC
    `;
    db.all(sql, [utenteId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};
