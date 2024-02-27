const mongoose = require("mongoose");
const User = require("./userModel");

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "user",
  },
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
    type: Number,
    required: true,
  },
  mobileN: {
    type: Number,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
