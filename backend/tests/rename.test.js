const {
  app,
  request,
  makeLaunderer,
  makeStudent,
  seedSettings,
  addCatalogItem,
  orderBody,
  models: { Order },
} = require('./helpers');

const ITEM = { clothingType: 'Shirt', washType: 'Simple Wash', price: 5 };

const rename = (cookie, username) =>
  request(app).patch('/user').set('Cookie', cookie).send({ username });

const laundererQueue = (cookie) =>
  request(app).get('/allorders').set('Cookie', cookie);

async function laundererWithAnOrder() {
  await seedSettings();
  const launderer = await makeLaunderer({ approved: true });
  await addCatalogItem(launderer.cookie, ITEM);
  const student = await makeStudent({ hostel: 'H1' });
  const res = await request(app)
    .post('/student/createorder')
    .set('Cookie', student.cookie)
    .send(orderBody(launderer.username, ITEM, 2));
  expect(res.status).toBe(201);
  return { launderer, student, order: res.body.order };
}

// Orders reference the launderer by _id, so a rename cannot detach them —
// there is no copy of the name to go stale. These guard the property rather
// than the mechanism: an implementation that went back to storing the name
// would fail here even if it carried the rename across correctly.
describe('Renaming a launderer keeps their records', () => {
  test('their order queue survives the rename', async () => {
    const { launderer } = await laundererWithAnOrder();
    expect((await laundererQueue(launderer.cookie)).body.orders).toHaveLength(
      1
    );

    const res = await rename(launderer.cookie, 'renamedwash');
    expect(res.status).toBe(200);

    // The cookie still carries the old username, so re-login to get a token
    // minted with the new one.
    const fresh = await request(app)
      .post('/login')
      .send({ username: 'renamedwash', password: 'Test@1234' });
    const cookie = fresh.headers['set-cookie'];

    const queue = await laundererQueue(cookie);
    expect(queue.body.orders).toHaveLength(1);
  });

  test('the order still points at the same launderer, by reference', async () => {
    const { launderer, order } = await laundererWithAnOrder();

    await rename(launderer.cookie, 'brightwash');

    const stored = await Order.findById(order._id).lean();
    // Unchanged, and that is the point: the order never held the name.
    expect(String(stored.launderer)).toBe(launderer.id);
  });

  test('the launderer resolves to their new name through the reference', async () => {
    const { launderer, order } = await laundererWithAnOrder();

    await rename(launderer.cookie, 'brightwash');

    const populated = await Order.findById(order._id).populate(
      'launderer',
      'username'
    );
    expect(populated.launderer.username).toBe('brightwash');
  });

  test('their analytics still count the order', async () => {
    const { launderer } = await laundererWithAnOrder();

    await rename(launderer.cookie, 'countwash');
    const fresh = await request(app)
      .post('/login')
      .send({ username: 'countwash', password: 'Test@1234' });

    const analytics = await request(app)
      .get('/launderer/analytics')
      .set('Cookie', fresh.headers['set-cookie']);

    expect(analytics.body.analytics.totalOrders).toBe(1);
  });

  test('a customer renaming themselves leaves the order untouched', async () => {
    const { student, order } = await laundererWithAnOrder();

    const res = await rename(student.cookie, 'newstudentname');
    expect(res.status).toBe(200);

    const stored = await Order.findById(order._id).lean();
    expect(String(stored.user)).toBe(String(order.user));
  });

  test('a rename to a taken username changes nothing', async () => {
    const { launderer, order } = await laundererWithAnOrder();
    const rival = await makeLaunderer({ approved: true });

    const res = await rename(launderer.cookie, rival.username);
    expect(res.status).toBe(409);

    // The order must still point at its own launderer, not the rival.
    const stored = await Order.findById(order._id).lean();
    expect(String(stored.launderer)).toBe(launderer.id);
    expect(String(stored.launderer)).not.toBe(rival.id);
  });
});

// username and hostel are both claims inside the JWT, so changing either used
// to leave the session carrying the old value until the user logged out and
// back in.
describe('Changing a profile field refreshes the session', () => {
  test('a student can order immediately after setting their hostel', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);

    // Signs in with no hostel, so the token carries an empty one.
    const student = await makeStudent({ hostel: null });
    const blocked = await request(app)
      .post('/student/createorder')
      .set('Cookie', student.cookie)
      .send(orderBody(launderer.username, ITEM));
    expect(blocked.status).toBe(401);

    const saved = await request(app)
      .patch('/user')
      .set('Cookie', student.cookie)
      .send({ hostel: 'H1' });
    expect(saved.status).toBe(200);

    // The response re-issues the cookie, which is what a browser would store.
    const refreshed = saved.headers['set-cookie'];
    expect(refreshed).toBeDefined();

    const res = await request(app)
      .post('/student/createorder')
      .set('Cookie', refreshed)
      .send(orderBody(launderer.username, ITEM));
    expect(res.status).toBe(201);
  });

  test('a profile edit that touches no token claim reissues nothing', async () => {
    const student = await makeStudent({ hostel: 'H1' });

    const res = await request(app)
      .patch('/user')
      .set('Cookie', student.cookie)
      .send({ room_number: '402' });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeUndefined();
  });
});
