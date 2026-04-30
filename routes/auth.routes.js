const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const pool = require("../db");
const rateLimit = require("express-rate-limit");
const { registerSchema, loginSchema } = require("../schemas/auth.schema");
const { userSafeResponse } = require("../utils/userSafeResponse");
const { sendEmail } = require("../services/mail.service");
const { generateCode } = require("../utils/generateCode");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas tentativas. Tente novamente em alguns minutos.",
  },
});

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

    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
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

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0].message,
    });
  }

  const {
    name: cleanName,
    birthDate,
    cpfCnpj: cleanCpfCnpj,
    phone: cleanPhone,
    email: cleanEmail,
    password,
    cep: cleanCep,
    street: cleanStreet,
    neighborhood: cleanNeighborhood,
    city: cleanCity,
    number: cleanNumber,
    state: cleanState,
    complement: cleanComplement,
  } = parsed.data;

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

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = randomUUID();

    await client.query(
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
      ]
    );

    await client.query(
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
      ]
    );

    const code = generateCode();

    await client.query(
      `
      INSERT INTO email_verification_codes
        (user_id, email, code, type, expires_at)
      VALUES
        ($1, $2, $3, 'verify_email', NOW() + INTERVAL '15 minutes')
      `,
      [userId, cleanEmail, code]
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

router.post("/verify-email", authLimiter, async (req, res) => {
  const { email, code } = req.body;

  const cleanEmail = normalizeText(email).toLowerCase();
  const cleanCode = onlyNumbers(code);

  if (!isValidEmail(cleanEmail) || cleanCode.length !== 6) {
    return res.status(400).json({
      error: "E-mail ou código inválido.",
    });
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
      [cleanEmail, cleanCode]
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
      [verification.user_id]
    );

    await pool.query(
      `
      UPDATE email_verification_codes
      SET used = true
      WHERE user_id = $1
        AND type = 'verify_email'
      `,
      [verification.user_id]
    );

    return res.json({ ok: true, message: "E-mail verificado com sucesso." });
  } catch (error) {
    console.error("Erro ao verificar e-mail:", error);
    return res.status(500).json({ error: "Erro ao verificar e-mail." });
  }
});

router.post("/login", authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: parsed.error.issues[0].message,
    });
  }

  const { email, password } = parsed.data;

  try {
    const result = await pool.query(
      `
      SELECT id, name, email, password_hash, role, email_verified, cpf_cnpj, phone, birth_date
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: "Verifique seu e-mail antes de entrar.",
      });
    }

    if (user.role !== "customer") {
      return res.status(403).json({
        error: "Acesso permitido apenas para clientes.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("customer_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 2,
    });

    return res.json({
      ok: true,
      user: userSafeResponse(user),
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return res.status(500).json({ error: "Erro no servidor." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("customer_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const token = req.cookies.customer_token;

  if (!token) {
    return res.json({ user: null });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.role !== "customer") {
      return res.json({ user: null });
    }

    const result = await pool.query(
      `
      SELECT id, name, email, role, email_verified, birth_date, cpf_cnpj, phone
      FROM users
      WHERE id = $1
        AND role = 'customer'
      LIMIT 1
      `,
      [payload.id]
    );

    const userFromDB = result.rows[0];

    if (!userFromDB) {
      return res.json({ user: null });
    }

    return res.json({
      user: userSafeResponse(userFromDB),
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

router.post("/forgot-password", authLimiter, async (req, res) => {
  const email = normalizeText(req.body.email).toLowerCase();

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Informe um e-mail válido." });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, name, email
      FROM users
      WHERE email = $1
        AND role = 'customer'
      LIMIT 1
      `,
      [email]
    );

    const user = result.rows[0];

    if (user) {
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        `
        INSERT INTO password_reset_codes (id, user_id, code, expires_at)
        VALUES ($1, $2, $3, $4)
        `,
        [randomUUID(), user.id, code, expiresAt]
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
    }

    return res.json({
      ok: true,
      message: "Se o e-mail existir, você receberá um código de recuperação.",
    });
  } catch (error) {
    console.error("Erro ao gerar código:", error);
    return res.status(500).json({
      error: "Erro ao gerar código de recuperação.",
    });
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
        AND prc.attempts < 5
        AND u.role = 'customer'
      ORDER BY prc.created_at DESC
      LIMIT 1
      `,
      [email, code]
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

    const codeResult = await client.query(
      `
      SELECT prc.id, u.id AS user_id
      FROM password_reset_codes prc
      JOIN users u ON u.id = prc.user_id
      WHERE u.email = $1
        AND prc.code = $2
        AND prc.used_at IS NULL
        AND prc.expires_at > NOW()
        AND prc.attempts < 5
        AND u.role = 'customer'
      ORDER BY prc.created_at DESC
      LIMIT 1
      `,
      [email, code]
    );

    if (!codeResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Código inválido ou expirado." });
    }

    const resetCode = codeResult.rows[0];
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await client.query(
      `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE id = $2
      `,
      [passwordHash, resetCode.user_id]
    );

    await client.query(
      `
      UPDATE password_reset_codes
      SET used_at = NOW()
      WHERE id = $1
      `,
      [resetCode.id]
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

module.exports = router;