// Costanti e funzioni "pure" del calendario: non usano React né il server.

export const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];
export const TIPI_SUGGERITI = ['Concerto', 'Festa privata', 'DJ set', 'Presentazione', 'Mostra', 'Altro'];

// Formatta una Date in 'YYYY-MM-DD' usando l'ora locale (evita i disallineamenti di toISOString con UTC)
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Costruisce la griglia del mese: settimane di 7 giorni (lun-dom), incluso il padding
// con i giorni del mese precedente/successivo per riempire le celle vuote.
export function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  // getDay(): 0=domenica..6=sabato -> convertiamo a 0=lunedì..6=domenica
  const startOffset = (firstOfMonth.getDay() + 6) % 7;

  const gridStart = new Date(year, month, 1 - startOffset);

  const weeks = [];
  let cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

// Cosa può fare e vedere ogni ruolo nel calendario.
// È l'unico punto in cui si decide: se cambiano le regole si modifica solo qui.
export function getPermessi(user) {
  const ruolo = user?.ruolo;
  return {
    puoGestireEventi: ruolo === 'eventi' || ruolo === 'amministrazione',
    puoVedereBacheca: ruolo === 'grafica' || ruolo === 'amministrazione',
    puoVederePagamenti: ruolo === 'amministrazione',
    isVolontario: ruolo === 'volontari',
    // Chi può vedere gli indicatori di stato sui singoli eventi nel calendario
    puoVedereStatoGrafica: ['eventi', 'amministrazione', 'grafica'].includes(ruolo),
    puoVedereStatoPagamento: ['eventi', 'amministrazione'].includes(ruolo)
  };
}

export const MESI_BREVI = ['GEN', 'FEB', 'MAR', 'APR', 'MAG', 'GIU', 'LUG', 'AGO', 'SET', 'OTT', 'NOV', 'DIC'];

// Il tipo di evento è testo libero ("Concerto", "DJ set"...): il colore si sceglie in base a
// parole chiave, come nei manifesti del circolo. Tutto il resto è "lilla".
export function coloreTipo(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (/concert|live|jazz|band|music/.test(t)) return 'viola';
  if (/karaoke|festa|party|dj|serata|ballo/.test(t)) return 'arancio';
  if (/torne|sport|calcett|ping|scacchi|gioc|quiz/.test(t)) return 'lime';
  if (/mostra|present|cinema|libro|teatro|arte|laborator/.test(t)) return 'verde';
  return 'lilla';
}
