const sqlite3 = require("sqlite3").verbose();
const dbPath =
  "c:\\Users\\pc\\Documents\\SGMABControl\\backup_extracted\\extracted\\BD_MiNegocio";
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

const tables = ["producto", "cliente", "categorias", "unidad"];

tables.forEach((table) => {
  db.all(`PRAGMA table_info(${table});`, [], (err, rows) => {
    if (err) {
      console.error(`Error schema ${table}:`, err.message);
      return;
    }
    console.log(`Schema for ${table}:`);
    rows.forEach((row) => {
      console.log(`- ${row.name} (${row.type})${row.pk ? " PK" : ""}`);
    });
    console.log("---");
  });
});

setTimeout(() => db.close(), 2000);
