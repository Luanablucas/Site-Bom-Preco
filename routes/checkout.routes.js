const express = require("express");
const { requireCustomerAuth } = require("../middleware/customerAuth");

const router = express.Router();

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