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
import AdminPanel from './components/AdminPanelComp';
import NotFound from './components/NotFound';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Stato per controllare l'apertura del modale dell'Admin
  const [showAdminModal, setShowAdminModal] = useState(false);

  // 1. Controlla se c'è già una sessione attiva al ricaricamento della pagina
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

  // 2. Funzione di Login
  const handleLogin = async (credentials) => {
    const res = await fetch(`${API_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error('Login fallito');
    const userData = await res.json();
    setUser(userData);
  };

  // 3. Funzione di Logout
  const handleLogout = async () => {
    await fetch(`${API_URL}/api/sessions/current`, { 
      method: 'DELETE',
      credentials: 'include' 
    });
    setUser(null);
  };

  // Se sta ancora verificando la sessione al primo avvio, mostra un caricamento
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
      
      {/* LA NAVBAR VA QUI: dentro il Router, ma prima delle Routes */}
      <NavHeader 
        loggedIn={!!user} 
        user={user} 
        handleLogout={handleLogout} 
        handleShowAdmin={() => setShowAdminModal(true)} 
      />

      {/* IL PANNELLO ADMIN: esiste solo se l'utente loggato è un admin */}
      {user?.ruolo === 'amministrazione' && (
        <AdminPanel 
          show={showAdminModal} 
          handleClose={() => setShowAdminModal(false)} 
        />
      )}

      {/* IL CONTENUTO DELLA PAGINA: cambia in base all'URL */}
      <Routes>
        
        {/* Rotta Principale: manda ciascuno alla sua pagina di riferimento */}
        <Route 
          path="/" 
          element={
            !user ? <Navigate to="/login" />
              : puoVedereMagazzino ? <Navigate to="/magazzino" />
              : <Navigate to="/calendario" />
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

        {/* Qualsiasi altra rotta: pagina 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
}