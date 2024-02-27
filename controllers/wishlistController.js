const productModel = require("../models/adminProductModel");
const User = require("../models/userModel");

const viewWishList = async (req, res) => {
  const userSession = req.session.user;
  const userCartItems = req.session.userCartItems || [];
  try {
    const userId = req.session.user.id;
    if (userId) {
      const user = await User.findById({ _id: userId });
      const userData = await user.populate("wishlist.item.productId");

      res.render("user/wishlist.ejs", {
        userSession,
        userCartItems,
        wistlistArray: userData.wishlist.item,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addWishList = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const productId = req.body.productId;

    if (userId) {
      const user = await User.findById({ _id: userId });
      const product = await productModel.findById({ _id: productId });

      const isExistingItem = user.wishlist.item.find((prodObj) => {
        return prodObj.productId.equals(product._id);
      });

      if (!isExistingItem) {
        user.wishlist.item.push({
          productId: product._id,
          price: product.price,
        });
      }
      await user.save();

      res.json({ success: true, message: "product added to wishlist" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const productId = req.body.productId;

    if (userId) {
      const user = await User.findById(userId);

      const productIndex = user.wishlist.item.findIndex((productObj) => {
        return productObj.productId.equals(productId);
      });

      if (productIndex != 1) {
        user.wishlist.item.splice(productIndex, 1);
        await user.save();
      }
    }

    return res.json({ success: true });
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  viewWishList,
  addWishList,
  removeFromWishlist,
};
