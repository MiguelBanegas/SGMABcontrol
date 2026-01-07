const knex = require("knex");
const config = require("./knexfile");
const db = knex(config.development);

async function checkProduct() {
  try {
    const product = await db("products").where({ id: 6 }).first();
    console.log("Product 6:", product);

    const saleItems = await db("sale_items").where({ product_id: 6 }).limit(5);
    console.log("Sale Items for Product 6:", saleItems);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await db.destroy();
  }
}

checkProduct();
