const {
  app,
  request,
  makeLaunderer,
  makeStudent,
  addCatalogItem,
} = require('./helpers');

const ITEM = { clothingType: 'Shirt', washType: 'Simple Wash', price: 5 };

describe('Catalog', () => {
  test('a launderer can add an item', async () => {
    const { cookie } = await makeLaunderer();
    const res = await addCatalogItem(cookie, ITEM);
    expect(res.status).toBe(201);
    expect(res.body.item.clothingType).toBe('Shirt');
  });

  test('duplicate clothing+wash combo is rejected (409)', async () => {
    const { cookie } = await makeLaunderer();
    await addCatalogItem(cookie, ITEM);
    const res = await addCatalogItem(cookie, { ...ITEM, price: 9 });
    expect(res.status).toBe(409);
  });

  test('a student cannot add catalog items (403)', async () => {
    const { cookie } = await makeStudent();
    const res = await addCatalogItem(cookie, ITEM);
    expect(res.status).toBe(403);
  });

  test('a launderer cannot edit another launderer’s item (403)', async () => {
    const a = await makeLaunderer();
    const b = await makeLaunderer();
    const created = await addCatalogItem(a.cookie, ITEM);
    const res = await request(app)
      .put(`/catalog/${created.body.item._id}`)
      .set('Cookie', b.cookie)
      .send({ price: 99 });
    expect(res.status).toBe(403);
  });

  test('owner can update and delete their item', async () => {
    const { cookie } = await makeLaunderer();
    const created = await addCatalogItem(cookie, ITEM);
    const id = created.body.item._id;

    const upd = await request(app)
      .put(`/catalog/${id}`)
      .set('Cookie', cookie)
      .send({ price: 7 });
    expect(upd.status).toBe(200);
    expect(upd.body.item.price).toBe(7);

    const del = await request(app)
      .delete(`/catalog/${id}`)
      .set('Cookie', cookie);
    expect(del.status).toBe(200);
  });

  test('students read an approved launderer’s catalog, but not an unapproved one', async () => {
    const approved = await makeLaunderer({ approved: true });
    await addCatalogItem(approved.cookie, ITEM);
    const unapproved = await makeLaunderer({ approved: false });
    await addCatalogItem(unapproved.cookie, ITEM);

    const student = await makeStudent();

    const ok = await request(app)
      .get(`/catalog/launderer/${approved.username}`)
      .set('Cookie', student.cookie);
    expect(ok.status).toBe(200);
    expect(ok.body.items).toHaveLength(1);

    const blocked = await request(app)
      .get(`/catalog/launderer/${unapproved.username}`)
      .set('Cookie', student.cookie);
    expect(blocked.status).toBe(404);
  });
});
