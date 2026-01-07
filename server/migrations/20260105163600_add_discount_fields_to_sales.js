exports.up = function (knex) {
  return knex.schema.table("sales", function (table) {
    table.decimal("subtotal", 10, 2);
    table.decimal("cash_discount", 10, 2).defaultTo(0);
  });
};

exports.down = function (knex) {
  return knex.schema.table("sales", function (table) {
    table.dropColumn("subtotal");
    table.dropColumn("cash_discount");
  });
};
