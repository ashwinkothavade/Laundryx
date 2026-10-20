const mongoose = require('mongoose');
const logger = require('../utils/logger');

// On a serverless runtime this module is evaluated once per *instance* and then
// reused across invocations. Cache the connection promise on `global` so every
// invocation served by one instance shares a single pool instead of opening its
// own — Atlas free tiers cap total connections, and a cold-start stampede is
// the usual way that cap gets hit.
const cache =
  global.__laundrixMongo ||
  (global.__laundrixMongo = {
    conn: null,
    promise: null,
  });

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Whether queries can currently be served.
const isConnected = () => mongoose.connection.readyState === 1;
const stateName = () => STATES[mongoose.connection.readyState] || 'unknown';

const connect = async () => {
  if (cache.conn) return cache.conn;

  if (!process.env.MONGO_URI) {
    logger.error(
      'MONGO_URI is not set. The API will still start and serve /health, but ' +
        'every database-backed route will return 503.'
    );
    return null;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGO_URI, {
        // Shorter than the 30s default so a genuinely unreachable database
        // becomes a clear 503 rather than a gateway timeout, but long enough
        // to cover a cold start's SRV lookup plus TLS handshake to Atlas,
        // which is far slower than a warm local connect.
        serverSelectionTimeoutMS: 15000,
        // Bound the pool hard. Each serverless instance keeps its own, and
        // Atlas shared tiers cap total connections, so a traffic spike that
        // spawns many instances is the realistic way to hit that ceiling.
        maxPoolSize: 5,
      })
      .then((m) => {
        logger.info(`MongoDB connected: ${m.connection.host}`);
        return m;
      })
      .catch((error) => {
        // Never take the process down. On serverless, exiting here fails the
        // whole function invocation, so a misconfigured or unreachable
        // database turns every route — even ones that touch no data — into an
        // opaque 500 with nothing useful in the response.
        logger.error(`MongoDB connection failed: ${error.message}`, {
          stack: error.stack,
        });
        // Clear the cached promise so a later invocation can retry rather than
        // replaying this rejection forever.
        cache.promise = null;
        return null;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
};

module.exports = {
  connect,
  isConnected,
  stateName,
};
