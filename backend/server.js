// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const DB = require('./config/db');
const logger = require('./utils/logger');

const port = process.env.PORT || 4000;

// Warn (don't crash the serverless cold start) if critical env vars are missing.
const requiredEnv = ['MONGO_URI', 'ACCESS_TOKEN_SECRET'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length) {
  logger.warn(
    `Missing required environment variables: ${missingEnv.join(', ')}`
  );
}

DB.connect();

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
