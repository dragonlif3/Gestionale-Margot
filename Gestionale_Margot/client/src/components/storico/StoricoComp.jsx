import { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import FiltriStorico from './storico/FiltriStorico';
import VoceStorico from './storico/VoceStorico';
import { caricaPagina, caricaUtenti } from './storico/api';
import { PER_PAGINA, raggruppaPerGiorno } from './storico/storicoUtils';
import './storico/storico.css';

// Il "regista" dello storico: scarica le righe a pagine, tiene i filtri e le mostra raggruppate per giorno.
// Come appare ogni parte è nei componenti della cartella storico/.
function Storico() {
  const [voci, setVoci] = useState([]);
  const [utentiFiltro, setUtentiFiltro] = useState([]);
  const [filtroUtente, setFiltroUtente] = useState('');
  const [filtroEntita, setFiltroEntita] = useState('');

  const [caricamento, setCaricamento] = useState(true);
  const [caricandoAltre, setCaricandoAltre] = useState(false);
  const [finito, setFinito] = useState(false);
  const [errore, setErrore] = useState(null);
  const [erroreUtenti, setErroreUtenti] = useState(false);

  // Scarica una pagina di righe; "primaDi" è l'id dell'ultima riga già mostrata
  const scaricaPagina = useCallback(
    (primaDi) => caricaPagina({ primaDi, utente: filtroUtente, entita: filtroEntita }),
    [filtroUtente, filtroEntita]
  );

  // Ogni volta che cambia un filtro si riparte dall'inizio
  useEffect(() => {
    let annullato = false;
    setCaricamento(true);
    setErrore(null);

    scaricaPagina(null)
      .then((righe) => {
        if (annullato) return;
        setVoci(righe);
        setFinito(righe.length < PER_PAGINA);
      })
      .catch((err) => {
        if (!annullato) setErrore(err.message);
      })
      .finally(() => {
        if (!annullato) setCaricamento(false);
      });

    // Se i filtri cambiano mentre sta ancora scaricando, ignora la risposta vecchia
    return () => {
      annullato = true;
    };
  }, [scaricaPagina]);

  // Elenco utenti per il filtro (una volta sola)
  useEffect(() => {
    caricaUtenti().then(setUtentiFiltro).catch(() => setErroreUtenti(true));
  }, []);

  const caricaAltre = async () => {
    if (voci.length === 0) return;
    setCaricandoAltre(true);
    setErrore(null);
    try {
      const righe = await scaricaPagina(voci[voci.length - 1].id);
      setVoci((precedenti) => [...precedenti, ...righe]);
      setFinito(righe.length < PER_PAGINA);
    } catch (err) {
      setErrore(err.message);
    } finally {
      setCaricandoAltre(false);
    }
  };

  const gruppi = useMemo(() => raggruppaPerGiorno(voci), [voci]);

  return (
    <Container className="mt-4 mb-5 sto-pagina">
      <Row>
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-clock-history"></i> Storico modifiche
          </h2>
          <p className="text-muted mb-0">
            Chi ha fatto cosa e quando: magazzino ed eventi. Le righe più recenti sono in alto; vengono conservate le ultime 8 settimane.
          </p>
        </Col>
      </Row>

      <FiltriStorico
        utenti={utentiFiltro}
        erroreUtenti={erroreUtenti}
        filtroUtente={filtroUtente}
        onUtente={setFiltroUtente}
        filtroEntita={filtroEntita}
        onEntita={setFiltroEntita}
      />

      {errore && <Alert variant="danger">{errore}</Alert>}

      {caricamento ? (
        <div className="text-center mt-5">
          <Spinner animation="border" variant="warning" />
        </div>
      ) : voci.length === 0 ? (
        <Alert variant="warning">
          <i className="bi bi-info-circle me-2"></i>
          {filtroUtente || filtroEntita
            ? 'Nessuna modifica corrisponde ai filtri scelti.'
            : 'Non c’è ancora nessuna modifica registrata. Compariranno qui da adesso in poi.'}
        </Alert>
      ) : (
        <>
          {gruppi.map((gruppo) => (
            <section key={gruppo.chiave}>
              <h3 className="sto-giorno">{gruppo.etichetta}</h3>
              <ul className="sto-lista">
                {gruppo.voci.map((voce) => (
                  <VoceStorico key={voce.id} voce={voce} />
                ))}
              </ul>
            </section>
          ))}

          {!finito && (
            <Button variant="outline-secondary" className="sto-altre" onClick={caricaAltre} disabled={caricandoAltre}>
              {caricandoAltre && <Spinner animation="border" size="sm" className="me-2" />}
              Mostra altre modifiche
            </Button>
          )}
        </>
      )}
    </Container>
  );
}

export { Storico };
