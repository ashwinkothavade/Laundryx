// Demo data seeding: launderers (with catalogs), customers, coupons, orders and
// reviews — enough to exercise every role and screen in the app.
//
// Safe to re-run: it first removes the demo entities it owns (matched by the
// known demo emails / coupon codes) and their catalog/orders/reviews, then
// recreates them. The admin account and any real data are left untouched.
//
//   Run with:  npm run seed:data
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const CatalogItem = require('../models/catalogModel');
const Order = require('../models/orderModel');
const Review = require('../models/reviewModel');
const Coupon = require('../models/couponModel');
const Setting = require('../models/settingModel');
const logger = require('../utils/logger');

// Password satisfies the model rule (upper, lower, digit, special, 8+).
const PASSWORD = 'Password@123';
const TAX_PERCENT = 5;

// ---- Launderers (approved so students can see them) --------------------------
const launderers = [
  {
    username: 'sparklewash',
    email: 'sparkle@laundrix.com',
    phone_number: '+919000000101',
    expressSurcharge: 30,
    availableTimeSlots: ['10:00 AM', '02:00 PM', '06:00 PM'],
    catalog: [
      { clothingType: 'Shirt', washType: 'Wash & Iron', price: 30 },
      { clothingType: 'Shirt', washType: 'Dry Clean', price: 60 },
      { clothingType: 'T-Shirt', washType: 'Wash & Fold', price: 20 },
      { clothingType: 'Trouser', washType: 'Wash & Iron', price: 40 },
      { clothingType: 'Jeans', washType: 'Wash & Fold', price: 45 },
      { clothingType: 'Bedsheet', washType: 'Wash & Fold', price: 70 },
    ],
  },
  {
    username: 'freshfold',
    email: 'fresh@laundrix.com',
    phone_number: '+919000000102',
    expressSurcharge: 20,
    availableTimeSlots: ['11:00 AM', '05:00 PM'],
    catalog: [
      { clothingType: 'Shirt', washType: 'Wash & Iron', price: 28 },
      { clothingType: 'T-Shirt', washType: 'Wash & Fold', price: 18 },
      { clothingType: 'Kurta', washType: 'Wash & Iron', price: 35 },
      { clothingType: 'Trouser', washType: 'Iron Only', price: 15 },
      { clothingType: 'Towel', washType: 'Wash & Fold', price: 25 },
      { clothingType: 'Blanket', washType: 'Dry Clean', price: 150 },
    ],
  },
  {
    username: 'cleancrease',
    email: 'clean@laundrix.com',
    phone_number: '+919000000103',
    expressSurcharge: 0, // does not offer express
    availableTimeSlots: [],
    catalog: [
      { clothingType: 'Shirt', washType: 'Dry Clean', price: 55 },
      { clothingType: 'Suit', washType: 'Dry Clean', price: 200 },
      { clothingType: 'Saree', washType: 'Dry Clean', price: 120 },
      { clothingType: 'Jeans', washType: 'Wash & Fold', price: 40 },
      { clothingType: 'Jacket', washType: 'Dry Clean', price: 180 },
    ],
  },
];

// ---- Customers ---------------------------------------------------------------
const customers = [
  {
    username: 'rahul_c',
    email: 'rahul@laundrix.com',
    phone_number: '+919000000201',
    hostel: 'H1',
    room_number: '101',
    roll_number: 'CS21B001',
  },
  {
    username: 'priya_c',
    email: 'priya@laundrix.com',
    phone_number: '+919000000202',
    hostel: 'H3',
    room_number: '204',
    roll_number: 'EC21B045',
  },
  {
    username: 'amit_c',
    email: 'amit@laundrix.com',
    phone_number: '+919000000203',
    hostel: 'H4',
    room_number: '312',
    roll_number: 'ME21B078',
  },
  {
    username: 'sneha_c',
    email: 'sneha@laundrix.com',
    phone_number: '+919000000204',
    hostel: 'Panini',
    room_number: '018',
    roll_number: 'CE21B120',
  },
];

// ---- Coupons -----------------------------------------------------------------
const coupons = [
  { code: 'WELCOME10', discountType: 'percent', value: 10, minOrder: 100, maxDiscount: 50 },
  { code: 'FLAT50', discountType: 'flat', value: 50, minOrder: 200 },
  { code: 'SAVE20', discountType: 'percent', value: 20, minOrder: 150, maxDiscount: 100 },
];

const laundererEmails = launderers.map((l) => l.email);
const customerEmails = customers.map((c) => c.email);
const allDemoEmails = [...laundererEmails, ...customerEmails];
const couponCodes = coupons.map((c) => c.code);

// Build an order document with correctly computed pricing.
//   orderTotal = subtotal + expressCharge - discount + tax
const buildOrder = ({
  customer,
  laundererUser,
  items, // [{ name, washType, quantity, pricePerItem }]
  express = false,
  coupon = null, // { discountType, value, minOrder, maxDiscount }
  statuses = {}, // { acceptedStatus, pickUpStatus, deliveredStatus, paid }
  daysAgo = 3,
}) => {
  const subtotal = items.reduce((s, it) => s + it.pricePerItem * it.quantity, 0);
  const expressCharge = express ? laundererUser.expressSurcharge : 0;

  let discount = 0;
  if (coupon && subtotal >= coupon.minOrder) {
    if (coupon.discountType === 'flat') {
      discount = coupon.value;
    } else {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }
  }
  discount = Math.min(discount, subtotal);

  const taxable = Math.max(0, subtotal + expressCharge - discount);
  const tax = Math.round(((taxable * TAX_PERCENT) / 100) * 100) / 100;
  const orderTotal = Math.max(0, taxable + tax);

  const pickup = new Date(Date.now() - daysAgo * 86400000);
  const delivery = new Date(Date.now() - (daysAgo - 1) * 86400000);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const address = `${customer.hostel}, Room ${customer.room_number}`;

  return {
    user: customer._id,
    launderer: laundererUser.username,
    items,
    fulfilmentMode: 'home_pickup',
    pickupDate: fmt(pickup),
    pickupTime: '10:00 AM',
    deliveryDate: fmt(delivery),
    deliveryTime: '06:00 PM',
    pickupAddress: address,
    deliveryAddress: address,
    subtotal,
    express,
    expressCharge,
    couponCode: coupon ? coupon.code : '',
    discount,
    tax,
    orderTotal,
    acceptedStatus: statuses.acceptedStatus || false,
    pickUpStatus: statuses.pickUpStatus || false,
    deliveredStatus: statuses.deliveredStatus || false,
    paid: statuses.paid || false,
  };
};

const run = async () => {
  const { MONGO_URI } = process.env;
  if (!MONGO_URI) {
    logger.error('MONGO_URI is required to seed data.');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  logger.info('Connected. Clearing previous demo data...');

  // ---- Clean up any prior run (cascade) --------------------------------------
  const priorUsers = await User.find({ email: { $in: allDemoEmails } }, '_id username');
  const priorUserIds = priorUsers.map((u) => u._id);
  const priorUsernames = priorUsers.map((u) => u.username);
  await Promise.all([
    CatalogItem.deleteMany({ launderer: { $in: priorUserIds } }),
    Order.deleteMany({
      $or: [{ user: { $in: priorUserIds } }, { launderer: { $in: priorUsernames } }],
    }),
    Review.deleteMany({
      $or: [{ student: { $in: priorUserIds } }, { launderer: { $in: priorUserIds } }],
    }),
    Coupon.deleteMany({ code: { $in: couponCodes } }),
    User.deleteMany({ email: { $in: allDemoEmails } }),
  ]);

  // ---- Tax setting (so orders show tax) --------------------------------------
  await Setting.updateOne(
    { key: 'taxPercent' },
    { $setOnInsert: { key: 'taxPercent', values: [String(TAX_PERCENT)] } },
    { upsert: true }
  );

  // ---- Create launderers + their catalogs ------------------------------------
  const laundererDocs = {};
  for (const l of launderers) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await User.create({
      username: l.username,
      email: l.email,
      password: PASSWORD,
      phone_number: l.phone_number,
      role: 'launderer',
      approved: true,
      expressSurcharge: l.expressSurcharge,
      availableTimeSlots: l.availableTimeSlots,
    });
    laundererDocs[l.username] = doc;
    // eslint-disable-next-line no-await-in-loop
    await CatalogItem.insertMany(
      l.catalog.map((c) => ({ ...c, launderer: doc._id }))
    );
  }
  logger.info(`Created ${launderers.length} launderers with catalogs.`);

  // ---- Create customers ------------------------------------------------------
  const customerDocs = {};
  for (const c of customers) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await User.create({
      username: c.username,
      email: c.email,
      password: PASSWORD,
      phone_number: c.phone_number,
      role: 'customer',
      hostel: c.hostel,
      room_number: c.room_number,
      roll_number: c.roll_number,
    });
    customerDocs[c.username] = doc;
  }
  logger.info(`Created ${customers.length} customers.`);

  // ---- Coupons ---------------------------------------------------------------
  await Coupon.insertMany(coupons);
  logger.info(`Created ${coupons.length} coupons.`);

  // ---- Orders (varied statuses) ----------------------------------------------
  const sparkle = laundererDocs.sparklewash;
  const fresh = laundererDocs.freshfold;
  const clean = laundererDocs.cleancrease;
  const rahul = customerDocs.rahul_c;
  const priya = customerDocs.priya_c;
  const amit = customerDocs.amit_c;
  const sneha = customerDocs.sneha_c;

  const orderSpecs = [
    // Completed + paid -> reviewable
    {
      customer: rahul,
      laundererUser: sparkle,
      items: [
        { name: 'Shirt', washType: 'Wash & Iron', quantity: 3, pricePerItem: 30 },
        { name: 'Trouser', washType: 'Wash & Iron', quantity: 2, pricePerItem: 40 },
      ],
      coupon: coupons[0], // WELCOME10
      statuses: { acceptedStatus: true, pickUpStatus: true, deliveredStatus: true, paid: true },
      daysAgo: 6,
      review: { rating: 5, comment: 'Crisp ironing and quick delivery!' },
    },
    // Completed + paid -> reviewable
    {
      customer: sneha,
      laundererUser: clean,
      items: [
        { name: 'Suit', washType: 'Dry Clean', quantity: 1, pricePerItem: 200 },
        { name: 'Shirt', washType: 'Dry Clean', quantity: 2, pricePerItem: 55 },
      ],
      coupon: coupons[1], // FLAT50
      statuses: { acceptedStatus: true, pickUpStatus: true, deliveredStatus: true, paid: true },
      daysAgo: 8,
      review: { rating: 4, comment: 'Suit came back spotless, a bit pricey though.' },
    },
    // Picked up, not yet delivered (express)
    {
      customer: priya,
      laundererUser: fresh,
      items: [
        { name: 'Kurta', washType: 'Wash & Iron', quantity: 2, pricePerItem: 35 },
        { name: 'T-Shirt', washType: 'Wash & Fold', quantity: 4, pricePerItem: 18 },
      ],
      express: true,
      statuses: { acceptedStatus: true, pickUpStatus: true, deliveredStatus: false, paid: false },
      daysAgo: 1,
    },
    // Accepted, awaiting pickup
    {
      customer: amit,
      laundererUser: sparkle,
      items: [
        { name: 'Bedsheet', washType: 'Wash & Fold', quantity: 2, pricePerItem: 70 },
        { name: 'Jeans', washType: 'Wash & Fold', quantity: 1, pricePerItem: 45 },
      ],
      coupon: coupons[2], // SAVE20
      statuses: { acceptedStatus: true, pickUpStatus: false, deliveredStatus: false, paid: false },
      daysAgo: 1,
    },
    // Brand new, pending launderer acceptance
    {
      customer: rahul,
      laundererUser: fresh,
      items: [
        { name: 'Blanket', washType: 'Dry Clean', quantity: 1, pricePerItem: 150 },
      ],
      statuses: {},
      daysAgo: 0,
    },
    // Delivered + paid, no review yet (so "rate your order" prompt shows)
    {
      customer: priya,
      laundererUser: sparkle,
      items: [
        { name: 'T-Shirt', washType: 'Wash & Fold', quantity: 6, pricePerItem: 20 },
      ],
      statuses: { acceptedStatus: true, pickUpStatus: true, deliveredStatus: true, paid: true },
      daysAgo: 4,
    },
  ];

  for (const spec of orderSpecs) {
    // eslint-disable-next-line no-await-in-loop
    const order = await Order.create(buildOrder(spec));
    if (spec.review) {
      // eslint-disable-next-line no-await-in-loop
      await Review.create({
        launderer: spec.laundererUser._id,
        student: spec.customer._id,
        order: order._id,
        rating: spec.review.rating,
        comment: spec.review.comment,
      });
    }
  }
  logger.info(`Created ${orderSpecs.length} orders (2 reviewed).`);

  await mongoose.disconnect();
  logger.info('Demo data seeding complete.');
  logger.info(`All demo accounts use the password: ${PASSWORD}`);
  process.exit(0);
};

run().catch((err) => {
  logger.error(`Data seeding failed: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
