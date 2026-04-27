const jwt = require("jsonwebtoken");

function requireCustomerAuth(req, res, next) {
  const token = req.cookies.customer_token;

  if (!token) {
    return res.status(401).json({
      error: "Você precisa estar logado para continuar."
    });
  }

  try {
    const customer = jwt.verify(token, process.env.JWT_SECRET);

    if (customer.role !== "customer") {
      return res.status(403).json({
        error: "Acesso permitido apenas para clientes."
      });
    }

    req.customer = customer;
    return next();
  } catch (error) {
    res.clearCookie("customer_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });

    return res.status(401).json({
      error: "Sessão inválida. Faça login novamente."
    });
  }
}

module.exports = { requireCustomerAuth };