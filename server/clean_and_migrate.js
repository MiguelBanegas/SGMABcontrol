require("dotenv").config();
const { cleanDatabase } = require("./clean_database");
const { migrate } = require("./migrate_backup");

async function cleanAndMigrate() {
  console.log("🔄 PROCESO COMPLETO: Limpieza + Migración\n");
  console.log("=".repeat(60));
  console.log("\n");

  try {
    // Paso 1: Limpiar base de datos
    console.log("📍 PASO 1/2: Limpiando base de datos actual...\n");
    await cleanDatabase();

    console.log("\n" + "=".repeat(60));
    console.log("\n");

    // Paso 2: Ejecutar migración
    console.log("📍 PASO 2/2: Ejecutando migración del backup...\n");
    const result = await migrate((message, percentage) => {
      console.log(`[${percentage}%] ${message}`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("\n");

    if (result.success) {
      console.log("✅ ¡PROCESO COMPLETADO EXITOSAMENTE!\n");
      console.log("📊 Estadísticas finales:");
      console.log(
        `   📁 Categorías: ${result.stats.categories.added} agregadas`,
      );
      console.log(
        `   📦 Productos: ${result.stats.products.added} agregados, ${result.stats.products.updated} actualizados`,
      );
      console.log(`   👥 Clientes: ${result.stats.customers.added} agregados`);
      console.log(`   💰 Ventas: ${result.stats.sales.added} agregadas`);
      console.log(`   🛒 Items: ${result.stats.saleItems.added} agregados`);
      console.log(`   🖼️  Imágenes: ${result.stats.images.copied} copiadas`);
      console.log(
        "\n✨ La base de datos ahora contiene solo los datos del backup.\n",
      );
    } else {
      console.error("❌ Error durante la migración:", result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error durante el proceso:", error);
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  console.log("\n⚠️  ADVERTENCIA IMPORTANTE ⚠️\n");
  console.log("Este script realizará las siguientes acciones:");
  console.log("1. 🧹 Eliminará TODOS los datos actuales de:");
  console.log("   - Ventas e items de venta");
  console.log("   - Productos");
  console.log("   - Categorías");
  console.log("   - Clientes");
  console.log("\n2. 📥 Importará los datos del backup:");
  console.log("   - Desde: temp_backup_extract/BD_MiNegocio");
  console.log("\n⚠️  Los usuarios y configuraciones NO se eliminarán.");
  console.log("⚠️  Esta acción NO se puede deshacer.");
  console.log("\n⏳ Iniciando en 5 segundos... (Ctrl+C para cancelar)\n");

  setTimeout(async () => {
    try {
      await cleanAndMigrate();
      process.exit(0);
    } catch (error) {
      console.error("Error:", error);
      process.exit(1);
    }
  }, 5000);
}

module.exports = { cleanAndMigrate };
