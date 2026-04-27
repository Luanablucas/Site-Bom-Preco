require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { router: productsRoutes } = require("./routes/products");
const publicProductsRoutes = require("./routes/public-products");
const checkoutRoutes = require("./routes/checkout.routes");
const authRoutes = require("./routes/auth.routes");
const accountRoutes = require("./routes/account.routes");
const adminRoutes = require("./routes/admin.routes");
const pool = require("./db");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://viacep.com.br"],
      },
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));
app.use("/api/account", accountRoutes);

app.use("/api/", rateLimit({ windowMs: 60_000, max: 120 }));

app.get("/", async (req, res) => {
  const result = await pool.query("SELECT NOW()");
  res.json({
    status: "Servidor funcionando",
    database_time: result.rows[0].now,
  });
});

app.use(express.static(path.join(__dirname, "public")));
app.use("/admin/products", productsRoutes);
app.use("/api", publicProductsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/admin", adminRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Rodando em http://localhost:${process.env.PORT}`);
});