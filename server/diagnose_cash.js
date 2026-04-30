const db = require("./db");

async function diagnoseNegativeCash() {
  try {
    // 1. Obtener caja abierta
    const openRegister = await db("cash_registers")
      .where({ status: "open" })
      .orderBy("id", "desc")
      .first();

    if (!openRegister) {
      console.log("No hay caja abierta para diagnosticar.");
      return;
    }

    console.log(
      `Diagnosticar Caja ID: ${openRegister.id} (Abierta: ${openRegister.opening_date})`,
    );

    // 2. Obtener ventas vinculadas que podrían ser negativas
    const sales = await db("sales")
      .where({ cash_register_id: openRegister.id })
      .select(
        "id",
        "total",
        "payment_method",
        "debt_amount",
        "created_at",
        "amount_paid",
      );

    console.log(`Total ventas encontradas: ${sales.length}`);

    let negativeSales = [];
    let weirdCalculation = [];

    sales.forEach((s) => {
      const netCash = parseFloat(s.total) - parseFloat(s.debt_amount || 0);

      if (parseFloat(s.total) < 0) {
        negativeSales.push(s);
      }

      if (netCash < 0) {
        weirdCalculation.push({ ...s, netCalculated: netCash });
      }
    });

    console.log("\n--- VENTAS CON TOTAL NEGATIVO ---");
    if (negativeSales.length > 0) {
      console.table(negativeSales);
    } else {
      console.log("Ninguna.");
    }

    console.log(
      "\n--- VENTAS CON CÁLCULO DE EFECTIVO NEGATIVO (Total - Deuda < 0) ---",
    );
    if (weirdCalculation.length > 0) {
      console.table(weirdCalculation);
    } else {
      console.log("Ninguna.");
    }

    // 3. Ver si hay pagos de cta cte negativos (poco probable pero posible)
    const payments = await db("cash_movements").where({
      cash_register_id: openRegister.id,
      type: "account_payment",
    });

    const negativePayments = payments.filter((p) => parseFloat(p.amount) < 0);
    console.log("\n--- PAGOS CTA CTE NEGATIVOS ---");
    if (negativePayments.length > 0) {
      console.table(negativePayments);
    } else {
      console.log("Ninguno.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
}

diagnoseNegativeCash();
