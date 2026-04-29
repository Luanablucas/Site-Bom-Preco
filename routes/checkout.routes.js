const express = require("express");
const { requireCustomerAuth } = require("../middleware/customerAuth");

const router = express.Router();


//// Frete 

const { calculateShipping } = require("../utils/calculateShipping");

router.post("/shipping", requireCustomerAuth, async (req, res) => {
  try {
    const { neighborhood, city } = req.body;

    const shipping = calculateShipping({ neighborhood, city });

    return res.json({
      ok: true,
      shipping
    });
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    return res.status(500).json({
      error: "Erro ao calcular frete."
    });
  }
});

router.post("/", requireCustomerAuth, async (req, res) => {
  return res.json({
    ok: true,
    message: "Cliente autenticado. Pode iniciar checkout.",
    customer: {
      id: req.customer.id,
      name: req.customer.name,
      email: req.customer.email
    }
  });
});


module.exports = router;