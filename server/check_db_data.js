const knex = require("knex");
const config = require("./knexfile");
const db = knex(config.development);

async function checkData() {
  try {
    console.log("--- Checking Products with price_buy >= price_sell ---");
    const suspiciousProducts = await db("products")
      .whereRaw("price_buy > price_sell")
      .orWhereRaw("price_offer IS NOT NULL AND price_buy > price_offer")
      .select("id", "name", "sku", "price_buy", "price_sell", "price_offer");

    console.log(`Found ${suspiciousProducts.length} suspicious products:`);
    suspiciousProducts.forEach((p) => console.log(p));

    console.log("\n--- Checking Sale Items with negative profit ---");
    const negativeProfitItems = await db("sale_items")
      .join("sales", "sale_items.sale_id", "sales.id")
      .whereRaw(
        "sale_items.subtotal < (sale_items.quantity * sale_items.cost_at_sale)"
      )
      .select(
        "sales.id as sale_id",
        "sale_items.product_id",
        "sale_items.quantity",
        "sale_items.subtotal",
        "sale_items.cost_at_sale",
        db.raw(
          "(sale_items.subtotal - (sale_items.quantity * sale_items.cost_at_sale)) as profit"
        )
      );

    console.log(`Found ${negativeProfitItems.length} negative profit items:`);
    negativeProfitItems.forEach((item) => console.log(item));

    console.log("\n--- Daily Stats (last 7 days) ---");
    const stats = await db("sales")
      .leftJoin("sale_items", "sales.id", "sale_items.sale_id")
      .select(
        db.raw("DATE(sales.created_at) as date"),
        db.raw(
          "SUM(sale_items.subtotal - (sale_items.quantity * sale_items.cost_at_sale))::FLOAT as profit_day"
        )
      )
      .groupBy("date")
      .orderBy("date", "desc")
      .limit(7);

    stats.forEach((s) => console.log(s));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await db.destroy();
  }
}

checkData();
