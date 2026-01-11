exports.up = function (knex) {
  return knex.schema.table("sales", (table) => {
    table
      .decimal("amount_paid", 10, 2)
      .nullable()
      .comment("Monto recibido del cliente");
    table.decimal("change_given", 10, 2).nullable().comment("Vuelto entregado");
    table.decimal("debt_amount", 10, 2).nullable().comment("Deuda pendiente");
  });
};

exports.down = function (knex) {
  return knex.schema.table("sales", (table) => {
    table.dropColumn("amount_paid");
    table.dropColumn("change_given");
    table.dropColumn("debt_amount");
  });
};
