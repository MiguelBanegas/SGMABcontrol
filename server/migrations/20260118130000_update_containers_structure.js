/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .alterTable("products", (table) => {
      table.boolean("is_container").defaultTo(false);
    })
    .createTable("container_balances", (table) => {
      table.increments("id").primary();
      table
        .integer("customer_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("customers")
        .onDelete("CASCADE");
      table
        .integer("product_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      table.decimal("balance", 10, 2).defaultTo(0);
      table
        .integer("business_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("businesses")
        .onDelete("CASCADE");
      table.unique(["customer_id", "product_id", "business_id"]);
      table.timestamps(true, true);
    })
    .createTable("container_transactions", (table) => {
      table.increments("id").primary();
      table
        .integer("customer_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("customers")
        .onDelete("CASCADE");
      table
        .integer("product_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      table
        .uuid("sale_id")
        .nullable()
        .references("id")
        .inTable("sales")
        .onDelete("SET NULL");
      table.enum("type", ["loan", "return"]).notNullable(); // loan = préstamo (venta), return = devolución
      table.decimal("amount", 10, 2).notNullable();
      table.decimal("balance_after", 10, 2).notNullable();
      table.text("description");
      table
        .integer("business_id")
        .unsigned()
        .notNullable()
        .references("id")
        .inTable("businesses")
        .onDelete("CASCADE");
      table.timestamp("created_at").defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("container_transactions")
    .dropTableIfExists("container_balances")
    .alterTable("products", (table) => {
      table.dropColumn("is_container");
    });
};
