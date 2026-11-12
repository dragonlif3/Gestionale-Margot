import { useMemo } from 'react';
import { GIORNI_SETTIMANA, MESI, toDateKey, buildMonthGrid, coloreTipo } from './calendarioUtils';

// Icone compatte di stato da mostrare sulle pillole degli eventi (solo su computer)
function iconeStato(ev, permessi) {
  const icone = [];
  if (permessi.puoVedereStatoGrafica && ev.grafica_stato) {
    const pronta = ev.grafica_stato === 'completato';
    icone.push(
      <i key="grafica" className={`bi ${pronta ? 'bi-easel-fill' : 'bi-easel'} ms-1`} title={pronta ? 'Grafica pronta' : 'Grafica in lavorazione'}></i>
    );
  }
  if (permessi.puoVedereStatoPagamento && ev.pagamento_stato) {
    const pagato = ev.pagamento_stato === 'pagato';
    icone.push(
      <i key="pagamento" className={`bi ${pagato ? 'bi-coin' : 'bi-exclamation-circle'} ms-1`} title={pagato ? 'Pagato' : 'Da pagare'}></i>
    );
  }
  return icone;
}

// La griglia del mese. Ogni giorno è un pulsante: su telefono mostra dei puntini colorati
// (uno per evento, per tipo), su computer le pillole con i nomi degli eventi.
//  - meseVisto: una Date che punta al primo giorno del mese mostrato
//  - giornoSelezionato: la Date del giorno scelto (il suo contenuto sta nell'agenda accanto)
//  - onSelezionaGiorno(data): clic su un giorno, anche di un mese adiacente
function GrigliaMese({ meseVisto, onCambiaMese, eventiPerGiorno, giornoSelezionato, onSelezionaGiorno, permessi }) {
  const oggi = new Date();
  const chiaveOggi = toDateKey(oggi);
  const chiaveSelezionato = toDateKey(giornoSelezionato);

  const settimane = useMemo(
    () => buildMonthGrid(meseVisto.getFullYear(), meseVisto.getMonth()),
    [meseVisto]
  );

  return (
    <section aria-label="Calendario">
      <div className="cal-mese">
        <button type="button" className="cal-freccia" onClick={() => onCambiaMese(-1)} aria-label="Mese precedente">
          <i className="bi bi-chevron-left"></i>
        </button>
        <h3>{MESI[meseVisto.getMonth()]} {meseVisto.getFullYear()}</h3>
        <button type="button" className="cal-freccia" onClick={() => onCambiaMese(1)} aria-label="Mese successivo">
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>

      <div className="cal-griglia">
        {GIORNI_SETTIMANA.map((g) => (
          <div key={g} className="cal-wk">
            <span className="d-lg-none">{g[0]}</span>
            <span className="d-none d-lg-inline">{g}</span>
          </div>
        ))}

        {settimane.flat().map((data) => {
          const key = toDateKey(data);
          const eventiGiorno = eventiPerGiorno[key] || [];
          const fuoriMese = data.getMonth() !== meseVisto.getMonth();
          const selezionato = key === chiaveSelezionato;
          const etichetta = data.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

          return (
            <button
              type="button"
              key={key}
              className={`cal-day${fuoriMese ? ' cal-day--fuori' : ''}${key === chiaveOggi ? ' cal-day--oggi' : ''}${selezionato ? ' cal-day--sel' : ''}`}
              onClick={() => onSelezionaGiorno(data)}
              aria-pressed={selezionato}
              aria-label={eventiGiorno.length > 0 ? `${etichetta}, ${eventiGiorno.length} ${eventiGiorno.length === 1 ? 'evento' : 'eventi'}` : etichetta}
            >
              <span className="cal-day-num">{data.getDate()}</span>
              {eventiGiorno.length > 0 && (
                <span className="cal-dots" aria-hidden="true">
                  {eventiGiorno.slice(0, 3).map((ev) => (
                    <i key={ev.id} className={`cal-dot cal-tipo--${coloreTipo(ev.tipo)}`}></i>
                  ))}
                </span>
              )}
              <span className="cal-pills" aria-hidden="true">
                {eventiGiorno.slice(0, 2).map((ev) => (
                  <span key={ev.id} className={`cal-pill cal-tipo--${coloreTipo(ev.tipo)}`} title={ev.nome}>
                    {ev.nome}
                    {iconeStato(ev, permessi)}
                  </span>
                ))}
                {eventiGiorno.length > 2 && <span className="cal-more">+{eventiGiorno.length - 2} altri</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default GrigliaMese;
