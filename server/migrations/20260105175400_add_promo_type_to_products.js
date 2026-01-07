exports.up = function (knex) {
  return knex.schema.table("products", function (table) {
    table.string("promo_type", 20).defaultTo("none");
  });
};

exports.down = function (knex) {
  return knex.schema.table("products", function (table) {
    table.dropColumn("promo_type");
  });
};
