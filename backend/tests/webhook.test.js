const crypto = require('crypto');
const mongoose = require('mongoose');
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

const WEBHOOK_SECRET = 'test-webhook-secret';
const WebhookEvent = require('../models/webhookEventModel');

// POST a webhook exactly as Razorpay does: raw JSON bytes, signature over
// those bytes, and a unique event id header.
const deliver = (body, { eventId = 'evt_1', secret = WEBHOOK_SECRET } = {}) => {
  const raw = JSON.stringify(body);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(raw)
    .digest('hex');
  return request(app)
    .post('/payment/webhook')
    .set('Content-Type', 'application/json')
    .set('x-razorpay-signature', signature)
    .set('x-razorpay-event-id', eventId)
    .send(raw);
};

const captured = (razorpayOrderId, amount, paymentId = 'pay_wh_1') => ({
  entity: 'event',
  event: 'payment.captured',
  contains: ['payment'],
  payload: {
    payment: {
      entity: {
        id: paymentId,
        order_id: razorpayOrderId,
        amount,
        currency: 'INR',
        status: 'captured',
      },
    },
  },
});

// A real, server-priced order linked to a Razorpay order id.
const linkedOrder = async (razorpayOrderId, price = 500) => {
  await seedSettings();
  const l = await makeLaunderer();
  const s = await makeStudent();
  const item = { clothingType: 'Shirt', washType: 'Wash', price };
  await addCatalogItem(l.cookie, item);
  const created = await request(app)
    .post('/student/createorder')
    .set('Cookie', s.cookie)
    .send(orderBody(l.username, item));
  const order = await models.Order.findById(created.body.order._id);
  order.razorpayOrderId = razorpayOrderId;
  await order.save();
  return order;
};

describe('Razorpay webhook', () => {
  const OLD = process.env.RAZORPAY_WEBHOOK_SECRET;
  beforeAll(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });
  afterAll(() => {
    if (OLD === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = OLD;
  });

  test('needs no session — it is authenticated by signature', async () => {
    const order = await linkedOrder('order_wh_a');
    const res = await deliver(captured('order_wh_a', order.orderTotal * 100));
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('applied');
  });

  test('rejects a forged signature with 400', async () => {
    await linkedOrder('order_wh_b');
    const res = await deliver(captured('order_wh_b', 100), {
      secret: 'the-wrong-secret',
      eventId: 'evt_b',
    });
    expect(res.status).toBe(400);
    expect(
      (await models.Order.findOne({ razorpayOrderId: 'order_wh_b' })).paid
    ).toBe(false);
  });

  test('settles the order the payment actually belongs to', async () => {
    const order = await linkedOrder('order_wh_c');
    await deliver(captured('order_wh_c', order.orderTotal * 100, 'pay_c'), {
      eventId: 'evt_c',
    });

    const after = await models.Order.findById(order._id);
    expect(after.paid).toBe(true);
    expect(after.paymentId).toBe('pay_c');
  });

  test('confirms the order even though the browser never came back', async () => {
    // The whole point: no call to /payment/validate happens here at all.
    const order = await linkedOrder('order_wh_d');
    expect(order.paid).toBe(false);

    await deliver(captured('order_wh_d', order.orderTotal * 100), {
      eventId: 'evt_d',
    });
    expect((await models.Order.findById(order._id)).paid).toBe(true);
  });

  test('a re-delivered event is a no-op, not a second transition', async () => {
    const order = await linkedOrder('order_wh_e');
    const body = captured('order_wh_e', order.orderTotal * 100, 'pay_e');

    const first = await deliver(body, { eventId: 'evt_e' });
    const second = await deliver(body, { eventId: 'evt_e' });

    expect(first.body.status).toBe('applied');
    expect(second.status).toBe(200);
    expect(second.body.status).toBe('duplicate');
    expect(await WebhookEvent.countDocuments({ eventId: 'evt_e' })).toBe(1);
  });

  test('refuses to settle an order for the wrong amount', async () => {
    const order = await linkedOrder('order_wh_f', 500); // total 1000 -> 100000 paise
    const res = await deliver(captured('order_wh_f', 100), {
      eventId: 'evt_f',
    }); // paid 1 rupee

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('amount_mismatch');
    expect((await models.Order.findById(order._id)).paid).toBe(false);
  });

  test('records an unmatched event without erroring', async () => {
    const res = await deliver(captured('order_not_ours', 100), {
      eventId: 'evt_g',
    });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('unmatched');
  });

  test('ignores non-capture events, including payment.failed', async () => {
    const order = await linkedOrder('order_wh_h');
    const res = await deliver(
      {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: { id: 'pay_h', order_id: 'order_wh_h', amount: 1 },
          },
        },
      },
      { eventId: 'evt_h' }
    );
    expect(res.body.status).toBe('ignored');
    // Razorpay documents a failed event arriving before a successful capture,
    // so this must not mark the order failed or block a later capture.
    expect((await models.Order.findById(order._id)).paid).toBe(false);
  });

  test('handles order.paid, which carries the order entity too', async () => {
    const order = await linkedOrder('order_wh_i');
    const res = await deliver(
      {
        event: 'order.paid',
        payload: {
          order: {
            entity: { id: 'order_wh_i', amount: order.orderTotal * 100 },
          },
          payment: {
            entity: {
              id: 'pay_i',
              order_id: 'order_wh_i',
              amount: order.orderTotal * 100,
              status: 'captured',
            },
          },
        },
      },
      { eventId: 'evt_i' }
    );
    expect(res.body.status).toBe('applied');
    expect((await models.Order.findById(order._id)).paid).toBe(true);
  });

  test('leaves an audit record for every event it accepts', async () => {
    const order = await linkedOrder('order_wh_j');
    await deliver(captured('order_wh_j', order.orderTotal * 100, 'pay_j'), {
      eventId: 'evt_j',
    });

    const rec = await WebhookEvent.findOne({ eventId: 'evt_j' });
    expect(rec).not.toBeNull();
    expect(rec.outcome).toBe('applied');
    expect(rec.razorpayPaymentId).toBe('pay_j');
    expect(rec.order.toString()).toBe(order._id.toString());
  });
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await WebhookEvent.deleteMany({});
  }
});
