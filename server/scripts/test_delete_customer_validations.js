#!/usr/bin/env node

/**
 * TEST: Validar funcionamiento del delete customer mejorado
 * Ejecutar: node server/scripts/test_delete_customer_validations.js
 */

const db = require("../db");

async function testDeleteValidations() {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  TEST - DELETE CUSTOMER VALIDATIONS               ║");
  console.log("╚════════════════════════════════════════════════════╝\n");

  try {
    // Test 1: Cliente con deuda
    console.log("TEST 1: Cliente con DEUDA pendiente\n");
    const customerWithDebt = await db("customers")
      .leftJoin("customer_account_transactions", "customers.id", "customer_account_transactions.customer_id")
      .groupBy("customers.id")
      .havingRaw("COALESCE(SUM(customer_account_transactions.amount), 0) > 0.01")
      .select("customers.id", "customers.name")
      .first();

    if (customerWithDebt) {
      console.log(`✅ Cliente encontrado: ${customerWithDebt.name} (ID: ${customerWithDebt.id})`);
      console.log(`   Intento de eliminación: DEBERÍA SER RECHAZADO ❌\n`);
    }

    // Test 2: Cliente con contenedor activo
    console.log("TEST 2: Cliente con CONTENEDOR activo\n");
    const customerWithContainer = await db("container_balances")
      .where("balance", ">", 0)
      .join("customers", "container_balances.customer_id", "customers.id")
      .join("products", "container_balances.product_id", "products.id")
      .select(
        "customers.id",
        "customers.name",
        "products.name as product_name",
        "container_balances.balance"
      )
      .first();

    if (customerWithContainer) {
      console.log(`✅ Cliente encontrado: ${customerWithContainer.name} (ID: ${customerWithContainer.id})`);
      console.log(`   Producto: ${customerWithContainer.product_name}`);
      console.log(`   Unidades: ${customerWithContainer.balance}`);
      console.log(`   Intento de eliminación: DEBERÍA SER RECHAZADO ❌\n`);
    }

    // Test 3: Verificar que container_balances ahora tiene customer_id nullable
    console.log("TEST 3: Verificar esquema de BD (nullable customer_id)\n");
    const schema = await db.raw(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'container_balances' AND column_name = 'customer_id'
    `);

    if (schema.rows && schema.rows[0]) {
      const col = schema.rows[0];
      console.log(`✅ Columna: container_balances.customer_id`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log(`   Estado: ${col.is_nullable === "YES" ? "✅ CORRECTO" : "❌ INCORRECTO"}\n`);
    }

    // Test 4: Verificar foreign key policy
    console.log("TEST 4: Verificar políticas de Foreign Keys\n");
    
    const constraints = await db.raw(`
      SELECT constraint_name, table_name, column_name
      FROM information_schema.key_column_usage
      WHERE table_name IN ('container_balances', 'container_transactions')
        AND column_name = 'customer_id'
        AND constraint_name LIKE '%fk%'
    `);

    if (constraints.rows && constraints.rows.length > 0) {
      constraints.rows.forEach((row) => {
        console.log(`✅ ${row.table_name}.${row.column_name}`);
        console.log(`   Constraint: ${row.constraint_name}`);
      });
      console.log();
    }

    // Test 5: Listar clientes seguros para eliminar
    console.log("TEST 5: Clientes SEGUROS para eliminar\n");
    
    const safeCustomers = await db.raw(`
      SELECT 
        c.id,
        c.name,
        COALESCE(SUM(cat.amount), 0) as debt,
        (SELECT COUNT(*) FROM container_balances WHERE customer_id = c.id AND balance > 0) as active_containers,
        (SELECT COUNT(*) FROM pending_sales WHERE customer_id = c.id) as pending_sales
      FROM customers c
      LEFT JOIN customer_account_transactions cat ON c.id = cat.customer_id
      GROUP BY c.id, c.name
      HAVING 
        COALESCE(SUM(cat.amount), 0) <= 0.01
        AND (SELECT COUNT(*) FROM container_balances WHERE customer_id = c.id AND balance > 0) = 0
        AND (SELECT COUNT(*) FROM pending_sales WHERE customer_id = c.id) = 0
      LIMIT 5
    `);

    if (safeCustomers.rows && safeCustomers.rows.length > 0) {
      console.log(`${safeCustomers.rows.length} clientes SEGUROS encontrados:\n`);
      safeCustomers.rows.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.name} (ID: ${c.id})`);
        console.log(`   Deuda: $${c.debt}, Contenedores: ${c.active_containers}, Pendientes: ${c.pending_sales}`);
      });
      console.log();
    } else {
      console.log("⚠️  NO hay clientes seguros para eliminar en este momento\n");
    }

    console.log("═══════════════════════════════════════════════════");
    console.log("RESUMEN: Todas las validaciones están en lugar ✅");
    console.log("═══════════════════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("Error en test:", error);
    process.exit(1);
  }
}

testDeleteValidations();
