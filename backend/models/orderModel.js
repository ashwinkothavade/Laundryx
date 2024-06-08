const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Shirt', 'T-shirt', 'Pant', 'Jacket', 'Blanket'],
  },
  quantity: {
    type: Number,
    required: true,
  },
  washType: {
    type: String,
    required: true,
    enum: ['simple_wash', 'power_clean', 'dry_clean'],
  },
  pricePerItem: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    items: [itemSchema],
    pickupDate: {
      type: String,
      required: true,
    },
    pickupTime: {
      type: String,
      required: true,
    },
    deliveryDate: {
      type: String,
      required: true,
    },
    deliveryTime: {
      type: String,
      required: true,
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    orderTotal: Number,
    // accept -> pickup -> delivered -> pay (for security concerns, we can add a payment gateway to the app to make sure the payment is done before the delivery is made)
    acceptedStatus: {
      type: Boolean,
      default: false,
    },
    deliveredStatus: {
      type: Boolean,
      default: false,
    },
    pickUpStatus: {
      type: Boolean,
      default: false,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    launderer: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'Order',
  }
);

module.exports = mongoose.model('Order', orderSchema);
