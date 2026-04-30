const { z } = require("zod");

function normalize(value) {
  return String(value || "").trim();
}

const shippingSchema = z.object({
  neighborhood: z
    .string()
    .min(2, "Bairro inválido.")
    .max(100)
    .transform(normalize),

  city: z
    .string()
    .min(2, "Cidade inválida.")
    .max(100)
    .transform(normalize),
});

module.exports = {
  shippingSchema,
};