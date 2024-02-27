const mongoose = require("mongoose");
const Offer = require("../models/offerModel");
const Category = require("../models/categoryModel");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  categoryId: {
    type: mongoose.Types.ObjectId,
    ref: "Category",
  },

  // rating: {
  //   type: Number,
  //   required: true,
  // },
  imgSrc: {
    type: Array,
    required: true,
  },

  isDeleted: {
    type: Boolean,
    default: false,
  },
  offer: {
    type: mongoose.Types.ObjectId,
    ref: "Offer",
  },
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
