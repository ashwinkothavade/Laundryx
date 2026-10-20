const mongoose = require('mongoose');
const { app, request } = require('./helpers');
const DB = require('../config/db');

describe('Health and readiness', () => {
  test('GET /health reports liveness without touching the database', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  test('GET /ready reports the database connection state', async () => {
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ready',
      database: 'connected',
      mongoUriConfigured: expect.any(Boolean),
    });
  });

  test('GET / still answers without authentication', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
  });
});

describe('Database connection contract', () => {
  // Restore the shared connection after any test that drops it, so the rest
  // of the suite still has a database.
  const reconnect = async (uri) => {
    process.env.MONGO_URI = uri;
    await DB.connect();
    delete process.env.MONGO_URI;
  };

  test('connection state is reported from mongoose, not cached separately', () => {
    expect(DB.isConnected()).toBe(true);
    expect(DB.stateName()).toBe('connected');
  });

  // The API must degrade, never die: a missing configuration returns a value
  // the caller can act on instead of taking the process — and on serverless
  // the whole function invocation — down with it.
  test('connect() resolves to null instead of throwing when MONGO_URI is unset', async () => {
    const uri = mongoose.connection.client.s.url;
    await mongoose.disconnect();
    delete process.env.MONGO_URI;

    await expect(DB.connect()).resolves.toBeNull();
    expect(DB.isConnected()).toBe(false);

    await reconnect(uri);
    expect(DB.isConnected()).toBe(true);
  });

  // This is the production failure: a serverless instance connects, is frozen
  // between invocations, and its socket dies. Caching the connection handle
  // made connect() short-circuit on the dead handle, so that instance
  // returned 503 to every later request. readyState is the source of truth.
  test('connect() re-establishes after the connection drops', async () => {
    const uri = mongoose.connection.client.s.url;
    await mongoose.disconnect();
    expect(DB.isConnected()).toBe(false);

    process.env.MONGO_URI = uri;
    const conn = await DB.connect();
    delete process.env.MONGO_URI;

    expect(conn).not.toBeNull();
    expect(DB.isConnected()).toBe(true);
    expect(DB.stateName()).toBe('connected');
  });
});
