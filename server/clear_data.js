const db = require("./db");

async function clearData() {
  console.log("Iniciando limpieza de datos de ventas y cuentas corrientes...");
  const trx = await db.transaction();
  try {
    // 1. Borrar items de venta (dependen de sales)
    const deletedSaleItems = await trx("sale_items").del();
    console.log(`- ${deletedSaleItems} items de venta eliminados.`);

    // 2. Borrar transacciones de cuentas corrientes (dependen de sales)
    const deletedTransactions = await trx(
      "customer_account_transactions"
    ).del();
    console.log(
      `- ${deletedTransactions} transacciones de cuenta corriente eliminadas.`
    );

    // 3. Borrar ventas pendientes
    const deletedPendingSales = await trx("pending_sales").del();
    console.log(`- ${deletedPendingSales} ventas pendientes eliminadas.`);

    // 4. Borrar ventas
    const deletedSales = await trx("sales").del();
    console.log(`- ${deletedSales} ventas eliminadas.`);

    await trx.commit();
    console.log("¡Limpieza completada con éxito!");
    process.exit(0);
  } catch (error) {
    await trx.rollback();
    console.error("Error durante la limpieza:", error);
    process.exit(1);
  }
}

clearData();
