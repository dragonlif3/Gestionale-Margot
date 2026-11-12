import { Button, Spinner } from 'react-bootstrap';
import { testoPendenti } from './consumiUtils';

// Quanti movimenti aspettano il prossimo report, e il pulsante per generarlo.
// Diventa gialla quando c'è qualcosa da riportare.
//  - pendenti: il numero, oppure null finché si sta ancora caricando
function CardPendenti({ pendenti, caricamento, generando, onGenera }) {
  return (
    <section className={`con-pendenti${pendenti > 0 ? ' con-pendenti--attivi' : ''}`} aria-label="Movimenti in attesa">
      <div className="con-pendenti-info">
        {caricamento ? (
          <Spinner animation="border" size="sm" variant="warning" />
        ) : (
          <>
            <div className="con-pendenti-num">{pendenti}</div>
            <p className="con-pendenti-testo">{testoPendenti(pendenti)}</p>
          </>
        )}
      </div>
      <Button variant="warning" onClick={onGenera} disabled={generando || pendenti === 0}>
        {generando ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-clipboard-data me-1"></i>}
        Dammi i consumi
      </Button>
    </section>
  );
}

export default CardPendenti;
