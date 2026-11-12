import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import FiltriMagazzino from './magazzino/FiltriMagazzino';
import RigaProdotto from './magazzino/RigaProdotto';
import ModaleProdotto from './magazzino/ModaleProdotto';
import ModaleRifornisci from './magazzino/ModaleRifornisci';
import { filtraProdotti, daOrdinare } from './magazzino/magazzinoUtils';
import { caricaProdotti, aggiornaQuantita, salvaProdotto, eliminaProdotto } from './magazzino/api';
import './magazzino/magazzino.css';

// Il "regista" del magazzino: tiene lo stato, scarica i dati e decide cosa fare quando l'utente
// agisce. Come appare ogni parte è nei componenti della cartella magazzino/.
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

  // ---------- Caricamento dei dati ----------

  const fetchProdotti = async () => {
    try {
      setProdotti(await caricaProdotti());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdotti();
  }, []);

  // ---------- Azioni ----------

  const handleAggiornaQuantita = async (id, delta) => {
    try {
      await aggiornaQuantita(id, delta);
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

  const handleSalvaProdotto = async (payload) => {
    try {
      await salvaProdotto(prodottoInModifica?.id, payload);
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
      await eliminaProdotto(id);
      fetchProdotti();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRifornisci = async (daAggiungere) => {
    await handleAggiornaQuantita(showRifornisci.id, daAggiungere);
    setShowRifornisci(null);
  };

  // ---------- Dati per la pagina ----------

  const prodottiFiltrati = useMemo(
    () => filtraProdotti(prodotti, tab, searchQuery),
    [prodotti, tab, searchQuery]
  );
  const ciSonoNonCategorizzati = prodotti.some((p) => !p.categoria);
  const numeroDaOrdinare = prodotti.filter(daOrdinare).length;

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
    <Container className="mt-4 mag-pagina">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2 className="text-warning">
            <i className="bi bi-box-seam"></i> Magazzino
          </h2>
        </Col>
        <Col xs="auto">
          {puoGestireMagazzino && (
            <Button variant="warning" onClick={apriNuovoProdotto}>
              <i className="bi bi-plus-circle"></i> Aggiungi Prodotto
            </Button>
          )}
        </Col>
      </Row>

      <FiltriMagazzino
        ricerca={searchQuery}
        onRicerca={setSearchQuery}
        tab={tab}
        onTab={setTab}
        mostraNonCategorizzati={ciSonoNonCategorizzati}
      />

      {prodottiFiltrati.length === 0 ? (
        <p className="mag-vuoto">
          {searchQuery ? 'Nessun prodotto trovato con questa ricerca.' : 'Nessun prodotto in questa sezione.'}
        </p>
      ) : (
        <ul className="mag-lista">
          {prodottiFiltrati.map((prodotto) => (
            <RigaProdotto
              key={prodotto.id}
              prodotto={prodotto}
              puoGestire={puoGestireMagazzino}
              onAggiorna={handleAggiornaQuantita}
              onRifornisci={setShowRifornisci}
              onModifica={apriModificaProdotto}
              onElimina={handleDeleteProdotto}
            />
          ))}
        </ul>
      )}

      {puoGestireMagazzino && numeroDaOrdinare > 0 && (
        <Link to="/ordini" className="mag-ordina">
          <i className="bi bi-cart-check"></i>
          Cosa ordinare · {numeroDaOrdinare} {numeroDaOrdinare === 1 ? 'prodotto' : 'prodotti'}
        </Link>
      )}

      <ModaleProdotto
        show={showFormModal}
        onHide={() => setShowFormModal(false)}
        prodotto={prodottoInModifica}
        categoria={categoriaForm}
        onCategoria={setCategoriaForm}
        unita={unitaForm}
        onUnita={setUnitaForm}
        onSalva={handleSalvaProdotto}
      />

      <ModaleRifornisci
        prodotto={showRifornisci}
        onHide={() => setShowRifornisci(null)}
        onConferma={handleRifornisci}
      />
    </Container>
  );
}

export { Magazzino };
