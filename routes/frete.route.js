router.post("/shipping", requireCustomerAuth, async (req, res) => {
  try {
    const { neighborhood, city } = req.body;

    if (!neighborhood || !city) {
      return res.status(400).json({
        error: "Informe bairro e cidade para calcular o frete."
      });
    }

    const result = calculateShipping({
      neighborhood,
      city
    });

    return res.json({
      ok: true,
      shipping: result
    });
  } catch (error) {
    console.error("Erro ao calcular frete:", error);
    return res.status(500).json({
      error: "Erro ao calcular frete."
    });
  }
});