// URL base dell'API, configurabile tramite variabile d'ambiente Vite.
// In sviluppo: definita in .env / .env.local
// In produzione (build): definita in .env.production, oppure impostata
// nella dashboard del tuo hosting (Render, Netlify, Vercel...).
export const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.27:3000'; 