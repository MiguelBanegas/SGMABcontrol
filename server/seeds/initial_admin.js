const bcrypt = require("bcryptjs");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("users").del();

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await knex("users").insert([
    {
      username: "admin",
      password: hashedPassword,
      role: "admin",
    },
  ]);
};
