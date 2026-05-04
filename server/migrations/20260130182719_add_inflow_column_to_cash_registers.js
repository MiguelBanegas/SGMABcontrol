exports.up = async function (knex) {
  const hasColumn = await knex.schema.hasColumn("cash_registers", "inflows");
  if (!hasColumn) {
    return knex.schema.table("cash_registers", (table) => {
      table.decimal("inflows", 15, 2).defaultTo(0);
    });
  }
};

exports.down = function (knex) {
  return knex.schema.table("cash_registers", (table) => {
    table.dropColumn("inflows");
  });
};
