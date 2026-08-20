import sqlite3 from 'sqlite3';
import crypto from 'crypto';

// Apre o crea il file del database
const db = new sqlite3.Database('./magazzino.db', (err) => {
  if (err) {
    console.error('Errore di connessione al database:', err.message);
    process.exit(1);
  }
  console.log('Connesso al database magazzino.db');
});

// Le query per creare le tabelle
const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    salt TEXT NOT NULL,
    ruolo TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS prodotti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    quantita INTEGER DEFAULT 0,
    prezzo REAL NOT NULL
  );
`;

// Funzione di utilità per creare un utente con password crittografata
const createInitialUser = (username, password, ruolo) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 16, (err, hashedPassword) => {
      if (err) reject(err);
      
      const sql = 'INSERT OR IGNORE INTO Users (username, password, salt, ruolo) VALUES (?, ?, ?, ?)';
      db.run(sql, [username, hashedPassword.toString('hex'), salt, ruolo], function(err) {
        if (err) reject(err);
        if (this.changes > 0) {
          console.log(`[+] Utente creato: ${username} (Ruolo: ${ruolo})`);
        }
        resolve();
      });
    });
  });
};

// Esecuzione dello script
db.serialize(() => {
  // 1. Creazione tabelle
  db.exec(createTablesSQL, async (err) => {
    if (err) {
      console.error('Errore durante la creazione delle tabelle:', err.message);
      return;
    }
    console.log('Tabelle "Users" e "prodotti" pronte.');

    try {
      // 2. Creazione degli utenti di default (se non esistono già)
      // Modifica queste password se vuoi!
      await createInitialUser('admin', 'admin123', 'admin');
      await createInitialUser('barista', 'barista123', 'operatore');

      // 3. (Opzionale) Aggiunta di un vino di prova
      const insertVino = 'INSERT OR IGNORE INTO prodotti (nome, quantita, prezzo) VALUES (?, ?, ?)';
      db.run(insertVino, ['Barolo DOCG', 5, 45.50], function(err) {
        if (!err && this.changes > 0) {
          console.log('[+] Vino di prova inserito in cantina.');
        }
      });

      console.log('\n--- Inizializzazione completata con successo! ---');
    } catch (error) {
      console.error('Errore durante l\'inserimento dei dati:', error);
    } finally {
      // Chiude la connessione
      db.close();
    }
  });
});