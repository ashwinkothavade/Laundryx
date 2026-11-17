const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    // Both parties are references. A username can change, and a notification
    // pointing at a name nobody holds is unreachable by its own recipient.
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    launderer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'Notification',
  }
);
module.exports = mongoose.model('Notification', notificationSchema);
