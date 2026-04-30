const { z } = require("zod");

function onlyNumbers(value) {
  return String(value || "").replace(/\D/g, "");
}

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe um nome válido.")
    .max(120, "Nome muito longo."),

  birthDate: z
    .string()
    .min(1, "Data de nascimento é obrigatória."),

  cpfCnpj: z
    .string()
    .transform(onlyNumbers)
    .refine((value) => value.length === 11 || value.length === 14, {
      message: "CPF ou CNPJ inválido.",
    }),

  phone: z
    .string()
    .transform(onlyNumbers)
    .refine((value) => value.length === 10 || value.length === 11, {
      message: "Telefone inválido.",
    }),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido."),

  password: z
    .string()
    .min(8, "A senha deve ter no mínimo 8 caracteres.")
    .max(72, "Senha muito longa.")
    .regex(/[A-Za-z]/, "A senha deve conter pelo menos uma letra.")
    .regex(/\d/, "A senha deve conter pelo menos um número."),

  cep: z
    .string()
    .transform(onlyNumbers)
    .refine((value) => value.length === 8, {
      message: "CEP inválido.",
    }),

  street: z.string().trim().min(2, "Rua inválida.").max(150),
  neighborhood: z.string().trim().min(2, "Bairro inválido.").max(100),
  city: z.string().trim().min(2, "Cidade inválida.").max(100),

  number: z
    .string()
    .trim()
    .min(1, "Número é obrigatório.")
    .max(20, "Número muito longo."),

  state: z
    .string()
    .trim()
    .toUpperCase()
    .length(2, "Estado inválido."),

  complement: z
    .string()
    .trim()
    .max(100, "Complemento muito longo.")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("E-mail inválido."),

  password: z
    .string()
    .min(1, "Senha é obrigatória."),
});

module.exports = {
  registerSchema,
  loginSchema,
};