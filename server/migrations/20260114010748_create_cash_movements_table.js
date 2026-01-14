exports.up = function (knex) {
  return knex.schema.createTable("cash_movements", (table) => {
    table.increments("id").primary();
    table.uuid("cash_register_id").notNullable();
    table.enum("type", ["expense", "withdrawal"]).notNullable();
    table.decimal("amount", 12, 2).notNullable();
    table.text("description").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table
      .foreign("cash_register_id")
      .references("cash_registers.id")
      .onDelete("CASCADE");
    table.index("cash_register_id");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("cash_movements");
};
