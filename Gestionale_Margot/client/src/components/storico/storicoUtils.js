// Le regole dello storico, senza React: come si trasforma una riga salvata dal server in una frase
// e come si raggruppano le righe per giorno.
import { formatDataIT, formatDataOraIT } from '../../dateUtils';
import { categoriaLabel, CATEGORIE } from '../../categorie';
import { UNITA } from '../../unita';

export const PER_PAGINA = 50;

// ---------------------------------------------------------
// COME SI LEGGE UNA RIGA DELLO STORICO
// Il backend salva dati strutturati (azione, entità, dettagli);
// qui li trasformiamo in frasi leggibili. Cambiare le parole non
// richiede di toccare il database.
// ---------------------------------------------------------

const EURO = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const ETICHETTE_CAMPI = {
  nome: 'nome',
  quantita: 'quantità',
  quantita_ottimale: 'quantità ottimale',
  prezzo: 'prezzo',
  categoria: 'categoria',
  sottocategoria: 'sottocategoria',
  unita: 'unità',
  tipo: 'tipo',
  costo: 'costo',
  data_evento: 'data',
  max_volontari: 'massimo volontari'
};

// Nelle modifiche viene salvata la chiave interna (es. "birra_bottiglia"):
// qui la ritrasformiamo nell'etichetta che l'utente vede nell'app.
const sottocategoriaDaChiave = (chiave) => {
  for (const categoria of Object.values(CATEGORIE)) {
    if (categoria.sottocategorie?.[chiave]) return categoria.sottocategorie[chiave];
  }
  return chiave;
};

const formattaValore = (campo, valore) => {
  if (valore === null || valore === undefined || valore === '') return '—';
  if (campo === 'prezzo' || campo === 'costo') return EURO.format(Number(valore));
  if (campo === 'data_evento') return formatDataIT(valore);
  if (campo === 'categoria') return categoriaLabel(valore);
  if (campo === 'sottocategoria') return sottocategoriaDaChiave(valore);
  if (campo === 'unita') return UNITA[valore] || valore;
  return String(valore);
};

const descriviCambi = (cambi) =>
  Object.entries(cambi || {})
    .map(([campo, { da, a }]) => `${ETICHETTE_CAMPI[campo] || campo} da ${formattaValore(campo, da)} a ${formattaValore(campo, a)}`)
    .join('; ');

// Restituisce la frase che segue il nome di chi ha fatto l'operazione
export const descriviVoce = (voce) => {
  const nome = `“${voce.entita_nome ?? '?'}”`;
  const d = voce.dettagli || {};

  switch (`${voce.entita}:${voce.azione}`) {
    case 'prodotto:creato':
      return `ha aggiunto il prodotto ${nome} (quantità ${d.quantita ?? 0}, prezzo ${formattaValore('prezzo', d.prezzo)})`;
    case 'prodotto:modificato':
      return `ha modificato il prodotto ${nome}: ${descriviCambi(d.cambi)}`;
    case 'prodotto:quantita_modificata':
      return d.delta >= 0
        ? `ha aggiunto ${d.delta} × ${nome}`
        : `ha tolto ${Math.abs(d.delta)} × ${nome}`;
    case 'prodotto:eliminato':
      return `ha eliminato il prodotto ${nome}`;

    case 'evento:creato':
      return `ha creato l'evento ${nome} del ${formattaValore('data_evento', d.data_evento)}`;
    case 'evento:modificato':
      return `ha modificato l'evento ${nome}: ${descriviCambi(d.cambi)}`;
    case 'evento:eliminato':
      return `ha eliminato l'evento ${nome} del ${formattaValore('data_evento', d.data_evento)}`;
    case 'evento:pagamento_registrato':
      return `ha segnato come pagato l'evento ${nome} (${formattaValore('costo', d.costo)})`;
    case 'evento:grafica_completata':
      return `ha segnato come completata la grafica dell'evento ${nome}`;

    default:
      // Azione non ancora conosciuta da questa pagina: meglio mostrarla grezza che nasconderla
      return `${voce.azione} — ${voce.entita} ${nome}`;
  }
};

export const ICONE_ENTITA = {
  prodotto: 'bi-box-seam',
  evento: 'bi-calendar-event'
};


// ---------------------------------------------------------
// RAGGRUPPAMENTO PER GIORNO
// I giorni si ricavano dall'orario già convertito in ora italiana ("GG/MM/AAAA HH:MM"),
// così il giorno mostrato è sempre coerente con l'ora scritta accanto.
// ---------------------------------------------------------

export const oraDiUnaVoce = (voce) => formatDataOraIT(voce.creato_il).slice(-5);

const parti = (giornoIT) => giornoIT.split('/').map(Number); // [giorno, mese, anno]

// "Oggi", "Ieri", oppure "venerdì 30 ottobre" (con l'anno se non è quello corrente)
export function etichettaGiorno(giornoIT, adesso = new Date()) {
  const ieri = new Date(adesso);
  ieri.setDate(ieri.getDate() - 1);
  if (giornoIT === formatDataIT(adesso)) return 'Oggi';
  if (giornoIT === formatDataIT(ieri)) return 'Ieri';

  const [g, m, a] = parti(giornoIT);
  const data = new Date(a, m - 1, g);
  const opzioni = { weekday: 'long', day: 'numeric', month: 'long' };
  if (a !== adesso.getFullYear()) opzioni.year = 'numeric';
  return data.toLocaleDateString('it-IT', opzioni);
}

// Le righe (già in ordine dalla più recente) divise in gruppi consecutivi dello stesso giorno:
// [{ chiave: 'GG/MM/AAAA', etichetta: 'Oggi', voci: [...] }, ...]
export function raggruppaPerGiorno(voci, adesso = new Date()) {
  const gruppi = [];
  voci.forEach((voce) => {
    const chiave = formatDataOraIT(voce.creato_il).slice(0, 10);
    const ultimo = gruppi[gruppi.length - 1];
    if (ultimo && ultimo.chiave === chiave) {
      ultimo.voci.push(voce);
    } else {
      gruppi.push({ chiave, etichetta: etichettaGiorno(chiave, adesso), voci: [voce] });
    }
  });
  return gruppi;
}
