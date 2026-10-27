// SQLite salva gli orari generati dal database (CURRENT_TIMESTAMP) nel formato
// "2026-10-26 14:30:00": sono in UTC, ma la stringa non lo dice. Senza aiuto il
// browser la leggerebbe come ora LOCALE, mostrando un orario sfasato di 1-2 ore
// (e, di sera tardi, perfino il giorno sbagliato).
// Qui riconosciamo quel formato preciso e lo trattiamo come UTC.
// Gli altri formati (data semplice "2026-11-20", ISO con "T" e "Z", oggetti Date)
// vengono letti come prima.
const FORMATO_SQLITE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

function leggiData(data) {
  if (data instanceof Date) return data;
  if (typeof data === 'string' && FORMATO_SQLITE.test(data)) {
    return new Date(data.replace(' ', 'T') + 'Z');
  }
  return new Date(data);
}

// Converte una data (stringa ISO 'YYYY-MM-DD', un timestamp ISO completo,
// un orario di SQLite o un oggetto Date) nel classico formato italiano GG/MM/AAAA.
// Usato SOLO per la visualizzazione: la logica interna (chiavi del
// calendario, il campo <input type="date">) resta in ISO perché lo
// richiede lo standard HTML, indipendentemente da questa funzione.
export function formatDataIT(data) {
  if (!data) return '—';
  const d = leggiData(data);
  if (isNaN(d.getTime())) return '—';

  const giorno = String(d.getDate()).padStart(2, '0');
  const mese = String(d.getMonth() + 1).padStart(2, '0');
  const anno = d.getFullYear();
  return `${giorno}/${mese}/${anno}`;
}

// Come sopra ma con anche l'orario (utile per timestamp completi, es. scadenze)
export function formatDataOraIT(data) {
  if (!data) return '—';
  const d = leggiData(data);
  if (isNaN(d.getTime())) return '—';

  const ore = String(d.getHours()).padStart(2, '0');
  const minuti = String(d.getMinutes()).padStart(2, '0');
  return `${formatDataIT(d)} ${ore}:${minuti}`;
}
