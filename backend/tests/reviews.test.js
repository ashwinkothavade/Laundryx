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

// Place an order and drive it all the way to delivered.
async function deliveredOrder() {
  await seedSettings();
  const launderer = await makeLaunderer({ approved: true });
  await addCatalogItem(launderer.cookie, ITEM);
  const student = await makeStudent({ hostel: 'H1' });

  const placed = await request(app)
    .post('/student/createorder')
    .set('Cookie', student.cookie)
    .send(orderBody(launderer.username, ITEM));
  const { order } = placed.body;

  await request(app)
    .put(`/acceptorder/${order._id}`)
    .set('Cookie', launderer.cookie);
  await request(app)
    .put(`/student/updatepickupstatus/${order._id}`)
    .set('Cookie', student.cookie);
  await request(app)
    .put(`/updatedeliveredstatus/${order._id}`)
    .set('Cookie', launderer.cookie);

  return { launderer, student, order };
}

describe('Reviews & ratings', () => {
  test('cannot review an order that is not delivered (400)', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);
    const student = await makeStudent({ hostel: 'H1' });
    const placed = await request(app)
      .post('/student/createorder')
      .set('Cookie', student.cookie)
      .send(orderBody(launderer.username, ITEM));

    const res = await request(app)
      .post('/reviews')
      .set('Cookie', student.cookie)
      .send({ orderId: placed.body.order._id, rating: 5 });
    expect(res.status).toBe(400);
  });

  test('can review a delivered order, and duplicates are rejected (409)', async () => {
    const { student, order } = await deliveredOrder();

    const first = await request(app)
      .post('/reviews')
      .set('Cookie', student.cookie)
      .send({ orderId: order._id, rating: 4, comment: 'Great' });
    expect(first.status).toBe(201);

    const dup = await request(app)
      .post('/reviews')
      .set('Cookie', student.cookie)
      .send({ orderId: order._id, rating: 3 });
    expect(dup.status).toBe(409);
  });

  test('an invalid rating is rejected (400)', async () => {
    const { student, order } = await deliveredOrder();
    const res = await request(app)
      .post('/reviews')
      .set('Cookie', student.cookie)
      .send({ orderId: order._id, rating: 9 });
    expect(res.status).toBe(400);
  });

  test('the rating shows up in the summary and the launderer directory', async () => {
    const { launderer, student, order } = await deliveredOrder();
    await request(app)
      .post('/reviews')
      .set('Cookie', student.cookie)
      .send({ orderId: order._id, rating: 4 });

    const summary = await request(app)
      .get('/reviews/summary')
      .set('Cookie', student.cookie);
    expect(summary.body.summary[launderer.username].avgRating).toBe(4);

    const directory = await request(app)
      .get('/launderers/directory')
      .set('Cookie', student.cookie);
    const entry = directory.body.launderers.find(
      (l) => l.username === launderer.username
    );
    expect(entry.avgRating).toBe(4);
    expect(entry.reviewCount).toBe(1);
  });
});
