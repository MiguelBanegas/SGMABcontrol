exports.up = function (knex) {
  return knex.schema.alterTable("sale_payments", (table) => {
    table.dropColumn("business_id");
  }).then(() => {
    return knex.schema.alterTable("sale_payments", (table) => {
      table.integer("business_id").unsigned().notNullable();
    });
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("sale_payments", (table) => {
    table.dropColumn("business_id");
  }).then(() => {
    return knex.schema.alterTable("sale_payments", (table) => {
      table.uuid("business_id").notNullable();
    });
  });
};
