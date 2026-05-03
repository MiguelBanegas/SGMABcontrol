const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Ruta a las herramientas de PostgreSQL
const PG_BIN_PATH = "C:\\Program Files\\PostgreSQL\\18\\bin";
const PG_DUMP = `"${PG_BIN_PATH}\\pg_dump.exe"`;
const PSQL = `"${PG_BIN_PATH}\\psql.exe"`;

/* exports.backupDatabase = async (req, res) => {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `sgm_backup_${timestamp}.dump`;
    const filePath = path.join(process.cwd(), fileName);

    // Configuración de conexión desde variables de entorno
    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;

    // Comando pg_dump en formato custom (.dump)
    const command = `set PGPASSWORD=${dbPassword}&& ${PG_DUMP} -Fc -h ${dbHost} -p ${dbPort} -U ${dbUser} -f "${filePath}" ${dbName}`;

    console.log("Ejecutando respaldo en formato custom (.dump)...");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error en pg_dump: ${error.message}`);
        return res.status(500).json({
          error: "Error al generar el respaldo",
          details: error.message,
        });
      }

      console.log("Respaldo generado con éxito:", filePath);

      // Responder con éxito, el archivo se guarda localmente
      res.json({
        message: "Backup guardado exitosamente",
        filePath: filePath,
        fileName: fileName
      });
    });
  } catch (error) {
    console.error("Error en backupDatabase:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}; */

/* exports.backupDatabase = async (req, res) => {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);

    const fileName = `sgm_backup_${timestamp}.dump`;
    const filePath = path.join(process.cwd(), fileName);

    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;
    const PG_DUMP = process.env.PG_DUMP || "pg_dump";

    const command = `PGPASSWORD=${dbPassword} ${PG_DUMP} \
      -h ${dbHost} \
      -p ${dbPort} \
      -U ${dbUser} \
      -Fc \
      -Z9 \
      -b \
      -v \
      -f "${filePath}" \
      ${dbName}`;

    console.log("Ejecutando backup (formato custom)...");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error en pg_dump:", error.message);
        console.error(stderr);
        return res.status(500).json({
          error: "Error al generar el backup",
          details: error.message,
        });
      }

      console.log("Backup generado:", filePath);

      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error al descargar:", err);
        }
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    console.error("Error en backupDatabase:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}; */
exports.backupDatabase = async (req, res) => {
  try {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);

    const fileName = `sgm_backup_${timestamp}.dump`;
    const filePath = path.join(process.cwd(), fileName);

    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;
    const PG_DUMP = process.env.PG_DUMP || "pg_dump";

    const command = `"${PG_DUMP}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -Fc -Z9 -b -v -f "${filePath}" ${dbName}`;

    console.log("Ejecutando backup (Windows compatible)...");

    exec(command, {
      env: { ...process.env, PGPASSWORD: dbPassword }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error("Error en pg_dump:", error.message);
        console.error(stderr);
        return res.status(500).json({
          error: "Error al generar el backup",
          details: error.message,
        });
      }

      console.log("Backup generado:", filePath);

      res.download(filePath, fileName, (err) => {
        if (err) console.error("Error al descargar:", err);
        fs.unlinkSync(filePath);
      });
    });

  } catch (error) {
    console.error("Error en backupDatabase:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/* exports.restoreDatabase = async (req, res) => {
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

    // Comando para restaurar usando psql (para archivos de texto plano .sql)
    const command = `set PGPASSWORD=${dbPassword}&& ${PSQL} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filePath}"`;

    console.log("Iniciando restauración de base de datos (psql)...");

    exec(command, (error, stdout, stderr) => {
      // Eliminar el archivo subido después de procesar
      fs.unlinkSync(filePath);

      if (error) {
        console.error(`Error en psql: ${error.message}`);
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
}; */
/* exports.restoreDatabase = async (req, res) => {
  try {
    const backupFile = req.file?.path; // usando multer
    if (!backupFile) {
      return res.status(400).json({ error: "Archivo de backup requerido" });
    }

    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;
    const PG_RESTORE = process.env.PG_RESTORE || "pg_restore";

    // ⚠️ IMPORTANTE: limpia y restaura correctamente
    const command = `PGPASSWORD=${dbPassword} ${PG_RESTORE} \
      -h ${dbHost} \
      -p ${dbPort} \
      -U ${dbUser} \
      -d ${dbName} \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      --disable-triggers \
      -v \
      "${backupFile}"`;

    console.log("Iniciando restauración...");

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("Error en restore:", error.message);
        console.error(stderr);
        return res.status(500).json({
          error: "Error al restaurar la base de datos",
          details: error.message,
        });
      }

      console.log("Restauración completada");

      // borrar archivo subido
      fs.unlinkSync(backupFile);

      res.json({ message: "Base de datos restaurada correctamente" });
    });
  } catch (error) {
    console.error("Error en restoreDatabase:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}; */

exports.restoreDatabase = async (req, res) => {
  try {
    const backupFile = req.file?.path;
    if (!backupFile) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;
    const PG_RESTORE = process.env.PG_RESTORE || "pg_restore";

    const command = `"${PG_RESTORE}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --clean --if-exists --no-owner --no-privileges --disable-triggers -v "${backupFile}"`;

    console.log("Restaurando DB (Windows compatible)...");

    exec(command, {
      env: { ...process.env, PGPASSWORD: dbPassword }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error("Error en restore:", error.message);
        console.error(stderr);
        return res.status(500).json({
          error: "Error al restaurar",
          details: error.message,
        });
      }

      console.log("Restore completado");

      fs.unlinkSync(backupFile);

      res.json({ message: "Restauración exitosa" });
    });

  } catch (error) {
    console.error("Error en restoreDatabase:", error);
    res.status(500).json({ error: "Error interno" });
  }
};