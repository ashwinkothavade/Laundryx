const {
  app,
  request,
  makeLaunderer,
  makeStudent,
  makeAdmin,
  seedSettings,
  addCatalogItem,
  orderBody,
  models: { User },
} = require('./helpers');

const ITEM = { clothingType: 'Shirt', washType: 'Simple Wash', price: 5 };

const setAreas = (cookie, areas) =>
  request(app).put('/launderer/areas').set('Cookie', cookie).send({ areas });

const directory = (cookie) =>
  request(app).get('/student/launderers').set('Cookie', cookie);

// The list the order form actually renders.
const pickerDirectory = (cookie) =>
  request(app).get('/launderers/directory').set('Cookie', cookie);

describe('Launderer service areas', () => {
  test('a launderer can state the areas they cover', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });

    const res = await setAreas(launderer.cookie, ['H1', 'H3']);

    expect(res.status).toBe(200);
    expect(res.body.serviceAreas).toEqual(['H1', 'H3']);
  });

  test('an area the admin does not serve is refused', async () => {
    await seedSettings(); // locations: H1, H3, H4
    const launderer = await makeLaunderer({ approved: true });

    const res = await setAreas(launderer.cookie, ['H1', 'Mars']);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Mars/);
  });

  test('duplicates are collapsed and blanks dropped', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });

    const res = await setAreas(launderer.cookie, ['H1', ' H1 ', '', 'H3']);

    expect(res.body.serviceAreas).toEqual(['H1', 'H3']);
  });

  test('a student only sees launderers who cover their hostel', async () => {
    await seedSettings();
    const near = await makeLaunderer({ approved: true });
    const far = await makeLaunderer({ approved: true });
    await setAreas(near.cookie, ['H1']);
    await setAreas(far.cookie, ['H4']);

    const student = await makeStudent({ hostel: 'H1' });
    const res = await directory(student.cookie);
    const names = res.body.launderers.map((l) => l.username);

    expect(res.body.hostel).toBe('H1');
    expect(names).toContain(near.username);
    expect(names).not.toContain(far.username);
  });

  test('a launderer who states no areas is visible everywhere', async () => {
    await seedSettings();
    const anywhere = await makeLaunderer({ approved: true });

    const student = await makeStudent({ hostel: 'H4' });
    const names = (await directory(student.cookie)).body.launderers.map(
      (l) => l.username
    );

    expect(names).toContain(anywhere.username);
  });

  // The directory listed every launderer regardless of approval, so a student
  // could pick one and only then be told the order could not be placed.
  test('an unapproved launderer is not listed to students', async () => {
    await seedSettings();
    const pending = await makeLaunderer({ approved: false });
    const live = await makeLaunderer({ approved: true });

    const student = await makeStudent({ hostel: 'H1' });
    const names = (await directory(student.cookie)).body.launderers.map(
      (l) => l.username
    );

    expect(names).toContain(live.username);
    expect(names).not.toContain(pending.username);
  });

  test('a student whose hostel was set after sign-in is not filtered on a stale one', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await setAreas(launderer.cookie, ['H3']);

    // Signs in with no hostel, then fills the profile in — the JWT still
    // carries the empty hostel it was minted with.
    const student = await makeStudent({ hostel: null });
    await User.updateOne({ username: student.username }, { hostel: 'H3' });

    const names = (await directory(student.cookie)).body.launderers.map(
      (l) => l.username
    );

    expect(names).toContain(launderer.username);
  });

  test('an order from an area the launderer does not cover is refused', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);
    await setAreas(launderer.cookie, ['H3']);

    const student = await makeStudent({ hostel: 'H1' });
    const body = orderBody(launderer.username, ITEM); // pickupAddress: H1
    const res = await request(app)
      .post('/student/createorder')
      .set('Cookie', student.cookie)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not collect from H1/);
  });

  test('self drop-off is unaffected by service areas', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await addCatalogItem(launderer.cookie, ITEM);
    await setAreas(launderer.cookie, ['H3']);

    const student = await makeStudent({ hostel: 'H1' });
    const body = orderBody(launderer.username, ITEM);
    delete body.pickupAddress;
    delete body.deliveryAddress;
    body.fulfilmentMode = 'self_dropoff';

    const res = await request(app)
      .post('/student/createorder')
      .set('Cookie', student.cookie)
      .send(body);

    expect(res.status).toBe(201);
  });

  test('a student cannot set service areas', async () => {
    const student = await makeStudent();
    const res = await setAreas(student.cookie, ['H1']);
    expect(res.status).toBe(403);
  });

  test('an admin can see which areas a launderer covers', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await setAreas(launderer.cookie, ['H1']);
    await makeAdmin();

    const stored = await User.findOne({ username: launderer.username }).lean();
    expect(stored.serviceAreas).toEqual(['H1']);
  });
});

describe('Launderer directory (the list students pick from)', () => {
  test('a student only sees launderers covering their hostel', async () => {
    await seedSettings();
    const near = await makeLaunderer({ approved: true });
    const far = await makeLaunderer({ approved: true });
    await setAreas(near.cookie, ['H1']);
    await setAreas(far.cookie, ['H4']);

    const student = await makeStudent({ hostel: 'H1' });
    const res = await pickerDirectory(student.cookie);
    const names = res.body.launderers.map((l) => l.username);

    expect(names).toContain(near.username);
    expect(names).not.toContain(far.username);
  });

  test('coverage is returned so the picker can show it', async () => {
    await seedSettings();
    const launderer = await makeLaunderer({ approved: true });
    await setAreas(launderer.cookie, ['H1', 'H3']);

    const student = await makeStudent({ hostel: 'H1' });
    const found = (await pickerDirectory(student.cookie)).body.launderers.find(
      (l) => l.username === launderer.username
    );

    expect(found.serviceAreas).toEqual(['H1', 'H3']);
  });

  test('a launderer stating no areas still reaches every student', async () => {
    await seedSettings();
    const anywhere = await makeLaunderer({ approved: true });

    const student = await makeStudent({ hostel: 'H4' });
    const names = (await pickerDirectory(student.cookie)).body.launderers.map(
      (l) => l.username
    );

    expect(names).toContain(anywhere.username);
  });

  test('a launderer browsing the directory is not filtered by hostel', async () => {
    await seedSettings();
    const a = await makeLaunderer({ approved: true });
    await setAreas(a.cookie, ['H1']);
    const viewer = await makeLaunderer({ approved: true });

    const names = (await pickerDirectory(viewer.cookie)).body.launderers.map(
      (l) => l.username
    );

    expect(names).toContain(a.username);
  });
});
