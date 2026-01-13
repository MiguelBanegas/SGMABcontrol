const knex = require("knex")(require("../knexfile").development);

async function verify() {
  try {
    const categories = await knex("categories").count("id as count").first();
    const products = await knex("products").count("id as count").first();
    const customers = await knex("customers").count("id as count").first();

    console.log("--- Verification Counts ---");
    console.log(`Categories: ${categories.count}`);
    console.log(`Products:   ${products.count}`);
    console.log(`Customers:  ${customers.count}`);
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    knex.destroy();
  }
}

verify();
