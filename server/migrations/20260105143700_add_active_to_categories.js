exports.up = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.boolean("active").defaultTo(true).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("categories", function (table) {
    table.dropColumn("active");
  });
};
