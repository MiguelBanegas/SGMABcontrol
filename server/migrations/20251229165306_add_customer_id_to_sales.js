exports.up = function (knex) {
  return knex.schema.table("sales", (table) => {
    table
      .integer("customer_id")
      .unsigned()
      .references("id")
      .inTable("customers")
      .onDelete("SET NULL");
  });
};

exports.down = function (knex) {
  return knex.schema.table("sales", (table) => {
    table.dropColumn("customer_id");
  });
};
