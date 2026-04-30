const db = require("./db");

async function checkLastSale() {
  try {
    // Obtener la última venta
    const lastSale = await db("sales").orderBy("created_at", "desc").first();

    if (!lastSale) {
      console.log("No hay ventas en la base de datos");
      process.exit(0);
    }

    console.log("=== ÚLTIMA VENTA ===");
    console.log(`ID: ${lastSale.id}`);
    console.log(`Cliente ID: ${lastSale.customer_id}`);
    console.log(`Total: $${lastSale.total}`);
    console.log(`Fecha: ${lastSale.created_at}`);

    // Obtener los items de esa venta
    const saleItems = await db("sale_items")
      .where("sale_id", lastSale.id)
      .select("*");

    console.log("\n=== ITEMS DE LA VENTA ===");
    console.log(`Total items: ${saleItems.length}`);

    // Para cada item, verificar si el producto es envase
    for (const item of saleItems) {
      const product = await db("products").where("id", item.product_id).first();

      console.log(`\nProducto: ${product.name}`);
      console.log(`  - ID: ${product.id}`);
      console.log(`  - SKU: ${product.sku}`);
      console.log(`  - is_container: ${product.is_container}`);
      console.log(`  - Cantidad vendida: ${item.quantity}`);
    }

    // Verificar si hay transacciones de envases para esta venta
    const containerTxs = await db("container_transactions")
      .where("sale_id", lastSale.id)
      .select("*");

    console.log("\n=== TRANSACCIONES DE ENVASES PARA ESTA VENTA ===");
    if (containerTxs.length > 0) {
      console.log(containerTxs);
    } else {
      console.log("❌ NO HAY TRANSACCIONES DE ENVASES REGISTRADAS");
    }

    // Verificar balances de envases del cliente
    if (lastSale.customer_id) {
      const balances = await db("container_balances")
        .where("customer_id", lastSale.customer_id)
        .select("*");

      console.log("\n=== BALANCES DE ENVASES DEL CLIENTE ===");
      if (balances.length > 0) {
        console.log(balances);
      } else {
        console.log("❌ NO HAY BALANCES DE ENVASES PARA ESTE CLIENTE");
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkLastSale();
