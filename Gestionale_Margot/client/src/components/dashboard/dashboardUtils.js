// Le regole della home: quali eventi, compiti e scorte mostrare. Senza React, facili da provare.
// "oggi" è mezzanotte di oggi (ora locale); si può passare a mano per le prove.
import { daOrdinare } from '../magazzino/magazzinoUtils';

export const oggiChiave = () => new Date(new Date().toDateString());

const perData = (a, b) => new Date(a.data_evento) - new Date(b.data_evento);

export const prossimiEventi = (eventi, oggi = oggiChiave()) =>
  eventi.filter((e) => new Date(e.data_evento) >= oggi).sort(perData);

export const eventiCreatiDa = (prossimi, username) => prossimi.filter((e) => e.creato_da_username === username);

export const mieiEventiFuturi = (mieiEventi, oggi = oggiChiave()) =>
  mieiEventi.filter((e) => new Date(e.data_evento) >= oggi).sort(perData);

export const eventiCheCercanoVolontari = (prossimi) =>
  prossimi.filter((e) => e.max_volontari > 0 && e.iscritti_count < e.max_volontari && !e.iscritto);

export const graficaDaFare = (notifiche) =>
  notifiche.filter((n) => n.stato !== 'completato').sort((a, b) => new Date(a.scadenza) - new Date(b.scadenza));

// Urgente = scade entro 2 giorni (o è già scaduta)
export const graficaUrgente = (daFare, adesso = new Date()) => {
  const traDueGiorni = new Date(adesso);
  traDueGiorni.setDate(traDueGiorni.getDate() + 2);
  return daFare.filter((n) => new Date(n.scadenza) <= traDueGiorni);
};

export const pagamentiDaFare = (notifiche) => notifiche.filter((n) => n.stato !== 'pagato');
export const totaleDaPagare = (daFare) => daFare.reduce((somma, n) => somma + Number(n.costo || 0), 0);

// Stessa regola della pagina Ordini
export const prodottiSottoScorta = (prodotti) => prodotti.filter(daOrdinare);
