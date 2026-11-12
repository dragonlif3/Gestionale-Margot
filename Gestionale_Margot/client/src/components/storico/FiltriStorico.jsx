import { Form } from 'react-bootstrap';

const TIPI = [['', 'Tutto'], ['prodotto', 'Prodotti'], ['evento', 'Eventi']];

// Filtri: chi ha fatto la modifica (elenco) e cosa è stato modificato (pulsanti).
function FiltriStorico({ utenti, erroreUtenti, filtroUtente, onUtente, filtroEntita, onEntita }) {
  return (
    <div className="sto-filtri">
      <div>
        <Form.Label htmlFor="sto-utente" className="sto-etichetta">Utente</Form.Label>
        <Form.Select id="sto-utente" value={filtroUtente} onChange={(e) => onUtente(e.target.value)}>
          <option value="">Tutti</option>
          {utenti.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </Form.Select>
        {erroreUtenti && <Form.Text className="text-danger">Elenco utenti non disponibile.</Form.Text>}
      </div>

      <div>
        <span className="sto-etichetta" id="sto-tipo-etichetta">Cosa è stato modificato</span>
        <div className="sto-tipi" role="group" aria-labelledby="sto-tipo-etichetta">
          {TIPI.map(([valore, etichetta]) => (
            <button key={valore} type="button" className="sto-tipo" aria-pressed={filtroEntita === valore} onClick={() => onEntita(valore)}>
              {etichetta}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FiltriStorico;
