const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const logger = require('../utils/logger');

const connect = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`, {
      stack: error.stack,
    });
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
    logger.info(`Stale order cleanup: ${result.deletedCount} orders deleted.`);
  } catch (err) {
    logger.error(`Error deleting stale orders: ${err.message}`, {
      stack: err.stack,
    });
  }
};

module.exports = {
  connect,
  deleteValidOrders,
};
