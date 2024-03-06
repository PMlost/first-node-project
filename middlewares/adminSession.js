const isLogin = (req, res, next) => {
  try {
    if (req.session.admin) {
    } else {
      res.redirect("/admin");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin) {
      res.redirect("/admin/view-product");
    }
  } catch (error) {
    console.log(error.message);
  }
};
