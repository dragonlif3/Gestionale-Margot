import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { API_URL } from '../config';
import { categoriaLabel, sottocategoriaLabel } from '../categorie';
import { formatDataOraIT } from '../dateUtils';

function Consumi() {
  const [pendenti, setPendenti] = useState(null);
  const [loadingPendenti, setLoadingPendenti] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [report, setReport] = useState(null); // null = nessun report ancora generato in questa sessione
  const [generatoIl, setGeneratoIl] = useState(null);
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

  useEffect(() => {
    fetchPendenti();
  }, []);

  const handleGeneraReport = async () => {
    if (!window.confirm(
      "Generi il report di quello che è stato consumato da quando l'hai chiesto l'ultima volta. " +
      'Una volta generato, questi movimenti vengono tolti dal log e non potrai più rivederli separatamente. Procedere?'
    )) return;

    setGenerando(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/consumi/report`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Errore nella generazione del report');
      const data = await response.json();
      setReport(data);
      setGeneratoIl(new Date());
      fetchPendenti();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  };

  const scaricaCsv = () => {
    if (!report || report.length === 0) return;
    const intestazione = ['Categoria', 'Sottocategoria', 'Nome', 'Quantità consumata', 'Unità', 'Movimenti', 'Dal', 'Al'];
    const righe = report.map((r) => [
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

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-3">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-graph-down-arrow"></i> Consumi
          </h2>
          <p className="text-muted mb-0">
            Ogni volta che si toglie quantità a un prodotto (mai quando si rifornisce), viene registrato qui.
            Genera il report quando vuoi: ti darà solo i movimenti da quando l'hai chiesto l'ultima volta, poi si azzera.
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
                {pendenti === 0 ? 'nessun movimento in attesa' : `moviment${pendenti === 1 ? 'o' : 'i'} in attesa dall'ultimo report`}
              </span>
            </>
          )}
        </div>
        <Button variant="warning" onClick={handleGeneraReport} disabled={generando || pendenti === 0}>
          {generando ? <Spinner animation="border" size="sm" className="me-2" /> : <i className="bi bi-clipboard-data me-1"></i>}
          Dammi i consumi
        </Button>
      </div>

      {report !== null && (
        <>
          <Row className="mb-2 align-items-center">
            <Col>
              <h5 className="mb-0">
                Report generato il {formatDataOraIT(generatoIl)}
              </h5>
            </Col>
            <Col xs="auto">
              <Button variant="outline-warning" size="sm" onClick={scaricaCsv} disabled={report.length === 0}>
                <i className="bi bi-filetype-csv me-1"></i> Scarica CSV
              </Button>
            </Col>
          </Row>

          {report.length === 0 ? (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              Nessun consumo registrato da quando l'hai chiesto l'ultima volta.
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
                {report.map((r) => (
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
    </Container>
  );
}

export { Consumi };
