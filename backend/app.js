const express = require('express');
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const DB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const laundererRoutes = require('./routes/laundererRoutes');
const studentRoutes = require('./routes/studentRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const catalogRoutes = require('./routes/catalogRoutes');
const settingRoutes = require('./routes/settingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const couponRoutes = require('./routes/couponRoutes');

const app = express();
// Behind Vercel's (or any) reverse proxy the client IP arrives in the
// X-Forwarded-For header. Trust the first proxy hop so express-rate-limit can
// identify clients correctly instead of throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);
const isTest = process.env.NODE_ENV === 'test';

// Allow the frontend origins to be configured via env (comma-separated),
// falling back to the known local + production domains.
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:8080', // nginx-served frontend in docker-compose
  'https://laundrix-web.vercel.app',
  // The production frontend's canonical Vercel alias. Kept in the defaults so
  // a missing or stale FRONTEND_URL cannot silently break every browser
  // request with a CORS failure.
  'https://laundrix-web-five.vercel.app',
];
const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET, POST, PUT, DELETE, PATCH',
  credentials: true,
  optionsSuccessStatus: 200,
};

app.set('view engine', 'ejs');

// Security headers. CSP is disabled because the only HTML this API serves is
// the EJS password-reset page; CORP is relaxed so the browser can consume the
// API cross-origin from the frontend domain.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Rate limiting + HTTP logging — skipped under test so suites aren't throttled
// or noisy. NOTE: the in-memory store only limits per-instance, so on
// serverless (Vercel) it is best-effort; use a shared store (Redis) for strict
// limits. Auth endpoints get a much tighter budget to blunt brute force.
if (!isTest) {
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later.' },
  });
  app.use(generalLimiter);
  app.use(['/login', '/signup', '/forgotpassword'], authLimiter);
  app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream: logger.stream,
    })
  );
}

// The Razorpay webhook signature is an HMAC over the raw request bytes, so
// this route must keep them. Mounted before express.json(): body-parser marks
// the body as read, so the JSON parser below skips this path instead of
// replacing the Buffer with a parsed object.
app.use('/payment/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(cookieParser());

// --- Routes that must answer even when the database is unreachable ---------
// These are registered before the DB guard below so that an outage is
// diagnosable with a single request instead of an opaque 500.

app.get('/', (req, resp) => {
  resp.status(200).json('This is the LaundriX backend API.');
});

// Liveness: is the process up at all? Never touches the database.
app.get('/health', (req, resp) => {
  resp.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
  });
});

// Readiness: can we actually serve traffic? Actively attempts a connection
// rather than only reporting the last known state, so this both self-heals and
// tells the truth. 503 when the database really is unreachable.
app.get('/ready', async (req, resp) => {
  if (!DB.isConnected()) await DB.connect();
  if (!DB.isConnected()) await DB.connect();
  const ready = DB.isConnected();
  resp.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'degraded',
    database: DB.stateName(),
    mongoUriConfigured: Boolean(process.env.MONGO_URI),
  });
});

// Ensure a connection before serving database-backed routes.
//
// This MUST attempt the connection here rather than only read the last known
// state. On a serverless runtime the instance is frozen once a response is
// sent, so a connection started at module load can be suspended mid-handshake
// and never finish; and a connect that failed at boot would otherwise leave
// the instance returning 503 forever, because nothing would retry.
//
// connect() caches the in-flight promise, so concurrent requests on a cold
// instance share one attempt instead of opening a connection each.
app.use(async (req, resp, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  if (DB.isConnected()) return next();

  // Try twice before giving up. connect() clears its in-flight promise once
  // it settles, so the second call is a genuinely fresh attempt rather than a
  // replay of the first rejection — enough to ride out a transient blip on a
  // cold instance. A database that is actually gone still fails fast, because
  // DNS for a dead cluster fails in well under a second.
  await DB.connect();
  if (!DB.isConnected()) await DB.connect();
  if (DB.isConnected()) return next();

  logger.warn(`Database unavailable for ${req.method} ${req.originalUrl}`);
  return resp.status(503).json({
    message:
      'Service temporarily unavailable: the database is unreachable. ' +
      'See /ready for details.',
  });
});

app.use(authRoutes);
app.use(laundererRoutes);
app.use(studentRoutes);
app.use(razorpayRoutes);
app.use(notificationRoutes);
app.use(catalogRoutes);
app.use(settingRoutes);
app.use(adminRoutes);
app.use(reviewRoutes);
app.use(couponRoutes);

// Centralized error handler — logs every error that reaches Express with
// request context, and returns a consistent JSON shape to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, resp, next) => {
  logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, {
    stack: err.stack,
  });
  resp.status(err.status || 500).json({ message: 'Internal Server Error' });
});

module.exports = app;
