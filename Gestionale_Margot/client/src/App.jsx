import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { API_URL } from './config';

// Importa tutti i componenti che abbiamo creato
import NavHeader from './components/NavHeader';
import { LoginForm } from './components/AuthComp';
import { Magazzino } from './components/MagComp';
import { CosaOrdinare } from './components/OrdiniComp';
import { Consumi } from './components/ConsumiComp';
import { Calendario } from './components/CalendarioComp';
import { MieiEventi } from './components/MieiEventiComp';
import { GestionePersonale } from './components/GestionePersonaleComp';
import { Dashboard } from './components/DashboardComp';
import NotFound from './components/NotFound';
import { Storico } from './components/StoricoComp';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/sessions/current`, { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Non autenticato');
      })
      .then(userData => setUser(userData))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (credentials) => {
    const res = await fetch(`${API_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const err = new Error('Login fallito');
      err.status = res.status;
      throw err;
    }
    const userData = await res.json();
    setUser(userData);
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/sessions/current`, { 
      method: 'DELETE',
      credentials: 'include' 
    });
    setUser(null);
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" variant="warning" />
      </Container>
    );
  }

  const puoVedereMagazzino = user?.ruolo === 'amministrazione' || user?.ruolo === 'bar';

  return (
    <>
      <NavHeader 
        loggedIn={!!user} 
        user={user} 
        handleLogout={handleLogout} 
      />

      {/* IL CONTENUTO DELLA PAGINA: cambia in base all'URL */}
      <Routes>
        
        {/* Rotta Principale: la Dashboard, adattiva in base al ruolo */}
        <Route 
          path="/" 
          element={
            !user ? <Navigate to="/login" /> : <Dashboard user={user} />
          } 
        />

        {/* Rotta Magazzino: solo Amministrazione e Bar, che lo gestiscono */}
        <Route 
          path="/magazzino" 
          element={
            !user ? <Navigate to="/login" />
              : puoVedereMagazzino ? <Magazzino user={user} />
              : <Navigate to="/calendario" />
          } 
        />

        {/* Rotta Cosa Ordinare: solo Amministrazione e Bar */}
        <Route 
          path="/ordini" 
          element={
            !user ? <Navigate to="/login" />
              : puoVedereMagazzino ? <CosaOrdinare />
              : <Navigate to="/calendario" />
          } 
        />

        {/* Rotta Consumi: solo Amministrazione e Bar */}
        <Route 
          path="/consumi" 
          element={
            !user ? <Navigate to="/login" />
              : puoVedereMagazzino ? <Consumi />
              : <Navigate to="/calendario" />
          } 
        />
        
        {/* Rotta di Login: Se loggato rimanda alla home, altrimenti mostra il form */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/" /> : <LoginForm handleLogin={handleLogin} />
          } 
        />

        {/* Rotta Calendario: eventi del locale, visibile a tutti i loggati */}
        <Route 
          path="/calendario" 
          element={
            user ? <Calendario user={user} /> : <Navigate to="/login" />
          } 
        />

        {/* Rotta I Miei Eventi: solo Volontari */}
        <Route 
          path="/miei-eventi" 
          element={
            !user ? <Navigate to="/login" />
              : user.ruolo === 'volontari' ? <MieiEventi />
              : <Navigate to="/calendario" />
          } 
        />

        {/* Rotta Gestione Personale: solo Amministrazione */}
        <Route 
          path="/personale" 
          element={
            !user ? <Navigate to="/login" />
              : user.ruolo === 'amministrazione' ? <GestionePersonale utenteCorrente={user} />
              : <Navigate to="/calendario" />
          } 
        />
        {/* Rotta Storico: solo Amministrazione */}
        <Route
          path="/storico"
          element={
            !user ? <Navigate to="/login" />
              : user.ruolo === 'amministrazione' ? <Storico />
              : <Navigate to="/calendario" />
          }
        />
        {/* Qualsiasi altra rotta: pagina 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
}