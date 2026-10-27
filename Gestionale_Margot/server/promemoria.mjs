/**
 * Promemoria automatici via notifica push.
 *
 * VOLONTARI: il giorno prima di un evento a cui sono iscritti ricevono un promemoria
 * (nell'app e, se hanno attivato le notifiche, anche sul telefono). Chi si è iscritto
 * proprio oggi non lo riceve: sa già di essere iscritto.
 *
 * GRAFICA: agli utenti con ruolo Grafica che hanno attivato le notifiche, per ogni
 * compito ancora "da fare" il server manda:
 *   - un avviso quando mancano 2 giorni (o meno, se il compito è nato più tardi),
 *   - un avviso il giorno stesso della scadenza,
 *   - un avviso, una sola volta, quando risulta scaduto.
 *
 * Quando: il controllo gira ogni 5 minuti, ma agisce solo tra le 9:00 e le 20:00
 * ORA ITALIANA. Quindi gli avvisi partono poco dopo le 9:00; se il server era spento
 * a quell'ora, partono appena riparte (purché prima delle 20:00: niente notifiche di notte).
 *
 * Ogni avviso parte UNA SOLA VOLTA per compito e per soglia (vedi riservaPromemoria).
 */

import { getChiavePubblica, inviaPushAUtente } from './push.mjs';
import { getIscrizioniUtente } from './dao/dao_push.mjs';
import {
  getCompitiGraficaDaFare,
  getUtentiPerRuolo,
  riservaPromemoria,
  getIscrizioniPerGiornoEvento
} from './dao/dao_promemoria.mjs';
import { creaNotifica } from './dao/dao_notifiche.mjs';

const FUSO = 'Europe/Rome';
const ORA_INIZIO = 9;
const ORA_FINE = 20;
const OGNI_5_MINUTI = 5 * 60 * 1000;
const RITARDO_PRIMA_ESECUZIONE = 60 * 1000; // il database, all'avvio, sta ancora verificando le tabelle

// ---------------------------------------------------------
// DATE: tutto ragionato in ora italiana
// ---------------------------------------------------------

// Dato un istante, restituisce il giorno ("2026-11-13") e l'ora (0-23) in Italia.
// Nota: la scadenza è salvata come istante UTC; convertirla in ora italiana dà il
// giorno che l'utente vede nell'app, anche attorno al cambio dell'ora legale.
const giornoEOraInItalia = (istante) => {
  const parti = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    hourCycle: 'h23'
  }).formatToParts(istante);
  const valore = (tipo) => parti.find((parte) => parte.type === tipo).value;
  return { giorno: `${valore('year')}-${valore('month')}-${valore('day')}`, ora: Number(valore('hour')) };
};

// Giorni tra due date "YYYY-MM-DD" (positivo se la seconda è dopo la prima)
const giorniTra = (da, a) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${da}T00:00:00Z`)) / 86400000);

const gg_mm = (giorno) => `${giorno.slice(8, 10)}/${giorno.slice(5, 7)}`;

// Il giorno dopo, in formato "YYYY-MM-DD"
const giornoDopo = (giorno) => new Date(Date.parse(`${giorno}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);

// I promemoria partono solo di giorno (vedi ORA_INIZIO e ORA_FINE)
const dentroLaFinestra = (ora) => ora >= ORA_INIZIO && ora < ORA_FINE;

// ---------------------------------------------------------
// COSA DIRE, E QUANDO
// ---------------------------------------------------------

// In base ai giorni che mancano alla scadenza, a quale "soglia" siamo?
// (null = ancora troppo presto per avvisare)
const decidiSoglia = (giorniMancanti) => {
  if (giorniMancanti < 0) return 'scaduta';
  if (giorniMancanti === 0) return 'oggi';
  if (giorniMancanti <= 2) return 'due_giorni';
  return null;
};

const costruisciMessaggio = (compito, soglia, giorniMancanti, giornoScadenza) => {
  const evento = `“${compito.nome}” (evento del ${gg_mm(compito.data_evento.slice(0, 10))})`;

  if (soglia === 'scaduta') {
    return { titolo: 'Grafica scaduta', testo: `${evento}: la grafica era da consegnare il ${gg_mm(giornoScadenza)}.` };
  }
  if (soglia === 'oggi') {
    return { titolo: 'Grafica da consegnare oggi', testo: `${evento}: la grafica scade oggi.` };
  }
  const quando = giorniMancanti === 1 ? 'domani' : `tra ${giorniMancanti} giorni`;
  return { titolo: 'Grafica in scadenza', testo: `${evento}: la grafica scade ${quando}.` };
};

// ---------------------------------------------------------
// IL CONTROLLO
// "adesso" si può passare a mano: serve per provare il comportamento in date diverse.
// ---------------------------------------------------------

export const controllaPromemoriaGrafica = async (adesso = new Date()) => {
  // Se le push non sono configurate non c'è nulla da inviare, e soprattutto
  // non dobbiamo "consumare" gli avvisi nel registro.
  if (!getChiavePubblica()) return;

  const { giorno: oggi, ora } = giornoEOraInItalia(adesso);
  if (!dentroLaFinestra(ora)) return;

  const compiti = await getCompitiGraficaDaFare();
  if (compiti.length === 0) return;

  // Destinatari: utenti Grafica con almeno un dispositivo. Se non ce n'è nessuno
  // non registriamo nulla: chi attiverà le notifiche più tardi riceverà comunque
  // gli avvisi ancora validi.
  const utentiGrafica = await getUtentiPerRuolo('grafica');
  const destinatari = [];
  for (const utente of utentiGrafica) {
    if ((await getIscrizioniUtente(utente.id)).length > 0) destinatari.push(utente.id);
  }
  if (destinatari.length === 0) return;

  for (const compito of compiti) {
    // Un evento già passato non ha più bisogno della grafica: niente avvisi
    if (compito.data_evento.slice(0, 10) < oggi) continue;

    const giornoScadenza = giornoEOraInItalia(new Date(compito.scadenza)).giorno;
    const giorniMancanti = giorniTra(oggi, giornoScadenza);
    const soglia = decidiSoglia(giorniMancanti);
    if (!soglia) continue;

    // Prenotiamo l'avviso PRIMA di inviarlo: se per un attimo due controlli si
    // sovrappongono, solo uno dei due ottiene la prenotazione e invia.
    const prenotato = await riservaPromemoria({
      tipo: 'grafica',
      riferimentoId: compito.id,
      soglia,
      scadenza: compito.scadenza
    });
    if (!prenotato) continue;

    const messaggio = costruisciMessaggio(compito, soglia, giorniMancanti, giornoScadenza);
    await Promise.all(destinatari.map((id) => inviaPushAUtente(id, { ...messaggio, url: '/calendario' })));
  }
};

// ---------------------------------------------------------
// VOLONTARI: il giorno prima dell'evento
// ---------------------------------------------------------

export const controllaPromemoriaVolontari = async (adesso = new Date()) => {
  const { giorno: oggi, ora } = giornoEOraInItalia(adesso);
  if (!dentroLaFinestra(ora)) return;

  // Tutte le iscrizioni agli eventi di domani
  const iscrizioni = await getIscrizioniPerGiornoEvento(giornoDopo(oggi));

  for (const iscrizione of iscrizioni) {
    // creato_il è salvato dal database in UTC, senza indicazione del fuso
    const giornoIscrizione = giornoEOraInItalia(new Date(iscrizione.creato_il.replace(' ', 'T') + 'Z')).giorno;
    if (giornoIscrizione >= oggi) continue; // iscritto oggi: nessun promemoria

    // Una sola volta per iscrizione. Se la data dell'evento cambia, la chiave cambia
    // e il promemoria riparte per la nuova data.
    const prenotato = await riservaPromemoria({
      tipo: 'volontari',
      riferimentoId: iscrizione.id,
      soglia: 'giorno_prima',
      scadenza: iscrizione.data_evento
    });
    if (!prenotato) continue;

    const testo = `Promemoria: domani sei iscritto all'evento “${iscrizione.nome}” (${gg_mm(iscrizione.data_evento.slice(0, 10))}).`;
    await creaNotifica(iscrizione.utente_id, testo, { titolo: 'Promemoria evento', url: '/miei-eventi' });
  }
};

// ---------------------------------------------------------
// AVVIO
// ---------------------------------------------------------

// Ogni controllo ha il suo try/catch: se uno fallisce, l'altro parte lo stesso
const esegui = async () => {
  try {
    await controllaPromemoriaGrafica();
  } catch (err) {
    console.error('Promemoria grafica: controllo fallito:', err.message);
  }
  try {
    await controllaPromemoriaVolontari();
  } catch (err) {
    console.error('Promemoria volontari: controllo fallito:', err.message);
  }
};

export const avviaPromemoria = () => {
  setTimeout(esegui, RITARDO_PRIMA_ESECUZIONE).unref();
  setInterval(esegui, OGNI_5_MINUTI).unref();
};
