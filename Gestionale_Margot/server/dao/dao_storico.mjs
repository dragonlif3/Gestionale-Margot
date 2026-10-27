/** DAO dello storico delle modifiche **/

import db from './db.mjs';

// Il campo "dettagli" è salvato come testo JSON. Se per qualche motivo
// non è leggibile, restituiamo null invece di rompere tutta la lista.
const leggiJson = (testo) => {
  if (!testo) return null;
  try {
    return JSON.parse(testo);
  } catch {
    return null;
  }
};

// Scrive una riga di storico.
// - utente: username di chi ha fatto l'operazione (copia di testo, non un id:
//   l'utente potrebbe essere eliminato in futuro, lo storico deve restare leggibile)
// - dettagli: oggetto con le informazioni utili (viene salvato come JSON)
export const registraModifica = ({ utente, azione, entita, entitaId = null, entitaNome = null, dettagli = null }) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO storico_modifiche
        (utente_username, azione, entita, entita_id, entita_nome, dettagli)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const dettagliJson = dettagli ? JSON.stringify(dettagli) : null;

    db.run(sql, [utente, azione, entita, entitaId, entitaNome, dettagliJson], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Legge lo storico dal più recente al più vecchio.
// La paginazione usa l'id dell'ultima riga già vista ("primaDi") invece di un
// offset: se nel frattempo arrivano nuove righe, non si vedono doppioni.
export const getStorico = ({ limit = 50, primaDi = null, utente = null, entita = null } = {}) => {
  return new Promise((resolve, reject) => {
    const condizioni = [];
    const parametri = [];

    if (primaDi) {
      condizioni.push('id < ?');
      parametri.push(primaDi);
    }
    if (utente) {
      condizioni.push('utente_username = ?');
      parametri.push(utente);
    }
    if (entita) {
      condizioni.push('entita = ?');
      parametri.push(entita);
    }

    // Le condizioni sono frammenti fissi scritti qui sopra: i valori arrivano
    // sempre dai "?" e mai concatenati nel testo della query.
    const where = condizioni.length > 0 ? `WHERE ${condizioni.join(' AND ')}` : '';
    const sql = `
      SELECT id, creato_il, utente_username, azione, entita, entita_id, entita_nome, dettagli
      FROM storico_modifiche
      ${where}
      ORDER BY id DESC
      LIMIT ?
    `;

    db.all(sql, [...parametri, limit], (err, righe) => {
      if (err) return reject(err);
      resolve(righe.map((riga) => ({ ...riga, dettagli: leggiJson(riga.dettagli) })));
    });
  });
};

// Elenco degli utenti che compaiono nello storico (per il filtro nella pagina)
export const getUtentiNelloStorico = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT DISTINCT utente_username FROM storico_modifiche ORDER BY utente_username COLLATE NOCASE';
    db.all(sql, [], (err, righe) => {
      if (err) reject(err);
      else resolve(righe.map((riga) => riga.utente_username));
    });
  });
};

// Elimina le righe più vecchie di "giorni" giorni. Restituisce quante ne ha tolte.
// Il minimo di 7 giorni evita che un errore di configurazione (ad esempio 0)
// cancelli tutto lo storico in un colpo solo.
export const eliminaStoricoPiuVecchioDi = (giorni) => {
  return new Promise((resolve, reject) => {
    if (!Number.isInteger(giorni) || giorni < 7) {
      return reject(new Error('Il periodo di conservazione deve essere di almeno 7 giorni.'));
    }

    // creato_il è salvato in formato ISO UTC, quindi il confronto tra testi
    // coincide con il confronto tra date.
    const sql = `DELETE FROM storico_modifiche WHERE creato_il < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ?)`;
    db.run(sql, [`-${giorni} days`], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};
