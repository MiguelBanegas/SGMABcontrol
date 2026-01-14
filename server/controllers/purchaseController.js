const db = require("../db");

// Crear una nueva compra
exports.createPurchase = async (req, res) => {
  const { items, notes } = req.body;

  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Se requiere al menos un item" });
    }

    const purchase_id = await db.transaction(async (trx) => {
      // Calcular total
      const total = items.reduce(
        (sum, item) =>
          sum + parseFloat(item.quantity) * parseFloat(item.price_buy),
        0
      );

      // Crear compra
      const [purchase] = await trx("purchases")
        .insert({
          business_id: req.user.business_id,
          user_id: req.user.id,
          total,
          notes: notes || null,
        })
        .returning("id");

      // Crear items
      const purchaseItems = items.map((item) => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: parseFloat(item.quantity),
        price_buy: parseFloat(item.price_buy),
        subtotal: parseFloat(item.quantity) * parseFloat(item.price_buy),
      }));

      await trx("purchase_items").insert(purchaseItems);

      return purchase.id;
    });

    res.status(201).json({
      message: "Compra registrada",
      purchase_id,
    });
  } catch (error) {
    console.error("Error en createPurchase:", error);
    res.status(500).json({
      message: "Error al registrar compra",
      error: error.message,
    });
  }
};

// Obtener reporte de compras por período
exports.getPurchasesReport = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "Se requieren startDate y endDate",
      });
    }

    const purchases = await db("purchases")
      .leftJoin("users", "purchases.user_id", "users.id")
      .where("purchases.business_id", req.user.business_id)
      .whereBetween("purchases.created_at", [startDate, endDate])
      .select(
        "purchases.id",
        "purchases.total",
        "purchases.notes",
        "purchases.created_at",
        "users.username as user_name",
        db.raw(
          "(SELECT COUNT(*) FROM purchase_items WHERE purchase_id = purchases.id) as items_count"
        )
      )
      .orderBy("purchases.created_at", "desc");

    res.json(purchases);
  } catch (error) {
    console.error("Error en getPurchasesReport:", error);
    res.status(500).json({ message: "Error al obtener reporte" });
  }
};

// Obtener detalle de una compra específica
exports.getPurchaseDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const purchase = await db("purchases")
      .leftJoin("users", "purchases.user_id", "users.id")
      .where({
        "purchases.id": id,
        "purchases.business_id": req.user.business_id,
      })
      .select("purchases.*", "users.username as user_name")
      .first();

    if (!purchase) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    const items = await db("purchase_items")
      .join("products", "purchase_items.product_id", "products.id")
      .where("purchase_id", id)
      .select(
        "purchase_items.*",
        "products.name as product_name",
        "products.sku"
      );

    res.json({ ...purchase, items });
  } catch (error) {
    console.error("Error en getPurchaseDetail:", error);
    res.status(500).json({ message: "Error al obtener detalle" });
  }
};

module.exports = exports;
