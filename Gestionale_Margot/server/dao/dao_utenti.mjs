import sqlite from 'sqlite3';
import crypto from 'crypto';
import db from './db.mjs';
import { isRuoloValido } from '../roles.mjs';

export const getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM Users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else {
        const user = {id: row.id, username: row.username, ruolo: row.ruolo};

        crypto.scrypt(password, row.salt, 16, (err, hashedPassword) => {
          if (err) {
            reject(err);
            return;
          }

          if(!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword)) {
            resolve(false);
          } else
            resolve(user);
        });
      }
    });
  });
};

export const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, ruolo FROM Users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else if (row === undefined) resolve({error: 'Utente non trovato'});
      else {
        const user = { id: row.id, username: row.username, ruolo: row.ruolo };
        resolve(user);
      }
    });
  });
};

export const createUser = (username, password, ruolo) => {
  return new Promise((resolve, reject) => {
    if (!isRuoloValido(ruolo)) {
      return resolve({ error: 'Ruolo non valido' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    
    crypto.scrypt(password, salt, 16, (err, hashedPassword) => {
      if (err) {
        return reject(err);
      }

      const sql = 'INSERT INTO Users (username, password, salt, ruolo) VALUES (?, ?, ?, ?)';
      
      db.run(sql, [username, hashedPassword.toString('hex'), salt, ruolo], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            resolve({ error: 'Questo username è già in uso' });
          } else {
            reject(err);
          }
        } else {
          resolve({ id: this.lastID, username, ruolo });
        }
      });
    });
  });
};

// Lista di tutto il personale (senza la password, ovviamente)
export const getAllUtenti = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, username, ruolo FROM Users ORDER BY ruolo ASC, username ASC', [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Aggiorna username e/o ruolo di un utente esistente
export const updateUtente = (id, username, ruolo) => {
  return new Promise((resolve, reject) => {
    if (!isRuoloValido(ruolo)) {
      return resolve({ error: 'Ruolo non valido' });
    }

    const sql = 'UPDATE Users SET username = ?, ruolo = ? WHERE id = ?';
    db.run(sql, [username, ruolo, id], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          resolve({ error: 'Questo username è già in uso' });
        } else {
          reject(err);
        }
      } else if (this.changes === 0) {
        resolve({ error: 'Utente non trovato' });
      } else {
        resolve({ id, username, ruolo });
      }
    });
  });
};

// Cambio password fatto dall'utente stesso: a differenza di resetPassword
// (che l'Amministrazione usa su altri, senza conoscerla), qui si deve
// verificare la password attuale prima di sostituirla.
export const cambiaPropriaPassword = (id, vecchiaPassword, nuovaPassword) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM Users WHERE id = ?', [id], (errGet, row) => {
      if (errGet) return reject(errGet);
      if (!row) return resolve({ error: 'Utente non trovato' });

      crypto.scrypt(vecchiaPassword, row.salt, 16, (errVerifica, hashVecchia) => {
        if (errVerifica) return reject(errVerifica);

        if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashVecchia)) {
          return resolve({ error: 'La password attuale non è corretta' });
        }

        const nuovoSalt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(nuovaPassword, nuovoSalt, 16, (errNuova, hashNuova) => {
          if (errNuova) return reject(errNuova);

          const sql = 'UPDATE Users SET password = ?, salt = ? WHERE id = ?';
          db.run(sql, [hashNuova.toString('hex'), nuovoSalt, id], function (errUpdate) {
            if (errUpdate) reject(errUpdate);
            else resolve(true);
          });
        });
      });
    });
  });
};

// Reset password: genera un nuovo salt + hash, lo salva, ritorna la
// password temporanea in chiaro così l'admin può comunicarla all'utente.
export const resetPassword = (id, nuovaPassword) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(nuovaPassword, salt, 16, (err, hashedPassword) => {
      if (err) return reject(err);

      const sql = 'UPDATE Users SET password = ?, salt = ? WHERE id = ?';
      db.run(sql, [hashedPassword.toString('hex'), salt, id], function (err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve({ error: 'Utente non trovato' });
        else resolve(true);
      });
    });
  });
};

// Elimina un utente. Non elimina gli eventi che ha creato o le iscrizioni
// già registrate: quelle restano in storico (il campo creato_da diventa
// un riferimento "orfano", ma le query usano LEFT JOIN già da prima).
export const deleteUtente = (id) => {
  return new Promise((resolve, reject) => {
    // Prima rimuovi le iscrizioni del volontario, altrimenti la FK blocca la DELETE
    db.run('DELETE FROM iscrizioni_volontari WHERE utente_id = ?', [id], (errIscrizioni) => {
      if (errIscrizioni) return reject(errIscrizioni);

      db.run('DELETE FROM Users WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve({ error: 'Utente non trovato' });
        else resolve(true);
      });
    });
  });
};