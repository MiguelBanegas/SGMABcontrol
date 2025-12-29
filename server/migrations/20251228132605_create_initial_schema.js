/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("users", (table) => {
      table.increments("id").primary();
      table.string("username").unique().notNullable();
      table.string("password").notNullable();
      table.enum("role", ["admin", "seller"]).defaultTo("seller");
      table.timestamps(true, true);
    })
    .createTable("categories", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
    })
    .createTable("products", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.text("description");
      table.string("sku").unique().notNullable();
      table.decimal("price_buy", 10, 2);
      table.decimal("price_sell", 10, 2).notNullable();
      table.integer("stock").defaultTo(0);
      table
        .integer("category_id")
        .unsigned()
        .references("id")
        .inTable("categories")
        .onDelete("SET NULL");
      table.string("image_url");
      table.timestamps(true, true);
    })
    .createTable("sales", (table) => {
      table.uuid("id").primary(); // UUID for offline sync consistency
      table.integer("user_id").unsigned().references("id").inTable("users");
      table.decimal("total", 10, 2).notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("sale_items", (table) => {
      table.increments("id").primary();
      table
        .uuid("sale_id")
        .references("id")
        .inTable("sales")
        .onDelete("CASCADE");
      table
        .integer("product_id")
        .unsigned()
        .references("id")
        .inTable("products");
      table.integer("quantity").notNullable();
      table.decimal("price_unit", 10, 2).notNullable();
      table.decimal("subtotal", 10, 2).notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("sale_items")
    .dropTableIfExists("sales")
    .dropTableIfExists("products")
    .dropTableIfExists("categories")
    .dropTableIfExists("users");
};
