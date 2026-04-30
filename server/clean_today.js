const db = require("./db");

async function cleanToday() {
  const startOfDay = "2026-01-30T00:00:00.000Z";
  const endOfDay = "2026-01-30T23:59:59.999Z";

  const todayDate = new Date().toISOString().split("T")[0];
  console.log(`Iniciando limpieza para el día: ${todayDate}`);

  let trx;
  try {
    trx = await db.transaction();

    // 1. Encontrar ventas de hoy
    const todaySales = await trx("sales").whereBetween("created_at", [
      startOfDay,
      endOfDay,
    ]);

    const saleIds = todaySales.map((s) => s.id);
    console.log(`Limpiando ${saleIds.length} ventas encontradas.`);

    if (saleIds.length > 0) {
      // 2. Para cada venta, obtener items para devolver stock
      const saleItems = await trx("sale_items").whereIn("sale_id", saleIds);

      for (const item of saleItems) {
        console.log(
          `- Restaurando stock para producto ${item.product_id}: +${item.quantity}`,
        );
        await trx("products")
          .where({ id: item.product_id })
          .increment("stock", item.quantity);

        const product = await trx("products")
          .where({ id: item.product_id })
          .first();
        if (product && product.is_container) {
          const sale = todaySales.find((s) => s.id === item.sale_id);
          if (sale && sale.customer_id) {
            console.log(
              `- Ajustando balance de envase para cliente ${sale.customer_id}`,
            );
            await trx("container_balances")
              .where({
                customer_id: sale.customer_id,
                product_id: item.product_id,
              })
              .decrement("balance", item.quantity);
          }
        }
      }

      console.log("Eliminando sale_items...");
      await trx("sale_items").whereIn("sale_id", saleIds).del();
      console.log("Eliminando customer_account_transactions por sale_id...");
      await trx("customer_account_transactions")
        .whereIn("sale_id", saleIds)
        .del();
      console.log("Eliminando container_transactions por sale_id...");
      await trx("container_transactions").whereIn("sale_id", saleIds).del();
    }

    // 4. Eliminar otros movimientos de hoy por fecha
    console.log("Eliminando customer_account_transactions por fecha...");
    await trx("customer_account_transactions")
      .whereBetween("created_at", [startOfDay, endOfDay])
      .del();
    console.log("Eliminando container_transactions por fecha...");
    await trx("container_transactions")
      .whereBetween("created_at", [startOfDay, endOfDay])
      .del();
    console.log("Eliminando cash_movements por fecha...");
    // Nota: borramos movimientos de hoy, pero no cerramos la caja. Los totales se recalculan.
    await trx("cash_movements")
      .whereBetween("created_at", [startOfDay, endOfDay])
      .del();

    // 5. Eliminar las cabeceras de ventas
    if (saleIds.length > 0) {
      const deletedCount = await trx("sales").whereIn("id", saleIds).del();
      console.log(`${deletedCount} ventas eliminadas correctamente.`);
    }

    await trx.commit();
    console.log("Limpieza completada con éxito.");
  } catch (error) {
    if (trx) await trx.rollback();
    console.error("Error durante la limpieza:");
    console.error(error);
  } finally {
    process.exit(0);
  }
}

cleanToday();
