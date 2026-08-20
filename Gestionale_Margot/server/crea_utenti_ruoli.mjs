/**
 * Crea gli account mancanti per i ruoli Eventi, Grafica e Volontari.
 * Esegui dalla root del backend con: node crea_utenti_ruoli.mjs
 *
 * È sicuro rilanciarlo più volte: se uno username esiste già,
 * quell'utente viene semplicemente saltato (grazie al vincolo
 * UNIQUE già gestito da createUser in dao_utenti.mjs).
 *
 * Modifica pure username/password qui sotto prima di lanciarlo.
 * Le password sono provvisorie: consiglio di farle cambiare al
 * primo accesso a chi userà questi account.
 */
import { createUser } from './dao/dao_utenti.mjs';

const NUOVI_UTENTI = [
  { username: 'Admin', password: 'Margot2026!', ruolo: 'eventi' },
  { username: 'Bar', password: 'Margot2026!', ruolo: 'grafica' },
];

for (const u of NUOVI_UTENTI) {
  const result = await createUser(u.username, u.password, u.ruolo);
  if (result.error) {
    console.log(`⏭️  ${u.username}: ${result.error} (probabilmente esiste già, saltato)`);
  } else {
    console.log(`✅ ${u.username} creato con ruolo "${u.ruolo}" — password provvisoria: ${u.password}`);
  }
}

process.exit(0);
