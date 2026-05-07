/**
 * PROPUESTA DE ACTUALIZACIÓN: customerController.js
 * Añade validaciones completas antes de eliminar un cliente
 *
 * Cambios:
 * 1. Validación de contenedores activos en préstamo
 * 2. Validación de ventas pendientes
 * 3. Mejor manejo de transacciones
 * 4. Logs y feedback detallado al usuario
 */

const db = require("../db");
const { getCustomerAdjustedBalance } = require("./customerAccountController");

// ... resto de exports existentes ...

/**
 * PROPUESTA MEJORADA: deleteCustomer
 * Implementa validaciones completas antes de eliminar
 */
exports.deleteCustomer_PROPUESTO = async (req, res) => {
  const { id } = req.params;
  const business_id = req.user.business_id;

  try {
    console.log(`[DELETE CUSTOMER] Iniciando eliminación de cliente ID: ${id}, Business: ${business_id}`);

    // VALIDACIÓN 1: Verificar si el cliente existe
    const customer = await db("customers")
      .where({ id, business_id })
      .first();

    if (!customer) {
      return res.status(404).json({
        message: "Cliente no encontrado",
      });
    }

    // VALIDACIÓN 2: Verificar si tiene deuda pendiente
    console.log(`[DELETE CUSTOMER] Verificando deuda del cliente ${id}...`);
    const balance = await getCustomerAdjustedBalance(id, business_id);

    if (balance > 0.01) {
      console.log(`[DELETE CUSTOMER] ❌ Cliente tiene deuda: $${balance}`);
      return res.status(400).json({
        code: "CUSTOMER_HAS_DEBT",
        message: `No se puede eliminar un cliente con deuda pendiente ($${balance.toFixed(2)})`,
        debt: balance,
      });
    }

    // VALIDACIÓN 3: Verificar si hay contenedores activos en préstamo
    console.log(`[DELETE CUSTOMER] Verificando contenedores activos del cliente ${id}...`);
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

    // VALIDACIÓN 4: Verificar si hay ventas pendientes en progreso
    console.log(`[DELETE CUSTOMER] Verificando ventas pendientes del cliente ${id}...`);
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

    // VALIDACIÓN 5: Verificar si hay transacciones recientes (últimos 30 días)
    // Esto es un warning, no un bloqueador
    console.log(`[DELETE CUSTOMER] Verificando transacciones recientes del cliente ${id}...`);
    const recentTransactions = await db("customer_account_transactions")
      .where({ customer_id: id })
      .where("created_at", ">", db.raw("NOW() - INTERVAL 30 days"))
      .count("* as count")
      .first();

    const hasRecentActivity =
      recentTransactions && recentTransactions.count > 0;

    // PROCEDER CON LA ELIMINACIÓN (en transacción)
    console.log(`[DELETE CUSTOMER] ✅ Todas las validaciones pasaron. Procediendo con eliminación...`);

    const deletionResult = await db.transaction(async (trx) => {
      // Paso 1: Reasignar ventas a 'Consumidor Final' (NULL)
      const updatedSales = await trx("sales")
        .where({ customer_id: id, business_id })
        .update({ customer_id: null });

      console.log(`[DELETE CUSTOMER] Reasignadas ${updatedSales} ventas a Consumidor Final`);

      // Paso 2: Limpiar container_balances de forma controlada
      // NO deletear, marcar customer_id como NULL y balance como 0
      // (Esto mantiene el historial en container_transactions)
      const updatedContainers = await trx("container_balances")
        .where({ customer_id: id, business_id })
        .update({ customer_id: null, balance: 0 });

      console.log(`[DELETE CUSTOMER] Limpiados ${updatedContainers} saldos de contenedores`);

      // Paso 3: Limpiar pending_sales si existen
      const deletedPendingSales = await trx("pending_sales")
        .where({ customer_id: id })
        .del();

      console.log(`[DELETE CUSTOMER] Eliminadas ${deletedPendingSales} ventas pendientes huérfanas`);

      // Paso 4: Eliminar físicamente el cliente
      const deletedCustomer = await trx("customers")
        .where({ id, business_id })
        .del();

      console.log(`[DELETE CUSTOMER] ✅ Cliente eliminado de la BD`);

      return {
        updatedSales,
        updatedContainers,
        deletedPendingSales,
        deletedCustomer,
      };
    });

    console.log(`[DELETE CUSTOMER] ✅ Proceso completado exitosamente`);

    res.json({
      message: "Cliente eliminado con éxito",
      details: {
        customerName: customer.name,
        salesReassigned: deletionResult.updatedSales,
        containersCleared: deletionResult.updatedContainers,
        pendingSalesRemoved: deletionResult.deletedPendingSales,
      },
      warnings: hasRecentActivity
        ? "Este cliente tenía actividad reciente"
        : undefined,
    });
  } catch (error) {
    console.error("[DELETE CUSTOMER] ❌ Error en deleteCustomer:", error);
    res.status(500).json({
      message: "Error al eliminar cliente",
      error: error.message,
    });
  }
};

// Exportar como función alternativa para testing
// exports.deleteCustomer = exports.deleteCustomer_PROPUESTO;
