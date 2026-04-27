const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/login", (req, res) => {
  res.render("admin-login");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Informe email e senha." });
  }

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email.trim().toLowerCase()
  ]);

  const user = result.rows[0];

  if (!user || user.role !== "admin") {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const ok = await bcrypt.compare(password, user.password_hash);

  if (!ok) {
    return res.status(401).json({ error: "Credenciais inválidas." });
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 2
  });

  return res.json({ ok: true, role: "admin" });
});

router.get("/", requireAuth, requireAdmin, (req, res) => {
  res.render("admin-home", { user: req.user });
});

router.get("/logout", (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  res.redirect("/admin/login");
});

module.exports = router;