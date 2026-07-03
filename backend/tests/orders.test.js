const {
  app,
  request,
  makeLaunderer,
  makeStudent,
  makeAdmin,
  seedSettings,
  addCatalogItem,
  orderBody,
} = require('./helpers');

const ITEM = { clothingType: 'Shirt', washType: 'Simple Wash', price: 5 };

async function setupOrderWorld() {
  await seedSettings();
  const launderer = await makeLaunderer({ approved: true });
  await addCatalogItem(launderer.cookie, ITEM);
  const student = await makeStudent({ hostel: 'H1' });
  return { launderer, student };
}

const create = (cookie, body) =>
  request(app).post('/student/createorder').set('Cookie', cookie).send(body);

describe('Order creation & pricing', () => {
  test('creates an order and computes the total from the catalog', async () => {
    const { launderer, student } = await setupOrderWorld();
    const res = await create(
      student.cookie,
      orderBody(launderer.username, ITEM, 3)
    );
    expect(res.status).toBe(201);
    expect(res.body.order.orderTotal).toBe(15); // 3 x 5, server-side
  });

  test('ignores a client-tampered price and uses the catalog price', async () => {
    const { launderer, student } = await setupOrderWorld();
    const body = orderBody(launderer.username, ITEM, 2);
    body.items[0].pricePerItem = 0.01; // attempt to cheat
    const res = await create(student.cookie, body);
    expect(res.status).toBe(201);
    expect(res.body.order.orderTotal).toBe(10); // 2 x 5, not the tampered price
  });

  test('rejects an item not in the launderer’s catalog (400)', async () => {
    const { launderer, student } = await setupOrderWorld();
    const body = orderBody(launderer.username, {
      clothingType: 'Blanket',
      washType: 'Dry Clean',
    });
    const res = await create(student.cookie, body);
    expect(res.status).toBe(400);
  });

  test('rejects an invalid pickup location (400)', async () => {
    const { launderer, student } = await setupOrderWorld();
    const body = orderBody(launderer.username, ITEM);
    body.pickupAddress = 'NotARealPlace';
    const res = await create(student.cookie, body);
    expect(res.status).toBe(400);
  });

  test('rejects an invalid time slot (400)', async () => {
    const { launderer, student } = await setupOrderWorld();
    const body = orderBody(launderer.username, ITEM);
    body.pickupTime = '03:00 AM';
    const res = await create(student.cookie, body);
    expect(res.status).toBe(400);
  });

  test('rejects ordering from an unapproved launderer (404)', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: false });
    await addCatalogItem(launderer.cookie, ITEM);
    const student = await makeStudent({ hostel: 'H1' });
    const res = await create(
      student.cookie,
      orderBody(launderer.username, ITEM)
    );
    expect(res.status).toBe(404);
  });

  test('an admin (non-student) cannot create an order (401)', async () => {
    const { launderer } = await setupOrderWorld();
    const admin = await makeAdmin();
    const res = await create(admin.cookie, orderBody(launderer.username, ITEM));
    expect(res.status).toBe(401);
  });
});

describe('Order lifecycle', () => {
  async function placedOrder() {
    const { launderer, student } = await setupOrderWorld();
    const res = await create(
      student.cookie,
      orderBody(launderer.username, ITEM)
    );
    return { launderer, student, order: res.body.order };
  }

  test('accept → pickup → deliver transitions the statuses', async () => {
    const { launderer, student, order } = await placedOrder();

    const accept = await request(app)
      .put(`/acceptorder/${order._id}`)
      .set('Cookie', launderer.cookie);
    expect(accept.status).toBe(200);

    const pickup = await request(app)
      .put(`/student/updatepickupstatus/${order._id}`)
      .set('Cookie', student.cookie);
    expect(pickup.status).toBe(200);

    const deliver = await request(app)
      .put(`/updatedeliveredstatus/${order._id}`)
      .set('Cookie', launderer.cookie);
    expect(deliver.status).toBe(200);
    expect(deliver.body.updatedOrder.deliveredStatus).toBe(true);
  });

  test('reschedule works before pickup and is blocked after', async () => {
    const { launderer, student, order } = await placedOrder();

    const ok = await request(app)
      .put(`/student/reschedule/${order._id}`)
      .set('Cookie', student.cookie)
      .send({ pickupTime: '04:00 PM' });
    expect(ok.status).toBe(200);
    expect(ok.body.updatedOrder.pickupTime).toBe('04:00 PM');

    await request(app)
      .put(`/acceptorder/${order._id}`)
      .set('Cookie', launderer.cookie);
    await request(app)
      .put(`/student/updatepickupstatus/${order._id}`)
      .set('Cookie', student.cookie);

    const blocked = await request(app)
      .put(`/student/reschedule/${order._id}`)
      .set('Cookie', student.cookie)
      .send({ pickupTime: '12:00 PM' });
    expect(blocked.status).toBe(400);
  });

  test('a student can cancel their own order before pickup', async () => {
    const { student, order } = await placedOrder();
    const res = await request(app)
      .put(`/student/cancelorder/${order._id}`)
      .set('Cookie', student.cookie);
    expect(res.status).toBe(200);

    const list = await request(app)
      .get('/student/orders')
      .set('Cookie', student.cookie);
    expect(list.body.orders).toHaveLength(0);
  });

  test('a different student cannot cancel someone else’s order (403)', async () => {
    const { order } = await placedOrder();
    const other = await makeStudent();
    const res = await request(app)
      .put(`/student/cancelorder/${order._id}`)
      .set('Cookie', other.cookie);
    expect(res.status).toBe(403);
  });
});
