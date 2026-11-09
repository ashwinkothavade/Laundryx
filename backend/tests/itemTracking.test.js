const {
  app,
  request,
  makeLaunderer,
  makeStudent,
  seedSettings,
  addCatalogItem,
  orderBody,
} = require('./helpers');

const ITEM = { clothingType: 'Shirt', washType: 'Simple Wash', price: 5 };
const OTHER = { clothingType: 'Jeans', washType: 'Dry Clean', price: 30 };

const stageUrl = (orderId, itemId) =>
  `/launderer/orders/${orderId}/items/${itemId}/stage`;

const setStage = (cookie, orderId, itemId, stage) =>
  request(app)
    .put(stageUrl(orderId, itemId))
    .set('Cookie', cookie)
    .send({ stage });

const accept = (cookie, orderId) =>
  request(app).put(`/acceptorder/${orderId}`).set('Cookie', cookie).send({});

async function placedOrder({ items = [ITEM] } = {}) {
  await seedSettings();
  const launderer = await makeLaunderer({ approved: true });
  await Promise.all(items.map((i) => addCatalogItem(launderer.cookie, i)));
  const student = await makeStudent({ hostel: 'H1' });

  const body = orderBody(launderer.username, items[0], 3);
  body.items = items.map((i, n) => ({
    name: i.clothingType,
    washType: i.washType,
    quantity: n + 1,
  }));
  const res = await request(app)
    .post('/student/createorder')
    .set('Cookie', student.cookie)
    .send(body);
  expect(res.status).toBe(201);
  return { launderer, student, order: res.body.order };
}

const studentOrders = (cookie) =>
  request(app).get('/student/orders').set('Cookie', cookie);

describe('Per-item tracking', () => {
  test('every item starts pending', async () => {
    const { order } = await placedOrder({ items: [ITEM, OTHER] });
    expect(order.items.map((i) => i.stage)).toEqual(['pending', 'pending']);
  });

  test('a launderer moves one item without touching the rest', async () => {
    const { launderer, order } = await placedOrder({ items: [ITEM, OTHER] });
    await accept(launderer.cookie, order._id);

    const res = await setStage(
      launderer.cookie,
      order._id,
      order.items[0]._id,
      'washing'
    );

    expect(res.status).toBe(200);
    expect(res.body.order.items[0].stage).toBe('washing');
    expect(res.body.order.items[1].stage).toBe('pending');
  });

  test('the student sees the stage the launderer set', async () => {
    const { launderer, student, order } = await placedOrder();
    await accept(launderer.cookie, order._id);
    await setStage(launderer.cookie, order._id, order.items[0]._id, 'ready');

    const mine = await studentOrders(student.cookie);
    const seen = mine.body.orders.find((o) => o._id === order._id);

    expect(seen.items[0].stage).toBe('ready');
  });

  test('an unknown stage is refused', async () => {
    const { launderer, order } = await placedOrder();
    await accept(launderer.cookie, order._id);

    const res = await setStage(
      launderer.cookie,
      order._id,
      order.items[0]._id,
      'incinerated'
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/pending, washing, ready, returned/);
  });

  test('items cannot be tracked before the order is accepted', async () => {
    const { launderer, order } = await placedOrder();

    const res = await setStage(
      launderer.cookie,
      order._id,
      order.items[0]._id,
      'washing'
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Accept the order/);
  });

  test('an item id from another order is a 404, not someone else’s item', async () => {
    const { launderer, order } = await placedOrder();
    const other = await placedOrder();
    await accept(launderer.cookie, order._id);

    const res = await setStage(
      launderer.cookie,
      order._id,
      other.order.items[0]._id,
      'washing'
    );

    expect(res.status).toBe(404);
  });

  test('a rival launderer cannot move items on an order they were not given', async () => {
    const { launderer, order } = await placedOrder();
    await accept(launderer.cookie, order._id);
    const rival = await makeLaunderer({ approved: true });

    const res = await setStage(
      rival.cookie,
      order._id,
      order.items[0]._id,
      'ready'
    );

    expect(res.status).toBe(403);
  });

  test('a student cannot move their own items along', async () => {
    const { launderer, student, order } = await placedOrder();
    await accept(launderer.cookie, order._id);

    const res = await setStage(
      student.cookie,
      order._id,
      order.items[0]._id,
      'ready'
    );

    expect(res.status).toBe(403);
  });
});
