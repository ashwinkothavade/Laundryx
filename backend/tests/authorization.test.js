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

// Two launderers and a student with an order placed with the FIRST launderer.
const marketplace = async () => {
  await seedSettings();
  const mine = await makeLaunderer();
  const rival = await makeLaunderer();
  const student = await makeStudent();
  const item = { clothingType: 'Shirt', washType: 'Wash', price: 20 };
  await addCatalogItem(mine.cookie, item);
  const created = await request(app)
    .post('/student/createorder')
    .set('Cookie', student.cookie)
    .send(orderBody(mine.username, item));
  return { mine, rival, student, orderId: created.body.order._id };
};

describe('A launderer can only act on their own orders', () => {
  const singleOrderRoutes = [
    ['put', '/acceptorder'],
    ['put', '/rejectorder'],
    ['put', '/updatedeliveredstatus'],
    ['put', '/updatedeliverydate'],
  ];

  test.each(singleOrderRoutes)(
    'a rival launderer is refused on %s %s/:id',
    async (method, path) => {
      const { rival, orderId } = await marketplace();
      const res = await request(app)
        [method](`${path}/${orderId}`)
        .set('Cookie', rival.cookie)
        .send({ deliveryDate: 'HACKED' });

      expect(res.status).toBe(403);

      // and nothing moved
      const after = await models.Order.findById(orderId);
      expect(after.acceptedStatus).toBe(false);
      expect(after.deliveredStatus).toBe(false);
      expect(after.deliveryDate).not.toBe('HACKED');
    }
  );

  test('the launderer the order belongs to can still accept it', async () => {
    const { mine, orderId } = await marketplace();
    const res = await request(app)
      .put(`/acceptorder/${orderId}`)
      .set('Cookie', mine.cookie);
    expect(res.status).toBe(200);
    expect((await models.Order.findById(orderId)).acceptedStatus).toBe(true);
  });

  test('a customer cannot reach launderer order routes at all', async () => {
    const { student, orderId } = await marketplace();
    const res = await request(app)
      .put(`/acceptorder/${orderId}`)
      .set('Cookie', student.cookie);
    expect(res.status).toBe(403);
  });

  test('a missing order is a 404, not a 403 leak about existence', async () => {
    const { mine } = await marketplace();
    const res = await request(app)
      .put('/acceptorder/000000000000000000000000')
      .set('Cookie', mine.cookie);
    expect(res.status).toBe(404);
  });
});

describe('A launderer only sees their own slice of a student history', () => {
  test('GET /orders/:username is scoped to the relationship', async () => {
    const { mine, rival, student } = await marketplace();

    const own = await request(app)
      .get(`/orders/${student.username}`)
      .set('Cookie', mine.cookie);
    expect(own.status).toBe(200);
    expect(own.body.orders).toHaveLength(1);

    // The rival has no orders with this student and must see none of them.
    const theirs = await request(app)
      .get(`/orders/${student.username}`)
      .set('Cookie', rival.cookie);
    expect(theirs.status).toBe(200);
    expect(theirs.body.orders).toHaveLength(0);
  });
});

describe('A customer can only act on their own orders', () => {
  const ownOrderRoutes = [
    ['put', '/student/updatepickupstatus'],
    ['put', '/student/updatedeliverystatus'],
    ['put', '/student/reschedule'],
    ['put', '/student/cancelorder'],
    ['delete', '/student/deleteorder'],
  ];

  test.each(ownOrderRoutes)(
    'another customer is refused on %s %s/:id',
    async (method, path) => {
      const { orderId } = await marketplace();
      const bystander = await makeStudent();
      const res = await request(app)
        [method](`${path}/${orderId}`)
        .set('Cookie', bystander.cookie)
        .send({ pickupDate: 'Mon, 1 Jan 2035' });

      expect(res.status).toBe(403);
      expect(await models.Order.findById(orderId)).not.toBeNull();
    }
  );
});
