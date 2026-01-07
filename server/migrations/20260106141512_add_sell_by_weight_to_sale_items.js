exports.up = function (knex) {
  return knex.schema.table("sale_items", (table) => {
    table.boolean("sell_by_weight").defaultTo(false);
  });
};

exports.down = function (knex) {
  return knex.schema.table("sale_items", (table) => {
    table.dropColumn("sell_by_weight");
  });
};
