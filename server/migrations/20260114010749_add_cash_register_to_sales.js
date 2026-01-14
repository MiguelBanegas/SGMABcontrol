exports.up = function (knex) {
  return knex.schema.table("sales", (table) => {
    table.uuid("cash_register_id");
    table
      .foreign("cash_register_id")
      .references("cash_registers.id")
      .onDelete("SET NULL");
    table.index("cash_register_id");
  });
};

exports.down = function (knex) {
  return knex.schema.table("sales", (table) => {
    table.dropForeign("cash_register_id");
    table.dropIndex("cash_register_id");
    table.dropColumn("cash_register_id");
  });
};
