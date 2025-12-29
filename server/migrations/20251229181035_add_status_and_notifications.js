/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable("sales", (table) => {
      table.string("status").defaultTo("completado"); // completado, pendiente
    })
    .createTable("notifications", (table) => {
      table.increments("id").primary();
      table
        .integer("user_id")
        .unsigned()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.text("message").notNullable();
      table.boolean("is_read").defaultTo(false);
      table.string("type").defaultTo("nota"); // nota, stock, etc
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("notifications")
    .alterTable("sales", (table) => {
      table.dropColumn("status");
    });
};
