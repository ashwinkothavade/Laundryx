// One-off migration: Order.launderer, Notification.launderer and
// Notification.student used to hold a username. They now hold a reference to
// the user, so any document written before that change needs converting.
//
//   node scripts/migrateLaundererRefs.js --dry-run   (report, change nothing)
//   node scripts/migrateLaundererRefs.js
//
// Safe to re-run: documents already holding an ObjectId are skipped, so a
// partial run can simply be run again.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const logger = require('../utils/logger');

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH = 500;

const chunk = (arr, size) =>
  arr.reduce((acc, item, i) => {
    if (i % size === 0) acc.push([]);
    acc[acc.length - 1].push(item);
    return acc;
  }, []);
// collection -> the fields that used to hold a username.
const COLLECTIONS = [
  ['Order', ['launderer']],
  ['Notification', ['launderer', 'student']],
];

// The models now declare `launderer` as an ObjectId, so reading the old string
// value through them would fail to cast. This goes through the driver instead,
// where the stored value is whatever is actually on disk.
const convert = async (db, name, field, idByName) => {
  const collection = db.collection(name);
  // $type 2 is a BSON string: exactly the documents still holding a username.
  const stale = await collection
    .find({ [field]: { $type: 2 } })
    .project({ [field]: 1 })
    .toArray();

  // A notification names only one of its two parties, and the unused side was
  // written as ''. That is not a missing user — clear it rather than warning
  // about a name that was never there, and leave no empty string sitting in a
  // field the schema now types as an ObjectId.
  const blanks = stale.filter((d) => d[field] === '');

  // A name with no user behind it is reported rather than guessed at or
  // deleted — losing the record silently is the failure mode this migration
  // exists to fix.
  const unmatched = [
    ...new Set(
      stale
        .filter((d) => d[field] !== '' && !idByName.has(d[field]))
        .map((d) => d[field])
    ),
  ];

  const ops = [
    ...stale
      .filter((d) => idByName.has(d[field]))
      .map((d) => ({
        updateOne: {
          filter: { _id: d._id },
          update: { $set: { [field]: idByName.get(d[field]) } },
        },
      })),
    ...blanks.map((d) => ({
      updateOne: {
        filter: { _id: d._id },
        update: { $unset: { [field]: '' } },
      },
    })),
  ];

  // Batched: a production Order collection can be far larger than one write
  // should carry, and the driver has its own limit on a single bulkWrite.
  if (!DRY_RUN) {
    await chunk(ops, BATCH).reduce(async (prev, batch) => {
      await prev;
      return collection.bulkWrite(batch);
    }, Promise.resolve());
  }

  logger.info(
    `${name}.${field}: ${stale.length} stale, ${ops.length} ` +
      `${DRY_RUN ? 'would be converted' : 'converted'}${
        unmatched.length ? `, ${unmatched.length} unmatched name(s)` : ''
      }`
  );
  if (unmatched.length) {
    logger.warn(
      `${name}.${field} references users that no longer exist: ` +
        `${unmatched.join(', ')}. Left as-is for a human to decide.`
    );
  }

  return {
    stale: stale.length,
    converted: ops.length,
    blanks: blanks.length,
    unmatched,
  };
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    logger.error('MONGO_URI is not set.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const { db } = mongoose.connection;

  // Every user, not only launderers: Notification.student held a customer's
  // username under exactly the same scheme.
  const users = await User.find().select('username').lean();
  const idByName = new Map(users.map((u) => [u.username, u._id]));
  logger.info(`Known users: ${idByName.size}`);

  // Sequential rather than parallel: two small collections, and a readable
  // report beats a few milliseconds.
  const jobs = COLLECTIONS.flatMap(([name, fields]) =>
    fields.map((field) => [name, field])
  );
  const results = await jobs.reduce(
    async (prev, [name, field]) => [
      ...(await prev),
      [`${name}.${field}`, await convert(db, name, field, idByName)],
    ],
    Promise.resolve([])
  );

  await mongoose.disconnect();
  if (DRY_RUN) logger.info('Dry run — nothing was written.');
  return Object.fromEntries(results);
};

module.exports = { run };

if (require.main === module) {
  run().catch((err) => {
    logger.error(`Migration failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  });
}
