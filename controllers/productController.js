const Product = require("../models/adminProductModel");
const adminProductModel = require("../models/adminProductModel");
const categoryModel = require("../models/categoryModel");
const offerModel = require("../models/offerModel");

const cloudinary = require("../utilities/cloudinary");

// loadProduct
const viewProduct = async (req, res) => {
  //   const adminSession = req.session.admin;
  try {
    const products = await adminProductModel.find();

    res.render("admin/view-products.ejs", { products });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//delete-product
const deleteProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const isdeleted = await adminProductModel.findByIdAndUpdate(productId, {
      isDeleted: true,
    });

    if (!isdeleted) {
      // Product not found
      return res.status(404).send("Product not found");
    }
    res.redirect("/admin/view-product");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// add - procuct
const viewAddProduct = async (req, res) => {
  try {
    const categoryData = await categoryModel.find();
    const offerArray = await offerModel.find({ type: "product" });
    // console.log(offerArray);

    res.render("admin/add-product.ejs", {
      categoryArray: categoryData,
      offerArray,
      message: "",
    });
  } catch (error) {
    console.log(error.message);
  }
};

const postAddProduct = async (req, res) => {
  if (req.files.length != 0) {
    try {
      const {
        name,
        category: categoryName,
        price,
        description,
        stock,
        offer,
      } = req.body;

      const category = await categoryModel.findOne({ name: categoryName });

      //cloudinary
      const imageUrls = await Promise.all(
        req.files.map(async (file) => {
          const { url } = await cloudinary.uploader.upload(file.path, {
            folder: "imageFolder",
          });
          return url;
        })
      );

      const newAddedProduct = new adminProductModel({
        name,
        category: category.name,
        categoryId: category._id,
        stock,
        price,
        description,
        imgSrc: imageUrls,
        offer: offer,
      });

      const productData = await newAddedProduct.save();
      if (productData) {
        res.redirect("/admin/view-product");
      }
    } catch (error) {
      console.error(error);
      if (error.message) {
        const categoryData = await categoryModel.find();

        res.render("admin/add-product.ejs", {
          categoryArray: categoryData,
          message: "Invalid image file",
        });
      }
    }
  }
};

const viewEditProduct = async (req, res) => {
  try {
    const product = await adminProductModel.findOne({ _id: req.params.id });
    const categoryArray = await categoryModel.find();

    if (!product) {
      return redirect("/admin/view-product");
    }
    res.render("admin/edit-product.ejs", { product, categoryArray });
  } catch (error) {
    console.log(error.message);
  }
};

//update Product
const updateProduct = async (req, res) => {
  try {
    if (req.files.length != 0) {
      try {
        const { name, category, price, description, stock } = req.body;

        const productId = req.query.id;
        const productDetail = await adminProductModel.findOne({
          _id: productId,
        });
        const oldImg = productDetail.imgSrc;

        //cloudinary
        const newImageUrl = await Promise.all(
          req.files.map(async (file) => {
            const { url } = await cloudinary.uploader.upload(file.path, {
              folder: "imageFolder",
            });
            return url;
          })
        );
        const images = oldImg.concat(newImageUrl);

        // console.log("oldImg", oldImg);
        // console.log("newImageUrl", newImageUrl);
        // console.log("images", images);

        let newEditedProduct = await adminProductModel.updateOne(
          { _id: req.query.id },
          {
            $set: {
              name,
              category,
              stock,
              price,
              description,
              imgSrc: images,
            },
          }
        );

        res.redirect("/admin/view-product");
      } catch (error) {
        console.error(error);
        if (error.message) {
          const categoryData = await categoryModel.find();

          res.render("admin/add-product.ejs", {
            categoryArray: categoryData,
            message: "Invalid image file",
          });
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};

const deleteEditImage = async (req, res) => {
  try {
    const { productId, imageUrl } = req.body;

    const product = await adminProductModel.findOne({ _id: productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imageIndex = product.imgSrc.indexOf(imageUrl);
    if (imageIndex > -1) {
      product.imgSrc.splice(imageIndex, 1);
    }

    // Save the updated product
    await product.save();

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  viewProduct,
  deleteProduct,
  viewAddProduct,
  postAddProduct,
  viewEditProduct,
  updateProduct,
  deleteEditImage,
};
