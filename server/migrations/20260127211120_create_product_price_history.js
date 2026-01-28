/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("product_price_history", (table) => {
      table.increments("id").primary();
      table
        .integer("product_id")
        .unsigned()
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      table.decimal("price_buy", 10, 2);
      table.decimal("price_sell", 10, 2).notNullable();
      table
        .integer("business_id")
        .unsigned()
        .references("id")
        .inTable("businesses")
        .onDelete("CASCADE");
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .then(() => {
      return knex.raw(`
        CREATE OR REPLACE FUNCTION log_product_price_changes()
        RETURNS TRIGGER AS $$
        BEGIN
          IF (NEW.price_sell <> OLD.price_sell OR NEW.price_buy <> OLD.price_buy) THEN
            INSERT INTO product_price_history (product_id, price_buy, price_sell, business_id, created_at)
            VALUES (NEW.id, NEW.price_buy, NEW.price_sell, NEW.business_id, NOW());
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_product_price_changes
        AFTER UPDATE ON products
        FOR EACH ROW
        EXECUTE FUNCTION log_product_price_changes();

        -- Insertar el precio inicial para los productos existentes
        INSERT INTO product_price_history (product_id, price_buy, price_sell, business_id, created_at)
        SELECT id, price_buy, price_sell, business_id, created_at FROM products;
      `);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex
    .raw(
      `
    DROP TRIGGER IF EXISTS trigger_product_price_changes ON products;
    DROP FUNCTION IF EXISTS log_product_price_changes();
  `,
    )
    .then(() => {
      return knex.schema.dropTableIfExists("product_price_history");
    });
};
