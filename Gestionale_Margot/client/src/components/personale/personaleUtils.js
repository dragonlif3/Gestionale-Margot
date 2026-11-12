// Il colore di ogni ruolo, usato per l'avatar e per l'etichetta (vedi personale.css).
const COLORI_RUOLO = { amministrazione: 'magenta', bar: 'arancio', eventi: 'viola', grafica: 'verde', volontari: 'lime' };
export const coloreRuolo = (ruolo) => COLORI_RUOLO[ruolo] || 'lilla';

// La lettera dentro l'avatar
export const iniziale = (username) => String(username || '?').trim().charAt(0).toUpperCase() || '?';
