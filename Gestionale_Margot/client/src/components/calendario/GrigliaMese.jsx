import { useMemo } from 'react';
import { Row, Col, Button } from 'react-bootstrap';
import { GIORNI_SETTIMANA, MESI, toDateKey, buildMonthGrid } from './calendarioUtils';

// Icone compatte di stato da mostrare sulla pillola dell'evento nel calendario
function iconeStato(ev, permessi) {
  const icone = [];
  if (permessi.puoVedereStatoGrafica && ev.grafica_stato) {
    const pronta = ev.grafica_stato === 'completato';
    icone.push(
      <i
        key="grafica"
        className={`bi ${pronta ? 'bi-easel-fill' : 'bi-easel'} calendar-status-icon ${pronta ? 'calendar-status-icon--ok' : 'calendar-status-icon--pending'}`}
        title={pronta ? 'Grafica pronta' : 'Grafica in lavorazione'}
      ></i>
    );
  }
  if (permessi.puoVedereStatoPagamento && ev.pagamento_stato) {
    const pagato = ev.pagamento_stato === 'pagato';
    icone.push(
      <i
        key="pagamento"
        className={`bi ${pagato ? 'bi-coin' : 'bi-exclamation-circle'} calendar-status-icon ${pagato ? 'calendar-status-icon--ok' : 'calendar-status-icon--pending'}`}
        title={pagato ? 'Pagato' : 'Da pagare'}
      ></i>
    );
  }
  return icone;
}

// La griglia del mese con le frecce per cambiare mese.
//  - meseVisto: una Date che punta al primo giorno del mese mostrato
//  - eventiPerGiorno: { 'YYYY-MM-DD': [eventi] }
//  - onApriGiorno(data): clic su un giorno che ha eventi
//  - onNuovoEvento(data): clic su un giorno vuoto (solo per chi può gestire gli eventi)
function GrigliaMese({ meseVisto, onCambiaMese, eventiPerGiorno, permessi, onApriGiorno, onNuovoEvento }) {
  const oggi = new Date();

  const settimane = useMemo(
    () => buildMonthGrid(meseVisto.getFullYear(), meseVisto.getMonth()),
    [meseVisto]
  );

  return (
    <>
      <Row className="mb-3 align-items-center">
        <Col xs="auto">
          <Button variant="outline-warning" size="sm" onClick={() => onCambiaMese(-1)}>
            <i className="bi bi-chevron-left"></i>
          </Button>
        </Col>
        <Col className="text-center">
          <h4 className="mb-0 text-capitalize">{MESI[meseVisto.getMonth()]} {meseVisto.getFullYear()}</h4>
        </Col>
        <Col xs="auto">
          <Button variant="outline-warning" size="sm" onClick={() => onCambiaMese(1)}>
            <i className="bi bi-chevron-right"></i>
          </Button>
        </Col>
      </Row>

      <div className="calendar-grid">
        {GIORNI_SETTIMANA.map((g) => (
          <div key={g} className="calendar-weekday">{g}</div>
        ))}

        {settimane.flat().map((data, idx) => {
          const key = toDateKey(data);
          const eventiGiorno = eventiPerGiorno[key] || [];
          const fuoriMese = data.getMonth() !== meseVisto.getMonth();
          const isOggi = key === toDateKey(oggi);

          return (
            <div
              key={idx}
              className={`calendar-day ${fuoriMese ? 'calendar-day--muted' : ''} ${isOggi ? 'calendar-day--today' : ''}`}
              onClick={() => (eventiGiorno.length > 0 ? onApriGiorno(data) : permessi.puoGestireEventi ? onNuovoEvento(data) : null)}
              role="button"
            >
              <span className="calendar-day-number">{data.getDate()}</span>
              <div className="calendar-day-events">
                {eventiGiorno.slice(0, 2).map((ev) => {
                  const icone = iconeStato(ev, permessi);
                  return (
                    <span key={ev.id} className="calendar-event-pill" title={ev.nome}>
                      {ev.nome}
                      {icone.length > 0 && (
                        <span className="calendar-status-icons">{icone}</span>
                      )}
                    </span>
                  );
                })}
                {eventiGiorno.length > 2 && (
                  <span className="calendar-event-more">+{eventiGiorno.length - 2} altri</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default GrigliaMese;
