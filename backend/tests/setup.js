// Global test setup: spin up an in-memory MongoDB, connect Mongoose, and reset
// the database between tests. Runs before every test file.
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'test-access-secret';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

let mongo;

beforeAll(async () => {
  // Use a provided test Mongo (e.g. a docker service / CI service) when given,
  // otherwise spin up an ephemeral in-memory MongoDB.
  let uri = process.env.TEST_MONGO_URI;
  if (!uri) {
    mongo = await MongoMemoryServer.create();
    uri = mongo.getUri();
  }
  await mongoose.connect(uri);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
