exports.up = function (knex) {
  return knex.schema
    .createTable("settings", function (table) {
      table.increments("id").primary();
      table.string("key", 100).unique().notNullable();
      table.text("value");
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      // Insertar configuración inicial de descuento por efectivo
      return knex("settings").insert({
        key: "cash_discount_percent",
        value: "0",
      });
    });
};

exports.down = function (knex) {
  return knex.schema.dropTable("settings");
};
