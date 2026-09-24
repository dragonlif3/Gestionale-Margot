import db from './db.mjs';

// Log grezzo di ogni "uscita" dal magazzino (solo diminuzioni di quantità,
// mai i riassortimenti). Ogni riga è un evento singolo; il report li
// aggrega e li svuota - vedi generaReportConsumi() più sotto.
//
// I dati del prodotto (nome, categoria, unità) sono salvati come
// fotografia al momento del consumo, non solo come riferimento a
// prodotto_id: così il report resta leggibile anche se nel frattempo
// il prodotto viene rinominato, ricategorizzato o eliminato.};

export const registraConsumo = (consumo, utenteUsername) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO consumi (prodotto_id, prodotto_nome, categoria, sottocategoria, unita_label, quantita, utente_username)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const valori = [
      consumo.prodotto_id,
      consumo.nome,
      consumo.categoria,
      consumo.sottocategoria,
      consumo.unita_label,
      consumo.quantita,
      utenteUsername
    ];
    db.run(sql, valori, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// Finestra di tempo entro la quale un "+" viene considerato una correzione
// di un "-" appena fatto per sbaglio, non un rifornimento vero e proprio.
const FINESTRA_ANNULLAMENTO_MS = 5 * 60 * 1000; // 5 minuti

// Quando la quantità di un prodotto AUMENTA, controlla se c'è un consumo
// registrato pochissimo fa per quello stesso prodotto e, se sì, lo riduce
// (o lo cancella del tutto) invece di lasciarlo lì come se fosse successo
// davvero. Se non c'è nulla di recente, non fa niente: un rifornimento
// vero, fatto ore o giorni dopo, non deve mai "ripulire" consumi passati
// genuini solo perché tocca lo stesso prodotto.
//
// Funziona "a ritroso" (l'ultimo consumo registrato è il primo ad essere
// ridotto): se prima hai tolto 1 e poi ancora 1, e infine ne riaggiungi 1,
// ad essere annullato è l'ultimo dei due, non il primo.
export const annullaConsumoRecente = (prodottoId, quantitaDaAnnullare) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM consumi WHERE prodotto_id = ? ORDER BY creato_il DESC, id DESC LIMIT 1';
    db.get(sql, [prodottoId], (err, riga) => {
      if (err) return reject(err);
      if (!riga) return resolve(quantitaDaAnnullare); // nessun consumo pendente da annullare

      // creato_il è salvato da SQLite come 'YYYY-MM-DD HH:MM:SS' in UTC,
      // senza 'T' né 'Z': va normalizzato prima di poterlo confrontare
      // con un timestamp JS.
      const creatoIlMs = new Date(riga.creato_il.replace(' ', 'T') + 'Z').getTime();
      const eta = Date.now() - creatoIlMs;

      if (eta > FINESTRA_ANNULLAMENTO_MS) {
        return resolve(quantitaDaAnnullare); // troppo vecchio per essere una correzione al volo
      }

      if (riga.quantita <= quantitaDaAnnullare) {
        // Il "+" copre (o supera) l'intero consumo pendente: lo rimuove del tutto.
        db.run('DELETE FROM consumi WHERE id = ?', [riga.id], (errDelete) => {
          if (errDelete) return reject(errDelete);
          resolve(quantitaDaAnnullare - riga.quantita);
        });
      } else {
        // Il "+" copre solo una parte del consumo pendente: lo riduce, non lo cancella.
        db.run('UPDATE consumi SET quantita = quantita - ? WHERE id = ?', [quantitaDaAnnullare, riga.id], (errUpdate) => {
          if (errUpdate) return reject(errUpdate);
          resolve(0);
        });
      }
    });
  });
};

// Quanti movimenti sono in attesa di essere riportati, senza generarli
// né svuotarli - utile per mostrare "N movimenti da controllare" in UI.
export const getConteggioConsumiPendenti = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS numero FROM consumi', [], (err, row) => {
      if (err) reject(err);
      else resolve(row.numero);
    });
  });
};

// Genera il report con tutto quello che è stato consumato dall'ultima
// volta che è stato chiesto, aggregato per prodotto, e SVUOTA quei
// movimenti dal log (così la prossima chiamata riparte da zero).
//
// Legge prima le righe grezze, cancella solo quelle per id (non un
// DELETE FROM consumi generico): se nel frattempo arriva un nuovo
// consumo mentre stiamo generando il report, quella riga ha un id che
// non è nella lista appena letta, quindi sopravvive e comparirà nel
// prossimo report invece di sparire silenziosamente.
export const generaReportConsumi = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM consumi ORDER BY creato_il ASC', [], (err, righe) => {
      if (err) return reject(err);
      if (righe.length === 0) return resolve([]);

      const ids = righe.map((r) => r.id);
      const placeholders = ids.map(() => '?').join(',');

      db.run(`DELETE FROM consumi WHERE id IN (${placeholders})`, ids, (errDelete) => {
        if (errDelete) return reject(errDelete);

        const mappa = {};
        righe.forEach((r) => {
          const chiave = r.prodotto_id !== null ? `id:${r.prodotto_id}` : `nome:${r.prodotto_nome}`;
          if (!mappa[chiave]) {
            mappa[chiave] = {
              prodotto_id: r.prodotto_id,
              nome: r.prodotto_nome,
              categoria: r.categoria,
              sottocategoria: r.sottocategoria,
              unita_label: r.unita_label,
              quantita_totale: 0,
              movimenti: 0,
              dal: r.creato_il,
              al: r.creato_il
            };
          }
          mappa[chiave].quantita_totale += r.quantita;
          mappa[chiave].movimenti += 1;
          if (r.creato_il < mappa[chiave].dal) mappa[chiave].dal = r.creato_il;
          if (r.creato_il > mappa[chiave].al) mappa[chiave].al = r.creato_il;
        });

        resolve(Object.values(mappa));
      });
    });
  });
};
