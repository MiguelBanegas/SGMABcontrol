const knex = require("knex");
const config = require("./knexfile");
const db = knex(config.development);

async function clearSalesHistory() {
  const trx = await db.transaction();
  try {
    console.log("--- Clearing Sales History ---");

    // Eliminar items de venta primero (FK constraint)
    const itemsDeleted = await trx("sale_items").del();
    console.log(`- Deleted ${itemsDeleted} sale items.`);

    // Eliminar ventas
    const salesDeleted = await trx("sales").del();
    console.log(`- Deleted ${salesDeleted} sales.`);

    // Eliminar ventas pendientes (opcional pero recomendado para limpieza total)
    const pendingDeleted = await trx("pending_sales").del();
    console.log(`- Deleted ${pendingDeleted} pending sales.`);

    // Reiniciar secuencias si es necesario (Postgres)
    // Nota: sales usa UUID, sale_items usa increments
    await trx.raw("ALTER SEQUENCE sale_items_id_seq RESTART WITH 1");
    console.log("- Reset sale_items ID sequence.");

    await trx.commit();
    console.log("\n✅ Sales history cleared successfully!");
  } catch (error) {
    if (trx) await trx.rollback();
    console.error("❌ Error clearing sales history:", error);
  } finally {
    await db.destroy();
  }
}

clearSalesHistory();
