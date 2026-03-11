const express = require("express");
const pool = require("../db");
const {
  allowedSectors,
  subcategoriesBySector,
} = require("./products");

const router = express.Router();

router.get("/products", async (req, res) => {
  try {
    const sector = req.query.sector?.trim() || "";
    const category = req.query.category?.trim() || "";
    const search = req.query.search?.trim() || "";
    const offer = req.query.offer?.trim() || "";

    let query = `
      SELECT
        id,
        name,
        description,
        price,
        old_price,
        stock,
        sector,
        category,
        image_url,
        is_offer,
        is_active
      FROM products
      WHERE is_active = true
        AND stock > 0
        AND price >= 0
        AND name IS NOT NULL
        AND TRIM(name) <> ''
        AND sector IS NOT NULL
        AND category IS NOT NULL
    `;

    const values = [];
    let paramCount = 1;

    if (sector && allowedSectors.includes(sector)) {
      query += ` AND sector = $${paramCount}`;
      values.push(sector);
      paramCount++;
    }

    if (category) {
      if (sector) {
        const allowedSubcategories = subcategoriesBySector[sector] || [];

        if (!allowedSubcategories.includes(category)) {
          return res.status(400).json({
            error: "Subcategoria inválida para o setor informado.",
          });
        }
      }

      query += ` AND category = $${paramCount}`;
      values.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND name ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }

    if (offer === "true") {
      query += ` AND is_offer = true`;
    }

    query += " ORDER BY name ASC";

    const result = await pool.query(query, values);

    return res.json({
      products: result.rows.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        oldPrice: product.old_price !== null ? Number(product.old_price) : null,
        stock: Number(product.stock),
        sector: product.sector,
        category: product.category,
        imageUrl: product.image_url,
        isOffer: product.is_offer,
        isActive: product.is_active,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar produtos da API pública:", error);
    return res.status(500).json({ error: "Erro ao buscar produtos." });
  }
});

module.exports = router;