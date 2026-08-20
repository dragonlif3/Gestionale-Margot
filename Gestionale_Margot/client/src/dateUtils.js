// Converte una data (stringa ISO 'YYYY-MM-DD', un timestamp ISO completo,
// o un oggetto Date) nel classico formato italiano GG/MM/AAAA.
// Usato SOLO per la visualizzazione: la logica interna (chiavi del
// calendario, il campo <input type="date">) resta in ISO perché lo
// richiede lo standard HTML, indipendentemente da questa funzione.
export function formatDataIT(data) {
  if (!data) return '—';
  const d = data instanceof Date ? data : new Date(data);
  if (isNaN(d.getTime())) return '—';

  const giorno = String(d.getDate()).padStart(2, '0');
  const mese = String(d.getMonth() + 1).padStart(2, '0');
  const anno = d.getFullYear();
  return `${giorno}/${mese}/${anno}`;
}

// Come sopra ma con anche l'orario (utile per timestamp completi, es. scadenze)
export function formatDataOraIT(data) {
  if (!data) return '—';
  const d = data instanceof Date ? data : new Date(data);
  if (isNaN(d.getTime())) return '—';

  const ore = String(d.getHours()).padStart(2, '0');
  const minuti = String(d.getMinutes()).padStart(2, '0');
  return `${formatDataIT(d)} ${ore}:${minuti}`;
}
