const db = require("../db");

exports.createSale = async (req, res) => {
  const { id, items, total, customer_id, created_at, payment_method } =
    req.body;
  const user_id = req.user.id;

  const trx = await db.transaction();
  try {
    await trx("sales").insert({
      id,
      user_id,
      customer_id: customer_id || null,
      total,
      payment_method: payment_method || "Efectivo",
      status: payment_method === "Cta Cte" ? "pendiente" : "completado",
      created_at: created_at || trx.fn.now(),
    });

    const saleItems = await Promise.all(
      items.map(async (item) => {
        const product = await trx("products")
          .where({ id: item.product_id })
          .first();
        // Sugerencia: El cliente envía item.price_unit.
        // Calculamos el descuento comparando con el precio_sell original del producto.
        const discount = Math.max(
          0,
          (product.price_sell || 0) - item.price_unit
        );

        return {
          sale_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_unit: item.price_unit,
          subtotal: item.subtotal,
          cost_at_sale: product.price_buy || 0,
          discount_amount: discount,
        };
      })
    );

    await trx("sale_items").insert(saleItems);

    for (const item of items) {
      await trx("products")
        .where({ id: item.product_id })
        .decrement("stock", item.quantity);
    }

    await trx.commit();
    req.app.get("io").emit("catalog_updated");
    req.app.get("io").emit("sales_updated");
    res.status(201).json({ message: "Venta registrada con éxito" });
  } catch (error) {
    if (trx) await trx.rollback();
    console.error("CREATE_SALE_ERROR:", error);
    res.status(500).json({
      message: "Error al registrar la venta",
      error: error.message,
      stack: error.stack,
    });
  }
};

exports.getSalesStats = async (req, res) => {
  try {
    const stats = await db("sales")
      .select(
        db.raw("DATE(created_at) as date"),
        db.raw("SUM(total)::FLOAT as total_day")
      )
      .groupBy("date")
      .orderBy("date", "desc")
      .limit(7);
    res.json(stats);
  } catch (error) {
    console.error("Error en getSalesStats:", error);
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};

exports.getSalesHistory = async (req, res) => {
  try {
    const sales = await db("sales")
      .leftJoin("users", "sales.user_id", "users.id")
      .leftJoin("customers", "sales.customer_id", "customers.id")
      .select(
        "sales.*",
        "users.username as seller_name",
        "customers.name as customer_name"
      )
      .orderBy("sales.created_at", "desc");

    const history = await Promise.all(
      sales.map(async (sale) => {
        const items = await db("sale_items")
          .join("products", "sale_items.product_id", "products.id")
          .where({ sale_id: sale.id })
          .select("sale_items.*", "products.name as product_name");
        return { ...sale, items };
      })
    );

    res.json(history);
  } catch (error) {
    console.error("Error en getSalesHistory:", error);
    res.status(500).json({ message: "Error al obtener historial de ventas" });
  }
};

exports.toggleSaleStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db("sales").where({ id }).update({ status });
    req.app.get("io").emit("sales_updated");
    res.json({ message: "Estado de venta actualizado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar estado" });
  }
};
