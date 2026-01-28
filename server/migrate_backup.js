const path = require("path");
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config({ path: path.join(__dirname, ".env") });
const knex = require("knex")(require("./knexfile").development);
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const SQLITE_DB_PATH = path.join(
  "c:",
  "Users",
  "pc",
  "Documents",
  "SGMABControl",
  "temp_backup_extract",
  "BD_MiNegocio",
);
const BACKUP_UPLOADS_PATH = path.join(
  "c:",
  "Users",
  "pc",
  "Documents",
  "SGMABControl",
  "temp_backup_extract",
);
const LOCAL_UPLOADS_PATH = path.join(__dirname, "uploads");
const DEFAULT_BUSINESS_ID = 1;

// Función para ejecutar la migración (puede ser llamada desde API)
async function migrate(progressCallback = null) {
  const db = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY);

  const getSqliteData = (query) => {
    return new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  const updateProgress = (message, percentage) => {
    console.log(`[${percentage}%] ${message}`);
    if (progressCallback) progressCallback(message, percentage);
  };

  const stats = {
    categories: { added: 0 },
    products: { added: 0, updated: 0 },
    customers: { added: 0 },
    sales: { added: 0 },
    saleItems: { added: 0 },
    images: { copied: 0 },
  };

  try {
    updateProgress("Iniciando migración...", 0);

    // 1. Migrar Categorías
    updateProgress("Migrando categorías...", 10);
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
        stats.categories.added++;
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

    // 2. Migrar Productos
    updateProgress("Migrando productos...", 20);
    const sqliteProducts = await getSqliteData("SELECT * FROM producto");

    for (const p of sqliteProducts) {
      const productData = {
        sku: p.key,
        name: p.nombre,
        description: p.descripcion,
        price_buy: p.p_compra || 0,
        price_sell: p.p_venta || 0,
        stock: Math.floor(p.cantidad || 0),
        category_id: catMap[p.categoria] || null,
        image_url: p.key ? `${p.key}.jpg` : null,
        business_id: DEFAULT_BUSINESS_ID,
        active: true,
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
        stats.products.updated++;
      } else {
        await knex("products").insert(productData);
        stats.products.added++;
      }
    }

    // Crear mapa de productos por nombre para los items de venta
    const pgProducts = await knex("products")
      .where("business_id", DEFAULT_BUSINESS_ID)
      .select("id", "name", "sku");
    const productNameMap = {};
    pgProducts.forEach((p) => {
      productNameMap[p.name] = p.id;
      productNameMap[p.sku] = p.id;
    });

    // 3. Migrar Clientes
    updateProgress("Migrando clientes...", 40);
    const sqliteCustomers = await getSqliteData("SELECT * FROM cliente");
    const customerIdMap = {}; // old_id -> new_id

    for (const c of sqliteCustomers) {
      const existing = await knex("customers")
        .where("name", c.nombre_cliente)
        .andWhere("business_id", DEFAULT_BUSINESS_ID)
        .first();

      let customerId;
      if (!existing) {
        const [inserted] = await knex("customers")
          .insert({
            name: c.nombre_cliente,
            email: c.correo,
            phone: c.telefono1,
            notes:
              `Dirección: ${c.direccion || ""}. Info: ${c.info_adicional || ""}`.trim(),
            is_active: true,
            business_id: DEFAULT_BUSINESS_ID,
          })
          .returning("id");
        customerId = inserted.id || inserted;
        stats.customers.added++;
      } else {
        customerId = existing.id;
      }
      customerIdMap[c.folio] = customerId;
    }

    // 4. Migrar Ventas
    updateProgress("Migrando ventas...", 60);
    const sqliteVentas = await getSqliteData("SELECT * FROM venta");
    const saleIdMap = {}; // old_folio -> new_uuid

    // Obtener el primer usuario admin
    const adminUser = await knex("users")
      .where("role", "admin")
      .andWhere("business_id", DEFAULT_BUSINESS_ID)
      .first();
    const defaultUserId = adminUser ? adminUser.id : 1;

    for (const v of sqliteVentas) {
      const saleUuid = uuidv4();

      // Parsear fecha y hora
      let createdAt = new Date();
      if (v.fecha && v.hora) {
        try {
          // Formato esperado: fecha "YYYY-MM-DD", hora "HH:MM:SS"
          const dateTimeStr = `${v.fecha} ${v.hora}`;
          createdAt = new Date(dateTimeStr);
          if (isNaN(createdAt.getTime())) {
            createdAt = new Date();
          }
        } catch (e) {
          createdAt = new Date();
        }
      }

      // Mapear forma de pago
      const paymentMethodMap = {
        1: "cash",
        2: "card",
        3: "transfer",
      };
      const paymentMethod = paymentMethodMap[v.id_forma_pago] || "cash";

      await knex("sales").insert({
        id: saleUuid,
        user_id: defaultUserId,
        customer_id: customerIdMap[v.id_cliente] || null,
        total: v.total || 0,
        payment_method: paymentMethod,
        status: "completed",
        business_id: DEFAULT_BUSINESS_ID,
        created_at: createdAt,
      });

      saleIdMap[v.folio] = saleUuid;
      stats.sales.added++;
    }

    // 5. Migrar Items de Venta
    updateProgress("Migrando items de venta...", 80);
    const sqliteVentaProductos = await getSqliteData(
      "SELECT * FROM venta_producto",
    );

    for (const vp of sqliteVentaProductos) {
      const saleId = saleIdMap[vp.folio];
      if (!saleId) {
        console.warn(`Venta no encontrada para folio ${vp.folio}`);
        continue;
      }

      const productId = productNameMap[vp.nombre];
      if (!productId) {
        console.warn(`Producto no encontrado: ${vp.nombre}`);
        continue;
      }

      await knex("sale_items").insert({
        sale_id: saleId,
        product_id: productId,
        quantity: Math.floor(vp.cantidad || 1),
        price_unit: vp.p_venta || 0,
        price_sell_at_sale: vp.p_venta || 0, // Precio de venta al momento de la venta
        cost_at_sale: vp.p_compra || 0, // Precio de costo al momento de la venta
        subtotal: vp.subtotal || 0,
      });

      stats.saleItems.added++;
    }

    // 6. Sincronizar Imágenes
    updateProgress("Sincronizando imágenes...", 90);
    if (!fs.existsSync(LOCAL_UPLOADS_PATH)) {
      fs.mkdirSync(LOCAL_UPLOADS_PATH, { recursive: true });
    }

    const files = fs.readdirSync(BACKUP_UPLOADS_PATH);
    for (const file of files) {
      if (file.toLowerCase().endsWith(".jpg")) {
        const destPath = path.join(LOCAL_UPLOADS_PATH, file);
        if (!fs.existsSync(destPath)) {
          fs.copyFileSync(path.join(BACKUP_UPLOADS_PATH, file), destPath);
          stats.images.copied++;
        }
      }
    }

    updateProgress("Migración completada con éxito", 100);
    return { success: true, stats };
  } catch (error) {
    console.error("Error durante la migración:", error);
    return { success: false, error: error.message, stats };
  } finally {
    db.close();
  }
}

// Si se ejecuta directamente desde la línea de comandos
if (require.main === module) {
  migrate()
    .then((result) => {
      console.log("\n--- Resumen de Migración ---");
      console.log(`Categorías agregadas: ${result.stats.categories.added}`);
      console.log(
        `Productos: ${result.stats.products.added} agregados, ${result.stats.products.updated} actualizados`,
      );
      console.log(`Clientes agregados: ${result.stats.customers.added}`);
      console.log(`Ventas agregadas: ${result.stats.sales.added}`);
      console.log(`Items de venta agregados: ${result.stats.saleItems.added}`);
      console.log(`Imágenes copiadas: ${result.stats.images.copied}`);
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error("Error fatal:", err);
      process.exit(1);
    })
    .finally(() => {
      knex.destroy();
    });
}

module.exports = { migrate };
