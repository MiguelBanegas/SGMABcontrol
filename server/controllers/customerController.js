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
    console.log(`[DELETE CUSTOMER] Iniciando eliminación de cliente ID: ${id}`);

    // 0. Verificar que el cliente existe
    const customer = await db("customers")
      .where({ id, business_id })
      .first();

    if (!customer) {
      return res.status(404).json({
        code: "CUSTOMER_NOT_FOUND",
        message: "Cliente no encontrado",
      });
    }

    // 1. Verificar si tiene deuda pendiente
    const balance = await getCustomerAdjustedBalance(id, business_id);

    if (balance > 0.01) {
      console.log(`[DELETE CUSTOMER] ❌ Cliente tiene deuda: $${balance}`);
      return res.status(400).json({
        code: "CUSTOMER_HAS_DEBT",
        message: `No se puede eliminar un cliente con deuda pendiente ($${balance.toFixed(2)})`,
        debt: balance,
      });
    }

    // 2. Verificar si hay contenedores activos en préstamo
    const activeContainers = await db("container_balances")
      .where({ customer_id: id, business_id })
      .where("balance", ">", 0);

    if (activeContainers && activeContainers.length > 0) {
      const totalContainers = activeContainers.reduce(
        (sum, c) => sum + c.balance,
        0
      );
      console.log(
        `[DELETE CUSTOMER] ❌ Cliente tiene ${activeContainers.length} contenedor(es) activo(s)`
      );
      return res.status(400).json({
        code: "CUSTOMER_HAS_ACTIVE_CONTAINERS",
        message: `No se puede eliminar cliente con ${activeContainers.length} contenedor(es) activo(s). Total: ${totalContainers} unidades en préstamo`,
        containers: activeContainers,
        totalUnits: totalContainers,
      });
    }

    // 3. Verificar si hay ventas pendientes en progreso
    const pendingSale = await db("pending_sales")
      .where({ customer_id: id })
      .first();

    if (pendingSale) {
      console.log(`[DELETE CUSTOMER] ❌ Cliente tiene venta pendiente (ID: ${pendingSale.id})`);
      return res.status(400).json({
        code: "CUSTOMER_HAS_PENDING_SALE",
        message: "No se puede eliminar cliente con venta pendiente. Completa o cancela la venta primero.",
        pendingSaleId: pendingSale.id,
      });
    }

    console.log(`[DELETE CUSTOMER] ✅ Todas las validaciones pasaron`);

    await db.transaction(async (trx) => {
      // 4. Reasignar ventas a 'Consumidor Final' (NULL)
      const updatedSales = await trx("sales")
        .where({ customer_id: id, business_id })
        .update({ customer_id: null });

      console.log(`[DELETE CUSTOMER] Reasignadas ${updatedSales} ventas`);

      // 5. Limpiar container_balances de forma controlada (NO deletear)
      const updatedContainers = await trx("container_balances")
        .where({ customer_id: id, business_id })
        .update({ customer_id: null, balance: 0 });

      console.log(`[DELETE CUSTOMER] Limpiados ${updatedContainers} contenedores`);

      // 6. Eliminar físicamente
      const deleted = await trx("customers").where({ id, business_id }).del();

      console.log(`[DELETE CUSTOMER] ✅ Cliente eliminado`);

      return { updatedSales, updatedContainers, deleted };
    });

    res.json({
      message: "Cliente eliminado con éxito",
      details: {
        customerName: customer.name,
      },
    });
  } catch (error) {
    console.error("Error en deleteCustomer:", error);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
};
