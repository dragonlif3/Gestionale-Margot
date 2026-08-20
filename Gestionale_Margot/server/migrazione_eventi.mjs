/**
 * Migrazione una tantum: aggiunge la colonna "max_volontari" alla
 * tabella "eventi" già esistente (la tabella "iscrizioni_volontari"
 * invece si crea da sola al primo avvio del server, perché è nuova
 * e initDb() usa CREATE TABLE IF NOT EXISTS).
 *
 * Esegui UNA SOLA VOLTA con: node migrazione_eventi.mjs
 *
 * Gli eventi che hai già restano con max_volontari = 0 (nessun
 * volontario richiesto) finché non li modifichi dal Calendario.
 */
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('GM.db', (err) => {
  if (err) throw err;
});

db.all('PRAGMA table_info(eventi)', [], (err, colonne) => {
  if (err) throw err;
  const giaPresente = colonne.some((c) => c.name === 'max_volontari');

  if (giaPresente) {
    console.log('⏭️  Colonna "max_volontari" già presente, nulla da fare');
    return db.close();
  }

  db.run('ALTER TABLE eventi ADD COLUMN max_volontari INTEGER NOT NULL DEFAULT 0', (errAlter) => {
    if (errAlter) {
      console.error('Errore aggiungendo "max_volontari":', errAlter);
    } else {
      console.log('✅ Colonna "max_volontari" aggiunta (default 0 per gli eventi esistenti)');
    }
    db.close();
  });
});
