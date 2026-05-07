/**
 * MIGRACIONES PROPUESTAS: Cambiar estrategia de CASCADE a SET NULL
 * 
 * PROBLEMA:
 * - Las tablas container_balances y container_transactions usan CASCADE
 * - Esto borra histórico cuando se elimina un cliente
 * - SOLUCIÓN: Cambiar a SET NULL para mantener auditoría
 * 
 * Ejecutar después de validar que NO hay clientes activos con contenedores
 */

// ============================================================
// MIGRACIÓN 1: Corregir container_balances
// ============================================================
// Nombre: 20260507_fix_container_balances_foreign_key.js

exports.up = function (knex) {
  return knex.schema.alterTable("container_balances", (table) => {
    // Eliminar la FK antigua con CASCADE
    table.dropForeign("customer_id");
    
    // Recrear con SET NULL
    table
      .integer("customer_id")
      .unsigned()
      .nullable() // Permitir NULL
      .references("id")
      .inTable("customers")
      .onDelete("SET NULL"); // Cambio crítico
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("container_balances", (table) => {
    table.dropForeign("customer_id");
    
    // Revertir a la versión original (CASCADE)
    table
      .integer("customer_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("customers")
      .onDelete("CASCADE");
  });
};

// ============================================================
// MIGRACIÓN 2: Corregir container_transactions
// ============================================================
// Nombre: 20260507_fix_container_transactions_foreign_key.js

exports.up = function (knex) {
  return knex.schema.alterTable("container_transactions", (table) => {
    // Eliminar la FK antigua con CASCADE
    table.dropForeign("customer_id");
    
    // Recrear con SET NULL
    table
      .integer("customer_id")
      .unsigned()
      .nullable() // Permitir NULL
      .references("id")
      .inTable("customers")
      .onDelete("SET NULL"); // Cambio crítico
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("container_transactions", (table) => {
    table.dropForeign("customer_id");
    
    // Revertir a la versión original (CASCADE)
    table
      .integer("customer_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("customers")
      .onDelete("CASCADE");
  });
};

// ============================================================
// INSTRUCCIONES DE IMPLEMENTACIÓN
// ============================================================

/*
ANTES DE EJECUTAR LAS MIGRACIONES:

1. Ejecutar el script de verificación:
   node server/scripts/check_delete_customer_consistency.js

2. Si hay clientes con contenedores activos:
   - Contactar al cliente
   - Solicitar devolución de contenedores
   - O reasignar contenedores a otro cliente

3. Ejecutar migraciones:
   npm run migrate:latest

4. Si algo sale mal, revertir:
   npm run migrate:rollback

5. Verificar nuevamente:
   node server/scripts/check_delete_customer_consistency.js

VENTAJAS DEL CAMBIO:
✅ Mantiene historial de transacciones de contenedores
✅ Permite auditoría completa
✅ Evita pérdida de datos
✅ Los registros quedan con customer_id = NULL como referencia
✅ Más seguro para eliminación de clientes

IMPACTO:
- container_balances: Algunos registros tendrán customer_id = NULL
- container_transactions: El historial se mantiene intacto
- Reportes: Pueden filtrar por customer_id IS NOT NULL
*/
