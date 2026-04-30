const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(
  "c:",
  "Users",
  "pc",
  "Documents",
  "SGMABControl",
  "temp_backup_extract",
  "BD_MiNegocio",
);
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
});

const tables = ["cliente", "venta", "venta_producto", "producto"];

const getTableInfo = (tableName) => {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName});`, [], (err, rows) => {
      if (err) reject(err);
      else resolve({ tableName, columns: rows });
    });
  });
};

Promise.all(tables.map(getTableInfo))
  .then((results) => {
    results.forEach((res) => {
      console.log(`\nStructure for table: ${res.tableName}`);
      res.columns.forEach((col) => {
        console.log(`- ${col.name} (${col.type})${col.pk ? " [PK]" : ""}`);
      });
    });
    db.close();
  })
  .catch((err) => {
    console.error("Error:", err.message);
    db.close();
    process.exit(1);
  });
