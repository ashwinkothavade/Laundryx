const express = require('express');
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
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
const isTest = process.env.NODE_ENV === 'test';

// Allow the frontend origins to be configured via env (comma-separated),
// falling back to the known local + production domains.
const defaultOrigins = [
  'http://localhost:5173',
  'https://laundrix-web.vercel.app',
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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(cookieParser());
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

app.get('/', (req, resp) => {
  resp.status(200).json('This is the LaundriX backend API.');
});

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
