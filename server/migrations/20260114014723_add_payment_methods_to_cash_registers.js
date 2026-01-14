exports.up = function (knex) {
  return knex.schema.table("cash_registers", (table) => {
    table.decimal("transfer_sales", 12, 2).defaultTo(0);
    table.decimal("debit_sales", 12, 2).defaultTo(0);
    table.decimal("credit_sales", 12, 2).defaultTo(0);
    table.decimal("account_sales", 12, 2).defaultTo(0);
    table.decimal("account_payments", 12, 2).defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.table("cash_registers", (table) => {
    table.dropColumn("transfer_sales");
    table.dropColumn("debit_sales");
    table.dropColumn("credit_sales");
    table.dropColumn("account_sales");
    table.dropColumn("account_payments");
  });
};
