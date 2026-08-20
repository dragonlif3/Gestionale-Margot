import db from './db.mjs';

// Crea la tabella prodotti con lo schema completo (nuove installazioni).
// Per i DB già esistenti con lo schema vecchio, usa lo script
// migrazione_prodotti.mjs una tantum: CREATE TABLE IF NOT EXISTS non
// aggiunge colonne a una tabella che esiste già.
export const initDb = () => {
  return new Promise((resolve, reject) => {
    const query = `
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
    `;

    db.run(query, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Recupera tutti i prodotti, ordinati per categoria/sottocategoria/nome
// così il frontend li riceve già pronti per essere raggruppati.
export const getAllProdotti = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM prodotti
      ORDER BY
        CASE WHEN categoria IS NULL THEN 1 ELSE 0 END,
        categoria ASC,
        sottocategoria ASC,
        nome ASC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const addProdotto = (prodotto) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO prodotti
        (nome, quantita, quantita_ottimale, prezzo, categoria, sottocategoria, unita, molteplicita, unita_contenuto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const valori = [
      prodotto.nome,
      prodotto.quantita,
      prodotto.quantita_ottimale || 0,
      prodotto.prezzo,
      prodotto.categoria,
      prodotto.sottocategoria,
      prodotto.unita,
      prodotto.molteplicita || null,
      prodotto.unita_contenuto || null
    ];

    db.run(query, valori, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...prodotto });
    });
  });
};

// Modifica completa di un prodotto esistente (anagrafica, non la quantità
// "live" che ha già il suo endpoint dedicato per i tasti +/-).
export const updateProdotto = (id, prodotto) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE prodotti SET
        nome = ?,
        quantita_ottimale = ?,
        prezzo = ?,
        categoria = ?,
        sottocategoria = ?,
        unita = ?,
        molteplicita = ?,
        unita_contenuto = ?
      WHERE id = ?
    `;
    const valori = [
      prodotto.nome,
      prodotto.quantita_ottimale || 0,
      prodotto.prezzo,
      prodotto.categoria,
      prodotto.sottocategoria,
      prodotto.unita,
      prodotto.molteplicita || null,
      prodotto.unita_contenuto || null,
      id
    ];

    db.run(query, valori, function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve({ error: 'Prodotto non trovato' });
      else resolve(true);
    });
  });
};

export const updateQuantitaProdotto = (id, nuovaQuantita) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE prodotti SET quantita = ? WHERE id = ?';

    db.run(sql, [nuovaQuantita, id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve({ error: 'Prodotto non trovato' });
      else resolve(true);
    });
  });
};

export const deleteProdotto = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM prodotti WHERE id = ?';

    db.run(sql, [id], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve({ error: 'Prodotto non trovato' });
      else resolve(true);
    });
  });
};
