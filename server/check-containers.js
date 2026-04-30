const db = require("./db");

async function checkContainers() {
  try {
    // Verificar productos marcados como envases
    const containers = await db("products")
      .where("is_container", true)
      .select("id", "name", "sku", "is_container");

    console.log("=== PRODUCTOS MARCADOS COMO ENVASES ===");
    console.log(containers);
    console.log(`Total: ${containers.length} productos`);

    // Verificar transacciones de envases
    const transactions = await db("container_transactions")
      .select("*")
      .orderBy("created_at", "desc")
      .limit(10);

    console.log("\n=== ÚLTIMAS 10 TRANSACCIONES DE ENVASES ===");
    console.log(transactions);

    // Verificar balances de envases
    const balances = await db("container_balances").select("*");

    console.log("\n=== BALANCES DE ENVASES ===");
    console.log(balances);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkContainers();
