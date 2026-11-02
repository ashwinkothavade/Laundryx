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
const OTHER_ITEM = {
  clothingType: 'Trousers',
  washType: 'Dry Clean',
  price: 20,
};

const create = (cookie, body) =>
  request(app).post('/student/createorder').set('Cookie', cookie).send(body);

const analytics = (cookie) =>
  request(app).get('/launderer/analytics').set('Cookie', cookie);

async function world() {
  await seedSettings();
  const launderer = await makeLaunderer({ approved: true });
  await addCatalogItem(launderer.cookie, ITEM);
  await addCatalogItem(launderer.cookie, OTHER_ITEM);
  const student = await makeStudent({ hostel: 'H1' });
  return { launderer, student };
}

describe('Launderer analytics', () => {
  test('reports zeros, not nulls, for a launderer with no orders', async () => {
    const launderer = await makeLaunderer({ approved: true });
    const { status, body } = await analytics(launderer.cookie);

    expect(status).toBe(200);
    const a = body.analytics;
    expect(a.totalOrders).toBe(0);
    expect(a.revenue).toBe(0);
    expect(a.outstanding).toBe(0);
    expect(a.avgOrderValue).toBe(0);
    expect(a.topItems).toEqual([]);
    // A new launderer should still get a drawable series rather than an empty
    // array the chart has to special-case.
    expect(a.trend).toHaveLength(a.trendDays);
    expect(a.trend.every((d) => d.orders === 0 && d.revenue === 0)).toBe(true);
  });

  test('separates collected revenue from money still owed', async () => {
    const { launderer, student } = await world();
    const paid = await create(
      student.cookie,
      orderBody(launderer.username, ITEM, 3)
    );
    await create(student.cookie, orderBody(launderer.username, ITEM, 2));
    await Order.updateOne({ _id: paid.body.order._id }, { paid: true });

    const { body } = await analytics(launderer.cookie);
    const a = body.analytics;

    expect(a.totalOrders).toBe(2);
    expect(a.revenue).toBe(15); // 3 x 5, paid
    expect(a.outstanding).toBe(10); // 2 x 5, not paid
    expect(a.avgOrderValue).toBe(15); // averaged over paid orders only
  });

  test('the funnel is cumulative, so a later stage never exceeds an earlier one', async () => {
    const { launderer, student } = await world();
    const a1 = await create(
      student.cookie,
      orderBody(launderer.username, ITEM)
    );
    const a2 = await create(
      student.cookie,
      orderBody(launderer.username, ITEM)
    );
    await create(student.cookie, orderBody(launderer.username, ITEM));

    await Order.updateOne(
      { _id: a1.body.order._id },
      {
        acceptedStatus: true,
        pickUpStatus: true,
        deliveredStatus: true,
        paid: true,
      }
    );
    await Order.updateOne({ _id: a2.body.order._id }, { acceptedStatus: true });

    const { funnel } = (await analytics(launderer.cookie)).body.analytics;

    expect(funnel.placed).toBe(3);
    expect(funnel.accepted).toBe(2);
    expect(funnel.delivered).toBe(1);
    expect(funnel.paid).toBe(1);
    const stages = [
      funnel.placed,
      funnel.accepted,
      funnel.pickedUp,
      funnel.delivered,
      funnel.paid,
    ];
    stages.forEach((count, i) => {
      if (i > 0) expect(count).toBeLessThanOrEqual(stages[i - 1]);
    });
  });

  test('ranks top items by quantity across orders', async () => {
    const { launderer, student } = await world();
    await create(student.cookie, orderBody(launderer.username, ITEM, 2));
    await create(student.cookie, orderBody(launderer.username, ITEM, 3));
    await create(student.cookie, orderBody(launderer.username, OTHER_ITEM, 1));

    const { topItems } = (await analytics(launderer.cookie)).body.analytics;

    expect(topItems[0].name).toBe('Shirt');
    expect(topItems[0].quantity).toBe(5); // summed across both orders
    expect(topItems[0].revenue).toBe(25);
    expect(topItems[1].name).toBe('Trousers');
  });

  test('counts a returning customer once, and their repeat separately', async () => {
    const { launderer, student } = await world();
    await create(student.cookie, orderBody(launderer.username, ITEM));
    await create(student.cookie, orderBody(launderer.username, ITEM));
    const other = await makeStudent({ hostel: 'H1' });
    await create(other.cookie, orderBody(launderer.username, ITEM));

    const a = (await analytics(launderer.cookie)).body.analytics;

    expect(a.uniqueCustomers).toBe(2);
    expect(a.repeatCustomers).toBe(1);
  });

  test("never counts another launderer's orders", async () => {
    const { launderer, student } = await world();
    await create(student.cookie, orderBody(launderer.username, ITEM));

    const rival = await makeLaunderer({ approved: true });
    await addCatalogItem(rival.cookie, ITEM);
    await create(student.cookie, orderBody(rival.username, ITEM, 7));

    const mine = (await analytics(launderer.cookie)).body.analytics;
    const theirs = (await analytics(rival.cookie)).body.analytics;

    expect(mine.totalOrders).toBe(1);
    expect(theirs.totalOrders).toBe(1);
    expect(theirs.topItems[0].quantity).toBe(7);
  });

  test("today's orders land in the last bucket of the trend", async () => {
    const { launderer, student } = await world();
    await create(student.cookie, orderBody(launderer.username, ITEM));

    const a = (await analytics(launderer.cookie)).body.analytics;
    const todayBucket = a.trend[a.trend.length - 1];

    expect(a.today.orders).toBe(1);
    expect(todayBucket.orders).toBe(1);
    expect(todayBucket.date).toBe(new Date().toISOString().slice(0, 10));
  });
});
