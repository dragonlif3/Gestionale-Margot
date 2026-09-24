import db from './db.mjs';
import { registraConsumo, annullaConsumoRecente } from './dao_consumi.mjs';
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
        quantita = ?,
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
      prodotto.quantita,
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
// Applica un DELTA relativo alla quantità (negativo per un consumo,
// positivo per un rifornimento), in una singola istruzione SQL atomica:
// "quantita = quantita + ?" invece di leggere il valore, calcolarlo in
// JS e riscriverlo assoluto. Questo è quello che rende sicuro l'uso
// concorrente: se due persone tolgono 1 alla stessa bottiglia quasi
// nello stesso istante, SQLite serializza le due scritture sulla
// colonna, non le fa sovrascrivere a vicenda.
//
// La clausola "AND quantita + ? >= 0" impedisce anche di andare sotto
// zero: se il delta porterebbe la quantità sotto zero (es. qualcun
// altro l'ha già svuotata nel frattempo), la UPDATE non tocca nulla
// (this.changes === 0) e lo segnaliamo come errore chiaro.
export const updateQuantitaProdotto = (id, delta, utenteUsername) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE prodotti SET quantita = quantita + ? WHERE id = ? AND quantita + ? >= 0';
    db.run(sql, [delta, id, delta], function (err) {
      if (err) return reject(err);

      if (this.changes === 0) {
        db.get('SELECT id, quantita FROM prodotti WHERE id = ?', [id], (errCheck, row) => {
          if (errCheck) return reject(errCheck);
          if (!row) return resolve({ error: 'Prodotto non trovato' });
          resolve({
            error: `Operazione non valida: in magazzino ci sono ${row.quantita} unità, non abbastanza. Probabilmente qualcun altro ha appena modificato questo prodotto: ricarica la pagina.`
          });
        });
        return;
      }

      if (delta >= 0) {
        if (delta > 0) {
          // Non blocchiamo la risposta per questo: se qualcosa va storto
          // qui, la quantità è comunque già aggiornata correttamente,
          // si perde solo l'eventuale "ripulitura" del log dei consumi.
          annullaConsumoRecente(id, delta).catch((errAnnulla) => {
            console.error('Errore annullando un consumo recente:', errAnnulla);
          });
        }
        return resolve(true);
      }

      // È un consumo: recuperiamo i dati anagrafici del prodotto (nome,
      // categoria, unità) DOPO l'update, solo per scrivere il log -
      // la quantità stessa non viene più letta né riscritta qui, quindi
      // niente race su quella.
      db.get('SELECT * FROM prodotti WHERE id = ?', [id], (errGet, prodotto) => {
        if (errGet) {
          console.error('Errore recuperando il prodotto per il log dei consumi:', errGet);
          return resolve(true);
        }
        const consumo = {
          prodotto_id: prodotto.id,
          nome: prodotto.nome,
          categoria: prodotto.categoria,
          sottocategoria: prodotto.sottocategoria,
          unita_label: unitaConteggioLabel(prodotto),
          quantita: -delta
        };
        // Non blocchiamo l'aggiornamento della quantità se la
        // registrazione del consumo fallisce: l'inventario resta
        // comunque corretto, si perde solo la riga di log.
        registraConsumo(consumo, utenteUsername).catch((errConsumo) => {
          console.error('Errore registrando il consumo (quantità comunque aggiornata):', errConsumo);
        });
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
