exports.up = function (knex) {
  return knex.schema.createTable("customer_account_transactions", (table) => {
    table.increments("id").primary();
    table.integer("customer_id").notNullable();
    table.uuid("sale_id").nullable();
    table.string("type").notNullable().comment("debt or payment");
    table.decimal("amount", 10, 2).notNullable();
    table
      .decimal("balance", 10, 2)
      .notNullable()
      .comment("Balance after this transaction");
    table.text("description").nullable();
    table.integer("business_id").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.foreign("customer_id").references("customers.id").onDelete("CASCADE");
    table.foreign("sale_id").references("sales.id").onDelete("SET NULL");
    table
      .foreign("business_id")
      .references("businesses.id")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("customer_account_transactions");
};
