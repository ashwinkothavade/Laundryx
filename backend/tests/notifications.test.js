const {
  app,
  request,
  makeStudent,
  makeLaunderer,
  seedSettings,
  addCatalogItem,
  orderBody,
} = require('./helpers');

const Notification = require('../models/notificationModel');

// A student with a real order placed with `launderer`.
const withOrder = async () => {
  await seedSettings();
  const launderer = await makeLaunderer();
  const student = await makeStudent();
  const item = { clothingType: 'Shirt', washType: 'Wash', price: 20 };
  await addCatalogItem(launderer.cookie, item);
  const created = await request(app)
    .post('/student/createorder')
    .set('Cookie', student.cookie)
    .send(orderBody(launderer.username, item));
  return { launderer, student, orderId: created.body.order._id };
};

describe('Sending a notification', () => {
  test('a customer can notify a launderer they have ordered from', async () => {
    const { launderer, student } = await withOrder();
    const res = await request(app)
      .post('/notifications')
      .set('Cookie', student.cookie)
      .send({ launderer: launderer.username, message: 'Running late' });

    expect(res.status).toBe(201);
    expect(res.body.notification.launderer).toBe(launderer.username);
  });

  test('a customer cannot message a launderer they have no order with', async () => {
    const { student } = await withOrder();
    const stranger = await makeLaunderer();
    const res = await request(app)
      .post('/notifications')
      .set('Cookie', student.cookie)
      .send({ launderer: stranger.username, message: 'Spam' });

    expect(res.status).toBe(403);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test("a launderer cannot notify about another launderer's order", async () => {
    const { orderId } = await withOrder();
    const rival = await makeLaunderer();
    const res = await request(app)
      .post('/notifications')
      .set('Cookie', rival.cookie)
      .send({ orderId, message: 'Your order is ready' });

    expect(res.status).toBe(403);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test('an empty message is rejected', async () => {
    const { launderer, student } = await withOrder();
    const res = await request(app)
      .post('/notifications')
      .set('Cookie', student.cookie)
      .send({ launderer: launderer.username, message: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('Deleting a notification', () => {
  test('the recipient can delete their own', async () => {
    const { launderer, student } = await withOrder();
    await request(app)
      .post('/notifications')
      .set('Cookie', student.cookie)
      .send({ launderer: launderer.username, message: 'Running late' });

    const note = await Notification.findOne({});
    const res = await request(app)
      .delete(`/notifications/${note._id}`)
      .set('Cookie', launderer.cookie);

    expect(res.status).toBe(200);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test('someone else cannot delete it', async () => {
    const { launderer, student } = await withOrder();
    await request(app)
      .post('/notifications')
      .set('Cookie', student.cookie)
      .send({ launderer: launderer.username, message: 'Running late' });

    const note = await Notification.findOne({});
    const bystander = await makeLaunderer();
    const res = await request(app)
      .delete(`/notifications/${note._id}`)
      .set('Cookie', bystander.cookie);

    expect(res.status).toBe(403);
    expect(await Notification.countDocuments()).toBe(1);
  });

  test('a missing id is a clean 404, not a double send', async () => {
    const s = await makeStudent();
    const res = await request(app)
      .delete('/notifications/000000000000000000000000')
      .set('Cookie', s.cookie);

    // Previously this sent 404 and then tried to send 200 on the same
    // response, throwing ERR_HTTP_HEADERS_SENT.
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Notification not found');
  });
});

afterAll(async () => {
  await Notification.deleteMany({}).catch(() => {});
});
