const mongoose = require("mongoose");
const Product = require("../models/adminProductModel");
const User = require("../models/userModel");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
  },
  payment: {
    method: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  address: {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipcode: {
      type: String,
      required: true,
    },
    mobileN: {
      type: Number,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },
  products: {
    item: [
      {
        productId: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
        },
      },
    ],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  status: {
    type: String,
    default: "Processing",
  },
  razorPaymentDetails: {
    receipt: {
      type: String,
    },
    status: {
      type: String,
    },
    createdAt: {
      type: Date,
    },
  },
});

module.exports = mongoose.model("Order", orderSchema);
