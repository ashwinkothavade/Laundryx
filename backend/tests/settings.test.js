const { app, request, makeAdmin, makeStudent } = require('./helpers');

describe('Dynamic settings', () => {
  test('admin can replace, append to and remove from a list', async () => {
    const admin = await makeAdmin();

    const put = await request(app)
      .put('/settings/locations')
      .set('Cookie', admin.cookie)
      .send({ values: ['H1', 'H2'] });
    expect(put.status).toBe(200);
    expect(put.body.values).toEqual(['H1', 'H2']);

    const add = await request(app)
      .post('/settings/locations')
      .set('Cookie', admin.cookie)
      .send({ value: 'H3' });
    expect(add.body.values).toContain('H3');

    const remove = await request(app)
      .delete('/settings/locations/H1')
      .set('Cookie', admin.cookie);
    expect(remove.body.values).not.toContain('H1');
  });

  test('a non-admin cannot modify settings (403) but can read them', async () => {
    const admin = await makeAdmin();
    await request(app)
      .put('/settings/timeSlots')
      .set('Cookie', admin.cookie)
      .send({ values: ['12:00 PM'] });

    const student = await makeStudent();

    const write = await request(app)
      .put('/settings/timeSlots')
      .set('Cookie', student.cookie)
      .send({ values: ['09:00 AM'] });
    expect(write.status).toBe(403);

    const read = await request(app)
      .get('/settings')
      .set('Cookie', student.cookie);
    expect(read.status).toBe(200);
    expect(read.body.settings.timeSlots).toEqual(['12:00 PM']);
  });

  test('PUT rejects a non-array value (400)', async () => {
    const admin = await makeAdmin();
    const res = await request(app)
      .put('/settings/locations')
      .set('Cookie', admin.cookie)
      .send({ values: 'not-an-array' });
    expect(res.status).toBe(400);
  });
});
