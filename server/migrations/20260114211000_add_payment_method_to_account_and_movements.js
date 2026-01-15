exports.up = function (knex) {
  return knex.schema
    .alterTable("cash_movements", (table) => {
      table.string("payment_method").defaultTo("Efectivo");
      // Knex no puede alterar tipos ENUM fácilmente en todos los dialectos sin recrear la tabla o SQL crudo.
      // Pero usualmente en PG si el tipo no es nativo, esto funciona.
    })
    .alterTable("customer_account_transactions", (table) => {
      table.string("payment_method").nullable();
    });
};

exports.down = function (knex) {
  return knex.schema
    .alterTable("cash_movements", (table) => {
      table.dropColumn("payment_method");
    })
    .alterTable("customer_account_transactions", (table) => {
      table.dropColumn("payment_method");
    });
};
