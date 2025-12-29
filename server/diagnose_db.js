const db = require("./db");

async function checkSchema() {
  try {
    const saleInfo = await db("sales").columnInfo();
    console.log("SALE TABLE INFO:", saleInfo);

    const itemInfo = await db("sale_items").columnInfo();
    console.log("SALE_ITEMS TABLE INFO:", itemInfo);

    const products = await db("products").select("id", "stock").limit(3);
    console.log("SAMPLE PRODUCTS:", products);

    process.exit(0);
  } catch (err) {
    console.error("DIAGNOSTIC ERROR:", err);
    process.exit(1);
  }
}

checkSchema();
