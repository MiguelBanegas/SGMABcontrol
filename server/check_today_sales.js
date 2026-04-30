const db = require("./db");

async function checkToday() {
  const startOfDay = "2026-01-30T00:00:00.000Z";
  const endOfDay = "2026-01-30T23:59:59.999Z";

  const sales = await db("sales")
    .whereBetween("created_at", [startOfDay, endOfDay])
    .select("id", "total", "payment_method", "created_at");

  console.log(`Ventas encontradas para hoy (${sales.length}):`);
  sales.forEach((s) =>
    console.log(
      `- ID: ${s.id}, Total: ${s.total}, Pago: ${s.payment_method}, Fecha: ${s.created_at}`,
    ),
  );

  process.exit(0);
}

checkToday();
