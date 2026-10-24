const mongoose = require('mongoose');

// A record of every Razorpay webhook we have accepted.
//
// Razorpay delivers at-least-once: if our response is slow or non-2xx the
// same event is resent, with exponential backoff, for up to 24 hours. The
// unique index on eventId is what makes re-delivery a no-op rather than a
// second state transition, and the stored payload gives an audit trail for
// any payment dispute.
const webhookEventSchema = new mongoose.Schema(
  {
    // Razorpay's x-razorpay-event-id header. Unique per event, so it is the
    // documented way to identify a duplicate delivery.
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    event: {
      type: String,
      required: true,
    },
    razorpayOrderId: { type: String, default: '', index: true },
    razorpayPaymentId: { type: String, default: '' },
    // The app order this event settled, when we could match one.
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    outcome: {
      type: String,
      enum: ['applied', 'duplicate', 'unmatched', 'amount_mismatch', 'ignored'],
      required: true,
    },
    amount: { type: Number, default: 0 },
    payload: { type: mongoose.Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'WebhookEvent',
  }
);

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
