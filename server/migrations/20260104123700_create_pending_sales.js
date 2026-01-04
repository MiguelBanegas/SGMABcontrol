/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("pending_sales", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("cart_data").notNullable(); // JSON del carrito
    table
      .integer("customer_id")
      .unsigned()
      .references("id")
      .inTable("customers")
      .onDelete("SET NULL");
    table.string("payment_method", 50);
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Índice único por usuario (solo una venta en progreso por usuario)
    table.unique("user_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("pending_sales");
};
