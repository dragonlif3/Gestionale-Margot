/**
 * Migrazione una tantum: aggiunge alla tabella "prodotti" già esistente
 * le nuove colonne per categoria, sottocategoria, quantità ottimale,
 * unità di misura e molteplicità.
 *
 * Esegui UNA SOLA VOLTA con: node migrazione_prodotti.mjs
 *
 * I prodotti che avevi già (es. i tuoi vini) restano intatti in nome/
 * quantità/prezzo; categoria e sottocategoria restano vuote finché non
 * li modifichi dalla nuova finestra "Modifica prodotto" nel Magazzino
 * (comparirà una sezione "Da categorizzare" per quelli senza categoria).
 * L'unità di default è "bottiglia" per compatibilità con i vini esistenti.
 */
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('GM.db', (err) => {
  if (err) throw err;
});

const colonneDaAggiungere = [
  { nome: 'quantita_ottimale', ddl: 'ALTER TABLE prodotti ADD COLUMN quantita_ottimale INTEGER NOT NULL DEFAULT 0' },
  { nome: 'categoria', ddl: 'ALTER TABLE prodotti ADD COLUMN categoria TEXT' },
  { nome: 'sottocategoria', ddl: 'ALTER TABLE prodotti ADD COLUMN sottocategoria TEXT' },
  { nome: 'unita', ddl: "ALTER TABLE prodotti ADD COLUMN unita TEXT NOT NULL DEFAULT 'bottiglia'" },
  { nome: 'molteplicita', ddl: 'ALTER TABLE prodotti ADD COLUMN molteplicita INTEGER' },
  { nome: 'unita_contenuto', ddl: 'ALTER TABLE prodotti ADD COLUMN unita_contenuto TEXT' }
];

db.all('PRAGMA table_info(prodotti)', [], (err, colonneEsistenti) => {
  if (err) throw err;
  const nomiEsistenti = colonneEsistenti.map((c) => c.name);

  db.serialize(() => {
    colonneDaAggiungere.forEach((col) => {
      if (nomiEsistenti.includes(col.nome)) {
        console.log(`⏭️  Colonna "${col.nome}" già presente, saltata`);
        return;
      }
      db.run(col.ddl, (errAlter) => {
        if (errAlter) console.error(`Errore aggiungendo "${col.nome}":`, errAlter);
        else console.log(`✅ Colonna "${col.nome}" aggiunta`);
      });
    });

    db.all('SELECT * FROM prodotti', [], (errFinale, rows) => {
      if (errFinale) return console.error(errFinale);
      console.log('\nSituazione finale prodotti:', rows);
      db.close();
    });
  });
});
