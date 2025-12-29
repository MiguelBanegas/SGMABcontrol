const db = require("../db");

exports.createSale = async (req, res) => {
  const { id, items, total, user_id, created_at } = req.body;

  const trx = await db.transaction();
  try {
    await trx("sales").insert({
      id,
      user_id,
      total,
      created_at,
    });

    const saleItems = items.map((item) => ({
      sale_id: id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_unit: item.price_unit,
      subtotal: item.subtotal,
    }));

    await trx("sale_items").insert(saleItems);

    // Actualizar stock
    for (const item of items) {
      await trx("products")
        .where({ id: item.product_id })
        .decrement("stock", item.quantity);
    }

    await trx.commit();
    res.status(201).json({ message: "Venta registrada con éxito" });
  } catch (error) {
    await trx.rollback();
    console.error(error);
    res.status(500).json({ message: "Error al registrar la venta" });
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
    res.status(500).json({ message: "Error al obtener estadísticas" });
  }
};
