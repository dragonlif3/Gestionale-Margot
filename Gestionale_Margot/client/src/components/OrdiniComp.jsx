import React, { useState, useEffect, useMemo } from 'react';
import { Container, Table, Button, Row, Col, Alert, Spinner, Form } from 'react-bootstrap';
import { API_URL } from '../config';
import { CATEGORIE, categoriaLabel, sottocategoriaLabel } from '../categorie';
import { unitaConteggio } from '../unita';
import { formatDataIT } from '../dateUtils';

function CosaOrdinare() {
  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // id prodotto -> quantità da ordinare, modificabile dall'utente.
  // Parte dal "mancante" calcolato, ma si può correggere a mano
  // (es. per arrotondare a un multiplo della confezione del fornitore).
  const [quantitaOrdine, setQuantitaOrdine] = useState({});

  useEffect(() => {
    fetch(`${API_URL}/api/prodotti`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Errore nel caricamento del magazzino');
        return res.json();
      })
      .then((data) => {
        setProdotti(data);
        const iniziale = {};
        data
          .filter((p) => p.quantita_ottimale > 0 && p.quantita < p.quantita_ottimale)
          .forEach((p) => {
            iniziale[p.id] = p.quantita_ottimale - p.quantita;
          });
        setQuantitaOrdine(iniziale);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Solo i prodotti con una quantità ottimale impostata e sotto quella soglia,
  // raggruppati per categoria -> sottocategoria come nel Magazzino.
  const mancanti = useMemo(() => {
    const lista = prodotti.filter((p) => p.quantita_ottimale > 0 && p.quantita < p.quantita_ottimale);

    const gruppi = {};
    lista.forEach((p) => {
      const catKey = p.categoria || 'senza_categoria';
      if (!gruppi[catKey]) gruppi[catKey] = {};
      const sottoKey = p.sottocategoria || 'senza_sottocategoria';
      if (!gruppi[catKey][sottoKey]) gruppi[catKey][sottoKey] = [];
      gruppi[catKey][sottoKey].push(p);
    });
    return gruppi;
  }, [prodotti]);

  const listaPiatta = useMemo(() => {
    const risultato = [];
    Object.entries(mancanti).forEach(([, sottocategorie]) => {
      Object.entries(sottocategorie).forEach(([, items]) => {
        items.forEach((p) => risultato.push(p));
      });
    });
    return risultato;
  }, [mancanti]);

  const handleQuantitaChange = (id, valore) => {
    const numero = parseInt(valore, 10);
    setQuantitaOrdine((prev) => ({ ...prev, [id]: isNaN(numero) || numero < 0 ? 0 : numero }));
  };

  const quantitaPer = (p) => quantitaOrdine[p.id] ?? (p.quantita_ottimale - p.quantita);
  const totalePer = (p) => quantitaPer(p) * Number(p.prezzo);

  const totaleCategoria = (items) => items.reduce((somma, p) => somma + totalePer(p), 0);
  const totaleGenerale = useMemo(() => listaPiatta.reduce((somma, p) => somma + totalePer(p), 0), [listaPiatta, quantitaOrdine]);

  const scaricaCsv = () => {
    const intestazione = ['Categoria', 'Sottocategoria', 'Nome', 'Quantità attuale', 'Quantità ottimale', 'Da ordinare', 'Unità', 'Prezzo unitario', 'Totale'];
    const righe = listaPiatta.map((p) => [
      categoriaLabel(p.categoria),
      p.categoria ? sottocategoriaLabel(p.categoria, p.sottocategoria) : '—',
      p.nome,
      p.quantita,
      p.quantita_ottimale,
      quantitaPer(p),
      unitaConteggio(p),
      Number(p.prezzo).toFixed(2),
      totalePer(p).toFixed(2)
    ]);
    righe.push(['', '', '', '', '', '', '', 'TOTALE', totaleGenerale.toFixed(2)]);

    const csv = [intestazione, ...righe]
      .map((riga) => riga.map((cella) => `"${String(cella).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ordini_margot_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stampaPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-2">Calcolo scorte in corso...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-3 align-items-center d-print-none">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-cart-check"></i> Cosa Ordinare
          </h2>
          <p className="text-muted mb-0">Prodotti sotto la quantità ottimale impostata in Magazzino. Puoi correggere le quantità prima di esportare.</p>
        </Col>
        <Col xs="auto">
          <Button variant="outline-warning" className="me-2" onClick={scaricaCsv} disabled={listaPiatta.length === 0}>
            <i className="bi bi-filetype-csv me-1"></i> Scarica CSV
          </Button>
          <Button variant="warning" onClick={stampaPdf} disabled={listaPiatta.length === 0}>
            <i className="bi bi-printer me-1"></i> Stampa / Salva PDF
          </Button>
        </Col>
      </Row>

      <h1 className="d-none d-print-block text-center mb-1">Ordine Margot — {formatDataIT(new Date())}</h1>
      {listaPiatta.length > 0 && (
        <p className="d-none d-print-block text-center mb-4">Totale complessivo: €{totaleGenerale.toFixed(2)}</p>
      )}

      {listaPiatta.length === 0 ? (
        <Alert variant="success" className="d-print-none">
          <i className="bi bi-check-circle me-2"></i>
          Tutto in ordine: nessun prodotto è sotto la quantità ottimale al momento.
        </Alert>
      ) : (
        <>
          {Object.entries(mancanti).map(([catKey, sottocategorie]) => {
            const itemsCategoria = Object.values(sottocategorie).flat();
            return (
              <div key={catKey} className="mb-4 ordine-categoria">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h4 className="text-wine mb-0">{catKey === 'senza_categoria' ? 'Da categorizzare' : CATEGORIE[catKey]?.label}</h4>
                  <span className="text-muted small">Subtotale: <strong>€{totaleCategoria(itemsCategoria).toFixed(2)}</strong></span>
                </div>
                <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Sottocategoria</th>
                      <th>Nome</th>
                      <th className="text-center">Attuale</th>
                      <th className="text-center">Ottimale</th>
                      <th className="text-center">Da ordinare</th>
                      <th className="text-end">Prezzo unit.</th>
                      <th className="text-end">Totale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sottocategorie).map(([sottoKey, items]) =>
                      items.map((p, idx) => (
                        <tr key={p.id}>
                          {idx === 0 ? (
                            <td rowSpan={items.length} className="align-middle fw-bold">
                              {catKey !== 'senza_categoria' && sottoKey !== 'senza_sottocategoria'
                                ? sottocategoriaLabel(catKey, sottoKey)
                                : '—'}
                            </td>
                          ) : null}
                          <td>{p.nome}</td>
                          <td className="text-center">{p.quantita} {unitaConteggio(p)}</td>
                          <td className="text-center">{p.quantita_ottimale} {unitaConteggio(p)}</td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              <Form.Control
                                type="number"
                                min="0"
                                size="sm"
                                className="text-center ordine-input-quantita d-print-none"
                                value={quantitaPer(p)}
                                onChange={(e) => handleQuantitaChange(p.id, e.target.value)}
                              />
                              <span className="d-none d-print-inline">{quantitaPer(p)}</span>
                              <span className="text-muted small">{unitaConteggio(p)}</span>
                            </div>
                          </td>
                          <td className="text-end">€{Number(p.prezzo).toFixed(2)}</td>
                          <td className="text-end fw-bold">€{totalePer(p).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            );
          })}

          <Row className="d-print-none">
            <Col className="text-end">
              <h5>Totale complessivo: <span className="text-wine">€{totaleGenerale.toFixed(2)}</span></h5>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export { CosaOrdinare };
