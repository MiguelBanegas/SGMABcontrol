const db = require("../db");

exports.getAllProducts = async (req, res) => {
  try {
    const products = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("products.active", true)
      .andWhere("products.business_id", req.user.business_id)
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
    const product = await db("products")
      .where({ sku, active: true, business_id: req.user.business_id })
      .first();
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

  const isOffer = is_offer === "true" || is_offer === true;

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
    price_offer: isOffer ? pOffer : null,
    is_offer: isOffer,
    image_url,
    promo_buy:
      isOffer && req.body.promo_buy ? parseInt(req.body.promo_buy) : null,
    promo_pay:
      isOffer && req.body.promo_pay ? parseInt(req.body.promo_pay) : null,
    promo_type: isOffer ? req.body.promo_type || "none" : "none",
    is_container:
      req.body.is_container === "true" || req.body.is_container === true,
    business_id: req.user.business_id,
  };

  // Si el SKU no viene, generamos uno basado en el último ID
  if (!sku || sku.trim() === "") {
    const lastProduct = await db("products").max("id as maxId").first();
    productData.sku = String((lastProduct.maxId || 0) + 1);
  }

  try {
    // Verificar si existe el SKU (activo o inactivo)
    const existingSku = await db("products")
      .where({
        sku: productData.sku,
        business_id: req.user.business_id,
      })
      .first();

    if (existingSku) {
      if (!existingSku.active) {
        // Si el usuario proporcionó el SKU manualmente y existe uno inactivo
        if (sku && sku.trim() !== "") {
          return res.status(400).json({
            message: `El código "${productData.sku}" ya está siendo usado por un producto inactivo ("${existingSku.name}").`,
            id: existingSku.id,
            inactive: true,
          });
        }

        // Si fue autogenerado o el usuario quiere reactivarlo (podríamos manejar esto en el front)
        // Por ahora, reactivamos si el usuario no especificó SKU (evita colisiones con el autogenerado)
        // O si reintenta sabiendo que existe.
        await db("products")
          .where({ id: existingSku.id })
          .update({ ...productData, active: true });

        req.app.get("io").emit("catalog_updated");
        return res.status(200).json({
          id: existingSku.id,
          message:
            "Producto reactivado y actualizado. Este código ya existía y ha sido restaurado.",
        });
      } else {
        // Ya existe uno activo
        return res.status(400).json({
          message: `El código "${productData.sku}" ya está siendo usado por el producto "${existingSku.name}".`,
        });
      }
    }

    // Si no existe, crear nuevo
    const result = await db("products").insert(productData).returning("id");
    const id = typeof result[0] === "object" ? result[0].id : result[0];

    // Enviar delta rico
    const newProduct = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("products.id", id)
      .andWhere("products.business_id", req.user.business_id)
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

  // Debug: Ver qué recibe el backend
  console.log("=== UPDATE PRODUCT DEBUG ===");
  console.log("is_container recibido:", req.body.is_container);
  console.log("Tipo:", typeof req.body.is_container);
  console.log("============================");

  // Validación y sanitización de precios y stock
  const parseNum = (val) => {
    if (val === "" || val === null || val === undefined || val === "null")
      return null;
    const p = parseFloat(val);
    return isNaN(p) ? null : p;
  };

  const pBuy = parseNum(price_buy);
  const pSell = parseNum(price_sell) || 0;
  const pOffer = parseNum(price_offer);
  const stockVal = parseNum(stock) || 0;

  if (pBuy !== null && pBuy > 10000000) {
    return res.status(400).json({ message: "Precio de compra absurdo" });
  }
  if (pSell > 10000000) {
    return res
      .status(400)
      .json({ message: "Precio de venta inválido o absurdo" });
  }

  const isOffer = is_offer === "true" || is_offer === true;

  const updateData = {
    name: name || "Producto sin nombre",
    description: description || null,
    sku: sku || "SIN-SKU",
    price_buy: pBuy,
    price_sell: Math.max(0, pSell),
    stock: stockVal,
    sell_by_weight:
      req.body.sell_by_weight === "true" || req.body.sell_by_weight === true,
    category_id:
      category_id === "" || category_id === "null" || category_id === null
        ? null
        : parseInt(category_id),
    price_offer: isOffer ? pOffer : null,
    is_offer: isOffer,
    promo_buy:
      isOffer && req.body.promo_buy ? parseInt(req.body.promo_buy) : null,
    promo_pay:
      isOffer && req.body.promo_pay ? parseInt(req.body.promo_pay) : null,
    promo_type: isOffer ? req.body.promo_type || "none" : "none",
    is_container:
      req.body.is_container === "true" || req.body.is_container === true,
  };

  if (req.file) {
    updateData.image_url = `/uploads/${req.file.filename}`;
  }

  try {
    await db("products")
      .where({ id, business_id: req.user.business_id })
      .update(updateData);

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
    await db("products")
      .where({ id, business_id: req.user.business_id })
      .update({ active: false });

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
      .where({ active: true, business_id: req.user.business_id })
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
    const [id] = await db("categories")
      .insert({ name, business_id: req.user.business_id })
      .returning("id");
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
    await db("categories")
      .where({ id, business_id: req.user.business_id })
      .update({ active: false });
    res.json({ message: "Categoría desactivada" });
  } catch (error) {
    console.error("Error en deleteCategory:", error);
    res.status(500).json({ message: "Error al desactivar categoría" });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const totalProducts = await db("products")
      .where({ business_id: req.user.business_id })
      .count("id as count")
      .first();
    const lowStockProducts = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("products.stock", "<", 5)
      .andWhere("products.business_id", req.user.business_id)
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
      .join("sales", "sale_items.sale_id", "sales.id")
      .where("sales.business_id", req.user.business_id)
      .select("sale_items.product_id")
      .sum("sale_items.quantity as total_sold")
      .groupBy("sale_items.product_id")
      .orderBy("total_sold", "desc")
      .limit(20);

    const productIds = topSellers.map((s) => s.product_id);

    const products = await db("products")
      .whereIn("products.id", productIds)
      .where({
        "products.active": true,
        "products.business_id": req.user.business_id,
      })
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
      const product = await trx("products")
        .where({ id, business_id: req.user.business_id })
        .first();
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      const newStock = parseFloat(product.stock) + parseFloat(adjustment);
      if (newStock < 0) {
        throw new Error("El stock resultante no puede ser negativo");
      }

      await trx("products")
        .where({ id, business_id: req.user.business_id })
        .update({ stock: newStock });
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

exports.patchProduct = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const product = await db("products")
      .where({ id, business_id: req.user.business_id })
      .first();

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // No permitir actualizar id o business_id
    delete updates.id;
    delete updates.business_id;

    await db("products")
      .where({ id, business_id: req.user.business_id })
      .update(updates);

    const updatedProduct = await db("products")
      .leftJoin("categories", "products.category_id", "categories.id")
      .where("products.id", id)
      .select("products.*", "categories.name as category_name")
      .first();

    // Emitir socket para que todos los clientes vean el cambio
    req.app.get("io").emit("catalog_updated", [updatedProduct]);

    res.json({
      message: "Producto actualizado parcialmente",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error en patchProduct:", error);
    res.status(500).json({
      message: "Error al actualizar el producto",
      error: error.message,
    });
  }
};

exports.searchProducts = async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  try {
    const searchTerm = `%${q.toLowerCase()}%`;

    const products = await db("products")
      .where("products.business_id", req.user.business_id)
      .andWhere("products.active", true)
      .andWhere(function () {
        this.whereRaw("LOWER(products.name) LIKE ?", [searchTerm]).orWhereRaw(
          "LOWER(products.sku) LIKE ?",
          [searchTerm],
        );
      })
      .leftJoin("categories", "products.category_id", "categories.id")
      .select("products.*", "categories.name as category_name")
      .limit(100)
      .orderByRaw(
        `
        CASE 
          WHEN LOWER(products.name) LIKE ? THEN 1
          WHEN LOWER(products.sku) LIKE ? THEN 2
          ELSE 3
        END, LOWER(products.name)
      `,
        [`${q.toLowerCase()}%`, `${q.toLowerCase()}%`],
      );

    res.json(products);
  } catch (error) {
    console.error("Error en searchProducts:", error);
    res.status(500).json({ message: "Error al buscar productos" });
  }
};
