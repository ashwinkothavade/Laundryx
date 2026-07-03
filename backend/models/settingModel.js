const mongoose = require('mongoose');

// A generic, admin-managed list of values keyed by name. Used to make things
// that were previously hardcoded fully dynamic — e.g. `locations` (pickup /
// delivery points) and `timeSlots` (pickup / delivery times). New dynamic
// lists can be introduced without a schema change by using a new key.
const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    values: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'Setting',
  }
);

module.exports = mongoose.model('Setting', settingSchema);
