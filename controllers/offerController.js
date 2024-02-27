const offerModel = require("../models/offerModel");

const viewOffer = async (req, res) => {
  try {
    const offers = await offerModel.find();

    res.render("admin/viewOffer", { offers });
  } catch (error) {
    console.log(error.message);
  }
};
const addOffer = async (req, res) => {
  try {
    res.render("admin/addOffer", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const addNewOffer = async (req, res) => {
  try {
    const isOfferExist = await offerModel.findOne({
      name: req.body.offerName,
    });
    if (isOfferExist) {
      res.render("admin/addCoupon", { message: "already exists" });
    } else {
      const newOffer = new offerModel({
        name: req.body.offerName,
        type: req.body.type,
        discountPercentage: req.body.discountPercentage,
        minimumvalue: req.body.minValue,
        maximumvalue: req.body.maxValue,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      });
      newOffer.save();
      res.redirect("/admin/view-offer");
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  viewOffer,
  addOffer,
  addNewOffer,
};
