/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.raw(`
    ALTER TABLE cash_movements DROP CONSTRAINT IF EXISTS cash_movements_type_check;
    ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_type_check CHECK (type IN ('expense', 'withdrawal', 'account_payment'));
  `);
};

exports.down = function (knex) {
  return knex.raw(`
    ALTER TABLE cash_movements DROP CONSTRAINT IF EXISTS cash_movements_type_check;
    ALTER TABLE cash_movements ADD CONSTRAINT cash_movements_type_check CHECK (type IN ('expense', 'withdrawal'));
  `);
};
