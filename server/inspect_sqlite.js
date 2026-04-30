const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath =
  "c:\\Users\\pc\\Documents\\SGMABControl\\temp_backup_extract\\BD_MiNegocio";
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.all(
  "SELECT folio, id_cliente, total, pagos, id_forma_pago FROM venta",
  [],
  (err, rows) => {
    if (err) return console.error(err);

    let totalDebt = 0;
    let debtSales = 0;

    rows.forEach((v) => {
      let paid = 0;
      try {
        const pList = JSON.parse(v.pagos || "[]");
        paid = pList.reduce((acc, p) => acc + (parseFloat(p.p) || 0), 0);
      } catch (e) {}

      const debt = parseFloat(v.total || 0) - paid;
      if (debt > 0.1 && v.id_cliente > 0) {
        totalDebt += debt;
        debtSales++;
        // console.log(`Folio: ${v.folio}, ClienteID: ${v.id_cliente}, Deuda: ${debt}`);
      }
    });

    console.log(`Total Sales with Debt: ${debtSales}`);
    console.log(`Total Pending Amount: $${totalDebt.toFixed(2)}`);
    db.close();
  },
);
