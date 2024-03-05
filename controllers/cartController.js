const User = require("../models/userModel");
const Product = require("../models/adminProductModel");

const cart = async (req, res) => {
  try {
    const userSession = req.session.user;

    const userCartItems = req.session.userCartItems || [];
    const userId = req.session.user.id;
    const userCompleteData = await User.findById(userId).populate({
      path: "cart.item.productId",
      populate: [
        { path: "offer" },
        {
          path: "categoryId",
          populate: { path: "offer" },
        },
      ],
    });

    if (!userCompleteData) {
      console.log("User not found");
      return next();
    }

    res.render("user/cart.ejs", {
      userData: userCompleteData.cart.item,
      userComplete: userCompleteData,
      userCartItems,
      userSession,
    });
  } catch (error) {
    console.error(error.message);
    return next(error);
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const productId = req.body.productId;

    const user = await User.findById(userId);

    const product = await Product.findById(productId)
      .populate("offer")
      .populate({
        path: "categoryId",
        populate: { path: "offer" },
      });

    if (!user || !product) {
      console.log("not found");
    }

    const isExistingItem = user.cart.item.find((prodObj) =>
      prodObj.productId.equals(product._id)
    );

    let price = product.price;
    let discountPercentage = 0;
    if (
      product.offer &&
      new Date() >= product.offer.startDate &&
      new Date() <= product.offer.endDate
    ) {
      discountPercentage += product.offer.discountPercentage;
    }
    if (
      product.categoryId.offer &&
      new Date() >= product.categoryId.offer.startDate &&
      new Date() <= product.categoryId.offer.endDate
    ) {
      discountPercentage += product.categoryId.offer.discountPercentage;
    }
    if (discountPercentage > 0) {
      price = price - (price * discountPercentage) / 100;
    }

    if (isExistingItem) {
      isExistingItem.quantity += 1;
    } else {
      user.cart.item.push({
        productId: product._id,
        quantity: 1,
        price: price,
      });
    }
    user.cart.totalPrice = user.cart.totalPrice + price;

    await user.save();

    req.session.userCartItems = user.cart.item;

    const totalQuantity = cartView(user.cart.item);

    if (!req.session || !req.session.user) {
      return res.json({ success: false, message: "User is not logged in" });
    }

    return res.json({ success: true, totalQuantity });
  } catch (error) {
    console.log(error.message);
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const productId = req.body.productId;
    const plusOrMinus = req.body.plusOrMinus;

    const user = await User.findById(userId);
    const product = await Product.findById(productId)
      .populate("offer")
      .populate({
        path: "categoryId",
        populate: { path: "offer" },
      });
    const productObj = user.cart.item.find((prodObj) =>
      prodObj.productId.equals(productId)
    );

    if (!productObj) {
      return res.status(404).json({ error: "Product not found" });
    }

    let price = product.price;

    let discountPercentage = 0;
    if (
      product.offer &&
      new Date() >= product.offer.startDate &&
      new Date() <= product.offer.endDate
    ) {
      discountPercentage += product.offer.discountPercentage;
    }
    if (
      product.categoryId.offer &&
      new Date() >= product.categoryId.offer.startDate &&
      new Date() <= product.categoryId.offer.endDate
    ) {
      discountPercentage += product.categoryId.offer.discountPercentage;
    }
    if (discountPercentage > 0) {
      price = price - (price * discountPercentage) / 100;
    }

    if (plusOrMinus === "increment") {
      productObj.quantity += 1;
      user.cart.totalPrice += price;
    } else if (plusOrMinus === "decrement") {
      productObj.quantity -= 1;
      user.cart.totalPrice -= price;
    }

    const grandTotal = user.cart.totalPrice;

    await user.save();
    req.session.userCartItems = user.cart.item;

    const updatedQuantity = productObj.quantity;
    const totalQuantity = cartView(user.cart.item);
    const totalPrice = updatedQuantity * productObj.price;

    const stock = product.stock;

    return res.json({
      success: true,
      updatedQuantity,
      totalQuantity,
      totalPrice,
      grandTotal,
      stock,
    });
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteCart = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const productId = req.body.productId;

    const user = await User.findById(userId);
    const product = await Product.findById(productId);

    const productObjIndex = user.cart.item.findIndex((prodObj) => {
      return prodObj.productId.equals(productId);
    });

    if (productObjIndex !== -1) {
      const removedProduct = user.cart.item.splice(productObjIndex, 1)[0];

      user.cart.totalPrice -= removedProduct.price * removedProduct.quantity;

      await user.save();
    } else {
      console.log("Product not found in the cart");
    }
    req.session.userCartItems = user.cart.item;

    const totalQuantity = cartView(user.cart.item);
    const grandTotal = user.cart.totalPrice;

    res.json({ success: true, totalQuantity, grandTotal });
  } catch (error) {
    console.error(error.message);
  }
};

const cartView = (cartItems) => {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
};

module.exports = {
  addToCart,
  cart,
  updateCart,
  deleteCart,
};
