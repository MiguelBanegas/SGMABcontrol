const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const db = new sqlite3.Database(
  "C:/Users/pc/Documents/SGMABControl/backup_1_extracted/BD_MiNegocio"
);

db.get(
  "SELECT * FROM producto WHERE key = ?",
  ["7793344904990"],
  (err, row) => {
    if (err) {
      fs.writeFileSync(
        "product_record.json",
        JSON.stringify({ error: err.message })
      );
    } else {
      fs.writeFileSync("product_record.json", JSON.stringify(row, null, 2));
    }
    db.close();
  }
);
