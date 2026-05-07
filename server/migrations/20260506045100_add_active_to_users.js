/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'active');
  if (!hasColumn) {
    await knex.schema.alterTable('users', table => {
      table.boolean('active').defaultTo(true).notNullable();
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('users', 'active');
  if (hasColumn) {
    await knex.schema.alterTable('users', table => {
      table.dropColumn('active');
    });
  }
};
