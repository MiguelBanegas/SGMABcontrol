/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Primero, crear un comercio por defecto para los datos existentes
  const [defaultBusinessId] = await knex("businesses")
    .insert({
      name: "Comercio Principal",
      active: true,
    })
    .returning("id");

  const tables = [
    "users",
    "products",
    "sales",
    "categories",
    "customers",
    "settings",
  ];

  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table
        .integer("business_id")
        .unsigned()
        .references("id")
        .inTable("businesses")
        .onDelete("CASCADE");
    });

    // Caso especial para settings: quitar restricción única vieja y poner una nueva con business_id
    if (tableName === "settings") {
      await knex.schema.alterTable(tableName, (table) => {
        table.dropUnique("key");
        table.unique(["key", "business_id"]);
      });
    }

    // Asignar el comercio por defecto a los registros actuales
    await knex(tableName).update({
      business_id: defaultBusinessId.id || defaultBusinessId,
    });

    // Hacer que la columna no sea nula después de asignar el valor
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
  const tables = [
    "users",
    "products",
    "sales",
    "categories",
    "customers",
    "settings",
  ];

  for (const tableName of tables) {
    await knex.schema.alterTable(tableName, (table) => {
      table.dropColumn("business_id");
    });
  }
};
