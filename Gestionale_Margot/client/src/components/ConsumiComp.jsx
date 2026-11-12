import { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import CardPendenti from './consumi/CardPendenti';
import ReportCorrente from './consumi/ReportCorrente';
import StoricoReport from './consumi/StoricoReport';
import { caricaPendenti, caricaUltimoReport, generaReport, caricaStoricoReport } from './consumi/api';
import { creaCsvConsumi, nomeFileCsv } from './consumi/consumiUtils';
import './consumi/consumi.css';

// Il "regista" della pagina Consumi: tiene lo stato e decide cosa fare quando l'utente agisce.
// Come appare ogni parte è nei componenti della cartella consumi/.
function Consumi() {
  const [pendenti, setPendenti] = useState(null);
  const [loadingPendenti, setLoadingPendenti] = useState(true);
  const [generando, setGenerando] = useState(false);

  // Il report mostrato in pagina: può essere l'ultimo generato (caricato da solo
  // all'apertura, sopravvive a un refresh) oppure uno più vecchio scelto dall'elenco.
  const [reportVisualizzato, setReportVisualizzato] = useState(null); // { dati, generato_il, generato_da } | null
  const [caricamentoIniziale, setCaricamentoIniziale] = useState(true);

  const [storico, setStorico] = useState([]);
  const [loadingStorico, setLoadingStorico] = useState(false);
  const [mostraStorico, setMostraStorico] = useState(false);

  const [error, setError] = useState(null);

  const fetchPendenti = async () => {
    try {
      const data = await caricaPendenti();
      setPendenti(data.numero);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPendenti(false);
    }
  };

  const fetchUltimoReport = async () => {
    try {
      const data = await caricaUltimoReport();
      if (data) setReportVisualizzato(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCaricamentoIniziale(false);
    }
  };

  const fetchStorico = async () => {
    setLoadingStorico(true);
    try {
      setStorico(await caricaStoricoReport());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStorico(false);
    }
  };

  useEffect(() => {
    fetchPendenti();
    fetchUltimoReport();
  }, []);

  const handleGeneraReport = async () => {
    if (!window.confirm(
      "Generi il report di quello che è stato consumato da quando l'hai chiesto l'ultima volta. " +
      "Questi movimenti vengono tolti dal log dei consumi 'in attesa', ma il report resta salvato e consultabile anche più avanti. Procedere?"
    )) return;

    setGenerando(true);
    setError(null);
    try {
      const dati = await generaReport();
      setReportVisualizzato({ dati, generato_il: new Date().toISOString(), generato_da: null });
      fetchPendenti();
      if (mostraStorico) fetchStorico(); // il report appena rimpiazzato dall'ultimo entra nello storico
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  };

  const toggleStorico = () => {
    const apro = !mostraStorico;
    setMostraStorico(apro);
    if (apro && storico.length === 0) fetchStorico();
  };

  const scaricaCsv = () => {
    const dati = reportVisualizzato?.dati;
    if (!dati || dati.length === 0) return;

    const blob = new Blob(['\uFEFF' + creaCsvConsumi(dati)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeFileCsv(new Date());
    link.click();
    URL.revokeObjectURL(url);
  };

  if (caricamentoIniziale) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5 con-pagina">
      <Row className="mb-1">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-graph-down-arrow"></i> Consumi
          </h2>
          <p className="text-muted mb-0">
            Ogni volta che si toglie quantità a un prodotto (mai quando si rifornisce), viene registrato qui.
            Genera il report quando vuoi: resta salvato qui, anche ricaricando la pagina o tornandoci tra qualche giorno.
          </p>
        </Col>
      </Row>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      <CardPendenti pendenti={pendenti} caricamento={loadingPendenti} generando={generando} onGenera={handleGeneraReport} />

      {reportVisualizzato === null ? (
        <Alert variant="warning">
          <i className="bi bi-info-circle me-2"></i>
          Non hai ancora generato nessun report di consumi.
        </Alert>
      ) : (
        <ReportCorrente report={reportVisualizzato} onScaricaCsv={scaricaCsv} />
      )}

      <StoricoReport
        aperto={mostraStorico}
        onToggle={toggleStorico}
        caricamento={loadingStorico}
        report={storico}
        selezionatoId={reportVisualizzato?.id}
        onSeleziona={setReportVisualizzato}
      />
    </Container>
  );
}

export { Consumi };
