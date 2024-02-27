// const multer = require("multer");
// const path = require("path");
// // console.log(path.join());

// // Set up Multer storage configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadFolder = "public/add-product";
//     cb(null, uploadFolder); // Set the destination folder for uploaded files
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname); // Set the filename to be unique
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = upload;

const multer = require("multer");

const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

module.exports = upload;
