const db = require("../db");
const { getCustomerAdjustedBalance } = require("./customerAccountController");

exports.getAllCustomers = async (req, res) => {
  try {
    const { all } = req.query; // Si all=true, trae incluso los inactivos (para el admin)

    let query = db("customers").where({ business_id: req.user.business_id });

    if (all !== "true") {
      query = query.where({ is_active: true });
    }

    const customers = await query.select("*").orderBy("name", "asc");
    res.json(customers);
  } catch (error) {
    console.error("Error en getAllCustomers:", error);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
};

exports.createCustomer = async (req, res) => {
  const { name, email, phone, notes } = req.body;
  try {
    const [result] = await db("customers")
      .insert({
        name,
        email,
        phone,
        notes,
        is_active: true,
        business_id: req.user.business_id,
      })
      .returning("id");

    const id = typeof result === "object" ? result.id : result;

    res.status(201).json({ id, message: "Cliente creado con éxito" });
  } catch (error) {
    console.error("Error en createCustomer:", error);
    res.status(500).json({ message: "Error al crear cliente" });
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, notes, is_active } = req.body;
  try {
    await db("customers")
      .where({ id, business_id: req.user.business_id })
      .update({ name, email, phone, notes, is_active });
    res.json({ message: "Cliente actualizado con éxito" });
  } catch (error) {
    console.error("Error en updateCustomer:", error);
    res.status(500).json({ message: "Error al actualizar cliente" });
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const business_id = req.user.business_id;

  try {
    // 1. Verificar si tiene deuda
    const balance = await getCustomerAdjustedBalance(id, business_id);

    if (balance > 0.01) {
      return res.status(400).json({
        message: `No se puede eliminar un cliente con deuda pendiente ($${balance.toFixed(
          2
        )})`,
      });
    }

    await db.transaction(async (trx) => {
      // 2. Reasignar ventas a 'Consumidor Final' (NULL)
      await trx("sales")
        .where({ customer_id: id, business_id })
        .update({ customer_id: null });

      // 3. Eliminar físicamente (las transacciones de cuenta corriente se borran por CASCADE en la DB si existen y el balance es 0)
      await trx("customers").where({ id, business_id }).del();
    });

    res.json({
      message: "Cliente eliminado y ventas reasignadas a Consumidor Final",
    });
  } catch (error) {
    console.error("Error en deleteCustomer:", error);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
};
