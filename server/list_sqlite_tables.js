const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath =
  "c:\\Users\\pc\\Documents\\SGMABControl\\backup_extracted\\extracted\\BD_MiNegocio";
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    process.exit(1);
  }
});

db.all(
  "SELECT name FROM sqlite_master WHERE type='table';",
  [],
  (err, rows) => {
    if (err) {
      console.error("Error listing tables:", err.message);
      process.exit(1);
    }
    console.log("Tables in database:");
    rows.forEach((row) => {
      console.log(`- ${row.name}`);
    });
    db.close();
  },
);
