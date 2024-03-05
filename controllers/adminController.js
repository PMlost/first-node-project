const adminProductModel = require("../models/adminProductModel");
const User = require("../models/userModel");
const categoryModel = require("../models/categoryModel");
const orderModel = require("../models/orderModel");
const offerModel = require("../models/offerModel");
const walletModel = require("../models/walletModel");

const bcrypt = require("bcrypt");

const adminLogin = async (req, res) => {
  const errorMessage = req.session.errorMessage;
  req.session.errorMessage = null;

  try {
    const adminSession = req.session.admin;

    if (req.session.admin) {
      res.redirect("/admin/view-product");
    } else {
      res.render("admin/signIn.ejs", { errorMessage, sidebar: false });
    }
  } catch (error) {
    console.log(error);
  }
};

const verifyLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await User.findOne({ email: email });

    if (!admin) {
      return res.redirect("/admin/login");
    }

    const isPasswordMatch = await bcrypt.compare(password, admin.password);

    if (!isPasswordMatch) {
      req.session.errorMessage = "Invalid email or password";
      return res.redirect("/admin/login");
    }

    if (admin.isAdmin === false) {
      req.session.errorMessage = "You are not a Authorised Person ";
      return res.redirect("/admin/login");
    } else {
      const adminSession = (req.session.admin = {
        id: admin._id,
        email: admin.email,
      });

      res.redirect("/admin/view-product");
    }
  } catch (error) {
    console.error(error);
  }
};

const loadCustomer = async (req, res) => {
  try {
    const allCustomers = await User.find({ isAdmin: false }).sort({ name: -1 });

    res.render("admin/customer.ejs", { allCustomers });
  } catch (error) {
    console.log(error);
  }
};

const blockCustomer = async (req, res) => {
  const userId = req.params.id;

  try {
    const userData = await User.findOne({ _id: userId });

    if (!userData) {
      return res.status(404).send("User not found");
    }

    await User.findOneAndUpdate(
      { _id: userId },
      { isBlocked: !userData.isBlocked }
    );

    res.redirect("/admin/customer");
  } catch (error) {
    res.status(404).send("error");
    console.error("Error in blockCustomer:", error.message);
    console.log(error);
  }
};

const categorySection = async (req, res, next) => {
  try {
    const categoryDetails = await categoryModel.find();

    res.render("admin/categorySection.ejs", { categoryDetails });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const errorMessage = req.session.errorMessage;
    const offerArray = await offerModel.find({ type: "category" });

    req.session.errorMessage = null;
    res.render("admin/addCategory", {
      categoryMessage: errorMessage,
      offerArray,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const addCategoryPost = async (req, res) => {
  try {
    const categoryName = await categoryModel.findOne({
      name: req.body.categoryName,
    });
    if (categoryName) {
      req.session.errorMessage = "Category Name already Exist";
      return res.redirect("/admin/add-category");
    }
    const addNewCategory = new categoryModel({
      name: req.body.categoryName,
      offer: req.body.offer,
    });
    addNewCategory.save();
    return res.redirect("/admin/add-category");
  } catch (error) {
    console.log(error.message);
  }
};

const editCategory = async (req, res) => {
  try {
    const catId = req.query.id;

    const categoryData = await categoryModel.findOne({ _id: catId });

    res.render("admin/editCategory.ejs", { categoryDetail: categoryData });
  } catch (error) {
    console.log(error.message);
  }
};

const updateCategory = async (req, res) => {
  const catId = req.params.id;
  try {
    const categoryFind = await categoryModel.findOne({
      name: req.body.categoryName,
    });

    if (categoryFind) {
      res.render("admin/editCategory.ejs", {
        categoryDetail: categoryFind,
        categoryMessage: "Category already existed",
      });
    } else {
      const categoryUpdated = await categoryModel.updateOne(
        { _id: catId },
        { $set: { name: req.body.categoryName } }
      );
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const unlistCategory = async (req, res) => {
  try {
    const catId = req.query.id;
    const categoryData = await categoryModel.findOne({ _id: catId });

    if (!categoryData) {
      return res.status(404).send("not found");
    }

    const c = await categoryModel.findOneAndUpdate(
      { _id: catId },
      { isAvailable: !categoryData.isAvailable }
    );

    res.redirect("/admin/category");
  } catch (error) {}
};

const logoutAdmin = async (req, res) => {
  req.session.admin = null;
  res.redirect("/admin/login");
};

const orderManagement = async (req, res, next) => {
  try {
    const ordersArray = await orderModel
      .find({})
      .populate("userId")
      .sort({ createdAt: -1 });

    res.render("admin/orderManagement.ejs", { ordersArray });
  } catch (error) {
    console.log(error.message);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const status = req.body.status;
    const orderId = req.body.orderId;

    const orderDetails = await orderModel.findByIdAndUpdate(
      { _id: orderId },
      { $set: { status } },
      { new: true }
    );

    if (orderDetails) {
      if (status === "cancelled") {
        let wallet = await walletModel.findOne({
          userId: orderDetails.userId,
        });

        if (wallet) {
          wallet.balanceAmount += orderDetails.payment.amount;
        } else {
          wallet = new walletModel({
            userId: orderDetails.userId,
            balanceAmount: orderDetails.payment.amount,
          });
        }

        wallet.transactions.push({
          transaction_id: orderDetails._id,
          amount: orderDetails.payment.amount,
          type: "credit",
          description: `Order #${orderDetails._id} cancelled`,
          order: orderDetails._id,
        });

        await wallet.save();
      }

      res.redirect("/admin/load-order");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const viewOrderDetails = async (req, res, next) => {
  try {
    const id = req.query.id;
    const order = await orderModel.findById({ _id: id });

    const orderDetail = await order.populate("products.item.productId");

    res.render("admin/viewOrderDetails.ejs", { orderDetail });
  } catch (error) {
    next(error);
  }
};

const salesOrder = async (req, res) => {
  try {
    let startDate = new Date(req.body.startDate);
    let endDate = new Date(req.body.endDate);
    endDate.setHours(23, 59, 59, 999);

    const orders = await orderModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .sort({ createdAt: -1 })
      .populate("userId");

    //tota;Discount
    let totalDiscount = 0,
      totalSales = 0,
      totalRevenue = 0;

    orders.forEach((order) => {
      productPrice = order.products.totalPrice;
      paidAmount = order.payment.amount;

      const discountedAmount = productPrice - paidAmount;
      totalDiscount = totalDiscount + discountedAmount;

      totalSales++;

      totalRevenue += paidAmount;
    });

    res.send({ orderDetail: orders, totalDiscount, totalSales, totalRevenue });
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    let totalSales = 0;
    let totalRevenue = 0;

    const orders = await orderModel.find();

    for (const orderObj of orders) {
      if (orderObj.status === "Delivered") {
        totalSales += 1;
        totalRevenue += orderObj.products.totalPrice;
      }
    }

    res.render("admin/dashboard", {
      totalSales,
      totalRevenue,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const topProducts = async (req, res) => {
  try {
    const orders = await orderModel.find().populate("products.item.productId");

    let productCounts = {};

    for (let order of orders) {
      if (order.status === "Delivered") {
        for (let item of order.products.item) {
          const productName = item.productId.name;
          if (!productCounts[productName]) {
            productCounts[productName] = 0;
          }
          productCounts[productName] += item.quantity;
        }
      }
    }

    let productPairs = Object.entries(productCounts);
    let topProducts = productPairs.sort((a, b) => b[1] - a[1]).slice(0, 10);

    let productNames = topProducts.map((pair) => pair[0]);
    let quantities = topProducts.map((pair) => pair[1]);

    res.send({ productNames, quantities });
  } catch (error) {
    console.log(error.message);
  }
};

const topCategory = async (req, res) => {
  try {
    const orders = await orderModel.find().populate("products.item.productId");

    let categoryCounts = {};

    for (let order of orders) {
      if (order.status === "Delivered") {
        for (let item of order.products.item) {
          const categoryName = item.productId.category;
          if (!categoryCounts[categoryName]) {
            categoryCounts[categoryName] = 0;
          }
          categoryCounts[categoryName] += item.quantity;
        }
      }
    }

    let categoryPairs = Object.entries(categoryCounts);

    let topCategories = categoryPairs.sort((a, b) => b[1] - a[1]).slice(0, 10);

    let categoryNames = topCategories.map((pair) => pair[0]);
    let quantities = topCategories.map((pair) => pair[1]);

    res.send({ categoryNames, quantities });
  } catch (error) {
    console.log(error.message);
  }
};

const monthlySales = async (req, res) => {
  try {
    const orders = await orderModel.find();

    let monthlyCounts = {};

    for (let order of orders) {
      if (order.status === "Delivered") {
        const month = order.createdAt.getMonth();
        if (!monthlyCounts[month]) {
          monthlyCounts[month] = 0;
        }
        monthlyCounts[month] += 1;
      }
    }

    let monthlyPairs = Object.entries(monthlyCounts);

    let sortedMonthlySales = monthlyPairs.sort((a, b) => a[0] - b[0]);

    let months = sortedMonthlySales.map((pair) => pair[0]);
    let sales = sortedMonthlySales.map((pair) => pair[1]);

    res.send({ months, sales });
  } catch (error) {
    console.log(error.message);
  }
};
const yearlySales = async (req, res) => {
  try {
    const orders = await orderModel.find();

    let yearlyCounts = {};

    for (let order of orders) {
      if (order.status === "Delivered") {
        const year = order.createdAt.getFullYear();
        if (!yearlyCounts[year]) {
          yearlyCounts[year] = 0;
        }
        yearlyCounts[year] += 1;
      }
    }

    let yearlyPairs = Object.entries(yearlyCounts);

    let sortedYearlySales = yearlyPairs.sort((a, b) => a[0] - b[0]);

    let years = sortedYearlySales.map((pair) => pair[0]);
    let sales = sortedYearlySales.map((pair) => pair[1]);

    res.send({ years, sales });
  } catch (error) {
    console.log(error.message);
  }
};
module.exports = {
  adminLogin,
  verifyLogin,
  logoutAdmin,
  loadCustomer,
  blockCustomer,
  categorySection,
  addCategory,
  addCategoryPost,
  editCategory,
  updateCategory,
  unlistCategory,
  orderManagement,
  updateStatus,
  viewOrderDetails,
  salesOrder,

  loadDashboard,
  topProducts,
  topCategory,
  monthlySales,
  yearlySales,
};
