exports.up = function (knex) {
  return knex.schema.table("sales", (table) => {
    table
      .timestamp("settled_at")
      .nullable()
      .comment("Fecha y hora en que la deuda fue saldada");
  });
};

exports.down = function (knex) {
  return knex.schema.table("sales", (table) => {
    table.dropColumn("settled_at");
  });
};
