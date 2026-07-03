const { app, request, signup, login, makeLaunderer } = require('./helpers');

describe('Auth', () => {
  test('signup creates a student and sets an auth cookie', async () => {
    const { res, body } = await signup({ role: 'student' });
    expect(res.status).toBe(201);
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.body.role).toBe('student');
    expect(res.body.newUser.username).toBe(body.username);
  });

  test('signup rejects a duplicate username', async () => {
    const { body } = await signup();
    const res = await request(app)
      .post('/signup')
      .send({
        ...body,
        email: 'other@test.com',
        phone_number: '+919111111111',
      });
    expect(res.status).toBe(500);
    expect(res.body.errors).toBeDefined();
  });

  test('login succeeds with correct credentials', async () => {
    const { body } = await signup();
    const { res } = await login(body.username);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe(body.username);
  });

  test('login fails with a wrong password', async () => {
    const { body } = await signup();
    const { res } = await login(body.username, 'Wrong@1234');
    expect(res.status).toBe(401);
  });

  test('GET /me returns the current user with a cookie, 401 without', async () => {
    const { body } = await signup();
    const { cookie } = await login(body.username);

    const authed = await request(app).get('/me').set('Cookie', cookie);
    expect(authed.status).toBe(200);
    expect(authed.body.username).toBe(body.username);
    expect(authed.body.password).toBeUndefined();

    const anon = await request(app).get('/me');
    expect(anon.status).toBe(401);
  });

  test('a new launderer is unapproved by default', async () => {
    const { cookie } = await makeLaunderer({ approved: false });
    const me = await request(app).get('/me').set('Cookie', cookie);
    expect(me.body.role).toBe('launderer');
    expect(me.body.approved).toBe(false);
  });
});
