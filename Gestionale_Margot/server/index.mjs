import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { inizializzaDatabase } from './db_init.mjs';
import { getUser, getUserById } from './dao/dao_utenti.mjs';
import prodottiRoutes from './routes/prodotti.mjs';
import authRoutes from './routes/auth.mjs';
import eventiRoutes from './routes/eventi.mjs';
import consumiRoutes from './routes/consumi.mjs';
import notificheRoutes from './routes/notifiche.mjs';
import passport from 'passport';
import session from 'express-session';
import LocalStrategy from 'passport-local';
import morgan from 'morgan';
import sqlite3 from 'sqlite3';
import storicoRoutes from './routes/storico.mjs';
import { tracciaModifiche } from './traccia_modifiche.mjs';
import pushRoutes from './routes/push.mjs';
import { avviaPuliziaStorico } from './pulizia_storico.mjs';
import { avviaPromemoria } from './promemoria.mjs';

class SQLiteSessionStore extends session.Store {
  constructor(dbPath = './sessions.sqlite') {
    super();
    this.db = new sqlite3.Database(dbPath);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expired INTEGER NOT NULL
      )
    `);
    // Rimuove automaticamente le sessioni scadute ogni ora
    setInterval(() => {
      this.db.run('DELETE FROM sessions WHERE expired <= ?', [Date.now()]);
    }, 60 * 60 * 1000).unref();
  }

  get(sid, cb) {
    this.db.get(
      'SELECT sess FROM sessions WHERE sid = ? AND expired > ?',
      [sid, Date.now()],
      (err, row) => {
        if (err) return cb(err);
        if (!row) return cb(null, null);
        try {
          cb(null, JSON.parse(row.sess));
        } catch (e) {
          cb(e);
        }
      }
    );
  }

  set(sid, sess, cb) {
    const maxAge = sess.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
    this.db.run(
      'INSERT OR REPLACE INTO sessions (sid, sess, expired) VALUES (?, ?, ?)',
      [sid, JSON.stringify(sess), Date.now() + maxAge],
      (err) => cb && cb(err)
    );
  }

  destroy(sid, cb) {
    this.db.run('DELETE FROM sessions WHERE sid = ?', [sid], (err) => cb && cb(err));
  }

  touch(sid, sess, cb) {
    const maxAge = sess.cookie?.maxAge || 7 * 24 * 60 * 60 * 1000;
    this.db.run(
      'UPDATE sessions SET expired = ? WHERE sid = ?',
      [Date.now() + maxAge, sid],
      (err) => cb && cb(err)
    );
  }
}

//init
const app = express();
app.disable('x-powered-by');
const PORT = 3000;
const HOST = process.env.HOST || '0.0.0.0';

//middleware
app.use(express.json());
app.use(morgan('dev'));

app.use('/images', express.static('images'));

// Origini ammesse: in .env puoi aggiungere ALLOWED_ORIGINS="http://192.168.1.23:5173,https://tuodominio.it"
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
];

const corsOptions = {
  origin: (origin, callback) => {
    // richieste senza origin (es. curl/health check) sempre ammesse
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorizzata da CORS: ' + origin));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

// Crea le tabelle "prodotti", "eventi" e "notifiche_grafica" se non esistono già
inizializzaDatabase().catch((err) => console.error('Errore inizializzazione DB:', err));

// Istruzione fondamentale: dice a Express di fidarsi se si trova dietro proxy (indispensabile per i cookie secure)
app.set('trust proxy', 1);

app.use(session({
  store: new SQLiteSessionStore('./sessions.sqlite'),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax', // Il browser ora lo accetta perché pensa che frontend e backend siano lo stesso sito
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(passport.authenticate('session'));

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  try {
    const user = await getUser(username, password);
    if (!user) {
      return cb(null, false, 'Username o password errati');
    }
    return cb(null, user);
  } catch (error) {
    console.error('Auth error:', error);
    return cb(error);
  }
}));

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(async function (id, cb) {
  try {
    if (typeof id !== 'number') return cb(null, false);

    const user = await getUserById(id);
    if (user.error) return cb(null, false);

    return cb(null, user);
  } catch (err) {
    return cb(err);
  }
});

// 2. Diciamo a Express che tutte le rotte in prodottiRoutes
// avranno il prefisso "/api"
app.use('/api', tracciaModifiche);
app.use('/api', prodottiRoutes);
app.use('/api', authRoutes);
app.use('/api', eventiRoutes);
app.use('/api', consumiRoutes);
app.use('/api', notificheRoutes);
app.use('/api', storicoRoutes);
app.use('/api', pushRoutes);

app.listen(PORT, HOST, () => {
  console.log(`API server started at http://localhost:${PORT}`);
  avviaPuliziaStorico();
  avviaPromemoria();
});