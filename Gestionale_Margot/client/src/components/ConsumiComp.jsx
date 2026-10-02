import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Alert, Spinner, Badge, ListGroup } from 'react-bootstrap';
import { API_URL } from '../config';
import { categoriaLabel, sottocategoriaLabel } from '../categorie';
import { formatDataOraIT } from '../dateUtils';

function Consumi() {
  const [pendenti, setPendenti] = useState(null);
  const [loadingPendenti, setLoadingPendenti] = useState(true);
  const [generando, setGenerando] = useState(false);

  // Il report mostrato nella tabella principale: può essere l'ultimo
  // generato (caricato da solo all'apertura della pagina, sopravvive
  // a un refresh) oppure uno più vecchio scelto dallo storico qui sotto.
  const [reportVisualizzato, setReportVisualizzato] = useState(null); // { dati, generato_il, generato_da } | null
  const [caricamentoIniziale, setCaricamentoIniziale] = useState(true);

  const [storico, setStorico] = useState([]);
  const [loadingStorico, setLoadingStorico] = useState(false);
  const [mostraStorico, setMostraStorico] = useState(false);

  const [error, setError] = useState(null);

  const fetchPendenti = async () => {
    try {
      const response = await fetch(`${API_URL}/api/consumi/pendenti`, { credentials: 'include' });
      if (!response.ok) throw new Error('Errore nel controllo dei consumi in attesa');
      const data = await response.json();
      setPendenti(data.numero);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPendenti(false);
    }
  };

  const fetchUltimoReport = async () => {
    try {
      const response = await fetch(`${API_URL}/api/consumi/report/ultimo`, { credentials: 'include' });
      if (!response.ok) throw new Error("Errore nel caricamento dell'ultimo report");
      const data = await response.json();
      if (data) setReportVisualizzato(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCaricamentoIniziale(false);
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
      const response = await fetch(`${API_URL}/api/consumi/report`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Errore nella generazione del report');
      const dati = await response.json();
      setReportVisualizzato({ dati, generato_il: new Date().toISOString(), generato_da: null });
      fetchPendenti();
      if (mostraStorico) fetchStorico(); // il report appena rimpiazzato dall'ultimo entra nello storico
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  };

  const fetchStorico = async () => {
    setLoadingStorico(true);
    try {
      const response = await fetch(`${API_URL}/api/consumi/report/storico`, { credentials: 'include' });
      if (!response.ok) throw new Error('Errore nel caricamento dello storico');
      const data = await response.json();
      setStorico(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStorico(false);
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
    const intestazione = ['Categoria', 'Sottocategoria', 'Nome', 'Quantità consumata', 'Unità', 'Movimenti', 'Dal', 'Al'];
    const righe = dati.map((r) => [
      categoriaLabel(r.categoria),
      r.categoria ? sottocategoriaLabel(r.categoria, r.sottocategoria) : '—',
      r.nome,
      r.quantita_totale,
      r.unita_label,
      r.movimenti,
      formatDataOraIT(r.dal),
      formatDataOraIT(r.al)
    ]);
    const csv = [intestazione, ...righe]
      .map((riga) => riga.map((cella) => `"${String(cella).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consumi_margot_${new Date().toISOString().slice(0, 10)}.csv`;
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
    <Container className="mt-4 mb-5">
      <Row className="mb-3">
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

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="p-4 mb-4 bg-white shadow-sm rounded d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          {loadingPendenti ? (
            <Spinner animation="border" size="sm" variant="warning" />
          ) : (
            <>
              <Badge bg={pendenti > 0 ? 'warning' : 'secondary'} text={pendenti > 0 ? 'dark' : undefined} className="fs-6 me-2">
                {pendenti}
              </Badge>
              <span className="text-muted">
                {pendenti === 0 ? 'nessun movimento in attesa' : `movimento${pendenti === 1 ? '' : 'i'} in attesa dall'ultimo report`}
              </span>
            </>
          )}
        </div>
        <Button variant="warning" onClick={handleGeneraReport} disabled={generando || pendenti === 0}>
          {generando ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-clipboard-data me-1"></i>}
          Dammi i consumi
        </Button>
      </div>

      {reportVisualizzato === null ? (
        <Alert variant="warning">
          <i className="bi bi-info-circle me-2"></i>
          Non hai ancora generato nessun report di consumi.
        </Alert>
      ) : (
        <>
          <Row className="mb-2 align-items-center">
            <Col>
              <h5 className="mb-0">
                Report del {formatDataOraIT(reportVisualizzato.generato_il)}
                {reportVisualizzato.generato_da && (
                  <span className="text-muted fw-normal"> — generato da {reportVisualizzato.generato_da}</span>
                )}
              </h5>
            </Col>
            <Col xs="auto">
              <Button variant="outline-warning" size="sm" onClick={scaricaCsv} disabled={reportVisualizzato.dati.length === 0}>
                <i className="bi bi-filetype-csv me-1"></i> Scarica CSV
              </Button>
            </Col>
          </Row>

          {reportVisualizzato.dati.length === 0 ? (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              Nessun consumo registrato in questo report.
            </Alert>
          ) : (
            <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Categoria</th>
                  <th>Sottocategoria</th>
                  <th>Nome</th>
                  <th className="text-center">Consumato</th>
                  <th className="text-center">Movimenti</th>
                  <th>Dal</th>
                  <th>Al</th>
                </tr>
              </thead>
              <tbody>
                {reportVisualizzato.dati.map((r) => (
                  <tr key={r.prodotto_id ?? r.nome}>
                    <td>{categoriaLabel(r.categoria)}</td>
                    <td>{r.categoria ? sottocategoriaLabel(r.categoria, r.sottocategoria) : '—'}</td>
                    <td className="fw-bold">{r.nome}</td>
                    <td className="text-center">
                      <Badge bg="danger">{r.quantita_totale} {r.unita_label}</Badge>
                    </td>
                    <td className="text-center">{r.movimenti}</td>
                    <td>{formatDataOraIT(r.dal)}</td>
                    <td>{formatDataOraIT(r.al)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}

      <div className="mt-4">
        <Button variant="link" className="p-0" onClick={toggleStorico}>
          <i className={`bi bi-chevron-${mostraStorico ? 'down' : 'right'} me-1`}></i>
          Report precedenti
        </Button>

        {mostraStorico && (
          <div className="mt-2">
            {loadingStorico ? (
              <Spinner animation="border" size="sm" variant="warning" />
            ) : storico.length === 0 ? (
              <p className="text-muted small mb-0">Nessun report precedente.</p>
            ) : (
              <ListGroup>
                {storico.map((r) => (
                  <ListGroup.Item
                    key={r.id}
                    action
                    onClick={() => setReportVisualizzato(r)}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>
                      {formatDataOraIT(r.generato_il)}
                      {r.generato_da && <span className="text-muted"> — {r.generato_da}</span>}
                    </span>
                    <Badge bg="secondary">{r.dati.length} prodott{r.dati.length === 1 ? 'o' : 'i'}</Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

export { Consumi };
