const mongoose = require("mongoose");

const couponModel = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    uppercase: true,
    required: true,
  },

  discount: {
    type: Number,
    required: true,
  },
  minimumvalue: {
    type: Number,
    required: true,
  },
  maximumvalue: {
    type: Number,
    required: true,
  },
  isCouponListed: {
    type: Boolean,
    default: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  usedBy: {
    type: Array,
    required: true,
  },
});

module.exports = mongoose.model("Coupon", couponModel);
