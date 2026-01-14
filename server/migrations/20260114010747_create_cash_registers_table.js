exports.up = function (knex) {
  return knex.schema.createTable("cash_registers", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.integer("business_id").notNullable();
    table.integer("user_id").notNullable();

    // Montos
    table.decimal("opening_amount", 12, 2).notNullable(); // Monto inicial declarado
    table.decimal("closing_amount", 12, 2); // Monto final declarado (null si está abierta)
    table.decimal("expected_amount", 12, 2); // Monto esperado calculado
    table.decimal("difference", 12, 2); // Diferencia (+ sobrante, - faltante)

    // Totales calculados
    table.decimal("cash_sales", 12, 2).defaultTo(0); // Ventas en efectivo
    table.decimal("expenses", 12, 2).defaultTo(0); // Gastos registrados
    table.decimal("withdrawals", 12, 2).defaultTo(0); // Retiros de efectivo

    // Estado y fechas
    table.enum("status", ["open", "closed"]).defaultTo("open");
    table.timestamp("opened_at").defaultTo(knex.fn.now());
    table.timestamp("closed_at");
    table.text("notes"); // Notas del cierre

    table
      .foreign("business_id")
      .references("businesses.id")
      .onDelete("CASCADE");
    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table.index(["business_id", "user_id", "status"]);
    table.index(["business_id", "opened_at"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("cash_registers");
};
