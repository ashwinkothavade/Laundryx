const express = require('express');
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
const cookieParser = require('cookie-parser');
// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();
const cors = require('cors');
const cron = require('node-cron');
const DB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const laundererRoutes = require('./routes/laundererRoutes');
const studentRoutes = require('./routes/studentRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

const port = process.env.PORT || 4000;

// Warn (don't crash the serverless cold start) if critical env vars are missing.
const requiredEnv = ['MONGO_URI', 'ACCESS_TOKEN_SECRET'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length) {
  console.warn(
    `Warning: missing required environment variables: ${missingEnv.join(', ')}`
      .yellow.bold
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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(authRoutes);
app.use(laundererRoutes);
app.use(studentRoutes);
app.use(razorpayRoutes);
app.use(notificationRoutes);

app.get('/', (req, resp) => {
  resp.status(200).json('This is the LaundriX backend API.');
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
    console.log(
      `Server is running on port ${port}, go to http://localhost:${port}`.yellow
        .bold
    );
  });
}

module.exports = app;
