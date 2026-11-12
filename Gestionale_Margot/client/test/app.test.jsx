import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

beforeAll(() => { window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } })); });
const ev = (id, nome, tipo, data, x = {}) => ({ id, nome, tipo, data_evento: data, costo: 100, creato_da_username: 'admin', grafica_stato: 'da_fare', pagamento_stato: 'da_pagare', max_volontari: 3, iscritti_count: 1, iscritto: false, ...x });
const eventi = [ev(1, 'Serata Jazz', 'Concerto', '2026-11-20'), ev(2, 'Karaoke', 'Karaoke', '2026-11-25', { creato_da_username: 'mario' })];
const prodotti = [{ id: 1, nome: 'Birra', categoria: 'alcolici', sottocategoria: 'birra_bottiglia', quantita: 2, quantita_ottimale: 10, prezzo: 2.5, unita: 'bottiglia' }];
const personale = [{ id: 1, username: 'admin', ruolo: 'amministrazione' }, { id: 2, username: 'mario', ruolo: 'volontari' }];
const storico = [{ id: 1, creato_il: '2026-11-10T08:00:00.000Z', utente_username: 'admin', entita: 'prodotto', azione: 'creato', entita_nome: 'Birra', dettagli: { quantita: 1, prezzo: 2.5 } }];
const r = (stato, corpo) => ({ ok: stato < 300, status: stato, json: async () => corpo });
const utenteDi = (ruolo) => (ruolo ? { id: 1, username: 'admin', ruolo } : null);

function installaServer(ruolo, log) {
  vi.stubGlobal('fetch', async (url, o = {}) => {
    const m = o.method || 'GET'; log.push(`${m} ${url}`);
    if (url === '/api/sessions/current') return m === 'DELETE' ? r(200, {}) : utenteDi(ruolo) ? r(200, utenteDi(ruolo)) : r(401, { error: 'no' });
    if (url === '/api/sessions' && m === 'POST') return r(200, utenteDi('amministrazione'));
    const tabella = { '/api/eventi': eventi, '/api/eventi/miei': eventi.slice(0, 1), '/api/prodotti': prodotti, '/api/consumi/pendenti': { numero: 2 }, '/api/consumi/report/ultimo': null, '/api/consumi/report/storico': [], '/api/notifiche-grafica': [], '/api/notifiche-pagamento': [], '/api/notifiche/conteggio': { numero: 1 }, '/api/notifiche': [], '/api/personale': personale, '/api/storico/utenti': ['admin'] };
    if (url.startsWith('/api/storico?')) return r(200, storico);
    return r(200, url in tabella ? tabella[url] : []);
  });
}
const aspetta = (ms = 60) => act(async () => { await new Promise((x) => setTimeout(x, ms)); });
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-10T10:00:00')); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const gestisceMagazzino = (r) => r === 'amministrazione' || r === 'bar';
function atteso(ruolo, rotta) {
  if (rotta === '/percorso-inesistente') return '404';
  if (!ruolo) return 'Accedi';
  const calendario = 'Eventi Margot';
  switch (rotta) {
    case '/': case '/login': return 'Ciao, admin';
    case '/calendario': return calendario;
    case '/magazzino': return gestisceMagazzino(ruolo) ? 'Magazzino' : calendario;
    case '/ordini': return gestisceMagazzino(ruolo) ? 'Cosa Ordinare' : calendario;
    case '/consumi': return gestisceMagazzino(ruolo) ? 'Consumi' : calendario;
    case '/personale': return ruolo === 'amministrazione' ? 'Gestione Personale' : calendario;
    case '/storico': return ruolo === 'amministrazione' ? 'Storico modifiche' : calendario;
    case '/miei-eventi': return ruolo === 'volontari' ? 'I Miei Eventi' : calendario;
    default: return '?';
  }
}
const ruoli = ['amministrazione', 'bar', 'eventi', 'grafica', 'volontari', null];
const rotte = ['/', '/login', '/calendario', '/magazzino', '/ordini', '/consumi', '/personale', '/storico', '/miei-eventi', '/percorso-inesistente'];
const titolo = () => document.querySelector('h1, h2')?.textContent.replace(/\s+/g, ' ').trim();
const GRAVI = /Each child in a list|unique "key"|Maximum update depth|Invalid hook call|Cannot read properties|is not defined|is not a function|Objects are not valid|Cannot update a component/;

describe('app intera: chi vede quale pagina', () => {
  const errori = [];
  it(`${ruoli.length} ruoli × ${rotte.length} indirizzi`, async () => {
    vi.spyOn(console, 'error').mockImplementation((...a) => errori.push(a.map(String).join(' ')));
    const sbagliati = []; let totale = 0;
    for (const ruolo of ruoli) {
      for (const rotta of rotte) {
        installaServer(ruolo, []);
        render(<MemoryRouter initialEntries={[rotta]}><App /></MemoryRouter>); await aspetta();
        totale += 1; const visto = titolo(); const voluto = atteso(ruolo, rotta);
        if (visto !== voluto) sbagliati.push(`${ruolo ?? 'ospite'} ${rotta}: visto "${visto}", atteso "${voluto}"`);
        const conMenu = document.body.classList.contains('con-shell');
        if (conMenu !== Boolean(ruolo)) sbagliati.push(`${ruolo ?? 'ospite'} ${rotta}: menu ${conMenu ? 'presente' : 'assente'}`);
        cleanup();
      }
    }
    console.log(`  controllate ${totale} combinazioni | errori di React gravi: ${errori.filter((e) => GRAVI.test(e)).length} | altri avvisi: ${new Set(errori.filter((e) => !GRAVI.test(e)).map((e) => e.slice(0, 70))).size} tipi`);
    expect(sbagliati).toEqual([]); expect(errori.filter((e) => GRAVI.test(e))).toEqual([]);
  }, 120000);
});

describe('app intera: accesso e uscita veri', () => {
  it('login dal form e poi logout dal menu', async () => {
    const log = []; installaServer(null, log);
    render(<MemoryRouter initialEntries={['/login']}><App /></MemoryRouter>); await aspetta();
    expect(titolo()).toBe('Accedi');
    fireEvent.change(document.querySelector('[name=username]'), { target: { value: 'admin' } }); fireEvent.change(document.querySelector('[name=password]'), { target: { value: 'segreta1' } });
    await act(async () => { fireEvent.submit(document.querySelector('form')); }); await aspetta();
    expect(titolo()).toBe('Ciao, admin'); expect(document.body.classList.contains('con-shell')).toBe(true);
    expect(log).toContain('POST /api/sessions');
    fireEvent.click(within(document.querySelector('.shell-side')).getByText(/Logout/)); await aspetta();
    expect(log).toContain('DELETE /api/sessions/current'); expect(titolo()).toBe('Accedi');   // dopo l'uscita si torna alla pagina di accesso
    expect(document.body.classList.contains('con-shell')).toBe(false);
  });
  it('navigazione dal menu laterale: Magazzino, Ordini, Consumi, Personale, Storico, Eventi', async () => {
    installaServer('amministrazione', []);
    render(<MemoryRouter initialEntries={['/']}><App /></MemoryRouter>); await aspetta();
    const visti = [];
    for (const nome of ['Magazzino', 'Ordini', 'Consumi', 'Personale', 'Storico', 'Eventi']) {
      fireEvent.click([...document.querySelectorAll('.shell-side a.shell-link')].find((a) => a.textContent.trim() === nome)); await aspetta();
      visti.push(titolo()); expect(document.querySelector('.shell-side a.shell-link.on').textContent.trim()).toBe(nome);
    }
    expect(visti).toEqual(['Magazzino', 'Cosa Ordinare', 'Consumi', 'Gestione Personale', 'Storico modifiche', 'Eventi Margot']);
  });
});
