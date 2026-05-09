#!/usr/bin/env node

/**
 * FIX: Corregir sale_payments.amount para ventas existentes con descuentos
 * Ejecutar: node server/scripts/fix_sale_payments_discounts.js
 */

const db = require("../db");
const { v4: uuidv4 } = require("uuid");

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
        s.business_id,
        COALESCE(SUM(sp.amount), 0) as payments_total,
        COUNT(sp.id) as payment_count
      FROM sales s
      LEFT JOIN sale_payments sp ON s.id = sp.sale_id
      WHERE s.payment_method != 'Cta Cte'
      GROUP BY s.id, s.total, s.payment_method, s.cash_discount, s.business_id
      HAVING ABS(s.total - COALESCE(SUM(sp.amount), 0)) > 0.01
    `);

    if (problematicSales.rows.length === 0) {
      console.log("✅ No se encontraron ventas con discrepancias\n");
      return;
    }

    console.log(`Se encontraron ${problematicSales.rows.length} ventas con problemas:\n`);

    const previewCount = Math.min(problematicSales.rows.length, 20);
    console.log(`Mostrando los primeros ${previewCount} registros para revisión rápida:`);
    for (let i = 0; i < previewCount; i++) {
      const sale = problematicSales.rows[i];
      console.log(`ID: ${sale.id.substring(0, 8)}...  total=$${sale.sales_total}  pagos=$${sale.payments_total}  método=${sale.payment_method}`);
    }

    console.log("\n2. Corrigiendo sale_payments...\n");

    let fixed = 0;
    for (const [index, sale] of problematicSales.rows.entries()) {
      const payments = await db("sale_payments").where({ sale_id: sale.id });

      if (payments.length === 0) {
        await db("sale_payments").insert({
          id: uuidv4(),
          sale_id: sale.id,
          payment_method: sale.payment_method || "Efectivo",
          amount: sale.sales_total,
          business_id: sale.business_id,
          created_at: new Date(),
        });
      } else if (sale.payment_method === "Cta Cte") {
        await db("sale_payments")
          .where({ sale_id: sale.id })
          .update({ amount: 0 });
      } else if (payments.length === 1) {
        await db("sale_payments")
          .where({ sale_id: sale.id })
          .update({ amount: sale.sales_total });
      } else {
        const mainPayment =
          payments.find((p) => p.payment_method !== "Cta Cte") || payments[0];

        await db("sale_payments")
          .where({ id: mainPayment.id })
          .update({ amount: sale.sales_total });

        const otherPaymentIds = payments
          .filter((p) => p.id !== mainPayment.id)
          .map((p) => p.id);

        if (otherPaymentIds.length > 0) {
          await db("sale_payments")
            .whereIn("id", otherPaymentIds)
            .update({ amount: 0 });
        }
      }

      fixed++;
      if ((index + 1) % 1000 === 0 || index === problematicSales.rows.length - 1) {
        console.log(`  Procesadas ${index + 1} / ${problematicSales.rows.length} ventas...`);
      }
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
