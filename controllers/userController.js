const productModel = require("../models/adminProductModel");
const User = require("../models/userModel");
const addressModel = require("../models/addressModal");
const categoryModel = require("../models/categoryModel");
const orderModel = require("../models/orderModel");
const couponModel = require("../models/couponModel");

const walletModel = require("../models/walletModel");
const bcrypt = require("bcrypt");
const otpSms = require("../middlewares/twilio");
const otpModel = require("../models/otpSchema");
const RazorPay = require("razorpay");

const crypto = require("crypto");

const homePage = async (req, res, next) => {
  try {
    const userSession = req.session.user;

    if (userSession) {
      const userCartItems = req.session.userCartItems || [];
      res.render("user/homePage.ejs", { userSession, userCartItems });
    } else {
      res.render("user/homePage.ejs");
    }
  } catch (error) {
    res.status(404).send("error");
    console.log(error.message);
  }
};

//login User
const loginUser = async (req, res) => {
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = null;
  if (req.session.user) {
    res.redirect("/users");
  } else {
    res.render("user/login.ejs", { errorMessage });
  }
};

const loginUserPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      req.session.errorMessage = "Invalid email or password";
      return res.redirect("/users/login");
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      req.session.errorMessage = "Invalid email or password";
      return res.redirect("/users/login");
    }

    if (user.isBlocked) {
      req.session.errorMessage =
        "You are blocked by admin.please contact admin";
      return res.redirect("/users/login");
    }

    req.session.user = {
      id: user._id,
      email: user.email,
      isBlocked: user.isBlocked,
    };

    res.redirect("/users/home");
  } catch (error) {
    console.error(error);
    res.redirect("/login");
  }
};

const signUpUser = async (req, res) => {
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = "";
  res.render("user/signup.ejs", { errorMessage });
};

const signUpUserPost = async (req, res) => {
  try {
    const { name, email, password, mobile, confirmpassword } = req.body;

    const existingUser = await User.findOne({ email, mobile });

    if (existingUser) {
      req.session.errorMessage = "Email already exists";
      return res.redirect("/users/signup");
    }

    if (password !== confirmpassword) {
      req.session.errorMessage = "Passwords not match";
      return res.redirect("/users/signup");
    }

    const otp = `${Math.floor(1000 + Math.random() * 9000).toString()}`;
    req.session.otp = otp;

    const newOtp = new otpModel({
      email: email,
      otp: otp,
    });
    await newOtp.save();

    otpSms.sendSMS(mobile, otp);

    const referralCode = crypto.randomBytes(10).toString("hex");
    req.session.newEmail = email;
    req.session.userDetails = { name, email, password, mobile, referralCode };

    res.render("user/otpPage.ejs");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
    console.log(error.message);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const newEmail = req.session.newEmail;

    const userDetails = req.session.userDetails;

    const otpSuccess = await otpModel.findOne({ otp, email: newEmail });

    if (otpSuccess) {
      const newUser = new User(userDetails);

      req.session.user = {
        id: newUser._id,
        email: newUser.email,
        isBlocked: newUser.isBlocked,
      };
      await newUser.save();

      res.redirect("/users/shop");
    } else {
      res.render("user/otpPage.ejs", { errorMessage: "otp is not valid" });
    }
  } catch (error) {
    console.log(err.message);
  }
};

const resendOTP = async (req, res) => {
  try {
    const email = req.session.newEmail;

    const otp = `${Math.floor(1000 + Math.random() * 9000).toString()}`;
    await otpModel.findOneAndUpdate({ email }, { otp, expiresAt: Date.now() });

    otpSms.sendSMS(req.session.userDetails.mobile, otp);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const logoutUser = async (req, res) => {
  req.session.user = null;
  res.redirect("/users/login");
};

const shop = async (req, res) => {
  try {
    const userSession = req.session.user;
    const userCartItems = req.session.userCartItems;
    const categoryArray = await categoryModel.find();
    let selectedCategories = req.query.category;

    let { ajax, search } = req.query;
    let limit = parseInt(req.query.limit);
    let sort = parseInt(req.query.sort);

    if (selectedCategories) {
      selectedCategories = selectedCategories.map(
        (index) => categoryArray[index].name
      );
    }

    if (!sort) {
      sort = 0;
    }

    if (!search) {
      search = "";
    }
    let sortOption;

    if (sort === 0) {
      sortOption = { $natural: -1 };
    } else {
      sortOption = { price: sort };
    }

    let page = parseInt(req.query.page) || 1;

    let products;
    let totalProducts;
    if (selectedCategories) {
      totalProducts = await productModel.countDocuments({
        name: { $regex: search, $options: "i" },
        category: { $in: selectedCategories },
      });
      products = await productModel
        .find({
          name: { $regex: search, $options: "i" },
          category: { $in: selectedCategories },
        })

        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("offer")
        .populate({
          path: "categoryId",
          populate: { path: "offer" },
        });
    } else {
      totalProducts = await productModel.countDocuments({
        name: { $regex: search, $options: "i" },
      });
      products = await productModel

        .find({ name: { $regex: search, $options: "i" } })
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("offer")
        .populate({
          path: "categoryId",
          populate: { path: "offer" },
        });
    }

    let totalPages = Math.ceil(totalProducts / limit);

    if (ajax) {
      res.json({ products, totalPages: totalPages, currentPage: page });
    } else {
      res.render("user/shop.ejs", {
        products,
        userSession,
        userCartItems,
        categoryArray,
        order: sort,
        currentPage: page,
        totalPages: totalPages,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewUserProduct = async (req, res) => {
  try {
    const productId = req.query.id;
    const userSession = req.session.user;
    const userCartItems = req.session.userCartItems;

    const productDetail = await productModel
      .findOne({ _id: productId })
      .populate("offer")
      .populate({
        path: "categoryId",
        populate: { path: "offer" },
      });

    res.render("user/view-product.ejs", {
      productDetail,

      userSession,
      userCartItems,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//profile
const profile = async (req, res) => {
  try {
    const userSession = req.session.user;
    const userCartItems = req.session.userCartItems || [];
    const userId = req.session.user.id;
    const userDetail = await User.findOne({ _id: userId });

    if (userSession) {
      res.render("user/profile.ejs", {
        userSession,
        userCartItems,
        userDetail,
      });
    } else {
      res.render("user/homePage.ejs");
    }
  } catch (error) {
    console.log(error.message);

    res.status(500).send("Internal Server Error");
  }
};

const changePassword = async (req, res) => {
  try {
    res.render("user/changePassword.ejs");
  } catch (error) {
    console.log(error.message);
  }
};

const updatePassword = async (req, res) => {
  const userId = req.session.user.id;

  try {
    const user = await User.findById(userId);
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "passwod must be atleat 8 characters long",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.json({
        success: false,
        message: "New password and confirm password not same",
      });
    }

    if (currentPassword === newPassword) {
      return res.json({
        success: false,
        message: "New password cannot be the same as the current password",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password successfully updated!",
    });
  } catch (error) {
    console.log(error.message);
  }
};

//edit

const editProfile = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const userDetail = await User.findOne({ _id: userId });

    res.render("user/editProfile.ejs", { userDetail });
  } catch (error) {
    console.log(error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.query.id;
    const updatedUserDetail = await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.number,
        },
      }
    );
    res.redirect("/users/profile");
    // .......
  } catch (error) {
    console.log(error);
  }
};

//load address
const manageAddress = async (req, res) => {
  const userSession = req.session.user;
  const userCartItems = req.session.userCartItems;

  res.render("user/manageAddress.ejs", { userSession, userCartItems });
};

const addAddress = async (req, res) => {
  const userSession = req.session.user;

  const {
    firstname,
    lastname,
    mobileN,
    address,
    country,
    city,
    state,
    zipcode,
  } = req.body;
  try {
    const userAddress = new addressModel({
      firstname,
      lastname,
      address,
      country,
      city,
      state,
      zipcode,
      mobileN,
      userId: req.session.user.id,
    });
    await userAddress.save();
    res.redirect("/users/profile");
  } catch (error) {
    console.log(error.message);
  }
};

const viewAddress = async (req, res) => {
  const userId = req.session.user.id;

  const addressDetails = await addressModel.find({ userId });

  res.render("user/viewAddress.ejs", { addressDetails });
};

const editAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const addressDetail = await addressModel.findOne({ _id: id });
    res.render("user/editAddress.ejs", { addressDetail });
  } catch (error) {
    console.log(error.message);
  }
};
const editUpdateAddress = async (req, res) => {
  try {
    const id = req.body.id;

    const updatedAddress = await addressModel.updateOne(
      { _id: id },
      {
        $set: {
          firstname: req.body.firstname,
          lastname: req.body.lastname,
          country: req.body.country,
          address: req.body.address,
          city: req.body.city,
          state: req.body.state,
          zipcode: req.body.zipcode,
          mobileN: req.body.mobileN,
        },
      }
    );
    res.redirect("/users/profile");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteAddress = async (req, res) => {
  const addressId = req.query.id;
  try {
    const deletedAddress = await addressModel.deleteOne({ _id: addressId });
    if (deleteAddress) {
      res.redirect("/users/profile");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const selectedAddress = async (req, res) => {
  const selectAddressId = req.query.addressId;
  const addressDetails = await addressModel.updateMany(
    {},
    { $set: { isSelected: false } }
  );
  const selectedAddress = await addressModel.updateOne(
    { _id: selectAddressId },
    { $set: { isSelected: true } }
  );
  res.redirect("/users/checkout");
};

//checkout
const checkout = async (req, res) => {
  try {
    const userSession = req.session.user;
    const userCartItems = req.session.userCartItems || [];
    const couponArray = await couponModel.find();

    const { id: userId } = req.session.user;

    const userData = await User.findById(userId);
    const completeUserData = await userData.populate("cart.item.productId");

    const addressDetails = await addressModel.find({
      userId,
      isSelected: true,
    });

    res.render("user/checkout.ejs", {
      userSession,
      userCartItems,
      addressDetails,
      checkOutDetails: completeUserData.cart,
      couponArray,
    });
  } catch (error) {
    console.log(error.message);
  }
};

let newOrder;
const placeOrder = async (req, res) => {
  const userId = req.session.user.id;
  let ourAddress;
  try {
    if (req.body.selectedAddress == 0) {
      ourAddress = await new addressModel({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        country: req.body.country,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zipcode: req.body.zip,
        mobileN: req.body.mno,
        userId: userId,
      });
      const newAddress = await ourAddress.save();
    } else {
      ourAddress = await addressModel.findOne({
        _id: req.body.selectedAddress,
      });
    }

    const userInfo = await User.findOne({ _id: req.session.user.id });

    newOrder = new orderModel({
      userId: req.session.user.id,
      address: ourAddress,
      payment: {
        method: "COD",
        amount: req.body.amount,
      },
      products: userInfo.cart,
    });

    if (req.body.payment == "COD") {
      await newOrder.save();

      const productInfo = await productModel.find();

      for (let productObj of userInfo.cart.item) {
        for (let productData of productInfo) {
          if (productObj.productId._id.equals(productData._id)) {
            productData.stock -= productObj.quantity;
            await productData.save();
          }
        }
      }

      await User.updateOne(
        { _id: req.session.user.id },
        { $unset: { cart: true } }
      );

      let couponData = await couponModel.findOne({ name: req.body.coupon });

      if (couponData) {
        await couponModel.updateOne(
          { name: couponData.name },
          { $push: { usedBy: req.session.user.id } }
        );
      }

      res.render("user/orderFinish.ejs", { user: req.session.user });
    } else if (req.body.payment == "Online") {
      const { RPY_KEYID, RPY_KEYSECRET } = process.env;
      //razorpay integration

      let instance = new RazorPay({
        key_id: RPY_KEYID,
        key_secret: RPY_KEYSECRET,
      });

      //create instance from order
      let razorpayOrder = await instance.orders.create({
        amount: req.body.amount * 100,
        currency: "INR",
        receipt: newOrder._id.toString(),
      });
      // /
      razorPaymentDetails = razorpayOrder;

      const productInfo = await productModel.find();

      for (let productObj of userInfo.cart.item) {
        for (let productData of productInfo) {
          if (productObj.productId._id.equals(productData._id)) {
            productData.stock -= productObj.quantity;
            await productData.save();
          }
        }
      }

      let couponData = await couponModel.findOne({ name: req.body.coupon });

      if (couponData) {
        await couponModel.updateOne(
          { name: couponData.name },
          { $push: { usedBy: req.session.user.id } }
        );
      }

      res.render("user/razorPayment", {
        userId: req.session.user.id,
        rorder_id: razorpayOrder.id,
        grandTotal: req.body.amount,
        key_id: RPY_KEYID,
        userInfo,
        newOrder,
        orderId: newOrder._id.toString(),
      });
    } else if (req.body.payment == "Wallet") {
      const wallet = await walletModel.findOne({ userId: req.session.user.id });

      if (wallet.balanceAmount < req.body.amount) {
        res.redirect("/users/checkout");
      } else {
        wallet.balanceAmount -= req.body.amount;

        newOrder.payment.method = "Wallet";

        wallet.transactions.push({
          transaction_id: newOrder._id,
          amount: newOrder.payment.amount,
          type: "debit",
          description: `Order #${newOrder._id} placed`,
          order: newOrder._id,
        });
        await wallet.save();

        await newOrder.save();

        await User.updateOne(
          { _id: req.session.user.id },
          { $unset: { cart: true } }
        );

        res.render("user/orderFinish.ejs", { user: req.session.user });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const onlinePayment = async (req, res) => {
  try {
    console.log(razorPaymentDetails);
    newOrder.payment.method = "Online";
    newOrder.razorPaymentDetails.receipt = razorPaymentDetails.receipt;
    newOrder.razorPaymentDetails.status = razorPaymentDetails.status;
    newOrder.razorPaymentDetails.createdAt = razorPaymentDetails.created_at;

    await newOrder.save();
    await User.updateOne(
      { _id: req.session.user.id },
      { $unset: { cart: true } }
    );

    res.render("user/orderFinish.ejs", { user: req.session.user });
  } catch (error) {
    console.log(error.message);
  }
};

const orderDetails = async (req, res) => {
  const userSession = req.session.user;
  const userCartItems = req.session.userCartItems || [];

  const userId = req.session.user.id;

  try {
    const orderData = await orderModel
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .populate("products.item.productId");
    res.render("user/orderDetails.ejs", {
      userSession,
      userCartItems,
      orderData,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const viewOrderDetails = async (req, res) => {
  const userSession = req.session.user;
  const userCartItems = req.session.userCartItems || [];
  try {
    const userId = req.session.user.id;
    const id = req.query.id;
    const orderDetails = await orderModel.findById({ _id: id });
    await orderDetails.populate("products.item.productId");

    res.render("user/viewOrderDetails.ejs", {
      userSession,
      userCartItems,
      orderDetails,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const viewInVoice = async (req, res) => {
  try {
    const id = req.query.id;
    const orderDetails = await orderModel.findById({ _id: id });
    await orderDetails.populate("products.item.productId");

    res.render("user/viewInVoice.ejs", { orderDetails });
  } catch (error) {
    console.log(error.message);
  }
};

const cancelOrder = async (req, res) => {
  try {
    const cancelOrderId = req.query.id;

    const orderDetail = await orderModel.findById({ _id: cancelOrderId });

    const updatedOrderDetails = await orderModel.findByIdAndUpdate(
      { _id: cancelOrderId },
      { $set: { status: "cancelled" } },
      { new: true }
    );
    if (updatedOrderDetails.status === "cancelled") {
      const productData = await productModel.find();

      for (const productOfOrder of orderDetail.products.item) {
        for (const productObj of productData) {
          if (productOfOrder.productId._id.equals(productObj._id)) {
            productObj.stock = productObj.stock + productOfOrder.quantity;
            await productObj.save();
          }
        }
      }
    }

    let wallet = await walletModel.findOne({
      userId: orderDetail.userId,
    });

    if (wallet) {
      wallet.balanceAmount += orderDetail.payment.amount;
    } else {
      wallet = new walletModel({
        userId: orderDetail.userId,
        balanceAmount: orderDetail.payment.amount,
      });
    }

    wallet.transactions.push({
      transaction_id: orderDetail._id,
      amount: orderDetail.payment.amount,
      type: "credit",
      description: `Order #${orderDetail._id} cancelled`,
      order: orderDetail._id,
    });

    await wallet.save();

    res.redirect("/users/order-details");
  } catch (error) {
    console.log(error.message);
  }
};

const applyCoupon = async (req, res) => {
  const userId = req.session.user.id;
  try {
    const { currentPrice, couponCode } = req.body;
    let userData = await User.findById({ _id: req.session.user.id });
    let couponData = await couponModel.findOne({ name: couponCode });

    if (couponCode) {
      const date1Time = new Date(couponData.expiryDate).getTime();
      const date2Time = new Date(Date.now()).getTime();

      if (date1Time + 6000000 > date2Time) {
        if (couponData.usedBy.includes(userId)) {
          res.json({ success: false, couponMessage: "coupon already used" });
        } else {
          if (userData.cart.totalPrice >= couponData.minimumvalue) {
            let discountedAmount = (couponData.discount * currentPrice) / 100;

            if (discountedAmount > couponData.maximumvalue) {
              discountedAmount = couponData.maximumvalue;
            }

            res.json({
              success: true,
              couponData,
              discountedAmount,
              couponMessage: "coupon succesfully added",
            });
          } else {
            res.json({ success: false, couponMessage: "coupon cant used" });
          }
        }
      } else {
        res.json({ success: false, couponMessage: "coupon expired" });
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewWallet = async (req, res, next) => {
  try {
    const userSession = req.session.user;
    const userCartItems = req.session.userCartItems;
    const walletData = await walletModel
      .findOne({ userId: userSession.id })
      .populate("userId");

    console.log(walletData);
    let userName, walletAmount, transactions;
    if (walletData) {
      userName = walletData.userId.name;
      walletAmount = walletData.balanceAmount;
      transactions = walletData.transactions;
    }

    res.render("user/wallet.ejs", {
      userName,
      walletAmount,
      userSession,
      userCartItems,
      transactions,
    });
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

const verifyReferralCode = async (req, res, next) => {
  try {
    const referralCode = req.body.referralCode;

    const referrer = await User.findOne({ referralCode: referralCode });

    const userId = req.session.user.id;

    let wallet = await walletModel.findOne({ userId: userId });

    if (referrer) {
      if (!wallet) {
        wallet = new walletModel({
          userId: userId,
          balanceAmount: 500,
        });

        await wallet.save();
      } else {
        wallet.balanceAmount += 500;

        await wallet.save();
      }

      res.json({ success: true });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid referral code" });
    }
  } catch (error) {
    console.log(error.message);
    next(error);
  }
};

module.exports = {
  loginUser,
  signUpUser,
  signUpUserPost,
  loginUserPost,
  resendOTP,
  logoutUser,
  homePage,
  shop,
  viewUserProduct,
  verifyOtp,
  checkout,
  profile,
  changePassword,
  updatePassword,
  manageAddress,
  addAddress,
  viewAddress,
  editAddress,
  editUpdateAddress,
  placeOrder,
  deleteAddress,
  selectedAddress,
  editProfile,
  updateProfile,
  orderDetails,
  viewOrderDetails,
  viewInVoice,
  cancelOrder,
  applyCoupon,
  onlinePayment,
  viewWallet,
  verifyReferralCode,
};
