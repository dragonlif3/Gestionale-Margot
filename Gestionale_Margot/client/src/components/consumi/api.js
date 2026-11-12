// Le chiamate al server dei consumi. Ogni funzione restituisce i dati oppure lancia un Error con il messaggio da mostrare.
import { chiama } from '../../apiClient';

// { numero } = quanti movimenti sono in attesa del prossimo report
export const caricaPendenti = async () =>
  (await chiama('/api/consumi/pendenti', { erroreDefault: 'Errore nel controllo dei consumi in attesa' })).json();

// L'ultimo report generato, oppure null se non ce n'è ancora nessuno
export const caricaUltimoReport = async () =>
  (await chiama('/api/consumi/report/ultimo', { erroreDefault: "Errore nel caricamento dell'ultimo report" })).json();

// Genera il report (i movimenti in attesa escono dal log): restituisce le righe del report
export const generaReport = async () =>
  (await chiama('/api/consumi/report', { metodo: 'POST', erroreDefault: 'Errore nella generazione del report' })).json();

export const caricaStoricoReport = async () =>
  (await chiama('/api/consumi/report/storico', { erroreDefault: 'Errore nel caricamento dello storico' })).json();
