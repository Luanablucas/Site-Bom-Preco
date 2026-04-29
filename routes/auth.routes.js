const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const pool = require("../db");
const rateLimit = require("express-rate-limit");
const { sendEmail } = require("../services/mail.service");
const { generateCode } = require("../utils/generateCode");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas. Tente novamente em alguns minutos."
  }
});

//// Validações

function onlyNumbers(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

function isValidPhone(phone) {
  const clean = onlyNumbers(phone);

  return clean.length === 10 || clean.length === 11;
}

function isValidBirthDate(value) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();

  if (date > today) return false;

  const minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 120);

  if (date < minDate) return false;

  return true;
}

function isValidCep(cep) {
  return onlyNumbers(cep).length === 8;
}

function isValidAddress({ street, neighborhood, city, state }) {
  return (
    normalizeText(street).length >= 2 &&
    normalizeText(neighborhood).length >= 2 &&
    normalizeText(city).length >= 2 &&
    isValidUF(state)
  );
}

function isValidUF(value) {
  return /^[A-Z]{2}$/.test(String(value || "").toUpperCase());
}

function isValidCPF(cpf) {
  cpf = onlyNumbers(cpf);

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;

  if (digit1 !== Number(cpf[9])) return false;

  sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += Number(cpf[i]) * (11 - i);
  }

  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;

  return digit2 === Number(cpf[10]);
}

function isValidCNPJ(cnpj) {
  cnpj = onlyNumbers(cnpj);

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calcDigit = (base) => {
    let size = base.length;
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += Number(base[size - i]) * pos--;
      if (pos < 2) pos = 9;
    }

    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result;
  };

  const base12 = cnpj.slice(0, 12);
  const digit1 = calcDigit(base12);

  if (digit1 !== Number(cnpj[12])) return false;

  const base13 = cnpj.slice(0, 13);
  const digit2 = calcDigit(base13);

  return digit2 === Number(cnpj[13]);
}

function isValidCpfOrCnpj(value) {
  const clean = onlyNumbers(value);

  if (clean.length === 11) return isValidCPF(clean);
  if (clean.length === 14) return isValidCNPJ(clean);

  return false;
}
//// Cadastro

router.post("/register", async (req, res) => {
  const {
    name,
    birthDate,
    cpfCnpj,
    phone,
    email,
    password,
    cep,
    street,
    neighborhood,
    city,
    number,
    state,
    complement,
  } = req.body;

  const cleanName = normalizeText(name);
  const cleanEmail = normalizeText(email).toLowerCase();
  const cleanCpfCnpj = onlyNumbers(cpfCnpj);
  const cleanPhone = onlyNumbers(phone);
  const cleanCep = onlyNumbers(cep);
  const cleanStreet = normalizeText(street);
  const cleanNeighborhood = normalizeText(neighborhood);
  const cleanCity = normalizeText(city);
  const cleanNumber = number ? normalizeText(number) : null;
  const cleanState = normalizeText(state).toUpperCase();
  const cleanComplement = complement ? normalizeText(complement) : null;

  if (!cleanName || !cleanEmail || !password) {
    return res
      .status(400)
      .json({ error: "Nome, e-mail e senha são obrigatórios." });
  }

  if (cleanName.length < 3) {
    return res.status(400).json({
      error: "Informe um nome válido.",
    });
  }

  if (!isValidBirthDate(birthDate)) {
    return res.status(400).json({
      error: "Informe uma data de nascimento válida.",
    });
  }

  if (!isValidCpfOrCnpj(cleanCpfCnpj)) {
    return res.status(400).json({
      error: "CPF ou CNPJ inválido.",
    });
  }

  if (!isValidPhone(cleanPhone)) {
    return res.status(400).json({
      error: "Telefone inválido.",
    });
  }

  if (!isValidEmail(cleanEmail)) {
    return res.status(400).json({
      error: "E-mail inválido.",
    });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error: "A senha deve ter no mínimo 8 caracteres, com letras e números.",
    });
  }

  if (!isValidCep(cleanCep)) {
    return res.status(400).json({
      error: "CEP inválido.",
    });
  }

  if (
    !isValidAddress({
      street: cleanStreet,
      neighborhood: cleanNeighborhood,
      city: cleanCity,
      state: cleanState,
    })
  ) {
    return res.status(400).json({
      error: "Endereço incompleto ou inválido.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    await pool.query.query(
      `
      INSERT INTO users
        (id, name, birth_date, cpf_cnpj, phone, email, password_hash, role)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, 'customer')
      `,
      [
        userId,
        cleanName,
        birthDate,
        cleanCpfCnpj,
        cleanPhone,
        cleanEmail,
        passwordHash,
      ],
    );

    await pool.query(
      `
      INSERT INTO user_addresses
        (id, user_id, cep, street, neighborhood, city, number, state, complement)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        randomUUID(),
        userId,
        cleanCep,
        cleanStreet,
        cleanNeighborhood,
        cleanCity,
        cleanNumber,
        cleanState,
        cleanComplement,
      ],
    );
    const code = generateCode();

    await pool.query(
      `
  INSERT INTO email_verification_codes
    (user_id, email, code, type, expires_at)
  VALUES
    ($1, $2, $3, 'verify_email', NOW() + INTERVAL '15 minutes')
  `,
      [userId, cleanEmail, code],
    );

    await sendEmail({
      to: cleanEmail,
      subject: "Código de verificação - Bom Preço",
      html: `
    <h2>Confirme seu e-mail</h2>
    <p>Seu código de verificação é:</p>
    <h1>${code}</h1>
    <p>Esse código expira em 15 minutos.</p>
  `,
    });

    await client.query("COMMIT");

    return res.status(201).json({
      ok: true,
      message: "Conta criada. Verifique seu e-mail para ativar a conta.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(409).json({
        error: "E-mail, CPF ou CNPJ já cadastrado.",
      });
    }

    console.error("Erro ao cadastrar cliente:", error);
    return res.status(500).json({ error: "Erro no servidor." });
  } finally {
    client.release();
  }
});

//// Verificar e-mail

router.post("/verify-email", authLimiter, async (req, res) => {
  const { email, code } = req.body;

  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();
  const cleanCode = String(code || "").trim();

  if (!cleanEmail || !cleanCode) {
    return res.status(400).json({ error: "E-mail e código são obrigatórios." });
  }

  try {
    const result = await pool.query(
      `
      SELECT *
      FROM email_verification_codes
      WHERE email = $1
        AND code = $2
        AND type = 'verify_email'
        AND used = false
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [cleanEmail, cleanCode],
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "Código inválido ou expirado." });
    }

    const verification = result.rows[0];

    await pool.query(
      `
      UPDATE users
      SET email_verified = true,
          updated_at = NOW()
      WHERE id = $1
      `,
      [verification.user_id],
    );

    await pool.query(
      `
  UPDATE email_verification_codes
  SET used = true
  WHERE user_id = $1
    AND type = 'verify_email'
  `,
      [verification.user_id],
    );

    return res.json({ ok: true, message: "E-mail verificado com sucesso." });
  } catch (error) {
    console.error("Erro ao verificar e-mail:", error);
    return res.status(500).json({ error: "Erro ao verificar e-mail." });
  }
});

//// Login

router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Informe email e senha." });
  }

  const result = await pool.query(
    `
  SELECT id, name, email, password_hash, role, email_verified
  FROM users
  WHERE email = $1
  `,
    [email.trim().toLowerCase()],
  );

  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Credenciais inválidas." });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Credenciais inválidas." });

  if (!user.email_verified) {
    return res.status(403).json({
      error: "Verifique seu e-mail antes de entrar.",
    });
  }

  if (user.role !== "customer") {
    return res
      .status(403)
      .json({ error: "Acesso permitido apenas para clientes." });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  res.cookie("customer_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 2,
  });

  return res.json({ ok: true, role: user.role });
});

//// Logout

router.post("/logout", (req, res) => {
  res.clearCookie("customer_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const token = req.cookies.customer_token;

  if (!token) {
    return res.json({ user: null });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);

    if (user.role !== "customer") {
      return res.json({ user: null });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    res.clearCookie("customer_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({ user: null });
  }
});

//// Esqueceu a senha

router.post("/forgot-password", authLimiter, async (req, res) => {
  const email = normalizeText(req.body.email).toLowerCase();

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Informe um e-mail válido." });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE email = $1 AND role = 'customer'",
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return res
        .status(404)
        .json({ error: "Nenhuma conta encontrada com esse e-mail." });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `
      INSERT INTO password_reset_codes (id, user_id, code, expires_at)
      VALUES ($1, $2, $3, $4)
      `,
      [randomUUID(), user.id, code, expiresAt],
    );

    await pool.query(
      `
  UPDATE password_reset_codes
  SET attempts = attempts + 1
  WHERE code = $1
`,
      [code],
    );

    await sendEmail({
      to: user.email,
      subject: "Código de recuperação de senha - Bom Preço",
      html: `
    <h2>Recuperação de senha</h2>
    <p>Seu código de recuperação é:</p>
    <h1>${code}</h1>
    <p>Esse código expira em 15 minutos.</p>
  `,
    });

    return res.json({
      ok: true,
      message: "Se o e-mail existir, você receberá um código de recuperação.",
    });
  } catch (error) {
    console.error("Erro ao gerar código:", error);
    return res
      .status(500)
      .json({ error: "Erro ao gerar código de recuperação." });
  }
});

router.post("/reset-password", async (req, res) => {
  const email = normalizeText(req.body.email).toLowerCase();
  const code = onlyNumbers(req.body.code);
  const { newPassword } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "E-mail inválido." });
  }

  if (code.length !== 6) {
    return res.status(400).json({ error: "Código inválido." });
  }

  if (!isStrongPassword(newPassword)) {
    return res.status(400).json({
      error:
        "A nova senha deve ter no mínimo 8 caracteres, com letras e números.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const codeResult = await pool.query(
      `
      SELECT prc.id, u.id AS user_id
      FROM password_reset_codes prc
      JOIN users u ON u.id = prc.user_id
      WHERE u.email = $1
        AND prc.code = $2
        AND prc.used_at IS NULL
AND prc.expires_at > NOW()
AND prc.attempts < 5
AND u.role = 'customer''
      ORDER BY prc.created_at DESC
      LIMIT 1
      `,
      [email, code],
    );

    if (!codeResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Código inválido ou expirado." });
    }

    const resetCode = codeResult.rows[0];

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await pool.query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [passwordHash, resetCode.user_id],
    );

    await pool.query(
      `
      UPDATE password_reset_codes
      SET used_at = NOW()
      WHERE id = $1
      `,
      [resetCode.id],
    );

    await client.query("COMMIT");

    return res.json({
      ok: true,
      message: "Senha redefinida com sucesso. Faça login novamente.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro ao redefinir senha:", error);

    return res.status(500).json({
      error: "Erro ao redefinir senha.",
    });
  } finally {
    client.release();
  }
});

router.post("/verify-reset-code", async (req, res) => {
  const email = normalizeText(req.body.email).toLowerCase();
  const code = onlyNumbers(req.body.code);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "E-mail inválido." });
  }

  if (code.length !== 6) {
    return res.status(400).json({ error: "Código inválido." });
  }

  try {
    const result = await pool.query(
      `
      SELECT prc.id
      FROM password_reset_codes prc
      JOIN users u ON u.id = prc.user_id
      WHERE u.email = $1
        AND prc.code = $2
        AND prc.used_at IS NULL
        AND prc.expires_at > NOW()
      ORDER BY prc.created_at DESC
      LIMIT 1
      `,
      [email, code],
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "Código inválido ou expirado." });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao verificar código:", error);
    return res.status(500).json({ error: "Erro ao verificar código." });
  }
});

module.exports = router;
