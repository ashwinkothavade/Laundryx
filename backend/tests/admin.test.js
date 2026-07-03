const {
  app,
  request,
  makeAdmin,
  makeStudent,
  makeLaunderer,
} = require('./helpers');

describe('Admin management', () => {
  test('non-admins are blocked from admin routes (403)', async () => {
    const student = await makeStudent();
    const res = await request(app)
      .get('/admin/users')
      .set('Cookie', student.cookie);
    expect(res.status).toBe(403);
  });

  test('admin can list users', async () => {
    const admin = await makeAdmin();
    await makeStudent();
    const res = await request(app)
      .get('/admin/users')
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    expect(res.body.users.every((u) => u.password === undefined)).toBe(true);
  });

  test('approving a launderer makes it visible to students', async () => {
    const admin = await makeAdmin();
    const launderer = await makeLaunderer({ approved: false });
    const student = await makeStudent();

    let list = await request(app)
      .get('/launderers')
      .set('Cookie', student.cookie);
    expect(
      list.body.find((l) => l.username === launderer.username)
    ).toBeUndefined();

    const approve = await request(app)
      .patch(`/admin/users/${launderer.id}/approval`)
      .set('Cookie', admin.cookie)
      .send({ approved: true });
    expect(approve.status).toBe(200);

    list = await request(app).get('/launderers').set('Cookie', student.cookie);
    expect(
      list.body.find((l) => l.username === launderer.username)
    ).toBeDefined();
  });

  test('admin can change a user’s role and delete a user', async () => {
    const admin = await makeAdmin();
    const { username } = await makeStudent();
    const users = await request(app)
      .get('/admin/users')
      .set('Cookie', admin.cookie);
    const target = users.body.users.find((u) => u.username === username);

    const role = await request(app)
      .patch(`/admin/users/${target._id}/role`)
      .set('Cookie', admin.cookie)
      .send({ role: 'launderer' });
    expect(role.status).toBe(200);
    expect(role.body.user.role).toBe('launderer');

    const del = await request(app)
      .delete(`/admin/users/${target._id}`)
      .set('Cookie', admin.cookie);
    expect(del.status).toBe(200);
  });

  test('admin analytics returns aggregate counts', async () => {
    const admin = await makeAdmin();
    await makeStudent();
    const res = await request(app)
      .get('/admin/analytics')
      .set('Cookie', admin.cookie);
    expect(res.status).toBe(200);
    expect(res.body.analytics.usersByRole.admin).toBeGreaterThanOrEqual(1);
    expect(res.body.analytics).toHaveProperty('totalOrders');
    expect(res.body.analytics).toHaveProperty('paidRevenue');
  });
});

describe('Launderer analytics', () => {
  test('a launderer sees their own analytics; a student is blocked (403)', async () => {
    const launderer = await makeLaunderer({ approved: true });
    const res = await request(app)
      .get('/launderer/analytics')
      .set('Cookie', launderer.cookie);
    expect(res.status).toBe(200);
    expect(res.body.analytics).toHaveProperty('totalOrders');

    const student = await makeStudent();
    const blocked = await request(app)
      .get('/launderer/analytics')
      .set('Cookie', student.cookie);
    expect(blocked.status).toBe(403);
  });

  test('a launderer can set their available time slots', async () => {
    const launderer = await makeLaunderer({ approved: true });
    const res = await request(app)
      .put('/launderer/availability')
      .set('Cookie', launderer.cookie)
      .send({ timeSlots: ['09:00 AM', '06:00 PM'] });
    expect(res.status).toBe(200);
    expect(res.body.availableTimeSlots).toEqual(['09:00 AM', '06:00 PM']);
  });
});
