const db = require("./db");

async function inspectTable() {
  try {
    const result = await db.raw(
      "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'users'"
    );
    console.log("--- Users Table Columns ---");
    console.log(result.rows);

    const users = await db("users").select("id", "username", "role");
    console.log("--- Users Current Data ---");
    console.log(users);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectTable();
