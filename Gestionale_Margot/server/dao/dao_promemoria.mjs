/** DAO dei promemoria automatici **/

import db from './db.mjs';

// I compiti di grafica ancora da fare, con i dati dell'evento a cui si riferiscono
export const getCompitiGraficaDaFare = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT ng.id, ng.scadenza, e.nome, e.data_evento
      FROM notifiche_grafica ng
      JOIN eventi e ON e.id = ng.evento_id
      WHERE ng.stato = 'da_fare'
    `;
    db.all(sql, [], (err, righe) => (err ? reject(err) : resolve(righe)));
  });
};

// Gli utenti con un certo ruolo
export const getUtentiPerRuolo = (ruolo) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id FROM Users WHERE ruolo = ?', [ruolo], (err, righe) => (err ? reject(err) : resolve(righe)));
  });
};

// Il "registro" degli avvisi già inviati. Serve a non mandare due volte lo stesso
// avviso, anche se il server si riavvia o il controllo gira più volte.
//
// Funziona così: si prova a scrivere una riga; la combinazione
// (tipo, riferimento, soglia, scadenza) è UNICA, quindi se esiste già la scrittura
// viene ignorata. Il risultato dice se la riga l'abbiamo scritta noi (true) o c'era
// già (false): solo nel primo caso va inviato l'avviso.
//
// La scadenza fa parte della chiave di proposito: se la data dell'evento cambia, la
// scadenza cambia e i promemoria possono ripartire per la nuova data.
export const riservaPromemoria = ({ tipo, riferimentoId, soglia, scadenza }) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO promemoria_inviati (tipo, riferimento_id, soglia, scadenza)
      VALUES (?, ?, ?, ?)
    `;
    db.run(sql, [tipo, riferimentoId, soglia, scadenza], function (err) {
      if (err) reject(err);
      else resolve(this.changes === 1);
    });
  });
};

// Gli id degli utenti iscritti a un evento
export const getIdUtentiIscritti = (eventoId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT utente_id FROM iscrizioni_volontari WHERE evento_id = ?', [eventoId], (err, righe) => {
      if (err) reject(err);
      else resolve(righe.map((riga) => riga.utente_id));
    });
  });
};

// Le iscrizioni agli eventi che si svolgono in un certo giorno ("YYYY-MM-DD").
// Di ognuna serve anche quando è stata fatta: chi si è iscritto oggi per domani
// non ha bisogno di un promemoria.
export const getIscrizioniPerGiornoEvento = (giorno) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT iv.id, iv.utente_id, iv.creato_il, e.nome, e.data_evento
      FROM iscrizioni_volontari iv
      JOIN eventi e ON e.id = iv.evento_id
      WHERE substr(e.data_evento, 1, 10) = ?
    `;
    db.all(sql, [giorno], (err, righe) => (err ? reject(err) : resolve(righe)));
  });
};
