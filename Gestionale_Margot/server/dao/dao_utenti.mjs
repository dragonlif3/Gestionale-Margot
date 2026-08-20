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

    // 1. Genera un salt casuale unico per questo utente
    const salt = crypto.randomBytes(16).toString('hex');
    
    // 2. Crea l'hash sicuro della password
    crypto.scrypt(password, salt, 16, (err, hashedPassword) => {
      if (err) {
        return reject(err);
      }

      const sql = 'INSERT INTO Users (username, password, salt, ruolo) VALUES (?, ?, ?, ?)';
      
      db.run(sql, [username, hashedPassword.toString('hex'), salt, ruolo], function(err) {
        if (err) {
          // Gestisce l'errore se l'username esiste già (vincolo UNIQUE)
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