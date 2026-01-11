const db = require("../db");

// Obtener todas las ventas temporales del usuario
exports.getAllPendingSales = async (req, res) => {
  try {
    const sales = await db("pending_sales_multiple")
      .where({
        user_id: req.user.id,
        business_id: req.user.business_id,
      })
      .orderBy("created_at", "asc");

    res.json(sales);
  } catch (error) {
    console.error("Error al obtener ventas temporales:", error);
    res.status(500).json({ message: "Error al obtener ventas temporales" });
  }
};

// Crear nueva venta temporal
exports.createPendingSale = async (req, res) => {
  const { cart, customer_id, payment_method } = req.body;

  try {
    // Verificar límite de ventas (máximo 5)
    const count = await db("pending_sales_multiple")
      .where({
        user_id: req.user.id,
        business_id: req.user.business_id,
      })
      .count("id as total")
      .first();

    if (parseInt(count.total) >= 5) {
      return res.status(400).json({
        message: "Límite de ventas simultáneas alcanzado (máximo 5)",
      });
    }

    const [id] = await db("pending_sales_multiple")
      .insert({
        user_id: req.user.id,
        business_id: req.user.business_id,
        customer_id: customer_id || null,
        payment_method: payment_method || "Efectivo",
        cart: JSON.stringify(cart || []),
      })
      .returning("id");

    const newSale = await db("pending_sales_multiple").where({ id }).first();

    res.status(201).json(newSale);
  } catch (error) {
    console.error("Error al crear venta temporal:", error);
    res.status(500).json({ message: "Error al crear venta temporal" });
  }
};

// Actualizar venta temporal
exports.updatePendingSale = async (req, res) => {
  const { id } = req.params;
  const { cart, customer_id, payment_method } = req.body;

  try {
    const updateData = {
      updated_at: db.fn.now(),
    };

    if (cart !== undefined) updateData.cart = JSON.stringify(cart);
    if (customer_id !== undefined) updateData.customer_id = customer_id;
    if (payment_method !== undefined)
      updateData.payment_method = payment_method;

    await db("pending_sales_multiple")
      .where({
        id,
        user_id: req.user.id,
        business_id: req.user.business_id,
      })
      .update(updateData);

    const updatedSale = await db("pending_sales_multiple")
      .where({ id })
      .first();

    res.json(updatedSale);
  } catch (error) {
    console.error("Error al actualizar venta temporal:", error);
    res.status(500).json({ message: "Error al actualizar venta temporal" });
  }
};

// Eliminar venta temporal
exports.deletePendingSale = async (req, res) => {
  const { id } = req.params;

  try {
    await db("pending_sales_multiple")
      .where({
        id,
        user_id: req.user.id,
        business_id: req.user.business_id,
      })
      .delete();

    res.json({ message: "Venta temporal eliminada" });
  } catch (error) {
    console.error("Error al eliminar venta temporal:", error);
    res.status(500).json({ message: "Error al eliminar venta temporal" });
  }
};
