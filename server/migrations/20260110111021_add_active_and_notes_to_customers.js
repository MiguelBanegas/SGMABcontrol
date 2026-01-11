exports.up = function (knex) {
  return knex.schema.table("customers", (table) => {
    table.boolean("is_active").defaultTo(true);
    table.text("notes").nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table("customers", (table) => {
    table.dropColumn("is_active");
    table.dropColumn("notes");
  });
};
