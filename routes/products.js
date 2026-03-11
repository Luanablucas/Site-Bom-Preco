const express = require("express");
const { randomUUID } = require("crypto");
const pool = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const fs = require("fs");
const path = require("path");
const uploadProductImage = require("../middleware/uploadProductImage");

const router = express.Router();

const sectorLabels = {
  frios: "Frios",
  carnes: "Carnes",
  bebidas: "Bebidas",
  hortifruti: "Hortifruti",
  limpeza: "Limpeza",
  padaria: "Padaria",
  higieneebeleza: "Higiene e beleza",
  biscoitosedoces: "Biscoitos e doces",
  petshop: "Petshop",
  temperos: "Temperos",
  utilidades: "Utilidades",
  congelados: "Congelados",
  basicos: "Básicos",
};

const allowedSectors = Object.keys(sectorLabels);

const subcategoryLabels = {
  queijos: "Queijos",
  iogurtes: "Iogurtes",
  fatiados: "Fatiados",
  manteiga: "Manteiga e margarina",
  diversos: "Diversos",

  aves: "Aves",
  bovino: "Bovinos",
  suinos: "Suínos",
  frutosdomar: "Frutos do mar",

  achocolatado: "Achocolatados",
  leite: "Leite",
  agua: "Água",
  cafe: "Cafés e capuccinos",
  refrigerante: "Refrigerantes",
  suco: "Sucos e chás",
  energetico: "Energéticos",
  alcoolicas: "Alcoólicas",

  frutas: "Frutas",
  legumes: "Legumes",
  ovos: "Ovos",
  hortalicas: "Hortaliças",

  banheiro: "Banheiro",
  cozinha: "Cozinha",
  casa: "Casa",
  lavanderia: "Lavanderia",
  automotivo: "Automotivo",

  paes: "Pães e torradas",
  bolos: "Bolos",

  cabelo: "Cabelo",
  corpo: "Corpo e rosto",
  maos: "Mãos e pés",
  maquiagem: "Maquiagem",
  higiene: "Higiene pessoal",

  biscoitos: "Biscoitos",
  chocolates: "Chocolates",
  doces: "Doces",
  balas: "Balas, gomas e confeitos",

  racoes: "Rações",
  banho: "Banho e higiene",
  acessorios: "Acessórios",

  sal: "Sal e caldo",
  pimenta: "Pimenta e molhos",
  condimentos: "Condimentos",
  tempero: "Tempero completo",

  utilidades: "Utilidades",

  sorvetes: "Sorvetes",
  prontos: "Pratos prontos",
  empanados: "Empanados e petiscos",
  polpas: "Polpas",

  acucar: "Açúcar e adoçantes",
  arroz: "Arroz e feijão",
  farinha: "Farinha e massas",
  enlatados: "Enlatados"
};

const subcategoriesBySector = {
  frios: ["queijos", "iogurtes", "fatiados", "manteiga", "diversos"],
  carnes: ["aves", "bovino", "suinos", "frutosdomar"],
  bebidas: ["achocolatado", "leite", "agua", "cafe", "refrigerante", "suco", "energetico", "alcoolicas"],
  hortifruti: ["frutas", "legumes", "ovos", "hortalicas"],
  limpeza: ["banheiro", "cozinha", "casa", "lavanderia", "automotivo"],
  padaria: ["paes", "bolos"],
  higieneebeleza: ["cabelo", "corpo", "maos", "maquiagem", "higiene"],
  biscoitosedoces: ["biscoitos", "chocolates", "doces", "balas"],
  petshop: ["racoes", "banho", "acessorios"],
  temperos: ["sal", "pimenta", "condimentos", "tempero"],
  utilidades: ["utilidades"],
  congelados: ["sorvetes", "prontos", "empanados", "polpas"],
  basicos: ["acucar", "arroz", "farinha", "enlatados", "diversos"],
};
function normalizeSpaces(value) {
  return value?.trim().replace(/\s+/g, " ") || "";
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeProductData(body, file, existingImageUrl = null) {
  const cleanName = normalizeSpaces(body.name);
  const cleanDescription = normalizeSpaces(body.description) || null;
  const cleanSector = body.sector?.trim() || null;
  const cleanCategory = body.category?.trim() || null;

  const parsedPrice = Number(body.price);
  const parsedStock = Number(body.stock);

  const isActive =
    body.is_active === "true" ||
    body.is_active === "on" ||
    body.is_active === true;

  const isOffer =
    body.is_offer === "true" ||
    body.is_offer === "on" ||
    body.is_offer === true;

  const oldPriceRaw = body.old_price?.toString().trim();
  const parsedOldPrice = oldPriceRaw ? Number(oldPriceRaw) : null;

  let finalImageUrl = existingImageUrl || null;

  if (file) {
    finalImageUrl = `/uploads/products/${file.filename}`;
  }

  if (!cleanName || cleanName.length < 2) {
    throw new Error("Nome inválido.");
  }

  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    throw new Error("Preço inválido.");
  }

  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    throw new Error("Estoque inválido.");
  }

  if (!cleanSector || !allowedSectors.includes(cleanSector)) {
    throw new Error("Setor inválido.");
  }

  if (!cleanCategory) {
    throw new Error("Subcategoria inválida.");
  }

  const allowedSubcategories = subcategoriesBySector[cleanSector] || [];

  if (!allowedSubcategories.includes(cleanCategory)) {
    throw new Error("Subcategoria inválida para o setor selecionado.");
  }

  if (parsedOldPrice !== null && (Number.isNaN(parsedOldPrice) || parsedOldPrice < 0)) {
    throw new Error("Preço antigo inválido.");
  }

  if (isOffer) {
    if (parsedOldPrice === null) {
      throw new Error("Informe o preço antigo para produtos em oferta.");
    }

    if (parsedOldPrice <= parsedPrice) {
      throw new Error("O preço antigo deve ser maior que o preço atual.");
    }
  }

  return {
    name: cleanName,
    description: cleanDescription,
    price: Number(parsedPrice.toFixed(2)),
    stock: parsedStock,
    sector: cleanSector,
    category: cleanCategory,
    image_url: finalImageUrl,
    is_active: isActive,
    is_offer: isOffer,
    old_price: isOffer ? Number(parsedOldPrice.toFixed(2)) : null,
  };
}

function buildAdminProductsRedirect(query = {}) {
  const params = new URLSearchParams(query);
  return `/admin/products?${params.toString()}`;
}

router.get("/new", requireAuth, requireAdmin, (req, res) => {
  res.render("admin-product-new", { user: req.user });
});

router.post(
  "/",
  requireAuth,
  requireAdmin,
  uploadProductImage.single("image"),
  async (req, res) => {
    try {
      const productData = normalizeProductData(req.body, req.file);

      await pool.query(
        `INSERT INTO products
  (id, name, description, price, stock, sector, category, image_url, is_active, is_offer, old_price)
 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          randomUUID(),
          productData.name,
          productData.description,
          productData.price,
          productData.stock,
          productData.sector,
          productData.category,
          productData.image_url,
          productData.is_active,
          productData.is_offer,
          productData.old_price,
        ]
      );

      res.redirect("/admin/products?success=created");
    } catch (error) {
      console.error("Erro ao cadastrar produto:", error);

      if (req.file) {
        removeLocalImage(`/uploads/products/${req.file.filename}`);
      }

      if (error.message) {
        return res.redirect(
          buildAdminProductsRedirect({
            error: error.message,
          })
        );
      }

      res.status(500).send("Erro ao cadastrar produto.");
    }
  }
);

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    const stock = req.query.stock?.trim() || "";
    const sector = req.query.sector?.trim() || "";
    const category = req.query.category?.trim() || "";
    const status = req.query.status?.trim() || "";
    const offer = req.query.offer?.trim() || "";
    const success = req.query.success?.trim() || "";
    const error = req.query.error?.trim() || "";

    let query = "SELECT * FROM products WHERE 1=1";
    const values = [];
    let paramCount = 1;

    if (search) {
      query += ` AND name ILIKE $${paramCount}`;
      values.push(`%${search}%`);
      paramCount++;
    }

    if (stock === "out") {
      query += ` AND stock <= 0`;
    } else if (stock === "low") {
      query += ` AND stock > 0 AND stock <= 10`;
    } else if (stock === "available") {
      query += ` AND stock > 10`;
    }

    if (sector && allowedSectors.includes(sector)) {
      query += ` AND sector = $${paramCount}`;
      values.push(sector);
      paramCount++;
    }

    if (category) {
      query += ` AND category = $${paramCount}`;
      values.push(category);
      paramCount++;
    }
    if (status === "active") {
      query += ` AND is_active = true`;
    } else if (status === "inactive") {
      query += ` AND is_active = false`;
    }

    if (offer === "yes") {
      query += ` AND is_offer = true`;
    } else if (offer === "no") {
      query += ` AND is_offer = false`;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    res.render("admin-products", {
      user: req.user,
      products: result.rows,
      search,
      stock,
      category,
      status,
      offer,
      success,
      error,
      sector,
      sectorLabels,
      allowedSectors,
      subcategoryLabels,
      subcategoriesBySector,
    });
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).send("Erro ao carregar produtos.");
  }
});

router.get("/:id/edit", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).send("Produto não encontrado.");
    }

    res.render("admin-product-edit", {
      user: req.user,
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Erro ao carregar produto para edição:", error);
    res.status(500).send("Erro ao carregar produto.");
  }
});

router.post(
  "/:id/update",
  requireAuth,
  requireAdmin,
  uploadProductImage.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingResult = await pool.query(
        "SELECT image_url FROM products WHERE id = $1",
        [id]
      );

      if (!existingResult.rows.length) {
        if (req.file) {
          removeLocalImage(`/uploads/products/${req.file.filename}`);
        }

        return res.status(404).send("Produto não encontrado.");
      }

      const existingProduct = existingResult.rows[0];

      const productData = normalizeProductData(
        req.body,
        req.file,
        existingProduct.image_url
      );

      await pool.query(
        `UPDATE products
   SET name = $1,
       description = $2,
       price = $3,
       stock = $4,
       sector = $5,
       category = $6,
       image_url = $7,
       is_active = $8,
       is_offer = $9,
       old_price = $10,
       updated_at = NOW()
   WHERE id = $11`,
        [
          productData.name,
          productData.description,
          productData.price,
          productData.stock,
          productData.sector,
          productData.category,
          productData.image_url,
          productData.is_active,
          productData.is_offer,
          productData.old_price,
          id,
        ]
      );

      if (req.file && existingProduct.image_url !== productData.image_url) {
        removeLocalImage(existingProduct.image_url);
      }

      res.redirect("/admin/products?success=updated");
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);

      if (req.file) {
        removeLocalImage(`/uploads/products/${req.file.filename}`);
      }

      if (error.message) {
        return res.redirect(
          buildAdminProductsRedirect({
            error: error.message,
          })
        );
      }

      res.status(500).send("Erro ao atualizar produto.");
    }
  }
);

router.post("/:id/stock", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, amount, stock } = req.body;

    const productResult = await pool.query(
      "SELECT id, stock FROM products WHERE id = $1",
      [id]
    );

    if (!productResult.rows.length) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    const currentStock = Number(productResult.rows[0].stock);
    let newStock = currentStock;

    if (action === "increment") {
      const parsedAmount = Number(amount);

      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Quantidade inválida." });
      }

      newStock = currentStock + parsedAmount;
    } else if (action === "decrement") {
      const parsedAmount = Number(amount);

      if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: "Quantidade inválida." });
      }

      newStock = Math.max(0, currentStock - parsedAmount);
    } else if (action === "set") {
      const parsedStock = Number(stock);

      if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ error: "Estoque inválido." });
      }

      newStock = parsedStock;
    } else {
      return res.status(400).json({ error: "Ação inválida." });
    }

    const updateResult = await pool.query(
      "UPDATE products SET stock = $1 WHERE id = $2 RETURNING stock",
      [newStock, id]
    );

    return res.json({
      success: true,
      stock: updateResult.rows[0].stock,
    });
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    return res.status(500).json({ error: "Erro ao atualizar estoque." });
  }
});

router.post("/:id/delete", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM products WHERE id = $1", [id]);

    res.redirect("/admin/products?success=deleted");
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    res.status(500).send("Erro ao excluir produto.");
  }
});

function removeLocalImage(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/products/")) {
    return;
  }

  const filePath = path.join(__dirname, "..", "public", imageUrl);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = {
  router,
  sectorLabels,
  allowedSectors,
  subcategoryLabels,
  subcategoriesBySector,
};