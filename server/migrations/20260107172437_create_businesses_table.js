/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("businesses", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("tax_id").unique(); // CUIT/NIT/etc.
    table.string("address");
    table.string("phone");
    table.string("email");
    table.string("logo_url");
    table.jsonb("settings").defaultTo("{}"); // Configuración específica del comercio
    table.boolean("active").defaultTo(true);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("businesses");
};
