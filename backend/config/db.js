const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Only the in-flight attempt is cached, never the connection handle. Caching
// the handle is what made a dropped connection unrecoverable: the cached value
// stayed truthy, so connect() short-circuited and handed back a socket that
// was already dead. On serverless that is the normal case rather than an edge
// case — an instance connects, is frozen between invocations, and its socket
// dies while the handle lives on. mongoose.connection.readyState is the only
// thing that actually knows.
const cache =
  global.__laundrixMongo ||
  (global.__laundrixMongo = {
    promise: null,
  });

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// Whether queries can currently be served.
const isConnected = () => mongoose.connection.readyState === 1;
const stateName = () => STATES[mongoose.connection.readyState] || 'unknown';

const connect = async () => {
  if (isConnected()) return mongoose.connection;

  if (!process.env.MONGO_URI) {
    logger.error(
      'MONGO_URI is not set. The API will still start and serve /health, but ' +
        'every database-backed route will return 503.'
    );
    return null;
  }

  // Share one attempt across concurrent callers on a cold instance instead of
  // opening a connection per request. Cleared once it settles, either way, so
  // a later request makes a genuinely fresh attempt rather than replaying a
  // stale rejection.
  if (!cache.promise) {
    cache.promise = mongoose
      .connect(process.env.MONGO_URI, {
        // Shorter than the 30s default so a genuinely unreachable database
        // becomes a clear 503 rather than a gateway timeout, but long enough
        // to cover a cold start's SRV lookup and TLS handshake to Atlas.
        serverSelectionTimeoutMS: 15000,
        // Each serverless instance holds its own pool and Atlas shared tiers
        // cap total connections, so keep it small.
        maxPoolSize: 5,
      })
      .then((m) => {
        logger.info(`MongoDB connected: ${m.connection.host}`);
        return m;
      })
      .catch((error) => {
        // Never take the process down. On serverless, exiting here fails the
        // whole function invocation, so an unreachable database would turn
        // every route — even ones that touch no data — into an opaque 500.
        logger.error(`MongoDB connection failed: ${error.message}`, {
          stack: error.stack,
        });
        return null;
      })
      .finally(() => {
        cache.promise = null;
      });
  }

  await cache.promise;
  return isConnected() ? mongoose.connection : null;
};

module.exports = {
  connect,
  isConnected,
  stateName,
};
