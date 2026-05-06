
exports.up = function (knex) {
  return knex.schema.createTable("sale_payments", (table) => {
    table.uuid("id").primary();
    table
      .uuid("sale_id")
      .references("id")
      .inTable("sales")
      .onDelete("CASCADE")
      .notNullable();
    table.string("payment_method").notNullable();
    table.decimal("amount", 10, 2).notNullable();
    table.uuid("business_id").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("sale_payments");
};
