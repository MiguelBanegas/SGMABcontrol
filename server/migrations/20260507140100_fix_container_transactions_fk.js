/**
 * MIGRACIÓN: Cambiar container_transactions.customer_id de CASCADE a SET NULL
 * Propósito: Mantener historial de transacciones cuando se elimina un cliente
 */

exports.up = function (knex) {
  return knex.schema.alterTable("container_transactions", (table) => {
    // Dropear la FK antigua
    table.dropForeign("customer_id");
    
    // Recrear con SET NULL
    table
      .integer("customer_id")
      .unsigned()
      .nullable() // Permitir NULL
      .references("id")
      .inTable("customers")
      .onDelete("SET NULL") // Cambio crítico: de CASCADE a SET NULL
      .alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("container_transactions", (table) => {
    table.dropForeign("customer_id");
    
    // Revertir a CASCADE
    table
      .integer("customer_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("customers")
      .onDelete("CASCADE")
      .alter();
  });
};
