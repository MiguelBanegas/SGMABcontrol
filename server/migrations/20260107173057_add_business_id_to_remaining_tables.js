/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [defaultBusiness] = await knex("businesses").select("id").limit(1);
  const defaultBusinessId = defaultBusiness.id;

  const tables = ["notifications", "pending_sales"];

  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table
        .integer("business_id")
        .unsigned()
        .references("id")
        .inTable("businesses")
        .onDelete("CASCADE");
    });

    // Asignar el comercio por defecto a los registros actuales
    await knex(tableName).update({ business_id: defaultBusinessId });

    // Hacer que la columna no sea nula
    await knex.schema.alterTable(tableName, (table) => {
      table.integer("business_id").notNullable().alter();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const tables = ["notifications", "pending_sales"];

  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn("business_id");
    });
  }
};
