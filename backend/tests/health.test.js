const { app, request } = require('./helpers');

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
