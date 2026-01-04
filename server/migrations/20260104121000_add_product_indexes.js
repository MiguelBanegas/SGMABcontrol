/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table("products", (table) => {
    // Agregar índice en el campo name para búsquedas más rápidas
    table.index("name", "idx_products_name");

    // El campo sku ya tiene índice único, pero agreguemos uno explícito para búsquedas
    // (el unique ya crea un índice, pero esto lo hace más explícito)
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table("products", (table) => {
    table.dropIndex("name", "idx_products_name");
  });
};
