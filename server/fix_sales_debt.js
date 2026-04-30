const db = require("./db");

async function fixSalesDebt() {
  try {
    console.log("Iniciando corrección de debt_amount en ventas...");

    // 1. Identificar ventas corruptas (debt_amount > total)
    // Usamos raw query para comparación de columnas
    const corruptSales = await db("sales")
      .whereRaw("debt_amount > total")
      .select(
        "id",
        "total",
        "amount_paid",
        "change_given",
        "debt_amount",
        "payment_method",
      );

    console.log(
      `Encontradas ${corruptSales.length} ventas con debt_amount > total.`,
    );

    if (corruptSales.length === 0) {
      console.log("No hay nada que corregir.");
      process.exit(0);
    }

    let updatedCount = 0;

    for (const sale of corruptSales) {
      const total = parseFloat(sale.total);
      const paid = parseFloat(sale.amount_paid || 0);
      const change = parseFloat(sale.change_given || 0);

      const netPaid = paid - change;
      let correctDebt = total - netPaid;

      // Asegurar que no sea negativo ni mayor al total (aunque si es Cta Cte puro netPaid es 0, debt=total)
      if (correctDebt < 0) correctDebt = 0;
      if (correctDebt > total) correctDebt = total;

      // Si es Cta Cte y no hubo pago, la deuda es el total
      if (sale.payment_method === "Cta Cte" && netPaid === 0) {
        correctDebt = total;
      }

      console.log(
        `Corrigiendo Venta ${sale.id.substring(0, 8)}: Total=${total}, Debt(Bad)=${sale.debt_amount} -> NewDebt=${correctDebt}`,
      );

      await db("sales")
        .where({ id: sale.id })
        .update({ debt_amount: correctDebt > 0 ? correctDebt : null });

      updatedCount++;
    }

    console.log(
      `\nCorrección finalizada. ${updatedCount} ventas actualizadas.`,
    );
  } catch (error) {
    console.error("Error al corregir ventas:", error);
  } finally {
    process.exit();
  }
}

fixSalesDebt();
