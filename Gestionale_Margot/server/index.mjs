import express from 'express';
import cors from 'cors';
import { inizializzaDatabase } from './db_init.mjs';
import { getUser} from './dao/dao_utenti.mjs';
import prodottiRoutes from './routes/prodotti.mjs';
import authRoutes from './routes/auth.mjs';
import eventiRoutes from './routes/eventi.mjs';
import consumiRoutes from './routes/consumi.mjs';
import passport from 'passport';
import session from 'express-session';
import LocalStrategy from 'passport-local';
import morgan from 'morgan';

//init
const app = express();
const PORT = 3000;

//middleware
app.use(express.json());
app.use(morgan('dev'));

app.use('/images', express.static('images'))

// Origini ammesse: in .env puoi aggiungere ALLOWED_ORIGINS="http://192.168.1.23:5173,https://tuodominio.it"
const allowedOrigins = [
  'http://localhost:5173',
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

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.authenticate('session'));
app.use(passport.session());

passport.use(new LocalStrategy(async function verify(username, password, cb) {
  try {
    const user = await getUser(username, password);
    if(!user) {
      return cb(null, false, 'Username o password errati');
    }
    return cb(null, user);
  } catch (error) {
    console.error('Auth error:', error); 
    return cb(error);
  }
}));


passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

// 2. Diciamo a Express che tutte le rotte in prodottiRoutes 
// avranno il prefisso "/api"
app.use('/api', prodottiRoutes); 
app.use('/api', authRoutes);
app.use('/api', eventiRoutes);
app.use('/api', consumiRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server started at http://localhost:${PORT}`);
  console.log('Raggiungibile anche da altri dispositivi in rete tramite l\'IP locale del PC, es. http://192.168.x.x:3000');
});