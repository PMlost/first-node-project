const express = require("express");
const router = express.Router();
const upload = require("../utilities/multer");
const adminController = require("../controllers/adminController");
const productController = require("../controllers/productController");
const couponController = require("../controllers/couponController");
const offerController = require("../controllers/offerController");

//login admin

router.post("/login", adminController.verifyLogin);
router.get("/login", adminController.adminLogin);

//dashboard
router.get("/dashboard", adminController.loadDashboard);

//user
router.get("/customer", adminController.loadCustomer);

//block user
router.get("/customer/:id", adminController.blockCustomer);

router.get("/category", adminController.categorySection);

router.get("/add-category", adminController.addCategory);
router.post("/add-category", adminController.addCategoryPost);

router.get("/edit-category", adminController.editCategory);
router.post("/edit-category/:id", adminController.updateCategory);
router.get("/unlist-category", adminController.unlistCategory);

// product
router.get("/view-product", productController.viewProduct);
router.get("/add-product", productController.viewAddProduct);
router.post(
  "/add-product",
  // upload.single("image"),
  upload.array("image", 5),
  productController.postAddProduct
);

router.get("/edit-product/:id", productController.viewEditProduct);
router.post("/deleteImage", productController.deleteEditImage);
router.post(
  "/edit-product/",
  upload.array("image", 5),
  productController.updateProduct
);

//delete product
router.get("/delete-product/:id", productController.deleteProduct);

//order section
router.get("/load-order", adminController.orderManagement);
router.post("/updateStatus", adminController.updateStatus);
router.get("/view-order-details", adminController.viewOrderDetails);
router.post("/sales-order", adminController.salesOrder);

//coupon
router.get("/view-coupon", couponController.viewCoupon);
router.get("/add-coupon", couponController.addCoupon);
router.post("/add-coupon", couponController.addNewCoupon);
router.get("/edit-coupon", couponController.editCoupon);
router.post("/edit-coupon", couponController.updateCoupon);
router.get("/delete-coupon", couponController.deleteCoupon);

//offer
router.get("/view-offer", offerController.viewOffer);
router.get("/add-offer", offerController.addOffer);
router.post("/add-offer", offerController.addNewOffer);

//dashboard
router.get("/dashboard", adminController.loadDashboard);
router.post("/monthlySales", adminController.monthlySales);
router.post("/yearlySales", adminController.yearlySales);

router.post("/topProducts", adminController.topProducts);
router.post("/topCategory", adminController.topCategory);

//logout  admin
router.get("/logout", adminController.logoutAdmin);

module.exports = router;
