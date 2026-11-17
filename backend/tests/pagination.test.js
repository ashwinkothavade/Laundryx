const {
  app,
  request,
  makeAdmin,
  makeLaunderer,
  makeStudent,
  seedSettings,
  addCatalogItem,
  orderBody,
} = require('./helpers');

const ITEM = { clothingType: 'Shirt', washType: 'Simple Wash', price: 5 };

const users = (cookie, qs = '') =>
  request(app).get(`/admin/users${qs}`).set('Cookie', cookie);
const orders = (cookie, qs = '') =>
  request(app).get(`/admin/orders${qs}`).set('Cookie', cookie);
const catalog = (cookie, qs = '') =>
  request(app).get(`/admin/catalog${qs}`).set('Cookie', cookie);

describe('Admin lists are paginated', () => {
  test('a page is capped and reports the total behind it', async () => {
    const admin = await makeAdmin();
    await Promise.all([makeStudent(), makeStudent(), makeStudent()]);

    const res = await users(admin.cookie, '?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(2);
    expect(res.body.total).toBeGreaterThanOrEqual(4); // 3 students + the admin
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.totalPages).toBe(Math.ceil(res.body.total / 2));
  });

  test('the second page continues rather than repeating the first', async () => {
    const admin = await makeAdmin();
    await Promise.all([makeStudent(), makeStudent(), makeStudent()]);

    const [p1, p2] = await Promise.all([
      users(admin.cookie, '?page=1&limit=2'),
      users(admin.cookie, '?page=2&limit=2'),
    ]);

    const names1 = p1.body.users.map((u) => u.username);
    const names2 = p2.body.users.map((u) => u.username);
    expect(names2.some((n) => names1.includes(n))).toBe(false);
  });

  test('a page past the end is empty, not an error', async () => {
    const admin = await makeAdmin();
    const res = await users(admin.cookie, '?page=999&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.users).toEqual([]);
  });

  test('limit is capped, so a client cannot ask for everything', async () => {
    const admin = await makeAdmin();
    const res = await users(admin.cookie, '?limit=100000');
    expect(res.body.limit).toBe(100);
  });

  test('nonsense paging values fall back to the defaults', async () => {
    const admin = await makeAdmin();
    const res = await users(admin.cookie, '?page=-4&limit=abc');
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(25);
  });
});

describe('Admin list filtering happens on the server', () => {
  test('users can be filtered by role', async () => {
    const admin = await makeAdmin();
    await makeStudent();
    await makeLaunderer({ approved: true });

    const res = await users(admin.cookie, '?role=launderer');

    expect(res.body.users.every((u) => u.role === 'launderer')).toBe(true);
    expect(res.body.total).toBe(res.body.users.length);
  });

  test('a search matches across the whole collection, not just one page', async () => {
    const admin = await makeAdmin();
    const target = await makeLaunderer({ approved: true });
    await Promise.all([makeStudent(), makeStudent(), makeStudent()]);

    // Deliberately a page size that would exclude the match by position.
    const res = await users(admin.cookie, `?q=${target.username}&limit=1`);

    expect(res.body.total).toBe(1);
    expect(res.body.users[0].username).toBe(target.username);
  });

  test('a search with regex characters is treated as text', async () => {
    const admin = await makeAdmin();
    await makeStudent();

    // Unescaped, ".*" would match every user.
    const res = await users(admin.cookie, '?q=.*');

    expect(res.body.total).toBe(0);
  });

  test('orders can be filtered by status and payment', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);
    const student = await makeStudent({ hostel: 'H1' });
    await request(app)
      .post('/student/createorder')
      .set('Cookie', student.cookie)
      .send(orderBody(launderer.username, ITEM));
    const admin = await makeAdmin();

    const pending = await orders(admin.cookie, '?status=pending');
    const unpaid = await orders(admin.cookie, '?paid=unpaid');
    const paid = await orders(admin.cookie, '?paid=paid');

    expect(pending.body.total).toBe(1);
    expect(unpaid.body.total).toBe(1);
    expect(paid.body.total).toBe(0);
  });

  test('orders can be searched by the customer behind the reference', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);
    const student = await makeStudent({ hostel: 'H1' });
    await request(app)
      .post('/student/createorder')
      .set('Cookie', student.cookie)
      .send(orderBody(launderer.username, ITEM));
    const admin = await makeAdmin();

    const byCustomer = await orders(admin.cookie, `?q=${student.username}`);
    const byLaunderer = await orders(admin.cookie, `?q=${launderer.username}`);

    expect(byCustomer.body.total).toBe(1);
    expect(byLaunderer.body.total).toBe(1);
  });

  test('catalog can be searched by item or by launderer', async () => {
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);
    const admin = await makeAdmin();

    const byItem = await catalog(admin.cookie, '?q=Shirt');
    const byOwner = await catalog(admin.cookie, `?q=${launderer.username}`);
    const miss = await catalog(admin.cookie, '?q=Parachute');

    expect(byItem.body.total).toBe(1);
    expect(byOwner.body.total).toBe(1);
    expect(miss.body.total).toBe(0);
  });
});

describe('Admin analytics carries the figures the lists no longer can', () => {
  test('counts pending approvals, outstanding money and order stages', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);
    await makeLaunderer({ approved: false }); // one awaiting approval
    const student = await makeStudent({ hostel: 'H1' });
    await request(app)
      .post('/student/createorder')
      .set('Cookie', student.cookie)
      .send(orderBody(launderer.username, ITEM, 4)); // 4 x 5 = 20, unpaid
    const admin = await makeAdmin();

    const { body } = await request(app)
      .get('/admin/analytics')
      .set('Cookie', admin.cookie);

    expect(body.analytics.pendingApprovals).toBe(1);
    expect(body.analytics.outstanding).toBe(20);
    expect(body.analytics.avgOrderValue).toBe(0); // nothing paid yet
    expect(body.analytics.statusCounts).toEqual({
      pending: 1,
      accepted: 0,
      pickedup: 0,
      delivered: 0,
    });
  });
});
