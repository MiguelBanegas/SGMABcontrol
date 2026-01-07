const db = require("../db");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("products.active", true)
      .select("products.*", "categories.name as category_name");
    res.json(products);
  } catch (error) {
    console.error("Error en getAllProducts:", error);
    res.status(500).json({ message: "Error al obtener productos" });
  }
};

exports.getProductBySku = async (req, res) => {
  const { sku } = req.params;
  try {
    const product = await db("products").where({ sku, active: true }).first();
    if (!product)
      return res.status(404).json({ message: "Producto no encontrado" });
    res.json(product);
  } catch (error) {
    console.error("Error en getProductBySku:", error);
    res.status(500).json({ message: "Error al buscar el producto" });
  }
};

exports.createProduct = async (req, res) => {
  const {
    name,
    description,
    sku,
    price_buy,
    price_sell,
    stock,
    category_id,
    price_offer,
    is_offer,
  } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // Validación de precios
  const pBuy =
    price_buy === "" || price_buy === null
      ? null
      : Math.max(0, parseFloat(price_buy));
  const pSell = Math.max(0, parseFloat(price_sell));
  const pOffer =
    price_offer === "" || price_offer === null
      ? null
      : Math.max(0, parseFloat(price_offer));

  if (pBuy !== null && pBuy > 10000000) {
    return res.status(400).json({ message: "Precio de compra absurdo" });
  }
  if (isNaN(pSell) || pSell > 10000000) {
    return res
      .status(400)
      .json({ message: "Precio de venta inválido o absurdo" });
  }
  if (pOffer !== null && isNaN(pOffer)) {
    return res.status(400).json({ message: "Precio de oferta inválido" });
  }

  // Sanitización de datos
  const productData = {
    name,
    description: description || null,
    sku,
    price_buy: pBuy,
    price_sell: pSell,
    stock: stock === "" ? 0 : Math.max(0, parseFloat(stock)),
    sell_by_weight:
      req.body.sell_by_weight === "true" || req.body.sell_by_weight === true,
    category_id:
      category_id === "" || category_id === "null"
        ? null
        : parseInt(category_id),
    price_offer: pOffer,
    is_offer: is_offer === "true" || is_offer === true,
    image_url,
    promo_buy: req.body.promo_buy ? parseInt(req.body.promo_buy) : null,
    promo_pay: req.body.promo_pay ? parseInt(req.body.promo_pay) : null,
    promo_type: req.body.promo_type || "none",
  };

  try {
    // Verificar si existe un producto inactivo con el mismo SKU
    const existingProduct = await db("products")
      .where({ sku: productData.sku, active: false })
      .first();

    if (existingProduct) {
      // Reactivar y actualizar el producto existente
      await db("products")
        .where({ id: existingProduct.id })
        .update({ ...productData, active: true });

      req.app.get("io").emit("catalog_updated");
      return res.status(200).json({
        id: existingProduct.id,
        message:
          "Producto reactivado y actualizado. Este producto ya existía y ha sido restaurado.",
      });
    }

    // Si no existe inactivo, crear nuevo
    const [id] = await db("products").insert(productData).returning("id");

    // Enviar delta rico
    const newProduct = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("products.id", id)
      .select("products.*", "categories.name as category_name")
      .first();

    req.app.get("io").emit("catalog_updated", [newProduct]);
    res.status(201).json({ id, message: "Producto creado con éxito" });
  } catch (error) {
    console.error("Error al crear producto:", error);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ message: "El SKU ya existe en un producto activo" });
    }
    res.status(500).json({ message: "Error al crear producto" });
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    sku,
    price_buy,
    price_sell,
    stock,
    category_id,
    price_offer,
    is_offer,
  } = req.body;

  // Validación de precios
  const pBuy =
    price_buy === "" || price_buy === null
      ? null
      : Math.max(0, parseFloat(price_buy));
  const pSell = Math.max(0, parseFloat(price_sell));
  const pOffer =
    price_offer === "" || price_offer === null
      ? null
      : Math.max(0, parseFloat(price_offer));

  if (pBuy !== null && pBuy > 10000000) {
    return res.status(400).json({ message: "Precio de compra absurdo" });
  }
  if (isNaN(pSell) || pSell > 10000000) {
    return res
      .status(400)
      .json({ message: "Precio de venta inválido o absurdo" });
  }
  if (pOffer !== null && isNaN(pOffer)) {
    return res.status(400).json({ message: "Precio de oferta inválido" });
  }

  const updateData = {
    name,
    description: description || null,
    sku,
    price_buy: pBuy,
    price_sell: pSell,
    stock: stock === "" ? 0 : Math.max(0, parseFloat(stock)),
    sell_by_weight:
      req.body.sell_by_weight === "true" || req.body.sell_by_weight === true,
    category_id:
      category_id === "" || category_id === "null"
        ? null
        : parseInt(category_id),
    price_offer: pOffer,
    is_offer: is_offer === "true" || is_offer === true,
    promo_buy: req.body.promo_buy ? parseInt(req.body.promo_buy) : null,
    promo_pay: req.body.promo_pay ? parseInt(req.body.promo_pay) : null,
    promo_type: req.body.promo_type || "none",
  };

  if (req.file) {
    updateData.image_url = `/uploads/${req.file.filename}`;
  }

  try {
    await db("products").where({ id }).update(updateData);

    // Obtener producto actualizado con categoría para el delta
    const updatedProduct = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("products.id", id)
      .select("products.*", "categories.name as category_name")
      .first();

    req.app.get("io").emit("catalog_updated", [updatedProduct]);
    res.json({ message: "Producto actualizado con éxito" });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    // Desactivación lógica en lugar de eliminación física
    await db("products").where({ id }).update({ active: false });

    // Notificar que este producto ya no es válido (enviamos el objeto con active false)
    req.app
      .get("io")
      .emit("catalog_updated", [{ id: parseInt(id), active: 0 }]);

    res.json({ message: "Producto desactivado correctamente" });
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    res.status(500).json({ message: "Error al desactivar producto" });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await db("categories")
      .where("active", true)
      .select("*")
      .orderBy("name", "asc");
    res.json(categories);
  } catch (error) {
    console.error("Error en getCategories:", error);
    res.status(500).json({ message: "Error al obtener categorías" });
  }
};

exports.createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name)
    return res.status(400).json({ message: "El nombre es obligatorio" });

  try {
    const [id] = await db("categories").insert({ name }).returning("id");
    res.status(201).json({ id, name, message: "Categoría creada con éxito" });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res.status(500).json({ message: "Error al crear categoría" });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Desactivación lógica en lugar de eliminación física
    await db("categories").where({ id }).update({ active: false });
    res.json({ message: "Categoría desactivada" });
  } catch (error) {
    console.error("Error en deleteCategory:", error);
    res.status(500).json({ message: "Error al desactivar categoría" });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await db("products").count("id as count").first();
    const lowStockProducts = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("stock", "<", 5)
      .select("products.*", "categories.name as category_name")
      .orderBy("stock", "asc");

    res.json({
      total: parseInt(totalProducts.count),
      lowStock: lowStockProducts.length,
      lowStockProducts: lowStockProducts,
    });
  } catch (error) {
    console.error("Error en getProductStats:", error);
    res
      .status(500)
      .json({ message: "Error al obtener estadísticas de productos" });
  }
};

exports.getTopSellers = async (req, res) => {
  try {
    const topSellers = await db("sale_items")
      .select("product_id")
      .sum("quantity as total_sold")
      .groupBy("product_id")
      .orderBy("total_sold", "desc")
      .limit(20);

    const productIds = topSellers.map((s) => s.product_id);

    const products = await db("products")
      .whereIn("products.id", productIds)
      .where("products.active", true)
      .leftJoin("categories", "products.category_id", "categories.id")
      .select("products.*", "categories.name as category_name");

    // Mantener el orden de ventas
    const sortedProducts = topSellers
      .map((s) => {
        const p = products.find((prod) => prod.id === s.product_id);
        return { ...p, total_sold: s.total_sold };
      })
      .filter((p) => p.id); // Filtrar productos que fueron desactivados

    res.json(sortedProducts);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener productos más vendidos" });
  }
};

exports.adjustStock = async (req, res) => {
  const { id } = req.params;
  const { adjustment } = req.body;

  if (isNaN(adjustment)) {
    return res.status(400).json({ message: "El ajuste debe ser un número" });
  }

  try {
    await db.transaction(async (trx) => {
      const product = await trx("products").where({ id }).first();
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      const newStock = parseFloat(product.stock) + parseFloat(adjustment);
      if (newStock < 0) {
        throw new Error("El stock resultante no puede ser negativo");
      }

      await trx("products").where({ id }).update({ stock: newStock });
    });

    // Obtener producto actualizado para el delta
    const updatedProduct = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("products.id", id)
      .select("products.*", "categories.name as category_name")
      .first();

    req.app.get("io").emit("catalog_updated", [updatedProduct]);
    res.json({ message: "Stock ajustado con éxito" });
  } catch (error) {
    console.error("Error en adjustStock:", error);
    res.status(error.message === "Producto no encontrado" ? 404 : 400).json({
      message: error.message || "Error interno al ajustar stock",
      error: error.message,
    });
  }
};
