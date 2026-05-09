#!/usr/bin/env node

/**
 * FIX: Corregir sale_payments.amount para ventas existentes con descuentos
 * Ejecutar: node server/scripts/fix_sale_payments_discounts.js
 */

const db = require("../db");

async function fixSalePaymentsDiscounts() {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  FIX - SALE_PAYMENTS DISCOUNTS                   ║");
  console.log("╚════════════════════════════════════════════════════╝\n");

  try {
    // 1. Encontrar ventas donde sales.total != SUM(sale_payments.amount) para pagos no Cta Cte
    console.log("1. Buscando ventas con discrepancias en sale_payments...\n");

    const problematicSales = await db.raw(`
      SELECT 
        s.id,
        s.total as sales_total,
        s.payment_method,
        s.cash_discount,
        COALESCE(SUM(sp.amount), 0) as payments_total,
        COUNT(sp.id) as payment_count
      FROM sales s
      LEFT JOIN sale_payments sp ON s.id = sp.sale_id
      WHERE s.payment_method != 'Cta Cte'
      GROUP BY s.id, s.total, s.payment_method, s.cash_discount
      HAVING ABS(s.total - COALESCE(SUM(sp.amount), 0)) > 0.01
      LIMIT 20
    `);

    if (problematicSales.rows.length === 0) {
      console.log("✅ No se encontraron ventas con discrepancias\n");
      return;
    }

    console.log(`Se encontraron ${problematicSales.rows.length} ventas con problemas:\n`);

    for (const sale of problematicSales.rows) {
      console.log(`ID: ${sale.id.substring(0, 8)}...`);
      console.log(`  sales.total: $${sale.sales_total}`);
      console.log(`  payments SUM: $${sale.payments_total}`);
      console.log(`  Método: ${sale.payment_method}`);
      console.log(`  Descuento: $${sale.cash_discount || 0}`);
      console.log(`  Diferencia: $${(sale.sales_total - sale.payments_total).toFixed(2)}\n`);
    }

    // 2. Corregir las discrepancias
    console.log("2. Corrigiendo sale_payments...\n");

    let fixed = 0;
    for (const sale of problematicSales.rows) {
      if (sale.payment_method === "Cta Cte") {
        // Para Cta Cte, amount debe ser 0
        await db("sale_payments")
          .where({ sale_id: sale.id })
          .update({ amount: 0 });
      } else {
        // Para otros métodos, amount debe ser igual a sales.total
        await db("sale_payments")
          .where({ sale_id: sale.id })
          .update({ 
            amount: sale.sales_total,
            payment_method: sale.payment_method
          });
      }
      fixed++;
      console.log(`✅ Corregida venta ${sale.id.substring(0, 8)}...`);
    }

    console.log(`\n📋 RESUMEN:`);
    console.log(`   Ventas corregidas: ${fixed}`);
    console.log(`   Problema: sale_payments.amount no reflejaba descuentos aplicados`);
    console.log(`   Solución: Actualizado para usar sales.total (con descuentos)\n`);

    console.log("═══════════════════════════════════════════════════");
    console.log("✅ FIX COMPLETADO - sale_payments corregidos");
    console.log("═══════════════════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("Error en fix:", error);
    process.exit(1);
  }
}

fixSalePaymentsDiscounts();
