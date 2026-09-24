/**
 * Inizializzazione del database — da lanciare UNA VOLTA SOLA, alla
 * primissima configurazione del progetto (es. appena clonato da GitHub).
 *
 *   node init_db.mjs
 *
 * Cosa fa:
 *   1. Crea il file GM.db (se non esiste) e TUTTE le tabelle, riusando
 *      lo stesso schema di db_init.mjs (quello che gira anche a ogni
 *      avvio del server) - non c'è una seconda copia dello schema qui.
 *   2. Crea un unico account di bootstrap, ruolo Amministrazione.
 *
 * Puoi lanciarlo prima o dopo il primo "node index.mjs", l'ordine non
 * conta: entrambi usano CREATE TABLE IF NOT EXISTS, quindi non si pestano
 * i piedi a vicenda.
 *
 * Dopo aver lanciato questo script:
 *   1. node index.mjs (se non è già in esecuzione) → avvia il server
 *   2. Fai login come l'account qui sotto
 *   3. Da "Personale" in navbar, registra gli account reali per Bar,
 *      Eventi, Grafica, Volontari — oppure usa crea_utenti_ruoli.mjs
 *      se preferisci farlo da riga di comando.
 *
 * L'unico account creato qui è volutamente uno solo: è più sicuro fare
 * il resto dall'app stessa (con password scelte da chi le userà davvero)
 * piuttosto che seminare nel repository altri account con password note.
 */
import crypto from 'crypto';
import db from './dao/db.mjs';
import { inizializzaDatabase } from './db_init.mjs';
import { RUOLI, isRuoloValido } from './roles.mjs';

// Cambia questi due valori prima di lanciare lo script in un ambiente reale
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'CambiaQuestaPassword!';

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

async function main() {
  try {
    await inizializzaDatabase();
    await createUser(ADMIN_USERNAME, ADMIN_PASSWORD, 'amministrazione');

    console.log('\n--- Inizializzazione completata ---');
    if (ADMIN_PASSWORD === 'CambiaQuestaPassword!') {
      console.log('⚠️  Stai usando la password di default. Cambiala appena hai fatto il primo login (o modifica ADMIN_PASSWORD in cima a questo file prima di lanciarlo).');
    }
    console.log('Ora avvia il server (se non è già acceso) con: node index.mjs');
  } catch (error) {
    console.error("Errore durante l'inizializzazione:", error);
  } finally {
    db.close();
  }
}

main();
