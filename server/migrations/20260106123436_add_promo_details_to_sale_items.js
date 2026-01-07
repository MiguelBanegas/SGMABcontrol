exports.up = function (knex) {
  return knex.schema.table("sale_items", (table) => {
    table.string("promo_type").defaultTo("none");
    table.integer("promo_buy").nullable();
    table.integer("promo_pay").nullable();
    table.decimal("price_sell_at_sale", 10, 2).nullable();
    table.decimal("price_offer_at_sale", 10, 2).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("sale_items", (table) => {
    table.dropColumn("promo_type");
    table.dropColumn("promo_buy");
    table.dropColumn("promo_pay");
    table.dropColumn("price_sell_at_sale");
    table.dropColumn("price_offer_at_sale");
  });
};
