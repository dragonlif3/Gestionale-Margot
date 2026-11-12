import { Button, Spinner } from 'react-bootstrap';
import { formatDataOraIT } from '../../dateUtils';
import { testoProdotti } from './consumiUtils';

// L'elenco dei report precedenti, che si apre e si chiude. Toccandone uno, lo si vede in pagina.
//  - selezionatoId: l'id del report mostrato adesso (se è uno dell'elenco), per evidenziarlo
function StoricoReport({ aperto, onToggle, caricamento, report, selezionatoId, onSeleziona }) {
  return (
    <div className="con-storico">
      <Button variant="link" className="p-0" onClick={onToggle} aria-expanded={aperto}>
        <i className={`bi bi-chevron-${aperto ? 'down' : 'right'} me-1`}></i>
        Report precedenti
      </Button>

      {aperto && (
        <div className="mt-2">
          {caricamento ? (
            <Spinner animation="border" size="sm" variant="warning" />
          ) : report.length === 0 ? (
            <p className="text-muted small mb-0">Nessun report precedente.</p>
          ) : (
            <ul className="con-storico-lista">
              {report.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="con-storico-voce"
                    aria-current={r.id === selezionatoId ? 'true' : undefined}
                    onClick={() => onSeleziona(r)}
                  >
                    <span>
                      {formatDataOraIT(r.generato_il)}
                      {r.generato_da && <span className="con-storico-da"> — {r.generato_da}</span>}
                    </span>
                    <span className="con-storico-n">{testoProdotti(r.dati.length)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default StoricoReport;
