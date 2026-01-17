const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const knex = require("knex")(require("./knexfile").development);

async function check() {
  try {
    const businesses = await knex("businesses").select("*");
    console.log("Available Businesses:");
    businesses.forEach((b) => console.log(`- ID: ${b.id}, Name: ${b.name}`));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

check();
