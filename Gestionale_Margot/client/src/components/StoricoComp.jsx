import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Form, ListGroup, Button, Spinner, Alert } from 'react-bootstrap';
import { API_URL } from '../config';
import { formatDataIT, formatDataOraIT } from '../dateUtils';
import { CATEGORIE, categoriaLabel } from '../categorie';
import { UNITA } from '../unita';

const PER_PAGINA = 50;

// ---------------------------------------------------------
// COME SI LEGGE UNA RIGA DELLO STORICO
// Il backend salva dati strutturati (azione, entità, dettagli);
// qui li trasformiamo in frasi leggibili. Cambiare le parole non
// richiede di toccare il database.
// ---------------------------------------------------------

const EURO = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

const ETICHETTE_CAMPI = {
  nome: 'nome',
  quantita: 'quantità',
  quantita_ottimale: 'quantità ottimale',
  prezzo: 'prezzo',
  categoria: 'categoria',
  sottocategoria: 'sottocategoria',
  unita: 'unità',
  tipo: 'tipo',
  costo: 'costo',
  data_evento: 'data',
  max_volontari: 'massimo volontari'
};

// Nelle modifiche viene salvata la chiave interna (es. "birra_bottiglia"):
// qui la ritrasformiamo nell'etichetta che l'utente vede nell'app.
const sottocategoriaDaChiave = (chiave) => {
  for (const categoria of Object.values(CATEGORIE)) {
    if (categoria.sottocategorie?.[chiave]) return categoria.sottocategorie[chiave];
  }
  return chiave;
};

const formattaValore = (campo, valore) => {
  if (valore === null || valore === undefined || valore === '') return '—';
  if (campo === 'prezzo' || campo === 'costo') return EURO.format(Number(valore));
  if (campo === 'data_evento') return formatDataIT(valore);
  if (campo === 'categoria') return categoriaLabel(valore);
  if (campo === 'sottocategoria') return sottocategoriaDaChiave(valore);
  if (campo === 'unita') return UNITA[valore] || valore;
  return String(valore);
};

const descriviCambi = (cambi) =>
  Object.entries(cambi || {})
    .map(([campo, { da, a }]) => `${ETICHETTE_CAMPI[campo] || campo} da ${formattaValore(campo, da)} a ${formattaValore(campo, a)}`)
    .join('; ');

// Restituisce la frase che segue il nome di chi ha fatto l'operazione
const descriviVoce = (voce) => {
  const nome = `“${voce.entita_nome ?? '?'}”`;
  const d = voce.dettagli || {};

  switch (`${voce.entita}:${voce.azione}`) {
    case 'prodotto:creato':
      return `ha aggiunto il prodotto ${nome} (quantità ${d.quantita ?? 0}, prezzo ${formattaValore('prezzo', d.prezzo)})`;
    case 'prodotto:modificato':
      return `ha modificato il prodotto ${nome}: ${descriviCambi(d.cambi)}`;
    case 'prodotto:quantita_modificata':
      return d.delta >= 0
        ? `ha aggiunto ${d.delta} × ${nome}`
        : `ha tolto ${Math.abs(d.delta)} × ${nome}`;
    case 'prodotto:eliminato':
      return `ha eliminato il prodotto ${nome}`;

    case 'evento:creato':
      return `ha creato l'evento ${nome} del ${formattaValore('data_evento', d.data_evento)}`;
    case 'evento:modificato':
      return `ha modificato l'evento ${nome}: ${descriviCambi(d.cambi)}`;
    case 'evento:eliminato':
      return `ha eliminato l'evento ${nome} del ${formattaValore('data_evento', d.data_evento)}`;
    case 'evento:pagamento_registrato':
      return `ha segnato come pagato l'evento ${nome} (${formattaValore('costo', d.costo)})`;
    case 'evento:grafica_completata':
      return `ha segnato come completata la grafica dell'evento ${nome}`;

    default:
      // Azione non ancora conosciuta da questa pagina: meglio mostrarla grezza che nasconderla
      return `${voce.azione} — ${voce.entita} ${nome}`;
  }
};

const ICONE_ENTITA = {
  prodotto: 'bi-box-seam',
  evento: 'bi-calendar-event'
};

// ---------------------------------------------------------
// LA PAGINA
// ---------------------------------------------------------

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
  const scaricaPagina = useCallback(async (primaDi) => {
    const parametri = new URLSearchParams({ limit: PER_PAGINA });
    if (primaDi) parametri.set('primaDi', primaDi);
    if (filtroUtente) parametri.set('utente', filtroUtente);
    if (filtroEntita) parametri.set('entita', filtroEntita);

    const risposta = await fetch(`${API_URL}/api/storico?${parametri}`, { credentials: 'include' });
    if (!risposta.ok) throw new Error('Impossibile caricare lo storico.');
    return risposta.json();
  }, [filtroUtente, filtroEntita]);

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
    fetch(`${API_URL}/api/storico/utenti`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setUtentiFiltro)
      .catch(() => setErroreUtenti(true));
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

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-3">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-clock-history"></i> Storico modifiche
          </h2>
          <p className="text-muted mb-0">
            Chi ha fatto cosa e quando: magazzino ed eventi. Le righe più recenti sono in alto; vengono conservate le ultime 8 settimane.
          </p>
        </Col>
      </Row>

      <div className="p-3 mb-3 bg-white shadow-sm rounded">
        <Row className="g-2">
          <Col xs={12} md={6}>
            <Form.Label className="small text-muted mb-1">Utente</Form.Label>
            <Form.Select value={filtroUtente} onChange={(e) => setFiltroUtente(e.target.value)}>
              <option value="">Tutti</option>
              {utentiFiltro.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </Form.Select>
            {erroreUtenti && <Form.Text className="text-danger">Elenco utenti non disponibile.</Form.Text>}
          </Col>
          <Col xs={12} md={6}>
            <Form.Label className="small text-muted mb-1">Cosa è stato modificato</Form.Label>
            <Form.Select value={filtroEntita} onChange={(e) => setFiltroEntita(e.target.value)}>
              <option value="">Tutto</option>
              <option value="prodotto">Prodotti</option>
              <option value="evento">Eventi</option>
            </Form.Select>
          </Col>
        </Row>
      </div>

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
          <ListGroup className="shadow-sm">
            {voci.map((voce) => (
              <ListGroup.Item key={voce.id} className="d-flex gap-3 align-items-start">
                <i className={`bi ${ICONE_ENTITA[voce.entita] || 'bi-dot'} fs-5 text-warning`}></i>
                <div className="flex-grow-1">
                  <div>
                    <strong>{voce.utente_username}</strong> {descriviVoce(voce)}
                  </div>
                  <div className="text-muted small">{formatDataOraIT(voce.creato_il)}</div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>

          {!finito && (
            <div className="text-center mt-3">
              <Button variant="outline-secondary" onClick={caricaAltre} disabled={caricandoAltre}>
                {caricandoAltre && <Spinner animation="border" size="sm" className="me-2" />}
                Mostra altre modifiche
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export { Storico };
