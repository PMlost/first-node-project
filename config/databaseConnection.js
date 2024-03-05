const mongoose = require("mongoose");

const connectDB = async function () {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("MongoDB connected");

    mongoose.connection.on("error", (err) => {
      console.error(err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB is disconnected");
    });
  } catch (error) {
    console.error(error.message);
  }
};

async function Database() {
  try {
    await connectDB();
  } catch (err) {
    console.error(err);
  }
}

const requiredEnvVariables = [
  "twilioPhoneNumber",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

requiredEnvVariables.forEach((variable) => {
  if (!process.env[variable]) {
    console.log(variable);
    throw new Error(`Environment variable ${variable} is not set`);
  }
});

Database();

module.exports = connectDB;
