/**
 * db_init.mjs — Creazione di tutte le tabelle del database.
 *
 * Questo è l'unico posto in cui viene definito lo schema completo.
 * Viene chiamato una volta all'avvio del server (in index.mjs) e
 * usa CREATE TABLE IF NOT EXISTS su ogni tabella, quindi è idempotente:
 * non tocca nulla se la tabella esiste già.
 *
 * NON va usato come sostituto di init_db.mjs: quello crea l'account
 * di bootstrap (va lanciato una volta manualmente), questo crea le
 * tabelle strutturali ogni volta che il server parte.
 */
import db from './dao/db.mjs';

const TABELLE = [
  {
    nome: 'Users',
    sql: `
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        salt TEXT NOT NULL,
        ruolo TEXT NOT NULL
      )
    `
  },
  {
    nome: 'prodotti',
    sql: `
      CREATE TABLE IF NOT EXISTS prodotti (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        quantita INTEGER NOT NULL DEFAULT 0,
        quantita_ottimale INTEGER NOT NULL DEFAULT 0,
        prezzo REAL NOT NULL,
        categoria TEXT,
        sottocategoria TEXT,
        unita TEXT NOT NULL DEFAULT 'bottiglia',
        molteplicita INTEGER,
        unita_contenuto TEXT
      )
    `
  },
  {
    nome: 'eventi',
    sql: `
      CREATE TABLE IF NOT EXISTS eventi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        costo REAL NOT NULL DEFAULT 0,
        data_evento TEXT NOT NULL,
        max_volontari INTEGER NOT NULL DEFAULT 0,
        creato_da INTEGER NOT NULL,
        creato_il TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creato_da) REFERENCES Users(id)
      )
    `
  },
  {
    nome: 'notifiche_grafica',
    sql: `
      CREATE TABLE IF NOT EXISTS notifiche_grafica (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evento_id INTEGER NOT NULL,
        scadenza TEXT NOT NULL,
        stato TEXT NOT NULL DEFAULT 'da_fare',
        creato_il TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completato_il TEXT,
        FOREIGN KEY (evento_id) REFERENCES eventi(id)
      )
    `
  },
  {
    nome: 'notifiche_pagamento',
    sql: `
      CREATE TABLE IF NOT EXISTS notifiche_pagamento (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evento_id INTEGER NOT NULL,
        stato TEXT NOT NULL DEFAULT 'da_pagare',
        creato_il TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        pagato_il TEXT,
        FOREIGN KEY (evento_id) REFERENCES eventi(id)
      )
    `
  },
  {
    nome: 'iscrizioni_volontari',
    sql: `
      CREATE TABLE IF NOT EXISTS iscrizioni_volontari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evento_id INTEGER NOT NULL,
        utente_id INTEGER NOT NULL,
        creato_il TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (evento_id) REFERENCES eventi(id),
        FOREIGN KEY (utente_id) REFERENCES Users(id),
        UNIQUE (evento_id, utente_id)
      )
    `
  },
  {
    nome: 'consumi',
    sql: `
      CREATE TABLE IF NOT EXISTS consumi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prodotto_id INTEGER,
        prodotto_nome TEXT NOT NULL,
        categoria TEXT,
        sottocategoria TEXT,
        unita_label TEXT NOT NULL,
        quantita INTEGER NOT NULL,
        utente_username TEXT,
        creato_il TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `
  },
  {
    nome: 'notifiche_utente',
    sql: `
      CREATE TABLE IF NOT EXISTS notifiche_utente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        utente_id INTEGER NOT NULL,
        messaggio TEXT NOT NULL,
        letta INTEGER NOT NULL DEFAULT 0,
        creato_il TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (utente_id) REFERENCES Users(id)
      )
    `
  },
  {
    nome: 'report_consumi',
    sql: `
      CREATE TABLE IF NOT EXISTS report_consumi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        generato_il TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        generato_da TEXT,
        dati TEXT NOT NULL
      )
    `
  },
  {
    nome: 'storico_modifiche',
    sql: `
      CREATE TABLE IF NOT EXISTS storico_modifiche (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        creato_il TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        utente_username TEXT NOT NULL,
        azione TEXT NOT NULL,
        entita TEXT NOT NULL,
        entita_id INTEGER,
        entita_nome TEXT,
        dettagli TEXT
      )
    `
  },
  {
    nome: 'push_iscrizioni',
    sql: `
      CREATE TABLE IF NOT EXISTS push_iscrizioni (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        utente_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        creato_il TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      )
    `
  },
  {
    nome: 'promemoria_inviati',
    sql: `
      CREATE TABLE IF NOT EXISTS promemoria_inviati (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tipo TEXT NOT NULL,
        riferimento_id INTEGER NOT NULL,
        soglia TEXT NOT NULL,
        scadenza TEXT NOT NULL,
        inviato_il TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        UNIQUE (tipo, riferimento_id, soglia, scadenza)
      )
    `
  }
];

export const inizializzaDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      let errore = null;

      TABELLE.forEach(({ nome, sql }) => {
        if (errore) return;
        db.run(sql, (err) => {
          if (err) {
            errore = err;
            console.error(`Errore creando la tabella "${nome}":`, err.message);
          }
        });
      });

      // Una query dummy finale: sqlite3 la esegue in sequenza dopo le
      // precedenti, quindi quando arriva qui tutte le tabelle sono state
      // create (o è già stato loggato l'errore).
      db.get('SELECT 1', [], (err) => {
        if (errore || err) reject(errore || err);
        else {
          console.log('Database pronto — tutte le tabelle verificate.');
          resolve();
        }
      });
    });
  });
};
