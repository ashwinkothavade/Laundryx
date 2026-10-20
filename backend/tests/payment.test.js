const crypto = require('crypto');
const {
  app,
  request,
  makeStudent,
  makeLaunderer,
  seedSettings,
  addCatalogItem,
  orderBody,
  models,
} = require('./helpers');

const SECRET = 'test-razorpay-secret';
const sign = (rzpOrderId, paymentId) =>
  crypto
    .createHmac('sha256', SECRET)
    .update(`${rzpOrderId}|${paymentId}`)
    .digest('hex');

// Create a real, priced order and link it to a Razorpay order id, as
// POST /payment would.
const payableOrder = async (rzpOrderId) => {
  await seedSettings();
  const l = await makeLaunderer();
  const s = await makeStudent();
  const item = { clothingType: 'Shirt', washType: 'Wash', price: 500 };
  await addCatalogItem(l.cookie, item);
  const created = await request(app)
    .post('/student/createorder')
    .set('Cookie', s.cookie)
    .send(orderBody(l.username, item));
  const order = await models.Order.findById(created.body.order._id);
  if (rzpOrderId) {
    order.razorpayOrderId = rzpOrderId;
    await order.save();
  }
  return { order, student: s };
};

describe('Payment endpoints require authentication', () => {
  test('POST /payment rejects an anonymous caller', async () => {
    const res = await request(app).post('/payment').send({ orderId: 'x' });
    expect(res.status).toBe(401);
  });

  test('PUT /payment/validate rejects an anonymous caller', async () => {
    const res = await request(app).put('/payment/validate').send({});
    expect(res.status).toBe(401);
  });
});

describe('POST /payment derives the amount server-side', () => {
  test('refuses to start a payment for an order the caller does not own', async () => {
    const { order } = await payableOrder();
    const other = await makeStudent();
    const res = await request(app)
      .post('/payment')
      .set('Cookie', other.cookie)
      .send({ orderId: order._id.toString() });
    expect(res.status).toBe(403);
  });

  test('requires an orderId and ignores any client-supplied amount', async () => {
    const { student } = await payableOrder();
    const res = await request(app)
      .post('/payment')
      .set('Cookie', student.cookie)
      .send({ amount: 100, currency: 'INR' }); // the old attack shape
    expect(res.status).toBe(400);
  });

  test('refuses to re-charge an order that is already paid', async () => {
    const { order, student } = await payableOrder();
    order.paid = true;
    await order.save();
    const res = await request(app)
      .post('/payment')
      .set('Cookie', student.cookie)
      .send({ orderId: order._id.toString() });
    expect(res.status).toBe(409);
  });
});

describe('PUT /payment/validate binds the payment to one order', () => {
  const OLD = process.env.RAZORPAY_SECRET;
  beforeAll(() => {
    process.env.RAZORPAY_SECRET = SECRET;
  });
  afterAll(() => {
    if (OLD === undefined) delete process.env.RAZORPAY_SECRET;
    else process.env.RAZORPAY_SECRET = OLD;
  });

  test('rejects a forged signature', async () => {
    const { student } = await payableOrder('order_rzp_1');
    const res = await request(app)
      .put('/payment/validate')
      .set('Cookie', student.cookie)
      .send({
        razorpay_order_id: 'order_rzp_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: 'not-the-signature',
      });
    expect(res.status).toBe(401);
  });

  test('a genuine signature for an unrelated payment settles nothing', async () => {
    // The old attack: pay 1 rupee, take the valid signature, point it at a
    // different order. The order is now resolved from the signed razorpay
    // order id, so there is nothing to point.
    const { order, student } = await payableOrder(); // no razorpayOrderId
    const res = await request(app)
      .put('/payment/validate')
      .set('Cookie', student.cookie)
      .send({
        razorpay_order_id: 'order_attacker_own',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: sign('order_attacker_own', 'pay_1'),
        order_id: order._id.toString(), // ignored now
      });

    expect(res.status).toBe(404);
    expect((await models.Order.findById(order._id)).paid).toBe(false);
  });

  test('refuses to settle an order belonging to someone else', async () => {
    const { order } = await payableOrder('order_rzp_2');
    const other = await makeStudent();
    const res = await request(app)
      .put('/payment/validate')
      .set('Cookie', other.cookie)
      .send({
        razorpay_order_id: 'order_rzp_2',
        razorpay_payment_id: 'pay_2',
        razorpay_signature: sign('order_rzp_2', 'pay_2'),
      });

    expect(res.status).toBe(403);
    expect((await models.Order.findById(order._id)).paid).toBe(false);
  });

  test('settles the right order, and is idempotent on retry', async () => {
    const { order, student } = await payableOrder('order_rzp_3');
    const body = {
      razorpay_order_id: 'order_rzp_3',
      razorpay_payment_id: 'pay_3',
      razorpay_signature: sign('order_rzp_3', 'pay_3'),
    };

    const first = await request(app)
      .put('/payment/validate')
      .set('Cookie', student.cookie)
      .send(body);
    expect(first.status).toBe(200);

    const paid = await models.Order.findById(order._id);
    expect(paid.paid).toBe(true);
    expect(paid.paymentId).toBe('pay_3');

    // A duplicate delivery must not fail or double-apply.
    const second = await request(app)
      .put('/payment/validate')
      .set('Cookie', student.cookie)
      .send(body);
    expect(second.status).toBe(200);
    expect((await models.Order.findById(order._id)).paymentId).toBe('pay_3');
  });
});
