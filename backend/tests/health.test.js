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
  // The API must degrade, never die: a bad or missing configuration returns a
  // value the caller can act on instead of taking the process (and, on
  // serverless, the whole function invocation) down with it.
  test('connect() resolves to null instead of throwing when MONGO_URI is unset', async () => {
    const saved = process.env.MONGO_URI;
    delete process.env.MONGO_URI;
    await expect(DB.connect()).resolves.toBeNull();
    if (saved !== undefined) process.env.MONGO_URI = saved;
  });

  test('connection state is reported from mongoose, not cached separately', () => {
    expect(DB.isConnected()).toBe(true);
    expect(DB.stateName()).toBe('connected');
  });
});
