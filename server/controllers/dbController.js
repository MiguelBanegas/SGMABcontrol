const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Ruta a las herramientas de PostgreSQL
const PG_BIN_PATH = "C:\\Program Files\\PostgreSQL\\18\\bin";
const PG_DUMP = `"${PG_BIN_PATH}\\pg_dump.exe"`;
const PSQL = `"${PG_BIN_PATH}\\psql.exe"`;

exports.backupDatabase = async (req, res) => {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `sgm_backup_${timestamp}.sql`;
    const filePath = path.join(process.cwd(), fileName);

    // Configuración de conexión desde variables de entorno
    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;

    // Comando pg_dump
    // -O: no owner, -x: no privileges, -f: output file
    const command = `set PGPASSWORD=${dbPassword}&& ${PG_DUMP} -h ${dbHost} -p ${dbPort} -U ${dbUser} -F c -b -v -f "${filePath}" ${dbName}`;

    console.log("Ejecutando respaldo...");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error en pg_dump: ${error.message}`);
        return res.status(500).json({
          error: "Error al generar el respaldo",
          details: error.message,
        });
      }

      console.log("Respaldo generado con éxito:", filePath);

      // Enviar el archivo al cliente
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error al descargar el archivo:", err);
        }
        // Eliminar el archivo temporal después de la descarga
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    console.error("Error en backupDatabase:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

exports.restoreDatabase = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "No se proporcionó ningún archivo de respaldo" });
    }

    const filePath = req.file.path;
    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;

    // Comando para restaurar (asumiendo formato custom de pg_dump -F c)
    // Usamos pg_restore for format custom
    const PG_RESTORE = `"${PG_BIN_PATH}\\pg_restore.exe"`;

    // --clean para borrar objetos antes de recrear, --if-exists, --no-owner
    const command = `set PGPASSWORD=${dbPassword}&& ${PG_RESTORE} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --clean --if-exists --no-owner "${filePath}"`;

    console.log("Iniciando restauración de base de datos...");

    exec(command, (error, stdout, stderr) => {
      // Eliminar el archivo subido después de procesar
      fs.unlinkSync(filePath);

      if (error) {
        console.error(`Error en pg_restore: ${error.message}`);
        return res.status(500).json({
          error: "Error al restaurar la base de datos",
          details: error.message,
        });
      }

      console.log("Restauración completada con éxito");
      res.json({ message: "Base de datos restaurada exitosamente" });
    });
  } catch (error) {
    console.error("Error en restoreDatabase:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
