// One-off seeding: create/confirm the admin account and migrate the previously
// hardcoded locations & time slots into the database as editable settings.
// Run with: npm run seed:admin
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Setting = require('../models/settingModel');
const logger = require('../utils/logger');

const run = async () => {
  const {
    MONGO_URI,
    ADMIN_USERNAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_PHONE,
  } = process.env;

  if (!MONGO_URI) {
    logger.error('MONGO_URI is required to seed the admin.');
    process.exit(1);
  }
  if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_PHONE) {
    logger.error(
      'ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_PHONE must all be set.'
    );
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  // Promote an existing account via findOneAndUpdate (does NOT trigger the
  // password-hashing pre-save hook, so the stored hash is left intact).
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    await User.findOneAndUpdate({ email: ADMIN_EMAIL }, { role: 'admin' });
    logger.info(`Existing user ${ADMIN_EMAIL} confirmed as admin.`);
  } else {
    // User.create runs the pre-save hook, hashing the plaintext password once.
    await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phone_number: ADMIN_PHONE,
      role: 'admin',
    });
    logger.info(`Admin user ${ADMIN_EMAIL} created.`);
  }

  // Seed starter dynamic settings ONLY if absent ($setOnInsert never clobbers
  // values the admin has since customized).
  const starterSettings = {
    locations: ['H1', 'H3', 'H4', 'Panini', 'Nagarjuna', 'Maa Saraswati'],
    timeSlots: ['12:00 PM', '04:00 PM', '07:00 PM'],
  };
  await Promise.all(
    Object.entries(starterSettings).map(([key, values]) =>
      Setting.updateOne(
        { key },
        { $setOnInsert: { key, values } },
        { upsert: true }
      )
    )
  );
  logger.info('Starter settings (locations, timeSlots) ensured.');

  await mongoose.disconnect();
  logger.info('Seeding complete.');
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Seeding failed: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
