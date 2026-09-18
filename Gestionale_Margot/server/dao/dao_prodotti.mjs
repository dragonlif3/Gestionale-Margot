import db from './db.mjs';
import { registraConsumo } from './dao_consumi.mjs';
import { unitaConteggioLabel } from '../unita.mjs';

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

// Aggiorna la quantità e, se è una diminuzione (mai per i riassortimenti),
// registra automaticamente il consumo nel log - usato sia dai tasti +/-
// che da qualunque altro punto che tocchi la quantità "live".
export const updateQuantitaProdotto = (id, nuovaQuantita, utenteUsername) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM prodotti WHERE id = ?', [id], (errGet, prodotto) => {
      if (errGet) return reject(errGet);
      if (!prodotto) return resolve({ error: 'Prodotto non trovato' });

      const sql = 'UPDATE prodotti SET quantita = ? WHERE id = ?';
      db.run(sql, [nuovaQuantita, id], function (err) {
        if (err) return reject(err);

        const consumato = prodotto.quantita - nuovaQuantita;
        if (consumato > 0) {
          const consumo = {
            prodotto_id: prodotto.id,
            nome: prodotto.nome,
            categoria: prodotto.categoria,
            sottocategoria: prodotto.sottocategoria,
            unita_label: unitaConteggioLabel(prodotto),
            quantita: consumato
          };
          // Non blocchiamo l'aggiornamento della quantità se la
          // registrazione del consumo fallisce: l'inventario resta
          // comunque corretto, si perde solo la riga di log.
          registraConsumo(consumo, utenteUsername).catch((errConsumo) => {
            console.error('Errore registrando il consumo (quantità comunque aggiornata):', errConsumo);
          });
        }

        resolve(true);
      });
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
