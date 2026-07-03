const mongoose = require('mongoose');

// Clothing and wash types are no longer a fixed list — they come from each
// launderer's catalog, so these are free-form strings rather than enums.
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  washType: {
    type: String,
    required: true,
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
    // How the order reaches the launderer:
    //  - home_pickup: the launderer collects it from the student's address
    //  - self_dropoff: the student drops it at the launderer themselves
    fulfilmentMode: {
      type: String,
      enum: ['home_pickup', 'self_dropoff'],
      default: 'home_pickup',
    },
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
