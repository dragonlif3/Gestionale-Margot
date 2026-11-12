import { useState, useEffect, useMemo } from 'react';
import { Container, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import TileRiepilogo from './dashboard/TileRiepilogo';
import Pannello from './dashboard/Pannello';
import RigaEvento from './dashboard/RigaEvento';
import { caricaDashboard } from './dashboard/api';
import {
  prossimiEventi as calcolaProssimi, eventiCreatiDa, mieiEventiFuturi as calcolaMieiFuturi,
  eventiCheCercanoVolontari, graficaDaFare, graficaUrgente, pagamentiDaFare, totaleDaPagare, prodottiSottoScorta
} from './dashboard/dashboardUtils';
import { iscrivitiAEvento } from './calendario/api';
import { RUOLI_LABEL } from '../roles';
import { formatDataIT } from '../dateUtils';
import './dashboard/dashboard.css';

const VUOTO = { eventi: [], notificheGrafica: [], notifichePagamento: [], prodotti: [], consumiPendenti: 0, mieiEventi: [] };

// La home: cosa serve sapere subito, in base al ruolo. Il "regista" scarica i dati e li passa ai pezzi
// della cartella dashboard/; le regole su cosa mostrare stanno in dashboardUtils.js.
function Dashboard({ user }) {
  const ruolo = user?.ruolo;
  const isAmministrazione = ruolo === 'amministrazione';
  const isBar = ruolo === 'bar';
  const isEventi = ruolo === 'eventi';
  const isGrafica = ruolo === 'grafica';
  const isVolontari = ruolo === 'volontari';

  const [dati, setDati] = useState(VUOTO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iscrizioneInCorso, setIscrizioneInCorso] = useState(null);

  const fetchTutto = () =>
    caricaDashboard({ isGrafica, isAmministrazione, isBar, isVolontari }, (parte) => setDati((prec) => ({ ...prec, ...parte })));

  useEffect(() => {
    fetchTutto()
      .catch(() => setError('Errore nel caricamento della dashboard'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIscriviti = async (eventoId) => {
    setIscrizioneInCorso(eventoId);
    try {
      await iscrivitiAEvento(eventoId);
      await fetchTutto();
    } catch (err) {
      alert(err.message);
    } finally {
      setIscrizioneInCorso(null);
    }
  };

  const prossimi = useMemo(() => calcolaProssimi(dati.eventi), [dati.eventi]);
  const creatiDaMe = useMemo(() => (isEventi ? eventiCreatiDa(prossimi, user.username) : []), [prossimi, isEventi, user]);
  const graficaFare = useMemo(() => graficaDaFare(dati.notificheGrafica), [dati.notificheGrafica]);
  const graficaUrgenti = useMemo(() => graficaUrgente(graficaFare), [graficaFare]);
  const pagamentiFare = useMemo(() => pagamentiDaFare(dati.notifichePagamento), [dati.notifichePagamento]);
  const totalePagamenti = useMemo(() => totaleDaPagare(pagamentiFare), [pagamentiFare]);
  const sottoScorta = useMemo(() => prodottiSottoScorta(dati.prodotti), [dati.prodotti]);
  const mieiFuturi = useMemo(() => calcolaMieiFuturi(dati.mieiEventi), [dati.mieiEventi]);
  const cercanoVolontari = useMemo(() => (isVolontari ? eventiCheCercanoVolontari(prossimi) : []), [prossimi, isVolontari]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-2">Caricamento dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5 dash-pagina">
      <div className="dash-saluto">
        <small>Circolo Arci Margot{RUOLI_LABEL[ruolo] ? ` · ${RUOLI_LABEL[ruolo]}` : ''}</small>
        <h2 className="text-warning">
          <i className="bi bi-house-door me-2"></i>
          Ciao, {user?.username}
        </h2>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* ============ TESSERE RIEPILOGATIVE, in base al ruolo ============ */}
      <div className="dash-tiles">
        {(isAmministrazione || isGrafica) && (
          <TileRiepilogo
            to="/calendario" colore="verde" etichetta="Grafica da fare" numero={graficaFare.length}
            extra={graficaUrgenti.length > 0 && <span className="dash-urgenti">{graficaUrgenti.length} urgenti</span>}
          />
        )}
        {isAmministrazione && (
          <TileRiepilogo
            to="/calendario" colore="sole" etichetta="Pagamenti da fare" numero={pagamentiFare.length}
            extra={pagamentiFare.length > 0 && <span className="dash-extra">totale €{totalePagamenti.toFixed(2)}</span>}
          />
        )}
        {(isAmministrazione || isBar) && (
          <TileRiepilogo to="/ordini" colore="arancio" etichetta="Scorte sotto soglia" numero={sottoScorta.length} />
        )}
        {(isAmministrazione || isBar) && (
          <TileRiepilogo to="/consumi" colore="lilla" etichetta="Consumi in attesa" numero={dati.consumiPendenti} />
        )}
        <TileRiepilogo to="/calendario" colore="viola" etichetta="Prossimi eventi" numero={prossimi.length} />
      </div>

      <div className="dash-pannelli">
        {/* ============ EVENTI: i tuoi eventi creati ============ */}
        {isEventi && (
          <Pannello titolo="I tuoi prossimi eventi" vuoto="Nessun evento in programma." haRighe={creatiDaMe.length > 0} link={{ to: '/calendario', testo: 'Vai al calendario →' }}>
            {creatiDaMe.slice(0, 6).map((ev) => (
              <RigaEvento
                key={ev.id} nome={ev.nome} sottotitolo={formatDataIT(ev.data_evento)} data={ev.data_evento} tipo={ev.tipo}
                destra={
                  <>
                    {ev.grafica_stato && (
                      <Badge bg={ev.grafica_stato === 'completato' ? 'success' : 'warning'} text={ev.grafica_stato === 'completato' ? undefined : 'dark'}>
                        {ev.grafica_stato === 'completato' ? 'Grafica pronta' : 'Grafica in corso'}
                      </Badge>
                    )}
                    {ev.pagamento_stato && (
                      <Badge bg={ev.pagamento_stato === 'pagato' ? 'success' : 'danger'}>
                        {ev.pagamento_stato === 'pagato' ? 'Pagato' : 'Da pagare'}
                      </Badge>
                    )}
                  </>
                }
              />
            ))}
          </Pannello>
        )}

        {/* ============ GRAFICA: notifiche da lavorare ============ */}
        {isGrafica && (
          <Pannello titolo="Notifiche da lavorare" vuoto="Nessuna notifica in sospeso." haRighe={graficaFare.length > 0} link={{ to: '/calendario', testo: 'Vai alla bacheca →' }}>
            {graficaFare.slice(0, 6).map((n) => {
              const scaduta = new Date(n.scadenza) < new Date();
              return (
                <RigaEvento
                  key={n.id} nome={n.nome} sottotitolo={`${n.tipo} · evento il ${formatDataIT(n.data_evento)}`} data={n.data_evento} tipo={n.tipo}
                  destra={<Badge bg={scaduta ? 'danger' : 'warning'} text={scaduta ? undefined : 'dark'}>scadenza {formatDataIT(n.scadenza)}</Badge>}
                />
              );
            })}
          </Pannello>
        )}

        {/* ============ VOLONTARI: i tuoi eventi + eventi che cercano volontari ============ */}
        {isVolontari && (
          <>
            <Pannello titolo="I tuoi prossimi eventi" vuoto="Non sei iscritto a nessun evento in programma." haRighe={mieiFuturi.length > 0} link={{ to: '/miei-eventi', testo: 'Vedi tutti →' }}>
              {mieiFuturi.slice(0, 6).map((ev) => (
                <RigaEvento key={ev.id} nome={ev.nome} sottotitolo={formatDataIT(ev.data_evento)} data={ev.data_evento} tipo={ev.tipo} />
              ))}
            </Pannello>

            <Pannello titolo="Cercano ancora volontari" vuoto="Nessun evento con posti liberi al momento." haRighe={cercanoVolontari.length > 0}>
              {cercanoVolontari.slice(0, 6).map((ev) => (
                <RigaEvento
                  key={ev.id} nome={ev.nome} sottotitolo={`${formatDataIT(ev.data_evento)} · ${ev.iscritti_count}/${ev.max_volontari} volontari`} data={ev.data_evento} tipo={ev.tipo}
                  destra={
                    <Button size="sm" variant="outline-success" disabled={iscrizioneInCorso === ev.id} onClick={() => handleIscriviti(ev.id)}>
                      {iscrizioneInCorso === ev.id ? <Spinner animation="border" size="sm" /> : 'Iscriviti'}
                    </Button>
                  }
                />
              ))}
            </Pannello>
          </>
        )}

        {/* ============ TUTTI: prossimi eventi in generale ============ */}
        {!isEventi && !isGrafica && !isVolontari && (
          <div className={isAmministrazione || isBar ? 'dash-pannello--intero' : undefined}>
            <Pannello titolo="Prossimi eventi" vuoto="Nessun evento in programma." haRighe={prossimi.length > 0} link={{ to: '/calendario', testo: 'Vai al calendario →' }}>
              {prossimi.slice(0, 6).map((ev) => (
                <RigaEvento
                  key={ev.id} nome={ev.nome} sottotitolo={ev.tipo} data={ev.data_evento} tipo={ev.tipo}
                  destra={<span className="dash-riga-sotto">{formatDataIT(ev.data_evento)}</span>}
                />
              ))}
            </Pannello>
          </div>
        )}
      </div>
    </Container>
  );
}

export { Dashboard };
