exports.up = function (knex) {
  return knex.schema.table("cash_registers", (table) => {
    table.decimal("account_payments_cash", 15, 2).defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.table("cash_registers", (table) => {
    table.dropColumn("account_payments_cash");
  });
};
