const request = require('supertest');
const app = require('../app');
const User = require('../models/userModel');
const CatalogItem = require('../models/catalogModel');
const Setting = require('../models/settingModel');

const PASSWORD = 'Test@1234';

let seq = 0;
const uniq = () => {
  seq += 1;
  return seq;
};

// Build a valid, unique signup payload.
const userPayload = (overrides = {}) => {
  const n = uniq();
  return {
    username: `user${n}`,
    email: `user${n}@test.com`,
    password: PASSWORD,
    role: 'student',
    phone_number: `+91${9000000000 + n}`,
    ...overrides,
  };
};

const signup = (overrides = {}) => {
  const body = userPayload(overrides);
  return request(app)
    .post('/signup')
    .send(body)
    .then((res) => ({ res, body }));
};

const login = (username, password = PASSWORD) =>
  request(app)
    .post('/login')
    .send({ username, password })
    .then((res) => ({ res, cookie: res.headers['set-cookie'] }));

// Create a student, optionally with a hostel set BEFORE login (so the JWT
// carries it — required by verifyStudentDetails for order creation).
const makeStudent = async ({ hostel = 'H1' } = {}) => {
  const { body } = await signup({ role: 'student' });
  if (hostel) {
    await User.updateOne({ username: body.username }, { hostel });
  }
  const { cookie } = await login(body.username);
  return { username: body.username, cookie };
};

const makeLaunderer = async ({
  approved = true,
  availableTimeSlots,
  expressSurcharge,
} = {}) => {
  const { body } = await signup({ role: 'launderer' });
  const update = { approved };
  if (availableTimeSlots) update.availableTimeSlots = availableTimeSlots;
  if (expressSurcharge !== undefined)
    update.expressSurcharge = expressSurcharge;
  await User.updateOne({ username: body.username }, update);
  const { cookie } = await login(body.username);
  const user = await User.findOne({ username: body.username });
  return { username: body.username, cookie, id: user._id.toString() };
};

const makeAdmin = async () => {
  const payload = userPayload({ role: 'admin' });
  await User.create(payload); // create() runs the password-hashing hook
  const { cookie } = await login(payload.username);
  return { username: payload.username, cookie };
};

const seedSettings = async () => {
  await Setting.create({ key: 'locations', values: ['H1', 'H3', 'H4'] });
  await Setting.create({ key: 'timeSlots', values: ['12:00 PM', '04:00 PM'] });
};

const addCatalogItem = (cookie, item) =>
  request(app).post('/catalog').set('Cookie', cookie).send(item);

// A ready-to-post order body for the given launderer + item.
const orderBody = (launderer, item, quantity = 2) => ({
  launderer,
  items: [{ name: item.clothingType, washType: item.washType, quantity }],
  pickupDate: 'Mon, 1 Jan 2035',
  pickupTime: '12:00 PM',
  deliveryDate: 'Wed, 3 Jan 2035',
  deliveryTime: '04:00 PM',
  pickupAddress: 'H1',
  deliveryAddress: 'H3',
});

module.exports = {
  app,
  request,
  PASSWORD,
  signup,
  login,
  makeStudent,
  makeLaunderer,
  makeAdmin,
  seedSettings,
  addCatalogItem,
  orderBody,
  models: { User, CatalogItem, Setting },
};
