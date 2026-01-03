/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .table("products", (table) => {
      table.decimal("price_offer", 10, 2);
      table.boolean("is_offer").defaultTo(false);
    })
    .table("sale_items", (table) => {
      table.decimal("cost_at_sale", 10, 2);
      table.decimal("discount_amount", 10, 2).defaultTo(0);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .table("sale_items", (table) => {
      table.dropColumn("cost_at_sale");
      table.dropColumn("discount_amount");
    })
    .table("products", (table) => {
      table.dropColumn("price_offer");
      table.dropColumn("is_offer");
    });
};
