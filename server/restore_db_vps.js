const { exec } = require("child_process");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

let backupFile = process.argv[2];

if (!backupFile) {
  console.error("Uso: node restore_db_vps.js <nombre_o_ruta_del_archivo.sql>");
  process.exit(1);
}

// Resolver la ruta absoluta si no lo es
if (!path.isAbsolute(backupFile)) {
  backupFile = path.resolve(process.cwd(), backupFile);
}

const dbName = process.env.DB_NAME || "sgm_db";
const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "postgres";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || 5432;

const command = `PGPASSWORD=${dbPassword} psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${backupFile}"`;

console.log(
  `Iniciando restauración de la base de datos '${dbName}' desde '${backupFile}' (psql)...`,
);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error en la restauración: ${error.message}`);
    console.error("Stderr:", stderr);
    process.exit(1);
  }
  console.log("Base de datos restaurada exitosamente.");
  console.log("Stdout:", stdout);
});