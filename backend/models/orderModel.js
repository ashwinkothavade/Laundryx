const mongoose = require("mongoose");

const itemSchema = mongoose.Schema({
    name: {
      type: String,
      required: true,
      enum: ["shirt", "pant", "jacket", "blanket"],
    },
    quantity: {
      type: Number,
      required: true,
    },
    washType: {
      type: String,
      required: true,
      enum: ["simple_wash", "power_clean", "dry_clean"],
    },
    pricePerItem: {
      type: Number,
      required: true,
    },
});

const orderSchema = mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    items: [itemSchema],
    deliveryDate: {
      type: Date,
      required: true,
      default: this.pickupDate + 2,
    },
    pickupAddress: {
      type: String,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    totalAmount: Number,
    acceptedStatus: {
        type: Boolean,
        default: false,
    },
    deliveredStatus: {
        type: Boolean,
        default: false,
    },
  },
  {
    timestamps: true,
    collection: "Order",
  }
);

module.exports = mongoose.model("Order", orderSchema);
