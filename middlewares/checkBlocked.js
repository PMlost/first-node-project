const User = require("../models/userModel");

module.exports = async (req, res, next) => {
  const userId = req.session.user.id;
  const user = await User.findById(userId);

  if (user && user.isBlocked) {
    req.session.user = null;
    return res.redirect("/users/login");
  }

  next();
};
