const mongoose = require('mongoose');
const Order = require('../models/orderModel');

const connect = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(
      `MongoDB connected: ${connection.connection.host}`.cyan.underline
    );
  } catch (error) {
    console.error(`Error: ${error.message}`.red.underline.bold);
    process.exit(1);
  }
};

// db optimization: delete orders that are paid, accepted, delivered and picked up every 2 days
const deleteValidOrders = async () => {
  try {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    const result = await Order.deleteMany({
      paid: true,
      acceptedStatus: true,
      deliveredStatus: true,
      pickUpStatus: true,
      updatedAt: { $lte: twoDaysAgo },
    });
    console.log(`${result.deletedCount} orders deleted.`);
  } catch (err) {
    console.error('Error deleting orders:', err);
  }
};

module.exports = {
  connect,
  deleteValidOrders,
};
