const express = require("express");
const pool = require("../db");
const { requireCustomerAuth } = require("../middleware/customerAuth");

const router = express.Router();

router.get("/", requireCustomerAuth, async (req, res) => {
  try {
    const userResult = await pool.query(
      `
      SELECT id, name, email, birth_date, cpf_cnpj, phone
      FROM users
      WHERE id = $1 AND role = 'customer'
      `,
      [req.customer.id]
    );

    const addressResult = await pool.query(
      `
      SELECT id, cep, street, neighborhood, city, state, complement
      FROM user_addresses
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [req.customer.id]
    );

    return res.json({
      user: userResult.rows[0],
      address: addressResult.rows[0] || null
    });
  } catch (error) {
    console.error("Erro ao buscar conta:", error);
    return res.status(500).json({ error: "Erro ao buscar dados da conta." });
  }
});

/// Edição de cadastro

router.put("/", requireCustomerAuth, async (req, res) => {
  const { name, phone } = req.body;

  try {
    await pool.query(
      `
      UPDATE users
      SET name = $1,
          phone = $2,
          updated_at = NOW()
      WHERE id = $3
      `,
      [name, phone, req.customer.id]
    );

    return res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return res.status(500).json({ error: "Erro ao atualizar perfil." });
  }
});

router.put("/address", requireCustomerAuth, async (req, res) => {
  const { cep, street, neighborhood, city, state, complement } = req.body;

  if (!cep || !street || !neighborhood || !city || !state) {
    return res.status(400).json({ error: "Endereço incompleto." });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM user_addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [req.customer.id]
    );

    if (existing.rows.length) {
      await pool.query(
        `
        UPDATE user_addresses
        SET cep = $1,
            street = $2,
            neighborhood = $3,
            city = $4,
            state = $5,
            complement = $6,
            updated_at = NOW()
        WHERE id = $7
        `,
        [
          cep,
          street,
          neighborhood,
          city,
          state,
          complement || null,
          existing.rows[0].id
        ]
      );
    } else {
      await pool.query(
        `
        INSERT INTO user_addresses
          (id, user_id, cep, street, neighborhood, city, state, complement)
        VALUES
          (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
        `,
        [
          req.customer.id,
          cep,
          street,
          neighborhood,
          city,
          state,
          complement || null
        ]
      );
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao atualizar endereço:", error);
    return res.status(500).json({ error: "Erro ao atualizar endereço." });
  }
});

module.exports = router;