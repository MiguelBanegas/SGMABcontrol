exports.up = function (knex) {
  return knex.schema.createTable("purchase_items", (table) => {
    table.increments("id").primary();
    table.uuid("purchase_id").notNullable();
    table.integer("product_id").notNullable();
    table.decimal("quantity", 10, 2).notNullable();
    table.decimal("price_buy", 10, 2).notNullable();
    table.decimal("subtotal", 12, 2).notNullable();

    table.foreign("purchase_id").references("purchases.id").onDelete("CASCADE");
    table.foreign("product_id").references("products.id").onDelete("CASCADE");
    table.index("purchase_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("purchase_items");
};
