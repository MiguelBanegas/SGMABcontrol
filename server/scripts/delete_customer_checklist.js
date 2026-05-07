#!/usr/bin/env node

/**
 * CHECKLIST INTERACTIVO - Seguridad al Eliminar Clientes
 * Ejecutar: node server/scripts/delete_customer_checklist.js
 * 
 * Este script actúa como guía y validación antes de proceder
 */

const db = require("../db");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function runChecklist() {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║    CHECKLIST - SEGURIDAD AL ELIMINAR CLIENTES              ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  try {
    // 1. INFORMACIÓN DEL CLIENTE
    console.log("📋 PASO 1: IDENTIFICACIÓN DEL CLIENTE\n");
    const customerId = await ask(
      "Ingresa el ID del cliente a eliminar (o 'salir'): "
    );

    if (customerId.toLowerCase() === "salir") {
      console.log("\n✅ Operación cancelada.");
      process.exit(0);
    }

    const customer = await db("customers").where({ id: customerId }).first();

    if (!customer) {
      console.log(
        "\n❌ Cliente no encontrado. Verifica el ID e intenta de nuevo."
      );
      process.exit(1);
    }

    console.log(`\n✅ Cliente encontrado:`);
    console.log(`   Nombre: ${customer.name}`);
    console.log(`   Email: ${customer.email}`);
    console.log(`   Teléfono: ${customer.phone}`);
    console.log(`   Estado: ${customer.is_active ? "ACTIVO" : "INACTIVO"}`);
    console.log(
      `   Creado: ${new Date(customer.created_at).toLocaleDateString()}`
    );

    // 2. VALIDACIÓN DE DEUDA
    console.log("\n\n💳 PASO 2: VERIFICAR DEUDA EN CUENTA CORRIENTE\n");

    const debtQuery = await db("customer_account_transactions")
      .where({ customer_id: customerId })
      .sum("amount as total_debt")
      .first();

    const debt = debtQuery.total_debt || 0;

    if (debt > 0.01) {
      console.log(`❌ BLOQUEADO: Cliente tiene deuda de $${debt.toFixed(2)}`);
      console.log("\n   Acciones requeridas:");
      console.log("   1. Cobrar la deuda pendiente");
      console.log("   2. O crear ajuste contable");
      console.log("   3. Intentar nuevamente después\n");
      process.exit(1);
    } else {
      console.log(`✅ DEUDA OK: $${debt.toFixed(2)}`);
    }

    // 3. VALIDACIÓN DE CONTENEDORES
    console.log("\n\n📦 PASO 3: VERIFICAR CONTENEDORES EN PRÉSTAMO\n");

    const containers = await db("container_balances")
      .where({ customer_id: customerId })
      .where("balance", ">", 0)
      .join("products", "container_balances.product_id", "products.id")
      .select(
        "container_balances.id",
        "container_balances.balance",
        "products.name"
      );

    if (containers.length > 0) {
      console.log(
        `❌ BLOQUEADO: Cliente tiene ${containers.length} contenedor(es) en préstamo:\n`
      );
      containers.forEach((c) => {
        console.log(`   - ${c.name}: ${c.balance} unidades`);
      });
      console.log("\n   Acciones requeridas:");
      console.log("   1. Contactar cliente para devolución");
      console.log("   2. O registrar devolución manualmente");
      console.log("   3. Intentar nuevamente después\n");
      process.exit(1);
    } else {
      console.log("✅ CONTENEDORES OK: Sin préstamos activos");
    }

    // 4. VALIDACIÓN DE VENTAS PENDIENTES
    console.log("\n\n🛒 PASO 4: VERIFICAR VENTAS PENDIENTES\n");

    const pendingSale = await db("pending_sales")
      .where({ customer_id: customerId })
      .first();

    if (pendingSale) {
      console.log(`❌ BLOQUEADO: Cliente tiene venta pendiente (ID: ${pendingSale.id})`);
      console.log("\n   Acciones requeridas:");
      console.log("   1. Completar la venta");
      console.log("   2. O cancelar la venta desde el carrito");
      console.log("   3. Intentar nuevamente después\n");
      process.exit(1);
    } else {
      console.log("✅ VENTAS PENDIENTES OK: Sin carrito activo");
    }

    // 5. RESUMEN DE DATOS A REASIGNAR
    console.log("\n\n📊 PASO 5: RESUMEN - DATOS A REASIGNAR\n");

    const salesCount = await db("sales")
      .where({ customer_id: customerId })
      .count("* as count")
      .first();

    const transactionCount = await db("customer_account_transactions")
      .where({ customer_id: customerId })
      .count("* as count")
      .first();

    console.log(`   Ventas asociadas: ${salesCount.count}`);
    console.log(`   Transacciones de cuenta: ${transactionCount.count}`);
    console.log(`\n   ℹ️  Las ventas serán reasignadas a "Consumidor Final"`);
    console.log(`   ℹ️  El historial de transacciones se mantendrá intacto`);

    // 6. CONFIRMACIÓN FINAL
    console.log("\n\n🔐 PASO 6: CONFIRMACIÓN FINAL\n");
    console.log(`⚠️  ADVERTENCIA: Esta acción es PERMANENTE`);
    console.log(`   Cliente: ${customer.name}`);
    console.log(`   Ventas a reasignar: ${salesCount.count}`);
    console.log(`   Histórico a conservar: ${transactionCount.count} transacciones`);

    const confirmation = await ask(
      `\n¿Confirmas la eliminación de ${customer.name}? (escribir 'SI' para confirmar): `
    );

    if (confirmation !== "SI") {
      console.log("\n✅ Operación cancelada.");
      process.exit(0);
    }

    // 7. PROCEDER CON ELIMINACIÓN
    console.log("\n\n🗑️  PASO 7: EJECUTANDO ELIMINACIÓN...\n");

    await db.transaction(async (trx) => {
      // Reasignar ventas
      const updatedSales = await trx("sales")
        .where({ customer_id: customerId })
        .update({ customer_id: null });

      console.log(`✅ Reasignadas ${updatedSales} ventas a Consumidor Final`);

      // Limpiar container_balances
      const updatedContainers = await trx("container_balances")
        .where({ customer_id: customerId })
        .update({ customer_id: null, balance: 0 });

      console.log(`✅ Limpiados ${updatedContainers} saldos de contenedores`);

      // Eliminar pending_sales
      const deletedPendingSales = await trx("pending_sales")
        .where({ customer_id: customerId })
        .del();

      console.log(`✅ Eliminadas ${deletedPendingSales} ventas pendientes`);

      // Eliminar cliente
      const deletedCustomer = await trx("customers")
        .where({ id: customerId })
        .del();

      console.log(`✅ Cliente eliminado de la base de datos`);
    });

    // 8. RESUMEN FINAL
    console.log("\n\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                    ✅ ELIMINACIÓN COMPLETADA                ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    console.log(`Cliente eliminado: ${customer.name}`);
    console.log(`Fecha/Hora: ${new Date().toLocaleString()}`);
    console.log(`\nDocumentación:`);
    console.log(`- Nombre: ${customer.name}`);
    console.log(`- Email: ${customer.email}`);
    console.log(`- ID: ${customerId}\n`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    rl.close();
    process.exit(1);
  }
}

runChecklist();
