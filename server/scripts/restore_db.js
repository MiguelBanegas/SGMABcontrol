const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const PG_BIN_PATH = "C:\\Program Files\\PostgreSQL\\18\\bin";
const PG_RESTORE = `"${PG_BIN_PATH}\\pg_restore.exe"`;

const backupFile = process.argv[2];

if (!backupFile) {
  console.error("Uso: node restore_db.js <ruta_al_archivo_respaldo.sql>");
  process.exit(1);
}

const dbName = process.env.DB_NAME || "sgm_db";
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "postgres";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || 5432;

const command = `set PGPASSWORD=${dbPassword}&& ${PG_RESTORE} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --clean --if-exists --no-owner "${backupFile}"`;

console.log(
  `Iniciando restauración de la base de datos '${dbName}' desde '${backupFile}'...`,
);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error en la restauración: ${error.message}`);
    process.exit(1);
  }
  console.log("Base de datos restaurada exitosamente.");
});
