// eslint-disable-next-line no-unused-vars
const dotenv = require('dotenv').config();
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

// Start connecting, but never block or crash boot on the result. The app stays
// up and answers /health and /ready even while the database is unreachable, so
// an outage is diagnosable instead of being an opaque 500 on every route.
DB.connect().catch((err) => {
  logger.error(`Initial database connection failed: ${err.message}`);
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
