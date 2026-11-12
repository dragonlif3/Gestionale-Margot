// Le chiamate al server dello storico.
import { chiama } from '../../apiClient';
import { PER_PAGINA } from './storicoUtils';

// Una pagina di righe, dalla più recente. "primaDi" è l'id dell'ultima riga già mostrata:
// restituisce quelle più vecchie. I filtri sono facoltativi.
export const caricaPagina = async ({ primaDi, utente, entita }) => {
  const parametri = new URLSearchParams({ limit: PER_PAGINA });
  if (primaDi) parametri.set('primaDi', primaDi);
  if (utente) parametri.set('utente', utente);
  if (entita) parametri.set('entita', entita);
  return (await chiama(`/api/storico?${parametri}`, { erroreDefault: 'Impossibile caricare lo storico.' })).json();
};

// Gli utenti che compaiono nello storico (per il filtro)
export const caricaUtenti = async () =>
  (await chiama('/api/storico/utenti', { erroreDefault: 'Elenco utenti non disponibile.' })).json();
