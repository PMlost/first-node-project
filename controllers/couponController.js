const couponModel = require("../models/couponModel");

const viewCoupon = async (req, res) => {
  try {
    const coupons = await couponModel.find();

    res.render("admin/viewCoupon", { coupons });
  } catch (error) {
    console.log(error.message);
  }
};

const addCoupon = async (req, res) => {
  try {
    res.render("admin/addCoupon", { message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const addNewCoupon = async (req, res) => {
  try {
    const isCouponExist = await couponModel.findOne({
      name: req.body.couponName,
    });
    if (isCouponExist) {
      res.render("admin/addCoupon", { message: "already exists" });
    } else {
      const newCoupon = new couponModel({
        name: req.body.couponName,
        discount: req.body.discount,
        minimumvalue: req.body.minValue,
        maximumvalue: req.body.maxValue,
        expiryDate: req.body.expiryDate,
      });
      newCoupon.save();
      res.redirect("/admin/view-coupon");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const editCoupon = async (req, res) => {
  try {
    const couponId = req.query.id;

    const couponDetail = await couponModel.findOne({ _id: couponId });
    res.render("admin/editCoupon", { coupon: couponDetail, message: "" });
  } catch (error) {
    console.log(error.message);
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { couponName, discount, minValue, maxValue, expiryDate, couponId } =
      req.body;

    const isCouponExist = await couponModel.findOne({ name: couponName });

    if (isCouponExist) {
      const couponDetail = await couponModel.findOne({ _id: couponId });

      return res.render("admin/editCoupon", {
        coupon: couponDetail,
        message: "coupon already exists",
      });
    }

    const updatedCoupon = await couponModel.updateOne(
      ({ _id: couponId },
      {
        $set: {
          name: couponName,
          discount: discount,
          minimumvalue: minValue,
          maximumvalue: maxValue,
          expiryDate: expiryDate,
        },
      })
    );

    if (updateCoupon) return res.redirect("/admin/view-coupon");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const couponId = req.query.id;
    const deletedCoupon = await couponModel.deleteOne({ _id: couponId });

    if (deletedCoupon) return res.redirect("/admin/view-coupon");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  viewCoupon,
  addCoupon,
  addNewCoupon,
  editCoupon,
  updateCoupon,
  deleteCoupon,
};
