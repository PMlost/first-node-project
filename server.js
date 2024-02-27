require("dotenv").config();
const express = require("express");
const app = express();
// const nocache = require("nocache");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const twilio = require("./middlewares/twilio");
const database = require("./config/databaseConnection");

app.use((req, res, next) => {
  //setup cache
  res.set("Cache-Control", "no-store");
  next();
});

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(expressLayouts);
// app.use(nocache());

//set layout based on the route
app.use((req, res, next) => {
  if (req.url.startsWith("/users")) {
    app.set("layout", "user/layouts/layout.ejs");
  } else if (req.url.startsWith("/admin")) {
    app.set("layout", "admin/layouts/layout.ejs");
  }
  next();
});

// Configure express-session
app.use(
  session({
    secret: process.env.SESSIONSECRET, // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 300000 }, // Set maxAge to 5 minute (in milliseconds)
  })
);

//connecting  to user router
const userRouter = require("./routes/user");
app.use("/users", userRouter);

//connecting to admin router
const adminRouter = require("./routes/admin");
app.use("/admin", adminRouter);

app.listen(3000, () => {
  console.log("server running succesfully on port 3000");
});
