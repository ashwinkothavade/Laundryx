const express = require('express');
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const cookieParser = require('cookie-parser');
// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();
const cors = require('cors');
const cron = require('node-cron');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const DB = require('./config/db');
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

const app = express();

const port = process.env.PORT || 4000;

// Warn (don't crash the serverless cold start) if critical env vars are missing.
const requiredEnv = ['MONGO_URI', 'ACCESS_TOKEN_SECRET'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length) {
  logger.warn(
    `Missing required environment variables: ${missingEnv.join(', ')}`
  );
}

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

DB.connect();
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

// Rate limiting. NOTE: the default in-memory store only limits per-instance,
// so on serverless (Vercel) it is best-effort; use a shared store (Redis) for
// strict limits. Auth endpoints get a much tighter budget to blunt brute force.
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

// HTTP request logging — concise colorized lines in dev, Apache "combined"
// format in production, all routed through winston (at the http level).
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: logger.stream,
  })
);

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

// task scheduler to delete the orders that are valid every 2 days
// Runs every day at midnight
cron.schedule('0 0 * * *', () => {
  DB.deleteValidOrders();
});

// On Vercel's serverless runtime the app is imported and invoked per-request,
// so we must export it. Only bind a port when running as a standalone process
// (local dev / traditional Node host), never inside the serverless function.
if (!process.env.VERCEL) {
  app.listen(port, () => {
    logger.info(`Server running on port ${port} (http://localhost:${port})`);
  });
}

module.exports = app;
