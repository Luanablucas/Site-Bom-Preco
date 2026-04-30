function onlyNumbers(value) {
  return String(value || "").replace(/\D/g, "");
}

function maskCpfCnpj(value) {
  const clean = onlyNumbers(value);

  if (!clean) return null;

  // CPF
  if (clean.length === 11) {
    return clean.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      (_, a, b, c, d) => `${a}.***.***-${d}`
    );
  }

  // CNPJ
  if (clean.length === 14) {
    return clean.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      (_, a, b, c, d, e) => `${a}.***.***/****-${e}`
    );
  }

  return null;
}

function userSafeResponse(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.email_verified ?? false,

    cpfCnpj: user.cpf_cnpj
      ? maskCpfCnpj(user.cpf_cnpj)
      : undefined,

    phone: user.phone
      ? maskPhone(user.phone)
      : undefined,
  };
}

function maskPhone(value) {
  const clean = onlyNumbers(value);

  if (!clean) return null;

  // Celular (11 dígitos)
  if (clean.length === 11) {
    return clean.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      (_, ddd, middle, end) => `(${ddd}) *****-${end}`
    );
  }

  // Fixo (10 dígitos)
  if (clean.length === 10) {
    return clean.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      (_, ddd, middle, end) => `(${ddd}) ****-${end}`
    );
  }

  return null;
}

module.exports = {
  userSafeResponse,
  maskCpfCnpj,
  maskPhone,
};