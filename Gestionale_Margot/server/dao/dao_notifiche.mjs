import db from './db.mjs';

// Notifiche personali "da leggere" per un utente - oggi generate solo
// quando un evento a cui un Volontario era iscritto viene cancellato,
// ma la tabella è generica: in futuro può ospitare altri tipi di avviso
// senza bisogno di un'altra tabella.

export const creaNotifica = (utenteId, messaggio) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO notifiche_utente (utente_id, messaggio) VALUES (?, ?)';
    db.run(sql, [utenteId, messaggio], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

export const getNotificheUtente = (utenteId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM notifiche_utente WHERE utente_id = ? ORDER BY creato_il DESC';
    db.all(sql, [utenteId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getConteggioNonLette = (utenteId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) AS numero FROM notifiche_utente WHERE utente_id = ? AND letta = 0';
    db.get(sql, [utenteId], (err, row) => {
      if (err) reject(err);
      else resolve(row.numero);
    });
  });
};

// Scoped anche su utente_id, non solo sull'id della notifica: così un
// utente non può segnare come lette notifiche che non sono sue solo
// indovinando un id.
export const segnaComeLetta = (id, utenteId) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE notifiche_utente SET letta = 1 WHERE id = ? AND utente_id = ?';
    db.run(sql, [id, utenteId], function (err) {
      if (err) reject(err);
      else if (this.changes === 0) resolve({ error: 'Notifica non trovata' });
      else resolve(true);
    });
  });
};

export const segnaTutteComeLette = (utenteId) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE notifiche_utente SET letta = 1 WHERE utente_id = ? AND letta = 0';
    db.run(sql, [utenteId], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};
