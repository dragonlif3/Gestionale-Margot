import React, { useState, useEffect, useMemo } from 'react';
import { Container, Table, Button, Row, Col, Alert, Spinner, Badge, Modal, Form, InputGroup, Nav } from 'react-bootstrap';
import { API_URL } from '../config';
import { CATEGORIE, categoriaLabel, sottocategoriaLabel } from '../categorie';
import { UNITA_SINGOLE, UNITA_MULTIPLE, isUnitaMultipla, unitaConteggio } from '../unita';

function Magazzino({ user }) {
  const [prodotti, setProdotti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('tutto');

  const [showFormModal, setShowFormModal] = useState(false);
  const [prodottoInModifica, setProdottoInModifica] = useState(null); // null = nuovo prodotto
  const [categoriaForm, setCategoriaForm] = useState('');
  const [unitaForm, setUnitaForm] = useState('bottiglia');

  const [showRifornisci, setShowRifornisci] = useState(null); // prodotto selezionato, o null

  // Amministrazione e Bar possono gestire il magazzino
  const puoGestireMagazzino = user?.ruolo === 'amministrazione' || user?.ruolo === 'bar';

  const fetchProdotti = async () => {
    try {
      const response = await fetch(`${API_URL}/api/prodotti`, { credentials: 'include' });
      if (!response.ok) throw new Error('Errore nel caricamento del magazzino');
      const data = await response.json();
      setProdotti(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdotti();
  }, []);

  const handleAggiornaQuantita = async (id, nuovaQuantita) => {
    if (nuovaQuantita < 0) return;
    try {
      const response = await fetch(`${API_URL}/api/prodotti/${id}/quantita`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantita: nuovaQuantita })
      });
      if (!response.ok) throw new Error("Errore durante l'aggiornamento");
      fetchProdotti();
    } catch (err) {
      alert(err.message);
    }
  };

  const apriNuovoProdotto = () => {
    setProdottoInModifica(null);
    setCategoriaForm('');
    setUnitaForm('bottiglia');
    setShowFormModal(true);
  };

  const apriModificaProdotto = (prodotto) => {
    setProdottoInModifica(prodotto);
    setCategoriaForm(prodotto.categoria || '');
    setUnitaForm(prodotto.unita || 'bottiglia');
    setShowFormModal(true);
  };

  const handleSalvaProdotto = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const unita = formData.get('unita');
    const multipla = isUnitaMultipla(unita);

    let quantita;
    if (!prodottoInModifica) {
      // Nuovo prodotto: se l'unità è multipla, converto subito confezioni -> unità reali
      if (multipla) {
        const numConfezioni = parseInt(formData.get('num_confezioni'), 10) || 0;
        const molteplicita = parseInt(formData.get('molteplicita'), 10) || 0;
        quantita = numConfezioni * molteplicita;
      } else {
        quantita = parseInt(formData.get('quantita'), 10) || 0;
      }
    } else {
      // Modifica: la quantità è sempre in unità reali, editabile direttamente
      quantita = parseInt(formData.get('quantita'), 10) || 0;
    }

    const payload = {
      nome: formData.get('nome'),
      categoria: formData.get('categoria') || null,
      sottocategoria: formData.get('sottocategoria') || null,
      prezzo: parseFloat(formData.get('prezzo')),
      quantita_ottimale: parseInt(formData.get('quantita_ottimale'), 10) || 0,
      unita,
      molteplicita: multipla ? parseInt(formData.get('molteplicita'), 10) || null : null,
      unita_contenuto: multipla ? formData.get('unita_contenuto') : null,
      quantita
    };

    const isModifica = Boolean(prodottoInModifica?.id);
    const url = isModifica ? `${API_URL}/api/prodotti/${prodottoInModifica.id}` : `${API_URL}/api/prodotti`;
    const method = isModifica ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Errore durante il salvataggio');
      }

      // Se è un prodotto nuovo (non in modifica), la quantità va impostata
      // con una seconda chiamata perché la creazione non la accetta oltre
      // al valore iniziale già passato nel payload — nessuna azione ulteriore
      // necessaria: il backend la salva già in fase di creazione.
      setShowFormModal(false);
      setProdottoInModifica(null);
      fetchProdotti();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProdotto = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare definitivamente questo prodotto?')) return;

    try {
      const response = await fetch(`${API_URL}/api/prodotti/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error("Errore durante l'eliminazione");
      fetchProdotti();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRifornisci = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const prodotto = showRifornisci;
    const multipla = isUnitaMultipla(prodotto.unita);

    let daAggiungere;
    if (multipla) {
      const numConfezioni = parseInt(formData.get('num_confezioni'), 10) || 0;
      daAggiungere = numConfezioni * (prodotto.molteplicita || 1);
    } else {
      daAggiungere = parseInt(formData.get('quantita_da_aggiungere'), 10) || 0;
    }

    await handleAggiornaQuantita(prodotto.id, prodotto.quantita + daAggiungere);
    setShowRifornisci(null);
  };

  // Prodotti filtrati per tab (categoria) e barra di ricerca
  const prodottiFiltrati = useMemo(() => {
    let lista = prodotti;
    if (tab === 'senza_categoria') {
      lista = lista.filter((p) => !p.categoria);
    } else if (tab !== 'tutto') {
      lista = lista.filter((p) => p.categoria === tab);
    }
    if (searchQuery) {
      lista = lista.filter((p) => p.nome.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return lista;
  }, [prodotti, tab, searchQuery]);

  const ciSonoNonCategorizzati = prodotti.some((p) => !p.categoria);

  // Percentuale rispetto alla quantità ottimale, per colorare il badge
  const badgeQuantita = (prodotto) => {
    const { quantita, quantita_ottimale } = prodotto;
    let variante = 'secondary';
    let extraClass = '';
    if (quantita_ottimale > 0) {
      const percentuale = quantita / quantita_ottimale;
      if (percentuale <= 0.25) {
        variante = 'danger';
      } else if (percentuale <= 0.5) {
        extraClass = 'qty-badge--warning';
      }
    }
    return (
      <>
        <Badge bg={variante} className={extraClass}>
          {quantita} {unitaConteggio(prodotto)}
        </Badge>
        {quantita_ottimale > 0 && quantita < quantita_ottimale && (
          <div className="text-muted small mt-1">mancano {quantita_ottimale - quantita}</div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="warning" />
        <p className="mt-2">Caricamento magazzino in corso...</p>
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
    <Container className="mt-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-box-seam"></i> Magazzino
          </h2>
        </Col>
        <Col xs="auto">
          {puoGestireMagazzino && (
            <Button variant="success" onClick={apriNuovoProdotto}>
              <i className="bi bi-plus-circle me-1"></i> Aggiungi Prodotto
            </Button>
          )}
        </Col>
      </Row>

      <Nav variant="tabs" activeKey={tab} onSelect={(k) => setTab(k)} className="mb-3 flex-wrap">
        <Nav.Item><Nav.Link eventKey="tutto">Tutto</Nav.Link></Nav.Item>
        {Object.entries(CATEGORIE).map(([key, cat]) => (
          <Nav.Item key={key}><Nav.Link eventKey={key}>{cat.label}</Nav.Link></Nav.Item>
        ))}
        {ciSonoNonCategorizzati && (
          <Nav.Item><Nav.Link eventKey="senza_categoria">Da categorizzare</Nav.Link></Nav.Item>
        )}
      </Nav>

      <Row className="mb-3">
        <Col md={6} lg={4}>
          <InputGroup>
            <InputGroup.Text className="bg-white">
              <i className="bi bi-search text-muted"></i>
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Cerca un prodotto per nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Col>
      </Row>

      <Table striped bordered hover responsive className="bg-white shadow-sm align-middle">
        <thead className="table-dark">
          <tr>
            <th>Nome</th>
            {tab === 'tutto' && <th>Categoria</th>}
            {tab !== 'senza_categoria' && <th>Sottocategoria</th>}
            <th>Prezzo</th>
            <th className="text-center">Disponibilità</th>
            <th className="text-center">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {prodottiFiltrati.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center py-4 text-muted">
                {searchQuery ? 'Nessun prodotto trovato con questa ricerca.' : 'Nessun prodotto in questa sezione.'}
              </td>
            </tr>
          ) : (
            prodottiFiltrati.map((prodotto) => (
              <tr key={prodotto.id}>
                <td className="fw-bold">{prodotto.nome}</td>
                {tab === 'tutto' && <td>{categoriaLabel(prodotto.categoria)}</td>}
                {tab !== 'senza_categoria' && (
                  <td>{prodotto.categoria ? sottocategoriaLabel(prodotto.categoria, prodotto.sottocategoria) : '—'}</td>
                )}
                <td>€{Number(prodotto.prezzo).toFixed(2)}</td>
                <td className="text-center">{badgeQuantita(prodotto)}</td>
                <td className="text-center text-nowrap">
                  {puoGestireMagazzino && (
                    <>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="me-1"
                        disabled={prodotto.quantita === 0}
                        onClick={() => handleAggiornaQuantita(prodotto.id, prodotto.quantita - 1)}
                        title="Togli 1"
                      >
                        <i className="bi bi-dash-lg"></i>
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="me-1"
                        onClick={() => handleAggiornaQuantita(prodotto.id, prodotto.quantita + 1)}
                        title="Aggiungi 1"
                      >
                        <i className="bi bi-plus-lg"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => setShowRifornisci(prodotto)}
                        title="Rifornisci in blocco"
                      >
                        <i className="bi bi-box-arrow-in-down"></i>
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-1"
                        onClick={() => apriModificaProdotto(prodotto)}
                        title="Modifica"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteProdotto(prodotto.id)}
                        title="Elimina"
                      >
                        <i className="bi bi-trash3"></i>
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* MODALE: crea / modifica prodotto */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-box-seam me-2"></i>
            {prodottoInModifica ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSalvaProdotto}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control name="nome" type="text" required defaultValue={prodottoInModifica?.nome} placeholder="Es. Barolo DOCG 2018" />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Categoria</Form.Label>
                  <Form.Select
                    name="categoria"
                    required
                    value={categoriaForm}
                    onChange={(e) => setCategoriaForm(e.target.value)}
                  >
                    <option value="" disabled>Seleziona...</option>
                    {Object.entries(CATEGORIE).map(([key, cat]) => (
                      <option key={key} value={key}>{cat.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Sottocategoria</Form.Label>
                  <Form.Select name="sottocategoria" required disabled={!categoriaForm} key={categoriaForm} defaultValue={prodottoInModifica?.sottocategoria || ''}>
                    <option value="" disabled>Seleziona...</option>
                    {categoriaForm && Object.entries(CATEGORIE[categoriaForm].sottocategorie).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prezzo (€)</Form.Label>
                  <Form.Control name="prezzo" type="number" step="0.01" min="0" required defaultValue={prodottoInModifica?.prezzo} placeholder="0.00" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantità ottimale</Form.Label>
                  <Form.Control name="quantita_ottimale" type="number" min="0" defaultValue={prodottoInModifica?.quantita_ottimale || 0} placeholder="0" />
                  <Form.Text className="text-muted">Scorta che vorresti avere sempre disponibile.</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Unità</Form.Label>
              <Form.Select name="unita" required value={unitaForm} onChange={(e) => setUnitaForm(e.target.value)}>
                <optgroup label="Unità singole">
                  {Object.entries(UNITA_SINGOLE).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </optgroup>
                <optgroup label="Unità multiple (confezioni)">
                  {Object.entries(UNITA_MULTIPLE).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </optgroup>
              </Form.Select>
            </Form.Group>

            {isUnitaMultipla(unitaForm) ? (
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>{prodottoInModifica ? 'Unità per confezione' : 'N. confezioni iniziali'}</Form.Label>
                    {prodottoInModifica ? (
                      <Form.Control name="molteplicita" type="number" min="1" required defaultValue={prodottoInModifica?.molteplicita} />
                    ) : (
                      <Form.Control name="num_confezioni" type="number" min="0" required placeholder="Es. 1" />
                    )}
                  </Form.Group>
                </Col>
                {!prodottoInModifica && (
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Unità per confezione</Form.Label>
                      <Form.Control name="molteplicita" type="number" min="1" required placeholder="Es. 24" />
                    </Form.Group>
                  </Col>
                )}
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cosa contiene</Form.Label>
                    <Form.Control name="unita_contenuto" type="text" required defaultValue={prodottoInModifica?.unita_contenuto} placeholder="Es. lattine" />
                  </Form.Group>
                </Col>
                {prodottoInModifica && (
                  <Col md={12}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quantità attuale in magazzino ({unitaConteggio(prodottoInModifica)})</Form.Label>
                      <Form.Control name="quantita" type="number" min="0" required defaultValue={prodottoInModifica?.quantita} />
                      <Form.Text className="text-muted">Correggi qui solo se serve un aggiustamento manuale: i tasti +/- nella tabella già la aggiornano una unità alla volta.</Form.Text>
                    </Form.Group>
                  </Col>
                )}
              </Row>
            ) : (
              <Form.Group className="mb-3">
                <Form.Label>{prodottoInModifica ? `Quantità attuale (${UNITA_SINGOLE[unitaForm]})` : `Quantità iniziale (${UNITA_SINGOLE[unitaForm]})`}</Form.Label>
                <Form.Control name="quantita" type="number" min="0" required defaultValue={prodottoInModifica?.quantita ?? 0} />
              </Form.Group>
            )}

            {!prodottoInModifica && isUnitaMultipla(unitaForm) && (
              <Alert variant="warning" className="mb-0 py-2 small">
                <i className="bi bi-info-circle me-1"></i>
                Es. "1 confezione da 24 lattine" verrà salvata come 24 lattine. I tasti +/- lavorano sempre sulla singola unità, mai su una confezione intera.
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowFormModal(false)}>Annulla</Button>
            <Button variant="success" type="submit">Salva</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* MODALE: rifornimento rapido */}
      <Modal show={Boolean(showRifornisci)} onHide={() => setShowRifornisci(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-box-arrow-in-down me-2"></i>Rifornisci "{showRifornisci?.nome}"</Modal.Title>
        </Modal.Header>
        {showRifornisci && (
          <Form onSubmit={handleRifornisci}>
            <Modal.Body>
              {isUnitaMultipla(showRifornisci.unita) ? (
                <Form.Group className="mb-2">
                  <Form.Label>
                    Quante confezioni da {showRifornisci.molteplicita} {showRifornisci.unita_contenuto} aggiungere?
                  </Form.Label>
                  <Form.Control name="num_confezioni" type="number" min="1" required defaultValue={1} autoFocus />
                </Form.Group>
              ) : (
                <Form.Group className="mb-2">
                  <Form.Label>Quante {UNITA_SINGOLE[showRifornisci.unita]?.toLowerCase()} aggiungere?</Form.Label>
                  <Form.Control name="quantita_da_aggiungere" type="number" min="1" required defaultValue={1} autoFocus />
                </Form.Group>
              )}
              <div className="text-muted small">Scorta attuale: {showRifornisci.quantita} {unitaConteggio(showRifornisci)}</div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowRifornisci(null)}>Annulla</Button>
              <Button variant="success" type="submit">Aggiungi</Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </Container>
  );
}

export { Magazzino };
