const path = require("path");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config({ path: path.join(__dirname, ".env") });
const knex = require("knex")(require("./knexfile").development);
const fs = require("fs");

const SQLITE_DB_PATH =
  "c:\\Users\\pc\\Documents\\SGMABControl\\backup_extracted\\extracted\\BD_MiNegocio";
const BACKUP_UPLOADS_PATH =
  "c:\\Users\\pc\\Documents\\SGMABControl\\backup_extracted\\extracted";
const LOCAL_UPLOADS_PATH = path.join(__dirname, "uploads");
const DEFAULT_BUSINESS_ID = 1;

async function migrate() {
  const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY);

  const getSqliteData = (query) => {
    return new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    console.log("--- Iniciando Migración ---");

    // 1. Migrar Categorías
    console.log("Migrando categorías...");
    const sqliteCategories = await getSqliteData(
      "SELECT folio, nombre FROM categorias",
    );
    for (const cat of sqliteCategories) {
      const existing = await knex("categories")
        .where("name", cat.nombre)
        .andWhere("business_id", DEFAULT_BUSINESS_ID)
        .first();
      if (!existing) {
        await knex("categories").insert({
          name: cat.nombre,
          business_id: DEFAULT_BUSINESS_ID,
        });
        console.log(`Categoría agregada: ${cat.nombre}`);
      }
    }

    // Mapeo de nombres de categorías a IDs de PostgreSQL
    const pgCategories = await knex("categories")
      .where("business_id", DEFAULT_BUSINESS_ID)
      .select("id", "name");
    const catMap = {};

    sqliteCategories.forEach((c) => {
      const pgCat = pgCategories.find((pg) => pg.name === c.nombre);
      if (pgCat) catMap[c.folio] = pgCat.id;
    });

    // 2. Migrar Productos (Opción A: Actualizar si existe)
    console.log("Migrando productos...");
    const sqliteProducts = await getSqliteData("SELECT * FROM producto");
    let prodAdded = 0;
    let prodUpdated = 0;

    for (const p of sqliteProducts) {
      const productData = {
        sku: p.key,
        name: p.nombre,
        description: p.descripcion,
        price_buy: p.p_compra,
        price_sell: p.p_venta,
        stock: p.cantidad,
        category_id: catMap[p.categoria] || null,
        image_url: p.key ? `${p.key}.jpg` : null,
        business_id: DEFAULT_BUSINESS_ID,
      };

      const existing = await knex("products")
        .where("sku", p.key)
        .andWhere("business_id", DEFAULT_BUSINESS_ID)
        .first();

      if (existing) {
        await knex("products").where("id", existing.id).update({
          price_buy: productData.price_buy,
          price_sell: productData.price_sell,
          stock: productData.stock,
          category_id: productData.category_id,
          updated_at: knex.fn.now(),
        });
        prodUpdated++;
      } else {
        await knex("products").insert(productData);
        prodAdded++;
      }
    }
    console.log(
      `Productos: ${prodAdded} agregados, ${prodUpdated} actualizados.`,
    );

    // 3. Migrar Clientes
    console.log("Migrando clientes...");
    const sqliteCustomers = await getSqliteData("SELECT * FROM cliente");
    let custAdded = 0;

    for (const c of sqliteCustomers) {
      const existing = await knex("customers")
        .where("name", c.nombre_cliente)
        .andWhere("business_id", DEFAULT_BUSINESS_ID)
        .first();

      if (!existing) {
        await knex("customers").insert({
          name: c.nombre_cliente,
          email: c.correo,
          phone: c.telefono1,
          notes:
            `Dirección: ${c.direccion || ""}. Info: ${c.info_adicional || ""}`.trim(),
          is_active: true,
          business_id: DEFAULT_BUSINESS_ID,
        });
        custAdded++;
      }
    }
    console.log(`Clientes: ${custAdded} agregados.`);

    // 4. Sincronizar Imágenes
    console.log("Sincronizando imágenes...");
    if (!fs.existsSync(LOCAL_UPLOADS_PATH)) fs.mkdirSync(LOCAL_UPLOADS_PATH);

    const files = fs.readdirSync(BACKUP_UPLOADS_PATH);
    let imagesCopied = 0;
    for (const file of files) {
      if (file.toLowerCase().endsWith(".jpg")) {
        const destPath = path.join(LOCAL_UPLOADS_PATH, file);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(path.join(BACKUP_UPLOADS_PATH, file), destPath);
          imagesCopied++;
        }
      }
    }
    console.log(`Imágenes: ${imagesCopied} nuevas copiadas.`);

    console.log("--- Migración Completada con Éxito ---");
  } catch (error) {
    console.error("Error durante la migración:", error);
  } finally {
    db.close();
    await knex.destroy();
  }
}

migrate();
