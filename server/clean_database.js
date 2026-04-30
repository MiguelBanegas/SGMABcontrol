require("dotenv").config();
const knex = require("knex")(require("./knexfile").development);

async function cleanDatabase() {
  console.log("🧹 Iniciando limpieza de base de datos...\n");

  try {
    // 1. Eliminar items de venta (tiene FK a sales y products)
    console.log("📦 Eliminando items de venta...");
    const deletedItems = await knex("sale_items").del();
    console.log(`   ✅ ${deletedItems} items eliminados\n`);

    // 2. Eliminar ventas (tiene FK a users y customers)
    console.log("💰 Eliminando ventas...");
    const deletedSales = await knex("sales").del();
    console.log(`   ✅ ${deletedSales} ventas eliminadas\n`);

    // 3. Eliminar productos (tiene FK a categories)
    console.log("📦 Eliminando productos...");
    const deletedProducts = await knex("products").del();
    console.log(`   ✅ ${deletedProducts} productos eliminados\n`);

    // 4. Eliminar categorías
    console.log("📁 Eliminando categorías...");
    const deletedCategories = await knex("categories").del();
    console.log(`   ✅ ${deletedCategories} categorías eliminadas\n`);

    // 5. Eliminar clientes
    console.log("👥 Eliminando clientes...");
    const deletedCustomers = await knex("customers").del();
    console.log(`   ✅ ${deletedCustomers} clientes eliminados\n`);

    // OPCIONAL: También puedes limpiar otras tablas si lo deseas
    // Descomenta las que necesites:

    // console.log("🔔 Eliminando notificaciones...");
    // const deletedNotifications = await knex("notifications").del();
    // console.log(`   ✅ ${deletedNotifications} notificaciones eliminadas\n`);

    // console.log("📊 Eliminando historial de precios...");
    // const deletedPriceHistory = await knex("product_price_history").del();
    // console.log(`   ✅ ${deletedPriceHistory} registros de precios eliminados\n`);

    console.log("🧾 Eliminando ventas pendientes...");
    const deletedPending = await knex("pending_sales").del();
    console.log(`   ✅ ${deletedPending} ventas pendientes eliminadas\n`);

    // console.log("💳 Eliminando cuentas corrientes...");
    // const deletedAccounts = await knex("customer_accounts").del();
    // console.log(`   ✅ ${deletedAccounts} cuentas eliminadas\n`);

    console.log("✨ ¡Limpieza completada exitosamente!\n");
    console.log("📝 Resumen:");
    console.log(`   - Items de venta: ${deletedItems}`);
    console.log(`   - Ventas: ${deletedSales}`);
    console.log(`   - Productos: ${deletedProducts}`);
    console.log(`   - Categorías: ${deletedCategories}`);
    console.log(`   - Clientes: ${deletedCustomers}`);
    console.log("\n🚀 Ahora puedes ejecutar la migración con:");
    console.log("   node migrate_backup.js\n");
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  } finally {
    await knex.destroy();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  console.log("⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de:");
  console.log("   - Ventas e items de venta");
  console.log("   - Productos");
  console.log("   - Categorías");
  console.log("   - Clientes");
  console.log("\n   Los usuarios y configuraciones NO se eliminarán.\n");

  // Esperar 3 segundos para que el usuario pueda cancelar
  console.log("⏳ Iniciando en 3 segundos... (Ctrl+C para cancelar)\n");

  setTimeout(async () => {
    try {
      await cleanDatabase();
      process.exit(0);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  }, 3000);
}

module.exports = { cleanDatabase };
