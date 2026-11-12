import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import SezioneCategoria from './ordini/SezioneCategoria';
import TabellaStampa from './ordini/TabellaStampa';
import { raggruppaMancanti, appiattisci, quantitaIniziali, leggiQuantita, creaCsv, nomeFileCsv } from './ordini/ordiniUtils';
import { caricaProdotti } from './magazzino/api';
import { formatDataIT } from '../dateUtils';
import './ordini/ordini.css';

// Il "regista" della pagina: tiene le quantità da ordinare e calcola i totali.
// Come appare ogni parte è nei componenti della cartella ordini/.
function CosaOrdinare() {
  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // id prodotto -> quantità da ordinare, modificabile dall'utente.
  // Parte dal "mancante" calcolato, ma si può correggere a mano
  // (es. per arrotondare a un multiplo della confezione del fornitore).
  const [quantitaOrdine, setQuantitaOrdine] = useState({});

  useEffect(() => {
    caricaProdotti()
      .then((data) => {
        setProdotti(data);
        setQuantitaOrdine(quantitaIniziali(data));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Solo i prodotti con una quantità ottimale impostata e sotto quella soglia,
  // raggruppati per categoria -> sottocategoria come nel Magazzino.
  const mancanti = useMemo(() => raggruppaMancanti(prodotti), [prodotti]);
  const listaPiatta = useMemo(() => appiattisci(mancanti), [mancanti]);

  const handleQuantitaChange = (id, valore) => {
    setQuantitaOrdine((prev) => ({ ...prev, [id]: leggiQuantita(valore) }));
  };

  const quantitaPer = (p) => quantitaOrdine[p.id] ?? (p.quantita_ottimale - p.quantita);
  const totalePer = (p) => quantitaPer(p) * Number(p.prezzo);
  const totaleCategoria = (items) => items.reduce((somma, p) => somma + totalePer(p), 0);
  const totaleGenerale = useMemo(
    () => listaPiatta.reduce((somma, p) => somma + totalePer(p), 0),
    [listaPiatta, quantitaOrdine]
  );

  const scaricaCsv = () => {
    const csv = creaCsv(listaPiatta, quantitaPer, totalePer, totaleGenerale);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeFileCsv(new Date());
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

  const nProdotti = listaPiatta.length;

  return (
    <Container className="mt-4 mb-5 ord-pagina">
      {/* ---- Schermo ---- */}
      <Row className="mb-1 align-items-center d-print-none">
        <Col xs={12} lg>
          <h2 className="text-warning">
            <i className="bi bi-cart-check"></i> Cosa Ordinare
          </h2>
          <p className="text-muted mb-0">Prodotti sotto la quantità ottimale impostata in Magazzino. Puoi correggere le quantità prima di esportare.</p>
        </Col>
        <Col xs={12} lg="auto">
          <div className="ord-azioni">
            <Button variant="outline-warning" onClick={scaricaCsv} disabled={nProdotti === 0}>
              <i className="bi bi-filetype-csv"></i> Scarica CSV
            </Button>
            <Button variant="warning" onClick={stampaPdf} disabled={nProdotti === 0}>
              <i className="bi bi-printer"></i> Stampa / Salva PDF
            </Button>
          </div>
        </Col>
      </Row>

      {nProdotti === 0 ? (
        <Alert variant="success" className="d-print-none mt-3">
          <i className="bi bi-check-circle me-2"></i>
          Tutto in ordine: nessun prodotto è sotto la quantità ottimale al momento.
        </Alert>
      ) : (
        <div className="d-print-none">
          <div className="ord-riepilogo">
            <div>
              <small>Totale complessivo</small>
              <div className="ord-riepilogo-totale">€{totaleGenerale.toFixed(2)}</div>
            </div>
            <div className="ord-riepilogo-n">{nProdotti} {nProdotti === 1 ? 'prodotto' : 'prodotti'} da ordinare</div>
          </div>

          {Object.entries(mancanti).map(([catKey, sottocategorie]) => (
            <SezioneCategoria
              key={catKey}
              catKey={catKey}
              sottocategorie={sottocategorie}
              subtotale={totaleCategoria(Object.values(sottocategorie).flat())}
              quantitaPer={quantitaPer}
              onCambia={handleQuantitaChange}
            />
          ))}
        </div>
      )}

      {/* ---- Carta: visibile solo in stampa / PDF ---- */}
      <div className="d-none d-print-block">
        <h1 className="text-center mb-1">Ordine Margot — {formatDataIT(new Date())}</h1>
        {nProdotti > 0 && (
          <>
            <p className="text-center mb-4">Totale complessivo: €{totaleGenerale.toFixed(2)}</p>
            <TabellaStampa gruppi={mancanti} quantitaPer={quantitaPer} totalePer={totalePer} />
          </>
        )}
      </div>
    </Container>
  );
}

export { CosaOrdinare };
