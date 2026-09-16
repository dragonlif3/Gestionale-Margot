/**
 * Inizializzazione del database — da lanciare UNA VOLTA SOLA, alla
 * primissima configurazione del progetto (es. appena clonato da GitHub).
 *
 *   node init_db.mjs
 *
 * Cosa fa:
 *   1. Crea il file GM.db (se non esiste) e la tabella "Users".
 *   2. Crea un unico account di bootstrap, ruolo Amministrazione.
 *
 * Cosa NON fa (di proposito): non tocca le tabelle "prodotti", "eventi",
 * "notifiche_grafica", "notifiche_pagamento" e "iscrizioni_volontari".
 * Quelle si creano da sole in automatico al primo avvio del server
 * (node index.mjs), gestite da dao_prodotti.mjs e dao_eventi.mjs — questo
 * script duplicherebbe quella logica invece di riusarla, con il rischio
 * che i due schemi prendano strade diverse nel tempo.
 *
 * Dopo aver lanciato questo script:
 *   1. node index.mjs                  → crea le altre tabelle, avvia il server
 *   2. Fai login come l'account qui sotto
 *   3. Da "Personale" in navbar, registra gli account reali per Bar,
 *      Eventi, Grafica, Volontari — oppure usa crea_utenti_ruoli.mjs
 *      se preferisci farlo da riga di comando.
 *
 * L'unico account creato qui è volutamente uno solo: è più sicuro fare
 * il resto dall'app stessa (con password scelte da chi le userà davvero)
 * piuttosto che seminare nel repository altri account con password note.
 */
import sqlite3 from 'sqlite3';
import crypto from 'crypto';
import { RUOLI, isRuoloValido } from './roles.mjs';

// Cambia questi due valori prima di lanciare lo script in un ambiente reale
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'CambiaQuestaPassword!';

const db = new sqlite3.Database('./GM.db', (err) => {
  if (err) {
    console.error('Errore di connessione al database:', err.message);
    process.exit(1);
  }
  console.log('Connesso a GM.db');
});

const createUsersTableSQL = `
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    ruolo TEXT NOT NULL
  )
`;

// Genera salt + hash con crypto.scrypt, come fa dao_utenti.mjs in produzione,
// così l'account creato qui funziona per il login esattamente allo stesso modo.
const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 16, (err, hashedPassword) => {
      if (err) return reject(err);
      resolve({ salt, hash: hashedPassword.toString('hex') });
    });
  });
};

const createUser = (username, password, ruolo) => {
  return new Promise(async (resolve, reject) => {
    if (!isRuoloValido(ruolo)) {
      return reject(new Error(`Ruolo "${ruolo}" non valido. Ruoli ammessi: ${RUOLI.join(', ')}`));
    }

    try {
      const { salt, hash } = await hashPassword(password);
      const sql = 'INSERT OR IGNORE INTO Users (username, password, salt, ruolo) VALUES (?, ?, ?, ?)';

      db.run(sql, [username, hash, salt, ruolo], function (err) {
        if (err) return reject(err);
        if (this.changes > 0) {
          console.log(`[+] Utente creato: ${username} (ruolo: ${ruolo})`);
        } else {
          console.log(`[=] Utente "${username}" già presente, non tocco nulla.`);
        }
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
};

db.serialize(() => {
  db.run(createUsersTableSQL, async (err) => {
    if (err) {
      console.error('Errore durante la creazione della tabella Users:', err.message);
      db.close();
      process.exit(1);
    }
    console.log('Tabella "Users" pronta.');

    try {
      await createUser(ADMIN_USERNAME, ADMIN_PASSWORD, 'amministrazione');

      console.log('\n--- Inizializzazione completata ---');
      if (ADMIN_PASSWORD === 'CambiaQuestaPassword!') {
        console.log(`⚠️  Stai usando la password di default. Cambiala appena hai fatto il primo login (o modifica ADMIN_PASSWORD in cima a questo file prima di lanciarlo).`);
      }
      console.log('Ora avvia il server con: node index.mjs');
    } catch (error) {
      console.error("Errore durante la creazione dell'utente iniziale:", error);
    } finally {
      db.close();
    }
  });
});
