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

// Which plan did the server pick? IXSCAN means it used an index; COLLSCAN
// means it read every document in the collection.
const planFor = async (filter, sort) => {
  let q = models.Order.find(filter);
  if (sort) q = q.sort(sort);
  const explained = await q.explain('queryPlanner');
  const plan = JSON.stringify(explained.queryPlanner.winningPlan);
  return {
    scan: plan.includes('"IXSCAN"') ? 'IXSCAN' : 'COLLSCAN',
    index: (plan.match(/"indexName":"([^"]+)"/) || ['', null])[1],
  };
};

describe('The hot order queries use an index', () => {
  let student;

  beforeEach(async () => {
    await models.Order.syncIndexes();
    await seedSettings();
    const launderer = await makeLaunderer();
    student = await makeStudent();
    const item = { clothingType: 'Shirt', washType: 'Wash', price: 20 };
    await addCatalogItem(launderer.cookie, item);
    await request(app)
      .post('/student/createorder')
      .set('Cookie', student.cookie)
      .send(orderBody(launderer.username, item));
  });

  test('GET /student/orders — { user }', async () => {
    const user = await models.User.findOne({ username: student.username });
    const { scan } = await planFor({ user: user._id });
    expect(scan).toBe('IXSCAN');
  });

  test('scoped launderer history — { user, launderer }', async () => {
    const user = await models.User.findOne({ username: student.username });
    const { scan } = await planFor({ user: user._id, launderer: 'freshfold' });
    expect(scan).toBe('IXSCAN');
  });

  test("a launderer's queue, newest first — { launderer } sorted", async () => {
    const { scan } = await planFor(
      { launderer: 'freshfold' },
      { createdAt: -1 }
    );
    expect(scan).toBe('IXSCAN');
  });

  test('payment lookup — { razorpayOrderId }', async () => {
    const { scan } = await planFor({ razorpayOrderId: 'order_x' });
    expect(scan).toBe('IXSCAN');
  });
});
