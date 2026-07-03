const mongoose = require('mongoose');

// A single catalog entry owned by a launderer: a clothing type + wash type
// combination with its price. Launderers manage their own catalog; students
// build orders from the catalog of the launderer they choose.
const catalogItemSchema = new mongoose.Schema(
  {
    launderer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clothingType: {
      type: String,
      required: [true, 'Clothing type is required'],
      trim: true,
    },
    washType: {
      type: String,
      required: [true, 'Wash type is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'CatalogItem',
  }
);

// A launderer cannot list the same clothing+wash combination twice.
catalogItemSchema.index(
  { launderer: 1, clothingType: 1, washType: 1 },
  { unique: true }
);

module.exports = mongoose.model('CatalogItem', catalogItemSchema);
