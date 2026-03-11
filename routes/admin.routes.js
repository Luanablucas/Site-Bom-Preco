const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("admin-login");
});

router.get("/", requireAuth, requireAdmin, (req, res) => {
  res.render("admin-home", { user: req.user });
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/admin/login");
});

module.exports = router;