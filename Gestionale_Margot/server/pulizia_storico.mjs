/**
 * Pulizia periodica dello storico delle modifiche.
 *
 * Elimina le righe più vecchie di SETTIMANE_DI_STORICO settimane: parte poco dopo
 * l'avvio del server e poi si ripete ogni 24 ore. È sicuro ripeterla quante volte
 * si vuole (non toglie mai righe recenti) e, se il server resta spento qualche
 * giorno, al riavvio recupera da sola.
 *
 * Se cambi il numero di settimane, aggiorna anche la frase in StoricoComp.jsx
 * ("vengono conservate le ultime ... settimane").
 */

import { eliminaStoricoPiuVecchioDi } from './dao/dao_storico.mjs';

const SETTIMANE_DI_STORICO = 8;

const UNA_VOLTA_AL_GIORNO = 24 * 60 * 60 * 1000;
// All'avvio il database sta ancora creando/verificando le tabelle: aspettiamo un momento
const RITARDO_PRIMA_ESECUZIONE = 30 * 1000;

const pulisci = async () => {
  try {
    const eliminate = await eliminaStoricoPiuVecchioDi(SETTIMANE_DI_STORICO * 7);
    if (eliminate > 0) {
      console.log(`Storico: eliminate ${eliminate} righe più vecchie di ${SETTIMANE_DI_STORICO} settimane.`);
    }
  } catch (err) {
    console.error('Storico: pulizia fallita:', err.message);
  }
};

export const avviaPuliziaStorico = () => {
  setTimeout(pulisci, RITARDO_PRIMA_ESECUZIONE).unref();
  setInterval(pulisci, UNA_VOLTA_AL_GIORNO).unref();
};
