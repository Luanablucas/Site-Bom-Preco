const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect("/admin/login");
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    res.clearCookie("token");
    return res.redirect("/admin/login");
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).send("Acesso negado");
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };