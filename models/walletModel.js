const mongoose = require("mongoose");
const Product = require("../models/adminProductModel");
const User = require("../models/userModel");
const Order = require("../models/orderModel");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balanceAmount: {
    type: Number,
  },
  transactions: [
    {
      transaction_id: {
        type: mongoose.Schema.Types.ObjectId,
        unique: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        enum: ["credit", "debit"],
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("Wallet", walletSchema);
