const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = require("../db"); // Postgres (Knex)

const SQLITE_DB_PATH =
  "c:\\Users\\pc\\Documents\\SGMABControl\\temp_backup_extract\\BD_MiNegocio";
const BUSINESS_ID = 1;

async function sync() {
  console.log("Starting Debt Synchronization...");
  const sqlite = new sqlite3.Database(SQLITE_DB_PATH, sqlite3.OPEN_READONLY);

  const getSqliteData = (query) =>
    new Promise((resolve, reject) => {
      sqlite.all(query, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

  try {
    // 1. Get Postgres Customers Map
    const pgCustomers = await db("customers").where({
      business_id: BUSINESS_ID,
    });
    const customerMap = new Map(); // name.toLowerCase() -> id
    pgCustomers.forEach((c) =>
      customerMap.set(c.name.toLowerCase().trim(), c.id),
    );

    // 2. Get Postgres Sales Map
    // We'll use (customer_id, total.toFixed(2), date_string) as key
    const pgSales = await db("sales").where({ business_id: BUSINESS_ID });
    const saleMap = new Map();
    pgSales.forEach((s) => {
      const dateStr = new Date(s.created_at).toISOString().split(":")[0]; // Sync to the minute
      const key = `${s.customer_id}_${parseFloat(s.total).toFixed(2)}_${dateStr}`;
      saleMap.set(key, s.id);
    });

    // 3. Get SQLite Data
    const sqliteCustomers = await getSqliteData(
      "SELECT folio, nombre_cliente FROM cliente",
    );
    const sqliteCustNames = new Map();
    sqliteCustomers.forEach((c) =>
      sqliteCustNames.set(c.folio, c.nombre_cliente.toLowerCase().trim()),
    );

    const sqliteSales = await getSqliteData("SELECT * FROM venta");

    console.log(`Processing ${sqliteSales.length} sales from SQLite...`);

    let matchedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const v of sqliteSales) {
      if (!v.id_cliente || v.id_cliente === 0) continue;

      // Calculate Debt
      let totalPaid = 0;
      let payments = [];
      try {
        payments = JSON.parse(v.pagos || "[]");
        totalPaid = payments.reduce(
          (acc, p) => acc + (parseFloat(p.p) || 0),
          0,
        );
      } catch (e) {}

      const total = parseFloat(v.total || 0);
      const debtAmount = total - totalPaid;

      if (debtAmount <= 0.01) continue; // No debt, skip

      // Match Customer
      const custName = sqliteCustNames.get(v.id_cliente);
      const pgCustomerId = customerMap.get(custName);

      if (!pgCustomerId) {
        // console.warn(`Could not match customer: ${custName}`);
        continue;
      }

      // Match Sale
      // Reconstruction of the date as migration did it:
      const dateTimeStr = `${v.fecha} ${v.hora}`;
      const sqliteDate = new Date(dateTimeStr);
      const dateStr = sqliteDate.toISOString().split(":")[0];
      const key = `${pgCustomerId}_${total.toFixed(2)}_${dateStr}`;

      const pgSaleId = saleMap.get(key);

      if (!pgSaleId) {
        // Try matching with small time offset or without customer if needed
        // but for now let's be strict
        continue;
      }

      matchedCount++;

      // Proceed to Update Postgres in a transaction
      await db.transaction(async (trx) => {
        // A. Update Sale
        await trx("sales")
          .where({ id: pgSaleId })
          .update({
            debt_amount: debtAmount,
            status: "pendiente",
            payment_method: "cuenta corriente",
            amount_paid: totalPaid > 0 ? totalPaid : null,
            settled_at: null,
          });

        // B. Clear any previous transactions for this sale (safety)
        await trx("customer_account_transactions")
          .where({ sale_id: pgSaleId })
          .delete();

        // C. Insert Debt Transaction
        // We use the original sale date
        await trx("customer_account_transactions").insert({
          customer_id: pgCustomerId,
          sale_id: pgSaleId,
          type: "debt",
          amount: total,
          balance: 0, // Will recalculate later
          description: `Venta #${pgSaleId.substring(0, 8)} (Migrada)`,
          business_id: BUSINESS_ID,
          created_at: sqliteDate,
        });

        // D. Insert Payment Transactions from JSON
        for (const p of payments) {
          const pDate = new Date(p.f);
          await trx("customer_account_transactions").insert({
            customer_id: pgCustomerId,
            sale_id: pgSaleId,
            type: "payment",
            amount: parseFloat(p.p),
            balance: 0,
            description: `Pago en Venta #${pgSaleId.substring(0, 8)} (Migrado)`,
            business_id: BUSINESS_ID,
            created_at: isNaN(pDate.getTime()) ? sqliteDate : pDate,
            payment_method: "Efectivo",
          });
        }
      });

      updatedCount++;
      if (updatedCount % 50 === 0) process.stdout.write(".");
    }

    console.log(
      `\nMatched: ${matchedCount}, Updated: ${updatedCount}, Errors: ${errorCount}`,
    );

    // 4. Recalculate Balances for all affected customers
    console.log("Recalculating balances...");
    const affectedCustomerIds = [...new Set(pgCustomers.map((c) => c.id))];

    let custProcessed = 0;
    for (const cid of affectedCustomerIds) {
      const txs = await db("customer_account_transactions")
        .where({ customer_id: cid, business_id: BUSINESS_ID })
        .orderBy("created_at", "asc")
        .orderBy("id", "asc");

      if (txs.length === 0) continue;

      let balance = 0;
      for (const tx of txs) {
        if (tx.type === "debt") balance += parseFloat(tx.amount);
        else balance -= parseFloat(tx.amount);

        await db("customer_account_transactions")
          .where({ id: tx.id })
          .update({ balance: balance });
      }
      custProcessed++;
      if (custProcessed % 20 === 0) process.stdout.write("#");
    }

    console.log("\nSync Completed!");
  } catch (err) {
    console.error("Sync Failed:", err);
  } finally {
    sqlite.close();
    db.destroy();
  }
}

sync();
