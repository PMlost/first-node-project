const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
  if (req.session.user) {
    try {
      const userId = req.session.user.id;
      const user = await User.findById(userId).populate("cart.item.productId");

      if (user) {
        req.session.userCartItems = user.cart.item;
        // ........
      }
    } catch (error) {
      console.error(error.message);
    }
    next();
  } else {
    res.redirect("/users/login");
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user) {
      res.redirect("/users");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
};
