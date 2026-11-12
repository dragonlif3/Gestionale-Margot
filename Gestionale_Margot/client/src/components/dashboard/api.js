// Le chiamate della home. A differenza delle altre pagine, qui un pezzo che non risponde non rompe
// tutto: se il server dice "no" per una parte, quella parte resta vuota e il resto si vede lo stesso.
// Solo un errore di rete vero (il server non raggiungibile) fa comparire il messaggio d'errore.
import { API_URL } from '../../config';

const leggi = async (percorso, seErrore) => {
  const risposta = await fetch(`${API_URL}${percorso}`, { credentials: 'include' });
  return risposta.ok ? risposta.json() : seErrore;
};

// Scarica i dati che servono al ruolo. "aggiorna({ chiave: valore })" viene chiamata man mano che
// ogni pezzo arriva, così la pagina si riempie anche se un altro pezzo ci mette di più.
export function caricaDashboard({ isGrafica, isAmministrazione, isBar, isVolontari }, aggiorna) {
  const richieste = [leggi('/api/eventi', []).then((v) => aggiorna({ eventi: v }))];

  if (isGrafica || isAmministrazione) {
    richieste.push(leggi('/api/notifiche-grafica', []).then((v) => aggiorna({ notificheGrafica: v })));
  }
  if (isAmministrazione) {
    richieste.push(leggi('/api/notifiche-pagamento', []).then((v) => aggiorna({ notifichePagamento: v })));
  }
  if (isAmministrazione || isBar) {
    richieste.push(leggi('/api/prodotti', []).then((v) => aggiorna({ prodotti: v })));
    richieste.push(leggi('/api/consumi/pendenti', { numero: 0 }).then((d) => aggiorna({ consumiPendenti: d.numero || 0 })));
  }
  if (isVolontari) {
    richieste.push(leggi('/api/eventi/miei', []).then((v) => aggiorna({ mieiEventi: v })));
  }

  return Promise.all(richieste);
}
