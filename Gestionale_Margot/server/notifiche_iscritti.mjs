/**
 * Avvisi ai volontari iscritti quando un evento viene MODIFICATO.
 *
 * Si avvisa solo se cambia qualcosa che li riguarda: il NOME o la DATA.
 * Costo, tipo e numero massimo di volontari sono dati interni del locale e
 * non generano nessun avviso.
 *
 * Ogni iscritto riceve una notifica nell'app (il campanellino) e, se ha attivato
 * le notifiche sul telefono, anche una push: lo fa già creaNotifica.
 */

import { creaNotifica } from './dao/dao_notifiche.mjs';
import { getIdUtentiIscritti } from './dao/dao_promemoria.mjs';

// "2026-11-20" -> "20/11/2026"
const formattaData = (data) => `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;

const costruisciTesto = (prima, dopo, nomeCambiato, dataCambiata) => {
  if (nomeCambiato && dataCambiata) {
    return `L'evento “${prima.nome}” è cambiato: ora si chiama “${dopo.nome}” e si svolge il ${formattaData(dopo.data_evento)} (prima: ${formattaData(prima.data_evento)}).`;
  }
  if (dataCambiata) {
    return `L'evento “${dopo.nome}” è stato spostato: dal ${formattaData(prima.data_evento)} al ${formattaData(dopo.data_evento)}.`;
  }
  return `L'evento “${prima.nome}” ora si chiama “${dopo.nome}”.`;
};

// prima / dopo: oggetti con almeno { nome, data_evento }.
// Restituisce a quanti iscritti ha mandato l'avviso.
export const avvisaIscrittiDiModifica = async (eventoId, prima, dopo) => {
  const nomeCambiato = prima.nome.trim() !== dopo.nome.trim();
  const dataCambiata = prima.data_evento.slice(0, 10) !== dopo.data_evento.slice(0, 10);
  if (!nomeCambiato && !dataCambiata) return 0;

  const iscritti = await getIdUtentiIscritti(eventoId);
  if (iscritti.length === 0) return 0;

  const testo = costruisciTesto(prima, dopo, nomeCambiato, dataCambiata);

  // Un errore con un singolo utente non deve impedire l'avviso agli altri
  const esiti = await Promise.allSettled(
    iscritti.map((utenteId) => creaNotifica(utenteId, testo, { titolo: 'Evento modificato', url: '/miei-eventi' }))
  );
  esiti.filter((esito) => esito.status === 'rejected')
    .forEach((esito) => console.error('Avviso di modifica evento non creato:', esito.reason?.message));

  return iscritti.length;
};
