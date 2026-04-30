const db = require("./db");

async function fixSequence() {
  try {
    // Resetear la secuencia de sale_items al máximo ID actual
    await db.raw(`
      SELECT setval('sale_items_id_seq', COALESCE((SELECT MAX(id) FROM sale_items), 1), true);
    `);

    console.log("✅ Secuencia de sale_items reseteada correctamente");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al resetear secuencia:", error);
    process.exit(1);
  }
}

fixSequence();
