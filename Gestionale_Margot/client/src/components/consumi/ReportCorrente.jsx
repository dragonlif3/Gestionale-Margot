import { Alert, Button } from 'react-bootstrap';
import RigaConsumo from './RigaConsumo';
import { formatDataOraIT } from '../../dateUtils';

// Il report mostrato in pagina: intestazione con data e autore, pulsante CSV e l'elenco dei prodotti consumati.
function ReportCorrente({ report, onScaricaCsv }) {
  return (
    <section>
      <div className="con-report-testa">
        <h3>
          Report del {formatDataOraIT(report.generato_il)}
          {report.generato_da && <small> — generato da {report.generato_da}</small>}
        </h3>
        <Button variant="outline-warning" size="sm" onClick={onScaricaCsv} disabled={report.dati.length === 0}>
          <i className="bi bi-filetype-csv me-1"></i> Scarica CSV
        </Button>
      </div>

      {report.dati.length === 0 ? (
        <Alert variant="success">
          <i className="bi bi-check-circle me-2"></i>
          Nessun consumo registrato in questo report.
        </Alert>
      ) : (
        <ul className="con-lista">
          {report.dati.map((r) => (
            <RigaConsumo key={r.prodotto_id ?? r.nome} riga={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default ReportCorrente;
