exports.up = function (knex) {
  return knex.schema.table("products", function (table) {
    table.integer("promo_buy");
    table.integer("promo_pay");
  });
};

exports.down = function (knex) {
  return knex.schema.table("products", function (table) {
    table.dropColumn("promo_buy");
    table.dropColumn("promo_pay");
  });
};
