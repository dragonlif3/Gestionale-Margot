/**
 * Migrazione una tantum: passa i prodotti "Confezione"/"Scatola" dal vecchio
 * conteggio "in unità interne" (es. 24 lattine) al nuovo conteggio diretto
 * "in confezioni" (es. 1 confezione), dividendo quantità e quantità
 * ottimale per la molteplicità che avevano.
 *
 * Esegui UNA SOLA VOLTA con: node migrazione_unita_confezioni.mjs
 *
 * ATTENZIONE - è una conversione con perdita di precisione:
 * se prima avevi, ad esempio, 20 lattine di una confezione da 24 (una
 * confezione già aperta), non esiste un modo esatto di esprimerlo in
 * confezioni intere: viene arrotondato al numero intero più vicino
 * (20/24 = 0.83 → 1). Lo script stampa il prima/dopo di ogni prodotto
 * convertito, con il valore esatto prima dell'arrotondamento: se qualcosa
 * non ti torna, correggilo a mano da "Modifica prodotto" nel Magazzino.
 *
 * Dopo la conversione, molteplicita e unita_contenuto vengono azzerate
 * per quei prodotti: non servono più.
 */
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('GM.db', (err) => {
  if (err) throw err;
});

const sql = `
  SELECT id, nome, unita, quantita, quantita_ottimale, molteplicita, unita_contenuto
  FROM prodotti
  WHERE unita IN ('confezione', 'scatola') AND molteplicita IS NOT NULL AND molteplicita > 0
`;

db.all(sql, [], (err, righe) => {
  if (err) throw err;

  if (righe.length === 0) {
    console.log('Nessun prodotto da convertire (già migrato, oppure non ne hai di tipo confezione/scatola).');
    return db.close();
  }

  console.log(`Trovati ${righe.length} prodotti da convertire:\n`);

  let rimanenti = righe.length;

  righe.forEach((p) => {
    const quantitaEsatta = p.quantita / p.molteplicita;
    const ottimaleEsatta = p.quantita_ottimale / p.molteplicita;
    const nuovaQuantita = Math.round(quantitaEsatta);
    const nuovaOttimale = Math.round(ottimaleEsatta);

    console.log(`- ${p.nome} (${p.unita} da ${p.molteplicita} ${p.unita_contenuto || 'unità'})`);
    console.log(`    quantità: ${p.quantita} ${p.unita_contenuto || 'unità'} → ${nuovaQuantita} ${p.unita} (esatto: ${quantitaEsatta.toFixed(2)})`);
    console.log(`    ottimale: ${p.quantita_ottimale} ${p.unita_contenuto || 'unità'} → ${nuovaOttimale} ${p.unita} (esatto: ${ottimaleEsatta.toFixed(2)})`);

    db.run(
      'UPDATE prodotti SET quantita = ?, quantita_ottimale = ?, molteplicita = NULL, unita_contenuto = NULL WHERE id = ?',
      [nuovaQuantita, nuovaOttimale, p.id],
      (errUpdate) => {
        if (errUpdate) console.error(`  ERRORE aggiornando "${p.nome}":`, errUpdate);
        rimanenti -= 1;
        if (rimanenti === 0) {
          console.log('\nMigrazione completata. Controlla i valori sopra e correggi a mano quelli che non ti tornano.');
          db.close();
        }
      }
    );
  });
});
