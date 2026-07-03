const {
  app,
  request,
  makeAdmin,
  makeStudent,
  makeLaunderer,
  seedSettings,
  addCatalogItem,
  orderBody,
  models,
} = require('./helpers');

const ITEM = { clothingType: 'Shirt', washType: 'Simple Wash', price: 100 };

const createOrder = (cookie, body) =>
  request(app).post('/student/createorder').set('Cookie', cookie).send(body);

describe('Coupons & express', () => {
  test('admin can create a coupon; a non-admin cannot (403)', async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .post('/admin/coupons')
      .set('Cookie', admin.cookie)
      .send({ code: 'SAVE10', discountType: 'percent', value: 10 });
    expect(res.status).toBe(201);

    const student = await makeStudent();
    const blocked = await request(app)
      .post('/admin/coupons')
      .set('Cookie', student.cookie)
      .send({ code: 'HACK', discountType: 'flat', value: 5 });
    expect(blocked.status).toBe(403);
  });

  test('preview returns a discount and respects the minimum order', async () => {
    const admin = await makeAdmin();
    await request(app).post('/admin/coupons').set('Cookie', admin.cookie).send({
      code: 'MIN50',
      discountType: 'percent',
      value: 20,
      minOrder: 50,
    });

    const student = await makeStudent();
    const ok = await request(app)
      .get('/coupons/MIN50?subtotal=100')
      .set('Cookie', student.cookie);
    expect(ok.body.valid).toBe(true);
    expect(ok.body.discount).toBe(20);

    const below = await request(app)
      .get('/coupons/MIN50?subtotal=40')
      .set('Cookie', student.cookie);
    expect(below.body.valid).toBe(false);
  });

  test('an order applies a coupon discount to the total', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);
    const admin = await makeAdmin();
    await request(app)
      .post('/admin/coupons')
      .set('Cookie', admin.cookie)
      .send({ code: 'FLAT30', discountType: 'flat', value: 30 });

    const student = await makeStudent({ hostel: 'H1' });
    const body = orderBody(launderer.username, ITEM, 1); // subtotal 100
    body.couponCode = 'FLAT30';
    const res = await createOrder(student.cookie, body);
    expect(res.status).toBe(201);
    expect(res.body.order.subtotal).toBe(100);
    expect(res.body.order.discount).toBe(30);
    expect(res.body.order.orderTotal).toBe(70);
  });

  test('express surcharge is added when the launderer offers it', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({
      approved: true,
      expressSurcharge: 40,
    });
    await addCatalogItem(launderer.cookie, ITEM);

    const student = await makeStudent({ hostel: 'H1' });
    const body = orderBody(launderer.username, ITEM, 1); // subtotal 100
    body.express = true;
    const res = await createOrder(student.cookie, body);
    expect(res.status).toBe(201);
    expect(res.body.order.expressCharge).toBe(40);
    expect(res.body.order.orderTotal).toBe(140);
  });

  test('applies tax from the taxPercent setting', async () => {
    await seedSettings();
    await models.Setting.create({ key: 'taxPercent', values: ['10'] });
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM); // price 100
    const student = await makeStudent({ hostel: 'H1' });
    const res = await createOrder(
      student.cookie,
      orderBody(launderer.username, ITEM, 1)
    );
    expect(res.status).toBe(201);
    expect(res.body.order.tax).toBe(10); // 10% of 100
    expect(res.body.order.orderTotal).toBe(110);
  });

  test('express is ignored when the launderer does not offer it', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true }); // no surcharge
    await addCatalogItem(launderer.cookie, ITEM);
    const student = await makeStudent({ hostel: 'H1' });
    const body = orderBody(launderer.username, ITEM, 1);
    body.express = true;
    const res = await createOrder(student.cookie, body);
    expect(res.body.order.expressCharge).toBe(0);
    expect(res.body.order.orderTotal).toBe(100);
  });
});
