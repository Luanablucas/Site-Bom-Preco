const express = require("express");
const { requireCustomerAuth } = require("../middleware/customerAuth");
const { shippingSchema } = require("../schemas/checkout.schema");

const router = express.Router();


//// Frete 

router.post("/shipping", requireCustomerAuth, async (req, res) => {
  const parsed = shippingSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0].message,
    });
  }

  const { neighborhood, city } = parsed.data;

  try {
    const shipping = calculateShipping({ neighborhood, city });

    return res.json({
      ok: true,
      shipping,
    });
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    return res.status(500).json({
      error: "Erro ao calcular frete.",
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
      email: req.customer.email,
    },
  });
});


module.exports = router;