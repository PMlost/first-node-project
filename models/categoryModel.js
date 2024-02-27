const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    uppercase: true,
    required: true,
  },

  isAvailable: {
    type: Boolean,
    default: true,
    required: true,
  },
  offer: {
    type: mongoose.Types.ObjectId,
    ref: "Offer",
  },
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
