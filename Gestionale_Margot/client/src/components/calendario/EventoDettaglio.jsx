import { Button, Badge } from 'react-bootstrap';

// Il dettaglio di UN evento dentro la finestra del giorno: dati, stato di grafica e
// pagamento, volontari iscritti e pulsanti (iscrizione, modifica, eliminazione).
//  - iscrittiEspansi: true se l'elenco degli iscritti è aperto
//  - iscritti: la lista già scaricata (undefined finché non è stata caricata)
function EventoDettaglio({
  ev,
  permessi,
  iscrittiEspansi,
  iscritti,
  onToggleIscritti,
  onIscriviti,
  onAnnullaIscrizione,
  onModifica,
  onElimina
}) {
  const { puoGestireEventi, puoVedereStatoGrafica, puoVedereStatoPagamento, isVolontario } = permessi;

  return (
    <div className="evento-dettaglio mb-3 pb-3 border-bottom">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <h5 className="mb-1">{ev.nome}</h5>
          <div className="text-muted small mb-1">{ev.tipo} · €{Number(ev.costo).toFixed(2)}</div>
          <div className="text-muted small mb-2">Creato da {ev.creato_da_username}</div>
          {(puoVedereStatoGrafica || puoVedereStatoPagamento) && (
            <div className="d-flex gap-2 flex-wrap mb-2">
              {puoVedereStatoGrafica && ev.grafica_stato && (
                <Badge bg={ev.grafica_stato === 'completato' ? 'success' : 'warning'} text={ev.grafica_stato === 'completato' ? undefined : 'dark'}>
                  <i className="bi bi-easel me-1"></i>
                  {ev.grafica_stato === 'completato' ? 'Grafica pronta' : 'Grafica in lavorazione'}
                </Badge>
              )}
              {puoVedereStatoPagamento && ev.pagamento_stato && (
                <Badge bg={ev.pagamento_stato === 'pagato' ? 'success' : 'danger'}>
                  <i className="bi bi-cash-coin me-1"></i>
                  {ev.pagamento_stato === 'pagato' ? 'Pagato' : 'Da pagare'}
                </Badge>
              )}
            </div>
          )}

          {ev.max_volontari > 0 && (
            <div className="mb-2">
              <Badge bg={ev.iscritti_count >= ev.max_volontari ? 'danger' : 'info'} text={ev.iscritti_count >= ev.max_volontari ? undefined : 'dark'}>
                <i className="bi bi-people me-1"></i>
                {ev.iscritti_count}/{ev.max_volontari} volontari
              </Badge>

              {isVolontario && (
                <div className="mt-2">
                  {ev.iscritto ? (
                    <Button size="sm" variant="outline-danger" onClick={() => onAnnullaIscrizione(ev.id)}>
                      <i className="bi bi-x-circle me-1"></i> Annulla iscrizione
                    </Button>
                  ) : ev.iscritti_count >= ev.max_volontari ? (
                    <Button size="sm" variant="secondary" disabled>Posti esauriti</Button>
                  ) : (
                    <Button size="sm" variant="outline-success" onClick={() => onIscriviti(ev.id)}>
                      <i className="bi bi-check-circle me-1"></i> Iscriviti
                    </Button>
                  )}
                </div>
              )}

              {puoGestireEventi && (
                <div className="mt-2">
                  <Button size="sm" variant="link" className="p-0" onClick={() => onToggleIscritti(ev.id)}>
                    {iscrittiEspansi ? 'Nascondi iscritti' : 'Vedi chi si è iscritto'}
                  </Button>
                  {iscrittiEspansi && (
                    <ul className="small mb-0 mt-1">
                      {(iscritti || []).length === 0 ? (
                        <li className="text-muted">Nessun iscritto ancora.</li>
                      ) : (
                        iscritti.map((iscritto) => (
                          <li key={iscritto.id}>{iscritto.username}</li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {puoGestireEventi && (
          <div className="text-nowrap">
            <Button size="sm" variant="outline-warning" className="me-2" onClick={() => onModifica(ev)}>
              <i className="bi bi-pencil"></i>
            </Button>
            <Button size="sm" variant="outline-danger" onClick={() => onElimina(ev.id)}>
              <i className="bi bi-trash3"></i>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventoDettaglio;
