exports.up = function (knex) {
  return knex.schema.createTable("purchases", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    table.integer("business_id").notNullable();
    table.integer("user_id").notNullable();
    table.decimal("total", 12, 2).notNullable();
    table.text("notes");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table
      .foreign("business_id")
      .references("businesses.id")
      .onDelete("CASCADE");
    table.foreign("user_id").references("users.id").onDelete("CASCADE");
    table.index(["business_id", "created_at"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("purchases");
};
