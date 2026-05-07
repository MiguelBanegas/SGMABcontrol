/**
 * MIGRACIÓN: Cambiar container_balances.customer_id de CASCADE a SET NULL
 * Propósito: Mantener auditoría de contenedores cuando se elimina un cliente
 */

exports.up = function (knex) {
  return knex.schema.alterTable("container_balances", (table) => {
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
  return knex.schema.alterTable("container_balances", (table) => {
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
