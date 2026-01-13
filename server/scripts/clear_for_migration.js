const db = require("../db");

async function clearAllData() {
  console.log("Iniciando borrado total para carga limpia...");
  const trx = await db.transaction();
  try {
    // 1. Borrar items de venta (llave foránea a products y sales)
    const deletedSaleItems = await trx("sale_items").del();
    console.log(`- ${deletedSaleItems} items de venta eliminados.`);

    // 2. Borrar transacciones de cuentas corrientes (dependen de sales)
    const deletedTransactions = await trx(
      "customer_account_transactions"
    ).del();
    console.log(
      `- ${deletedTransactions} transacciones de cuenta corriente eliminadas.`
    );

    // 3. Borrar ventas pendientes (pueden referenciar productos)
    const deletedPendingSales = await trx("pending_sales").del();
    console.log(`- ${deletedPendingSales} ventas pendientes eliminadas.`);

    // 4. Borrar ventas
    const deletedSales = await trx("sales").del();
    console.log(`- ${deletedSales} ventas eliminadas.`);

    // 5. Borrar productos (ahora que no tienen dependencias)
    const deletedProducts = await trx("products").del();
    console.log(`- ${deletedProducts} productos eliminados.`);

    // 6. Borrar clientes
    const deletedCustomers = await trx("customers").del();
    console.log(`- ${deletedCustomers} clientes eliminados.`);

    await trx.commit();
    console.log("\n¡Base de datos de productos y ventas vaciada con éxito!");
    process.exit(0);
  } catch (error) {
    await trx.rollback();
    console.error("Error durante el vaciado:", error);
    process.exit(1);
  }
}

clearAllData();
