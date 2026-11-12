import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Caratteri installati con l'app (niente richieste a Google): solo il sottoinsieme latino
import '@fontsource/anton/latin-400.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/pacifico/latin-400.css'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// Il tema va per ULTIMO: ridefinisce colori e componenti sopra Bootstrap e i vecchi CSS
import './theme.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
