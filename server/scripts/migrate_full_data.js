const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const knex = require("knex")(require("../knexfile").development);

const BACKUP_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "backup_1_extracted",
  "BD_MiNegocio"
);
const BUSINESS_ID = 1;

async function migrate() {
  console.log("Starting migration...");
  console.log(`Reading from SQLite DB: ${BACKUP_PATH}`);

  const db = new sqlite3.Database(BACKUP_PATH);

  // Helper to query SQLite with promises
  const query = (sql, params = []) =>
    new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

  try {
    // 1. Categories Migration
    console.log("\n--- Migrating Categories ---");
    const sqliteCategories = await query(
      "SELECT folio, nombre FROM categorias"
    );
    console.log(`Found ${sqliteCategories.length} categories in SQLite.`);

    const categoryMap = new Map(); // SQLite ID -> PG ID

    for (const cat of sqliteCategories) {
      // Check if exists by name
      const existing = await knex("categories")
        .where({ name: cat.nombre, business_id: BUSINESS_ID })
        .first();

      let pgId;
      if (existing) {
        pgId = existing.id;
        // console.log(`Category "${cat.nombre}" exists (ID: ${pgId}). Skipping.`);
      } else {
        const [inserted] = await knex("categories")
          .insert({
            name: cat.nombre,
            business_id: BUSINESS_ID,
          })
          .returning("id");
        pgId = inserted.id;
        console.log(`Created category "${cat.nombre}" (ID: ${pgId}).`);
      }
      categoryMap.set(cat.folio, pgId);
    }

    // 2. Map Unclustered Products if needed (default category)
    let defaultCategoryId =
      categoryMap.get(0) || categoryMap.values().next().value;
    if (!defaultCategoryId) {
      const [inserted] = await knex("categories")
        .insert({
          name: "General",
          business_id: BUSINESS_ID,
        })
        .returning("id");
      defaultCategoryId = inserted.id;
      console.log(
        `Created default category "General" (ID: ${defaultCategoryId}) for unmapped products.`
      );
    }

    // 3. Products Migration
    console.log("\n--- Migrating Products ---");
    const sqliteProducts = await query("SELECT * FROM producto");
    console.log(`Found ${sqliteProducts.length} products in SQLite.`);

    let prodInserted = 0;
    let prodSkipped = 0;

    for (const prod of sqliteProducts) {
      // Clean SKU
      const sku = prod.key
        ? String(prod.key).trim()
        : `GEN-${Math.random().toString(36).substr(2, 9)}`;

      // Check duplicate SKU
      const existing = await knex("products")
        .where({ sku: sku, business_id: BUSINESS_ID })
        .first();
      if (existing) {
        prodSkipped++;
        continue;
      }

      const categoryId = categoryMap.get(prod.categoria) || defaultCategoryId;

      // Validate and Parse Numbers
      const priceBuy = isNaN(prod.p_compra) ? 0 : prod.p_compra;
      const priceSell = isNaN(prod.p_venta) ? 0 : prod.p_venta;
      const stock = isNaN(prod.cantidad) ? 0 : prod.cantidad;

      await knex("products").insert({
        name: prod.nombre,
        sku: sku,
        description: prod.descripcion || "",
        price_buy: priceBuy,
        price_sell: priceSell,
        stock: stock,
        category_id: categoryId,
        business_id: BUSINESS_ID,
        active: true,
      });
      prodInserted++;

      if (prodInserted % 100 === 0) process.stdout.write(".");
    }
    console.log(
      `\nProducts: Inserted ${prodInserted}, Skipped ${prodSkipped} (duplicates).`
    );

    // 4. Customers Migration
    console.log("\n--- Migrating Customers ---");
    const sqliteCustomers = await query("SELECT * FROM cliente");
    console.log(`Found ${sqliteCustomers.length} customers in SQLite.`);

    let custInserted = 0;
    for (const cust of sqliteCustomers) {
      // Simple duplicate check by name (optional, but good practice)
      // We'll allow same name for now, but usually phone/email are better checks
      // Since SQLite doesn't strictly enforce unique emails, let's just insert

      await knex("customers").insert({
        name: cust.nombre_cliente,
        phone: cust.telefono1 || "",
        email: cust.correo || "",
        business_id: BUSINESS_ID,
        is_active: true,
      });
      custInserted++;
      if (custInserted % 100 === 0) process.stdout.write(".");
    }
    console.log(`\nCustomers: Inserted ${custInserted}.`);

    console.log("\nMigration Completed Successfully!");
  } catch (err) {
    console.error("Migration Failed:", err);
  } finally {
    db.close();
    knex.destroy();
  }
}

migrate();
