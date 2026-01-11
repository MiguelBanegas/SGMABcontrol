const knex = require("knex");
const config = require("./knexfile");
const db = knex(config.development || config);

async function check() {
  try {
    const users = await db("users").select("id", "username", "role");
    users.forEach((u) => {
      console.log(
        `User: [${u.username}], Role: [${u.role}], Length: ${u.role.length}`
      );
    });
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
