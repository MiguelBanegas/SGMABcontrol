exports.up = function (knex) {
  return knex.schema.createTable("pending_sales_multiple", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .integer("business_id")
      .unsigned()
      .references("id")
      .inTable("businesses")
      .onDelete("CASCADE");
    table
      .integer("customer_id")
      .unsigned()
      .references("id")
      .inTable("customers")
      .onDelete("SET NULL")
      .nullable();
    table.string("payment_method", 50).defaultTo("Efectivo");
    table.jsonb("cart").notNullable().defaultTo("[]");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    table.index(["user_id", "business_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("pending_sales_multiple");
};
