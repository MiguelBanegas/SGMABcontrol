#!/usr/bin/env node

/**
 * Script para detectar inconsistencias en la BD al eliminar clientes
 * Ejecutar: node server/scripts/check_delete_customer_consistency.js
 */

const db = require("../db");

async function checkDeleteCustomerConsistency() {
  console.log("\n=== VERIFICACIÓN DE INCONSISTENCIAS AL ELIMINAR CLIENTES ===\n");

  try {
    // 1. Detectar clientes con deuda pendiente
    console.log("1️⃣  VERIFICANDO DEUDAS PENDIENTES...\n");
    const customersWithDebt = await db.raw(`
      SELECT 
        c.id,
        c.name,
        c.email,
        COALESCE(SUM(cat.amount), 0) as total_debt
      FROM customers c
      LEFT JOIN customer_account_transactions cat ON c.id = cat.customer_id
      GROUP BY c.id, c.name, c.email
      HAVING COALESCE(SUM(cat.amount), 0) > 0.01
      ORDER BY total_debt DESC
    `);

    if (customersWithDebt.rows && customersWithDebt.rows.length > 0) {
      console.log(`   ⚠️  ${customersWithDebt.rows.length} cliente(s) con deuda:\n`);
      customersWithDebt.rows.forEach((customer) => {
        console.log(`      - ${customer.name} (ID: ${customer.id}): $${parseFloat(customer.total_debt).toFixed(2)}`);
      });
    } else {
      console.log("   ✅ No hay clientes con deuda pendiente\n");
    }

    // 2. Detectar clientes con contenedores activos
    console.log("\n2️⃣  VERIFICANDO CONTENEDORES ACTIVOS...\n");
    const customersWithContainers = await db.raw(`
      SELECT 
        c.id,
        c.name,
        cb.id as container_balance_id,
        p.name as product_name,
        cb.balance
      FROM customers c
      JOIN container_balances cb ON c.id = cb.customer_id
      JOIN products p ON cb.product_id = p.id
      WHERE cb.balance > 0
      ORDER BY c.id, cb.balance DESC
    `);

    if (
      customersWithContainers.rows &&
      customersWithContainers.rows.length > 0
    ) {
      console.log(
        `   ⚠️  ${customersWithContainers.rows.length} contenedor(es) activo(s):\n`
      );
      customersWithContainers.rows.forEach((row) => {
        console.log(
          `      - Cliente: ${row.name} (ID: ${row.id})`
        );
        console.log(
          `        Producto: ${row.product_name}, Balance: ${row.balance} unidades\n`
        );
      });
    } else {
      console.log("   ✅ No hay contenedores activos pendientes\n");
    }

    // 3. Detectar ventas pendientes
    console.log("\n3️⃣  VERIFICANDO VENTAS PENDIENTES...\n");
    const pendingSalesByCustomer = await db.raw(`
      SELECT 
        c.id,
        c.name,
        ps.id as pending_sale_id,
        ps.updated_at,
        u.username as user_name
      FROM customers c
      JOIN pending_sales ps ON c.id = ps.customer_id
      JOIN users u ON ps.user_id = u.id
      ORDER BY ps.updated_at DESC
    `);

    if (
      pendingSalesByCustomer.rows &&
      pendingSalesByCustomer.rows.length > 0
    ) {
      console.log(
        `   ⚠️  ${pendingSalesByCustomer.rows.length} venta(s) pendiente(s):\n`
      );
      pendingSalesByCustomer.rows.forEach((row) => {
        console.log(
          `      - Cliente: ${row.name} (ID: ${row.id}), Usuario: ${row.user_name}, Actualizado: ${row.updated_at}\n`
        );
      });
    } else {
      console.log("   ✅ No hay ventas pendientes\n");
    }

    // 4. Detectar clientes eliminados con orfandad (soft check)
    console.log("\n4️⃣  VERIFICANDO ORFANDAD DE DATOS...\n");

    // Ventas sin cliente asignado
    const orphanedSales = await db.raw(`
      SELECT COUNT(*) as count
      FROM sales
      WHERE customer_id IS NULL
    `);

    console.log(
      `   - Ventas sin cliente: ${orphanedSales.rows[0].count}`
    );

    // Container balances sin cliente (si existen)
    const orphanedContainers = await db.raw(`
      SELECT COUNT(*) as count
      FROM container_balances
      WHERE customer_id IS NULL
    `);

    console.log(
      `   - Contenedores sin cliente: ${orphanedContainers.rows[0].count}`
    );

    // 5. Resumen de clientes seguros para eliminar
    console.log("\n5️⃣  RESUMEN - CLIENTES SEGUROS PARA ELIMINAR...\n");

    const safeToDelete = await db.raw(`
      SELECT 
        c.id,
        c.name,
        c.email,
        COUNT(DISTINCT s.id) as sale_count,
        COALESCE(SUM(cat.amount), 0) as debt_balance,
        (SELECT COUNT(*) FROM container_balances WHERE customer_id = c.id AND balance > 0) as active_containers,
        (SELECT COUNT(*) FROM pending_sales WHERE customer_id = c.id) as pending_sales
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id
      LEFT JOIN customer_account_transactions cat ON c.id = cat.customer_id
      WHERE c.is_active = false OR c.id NOT IN (
        SELECT customer_id FROM customer_account_transactions WHERE amount > 0
      )
      GROUP BY c.id, c.name, c.email
      HAVING 
        COALESCE(SUM(cat.amount), 0) <= 0.01
        AND (SELECT COUNT(*) FROM container_balances WHERE customer_id = c.id AND balance > 0) = 0
        AND (SELECT COUNT(*) FROM pending_sales WHERE customer_id = c.id) = 0
      ORDER BY c.name
    `);

    if (safeToDelete.rows && safeToDelete.rows.length > 0) {
      console.log(`   ✅ ${safeToDelete.rows.length} cliente(s) SEGUROS para eliminar:\n`);
      safeToDelete.rows.forEach((customer) => {
        console.log(`      - ${customer.name} (ID: ${customer.id}, Email: ${customer.email})`);
        console.log(`        Ventas: ${customer.sale_count}, Deuda: $${parseFloat(customer.debt_balance).toFixed(2)}`);
      });
    } else {
      console.log("   ❌ No hay clientes seguros para eliminar\n");
    }

    console.log("\n=== FIN DE VERIFICACIÓN ===\n");

    process.exit(0);
  } catch (error) {
    console.error("Error durante la verificación:", error);
    process.exit(1);
  }
}

checkDeleteCustomerConsistency();
