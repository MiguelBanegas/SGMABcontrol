/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable("products", (table) => {
      table.boolean("sell_by_weight").defaultTo(false);
      table.decimal("stock", 10, 3).alter();
    })
    .alterTable("sale_items", (table) => {
      table.decimal("quantity", 10, 3).alter();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .alterTable("products", (table) => {
      table.dropColumn("sell_by_weight");
      table.integer("stock").alter();
    })
    .alterTable("sale_items", (table) => {
      table.integer("quantity").alter();
    });
};
