const knex = require("knex")(require("./knexfile").development);
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

async function updateHistoricalPricesFromBackup() {
  console.log("Actualizando precios históricos desde el backup SQLite...\n");

  const backupPath = path.join(
    __dirname,
    "../temp_backup_extract/BD_MiNegocio",
  );
  const db = new sqlite3.Database(backupPath);

  try {
    // Obtener todos los items de venta del backup
    const ventaProductos = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM venta_producto", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(
      `Encontrados ${ventaProductos.length} items de venta en el backup\n`,
    );

    // Crear mapeos de folio a sale_id y nombre a product_id
    const sales = await knex("sales").select("id", "folio");
    const saleIdMap = {};
    sales.forEach((s) => {
      if (s.folio) saleIdMap[s.folio] = s.id;
    });

    const products = await knex("products").select("id", "name");
    const productNameMap = {};
    products.forEach((p) => (productNameMap[p.name] = p.id));

    let updated = 0;
    let notFound = 0;

    for (const vp of ventaProductos) {
      const saleId = saleIdMap[vp.folio];
      const productId = productNameMap[vp.nombre];

      if (!saleId || !productId) {
        notFound++;
        continue;
      }

      // Actualizar el sale_item con los precios del backup
      const result = await knex("sale_items")
        .where({
          sale_id: saleId,
          product_id: productId,
        })
        .update({
          price_sell_at_sale: vp.p_venta || 0,
          cost_at_sale: vp.p_compra || 0,
        });

      if (result > 0) {
        updated++;
        if (updated % 100 === 0) {
          console.log(`Actualizados ${updated} items...`);
        }
      }
    }

    console.log(`\n✅ Actualización completada:`);
    console.log(`   - Items actualizados: ${updated}`);
    console.log(`   - Items no encontrados: ${notFound}`);
  } catch (error) {
    console.error("❌ Error al actualizar precios históricos:", error);
  } finally {
    db.close();
    await knex.destroy();
  }
}

updateHistoricalPricesFromBackup();
