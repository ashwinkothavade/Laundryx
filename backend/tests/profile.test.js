const {
  app,
  request,
  PASSWORD,
  makeStudent,
  makeLaunderer,
  models,
} = require('./helpers');

describe('PATCH /user — self-service profile only', () => {
  test('updates the fields a user legitimately owns', async () => {
    const s = await makeStudent({ hostel: '' });
    const res = await request(app)
      .patch('/user')
      .set('Cookie', s.cookie)
      .send({ hostel: 'H4', room_number: '201', roll_number: 'B21CS001' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      hostel: 'H4',
      room_number: '201',
      roll_number: 'B21CS001',
    });
  });

  test('never echoes the password hash back to the client', async () => {
    const s = await makeStudent();
    const res = await request(app)
      .patch('/user')
      .set('Cookie', s.cookie)
      .send({ room_number: '7' });

    expect(res.status).toBe(200);
    expect(res.body.password).toBeUndefined();
  });

  test('ignores role, so a customer cannot make itself an admin', async () => {
    const s = await makeStudent();
    const res = await request(app)
      .patch('/user')
      .set('Cookie', s.cookie)
      .send({ hostel: 'H1', role: 'admin' });

    expect(res.status).toBe(200);
    expect((await models.User.findOne({ username: s.username })).role).toBe(
      'customer'
    );

    // And the admin console stays shut even after a fresh login.
    const relog = await request(app)
      .post('/login')
      .send({ username: s.username, password: PASSWORD });
    const admin = await request(app)
      .get('/admin/users')
      .set('Cookie', relog.headers['set-cookie']);
    expect(admin.status).toBe(403);
  });

  test('ignores approved, so a launderer cannot bypass the admin gate', async () => {
    const l = await makeLaunderer({ approved: false });
    const res = await request(app)
      .patch('/user')
      .set('Cookie', l.cookie)
      .send({ approved: true });

    expect(res.status).toBe(400); // nothing updatable was sent
    expect((await models.User.findOne({ username: l.username })).approved).toBe(
      false
    );

    const dir = await request(app)
      .get('/launderers/directory')
      .set('Cookie', l.cookie);
    expect(dir.body.launderers).toHaveLength(0);
  });

  test('ignores password, so it cannot be written unhashed', async () => {
    const s = await makeStudent();
    await request(app)
      .patch('/user')
      .set('Cookie', s.cookie)
      .send({ hostel: 'H3', password: 'Pwned@1234' });

    const stored = (await models.User.findOne({ username: s.username }))
      .password;
    expect(stored.startsWith('$2')).toBe(true); // still a bcrypt hash
    expect(stored).not.toBe('Pwned@1234');

    // The injected password does not work, the real one still does.
    const bad = await request(app)
      .post('/login')
      .send({ username: s.username, password: 'Pwned@1234' });
    expect(bad.status).toBe(401);
    const good = await request(app)
      .post('/login')
      .send({ username: s.username, password: PASSWORD });
    expect(good.status).toBe(200);
  });

  test('rejects a body with nothing updatable in it', async () => {
    const s = await makeStudent();
    const res = await request(app)
      .patch('/user')
      .set('Cookie', s.cookie)
      .send({ role: 'admin', approved: true, _id: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('Password hashing is idempotent across saves', () => {
  test('re-saving a user does not invalidate their password', async () => {
    const s = await makeStudent();
    const user = await models.User.findOne({ username: s.username });

    // A save that touches an unrelated field must not re-hash the hash.
    user.room_number = '42';
    await user.save();

    const res = await request(app)
      .post('/login')
      .send({ username: s.username, password: PASSWORD });
    expect(res.status).toBe(200);
  });
});
