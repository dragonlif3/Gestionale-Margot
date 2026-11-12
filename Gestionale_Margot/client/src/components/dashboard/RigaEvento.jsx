import { MESI_BREVI, coloreTipo } from '../calendario/calendarioUtils';

// Una riga della home: a sinistra la data in un quadrato del colore del tipo di evento
// (come nelle schede del calendario), al centro il titolo e il sottotitolo, a destra un'etichetta o un pulsante.
//  - data: 'YYYY-MM-DD' o l'inizio di un timestamp
//  - tipo: serve solo a scegliere il colore (può mancare: viene il colore neutro)
function RigaEvento({ nome, sottotitolo, data, tipo, destra }) {
  const [, mese, giorno] = String(data).slice(0, 10).split('-');
  return (
    <li className="dash-riga">
      <div className={`dash-data dash-tipo--${coloreTipo(tipo)}`} aria-hidden="true">
        <b>{Number(giorno)}</b>
        <small>{MESI_BREVI[Number(mese) - 1]}</small>
      </div>
      <div className="dash-riga-testo">
        <div className="dash-riga-nome">{nome}</div>
        <div className="dash-riga-sotto">{sottotitolo}</div>
      </div>
      {destra && <div className="dash-riga-destra">{destra}</div>}
    </li>
  );
}

export default RigaEvento;
