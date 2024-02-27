const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  type: {
    type: String,
    enum: ["product", "category", "referral"],
    required: true,
  },
  product: {
    type: mongoose.Types.ObjectId,
    ref: "Product",
  },
  category: {
    type: String,
  },
  discountPercentage: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Offer", offerSchema);
