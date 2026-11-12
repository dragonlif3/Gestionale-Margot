// Regole e formati della pagina Consumi, senza React.
import { categoriaLabel, sottocategoriaLabel } from '../../categorie';
import { formatDataOraIT } from '../../dateUtils';

// Il testo del file CSV (il carattere speciale iniziale, che serve a Excel per gli accenti, lo aggiunge chi scarica)
export function creaCsvConsumi(dati) {
  const intestazione = ['Categoria', 'Sottocategoria', 'Nome', 'Quantità consumata', 'Unità', 'Movimenti', 'Dal', 'Al'];
  const righe = dati.map((r) => [
    categoriaLabel(r.categoria),
    r.categoria ? sottocategoriaLabel(r.categoria, r.sottocategoria) : '—',
    r.nome,
    r.quantita_totale,
    r.unita_label,
    r.movimenti,
    formatDataOraIT(r.dal),
    formatDataOraIT(r.al)
  ]);
  return [intestazione, ...righe]
    .map((riga) => riga.map((cella) => `"${String(cella).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export const nomeFileCsv = (data) => `consumi_margot_${data.toISOString().slice(0, 10)}.csv`;

export const testoPendenti = (n) =>
  n === 0 ? 'nessun movimento in attesa' : `${n === 1 ? 'movimento' : 'movimenti'} in attesa dall'ultimo report`;

export const testoProdotti = (n) => `${n} prodott${n === 1 ? 'o' : 'i'}`;
