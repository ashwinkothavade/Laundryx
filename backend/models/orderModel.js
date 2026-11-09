const mongoose = require('mongoose');

// Ordered: an item moves forward through these, and the UI reads progress
// from the index rather than from a pile of booleans.
const ITEM_STAGES = ['pending', 'washing', 'ready', 'returned'];

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
  // Where this line of the order has got to inside the laundry. The order's
  // own booleans say where the *order* is (accepted, picked up, delivered);
  // they cannot say that the shirts are done while the bedsheets are still
  // in the wash, which is the thing students actually ask about.
  //
  // One stage covers the whole line, so "Shirt x 5" moves together. Tracking
  // part of a line would mean a count per stage rather than a single value.
  stage: {
    type: String,
    enum: ITEM_STAGES,
    default: 'pending',
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
    // Pricing breakdown. orderTotal is the final payable amount:
    //   orderTotal = subtotal + expressCharge - discount
    subtotal: Number,
    express: {
      type: Boolean,
      default: false,
    },
    expressCharge: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: '',
    },
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
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
    // The Razorpay order this order's payment was initiated against. Payment
    // confirmation looks our order up by THIS value rather than trusting an
    // order id supplied by the client, so a signature obtained for one payment
    // cannot be replayed against a different order.
    razorpayOrderId: {
      type: String,
      default: '',
      index: true,
    },
    paymentId: {
      type: String,
      default: '',
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

// The two access patterns that carry all the traffic, neither of which was
// indexed — every student opening their orders and every launderer opening
// their queue was a full collection scan.
//
//   { user }                      -> a student's own orders
//   { user, launderer }           -> the scoped history a launderer may see
// A compound index serves both, because a query on a prefix of the key uses it.
orderSchema.index({ user: 1, launderer: 1 });

// A launderer's own queue, newest first — the sort is part of the index so
// the server does not have to collect and sort the whole result set.
orderSchema.index({ launderer: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.ITEM_STAGES = ITEM_STAGES;
