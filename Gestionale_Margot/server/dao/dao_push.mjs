/** DAO delle iscrizioni alle notifiche push **/

import db from './db.mjs';

// Un'iscrizione rappresenta UN DISPOSITIVO (browser o app installata) che ha
// accettato di ricevere notifiche. Lo stesso utente può averne più d'una
// (telefono + computer). L'endpoint è l'indirizzo che il servizio di push del
// browser ci assegna: è unico per dispositivo, quindi lo usiamo come chiave.

// Salva l'iscrizione, oppure la aggiorna se l'endpoint esiste già.
// Se il dispositivo era associato a un altro utente (stesso telefono, account
// diverso), passa all'utente attuale: le notifiche vanno a chi sta usando il dispositivo.
export const salvaIscrizione = ({ utenteId, endpoint, p256dh, auth }) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO push_iscrizioni (utente_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(endpoint) DO UPDATE SET
        utente_id = excluded.utente_id,
        p256dh = excluded.p256dh,
        auth = excluded.auth
    `;
    db.run(sql, [utenteId, endpoint, p256dh, auth], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// Rimozione richiesta dall'utente: può togliere solo i propri dispositivi.
export const rimuoviIscrizione = (endpoint, utenteId) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM push_iscrizioni WHERE endpoint = ? AND utente_id = ?', [endpoint, utenteId], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

// Rimozione fatta dal server quando il servizio di push dice che
// l'iscrizione non esiste più (app disinstallata, permesso revocato).
export const rimuoviIscrizionePerEndpoint = (endpoint) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM push_iscrizioni WHERE endpoint = ?', [endpoint], function (err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

export const getIscrizioniUtente = (utenteId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT endpoint, p256dh, auth FROM push_iscrizioni WHERE utente_id = ?', [utenteId], (err, righe) => {
      if (err) reject(err);
      else resolve(righe);
    });
  });
};
