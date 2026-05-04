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
    // Asegurar que la carpeta de backups exista en la raíz del servidor
    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
      console.log("Carpeta 'backups' creada correctamente");
    }
    
    const filePath = path.join(backupsDir, fileName);

    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;
    const PG_DUMP = process.env.PG_DUMP || "pg_dump";

    const command = `"${PG_DUMP}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -Fc -Z9 -b -v -f "${filePath}" ${dbName}`;

    console.log("Ejecutando backup...");

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

      console.log("Backup generado con éxito en:", filePath);

      // Responder con JSON para que el frontend pueda mostrar la ruta
      res.json({
        message: "Backup guardado exitosamente",
        filePath: filePath,
        fileName: fileName
      });
    });

  } catch (error) {
    console.error("Error en backupDatabase:", error);
    res.status(500).json({ error: "Error interno" });
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

exports.listBackups = async (req, res) => {
  try {
    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter(file => file.endsWith(".dump") || file.endsWith(".sql"))
      .map(file => {
        const stats = fs.statSync(path.join(backupsDir, file));
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    res.json(backups);
  } catch (error) {
    console.error("Error al listar backups:", error);
    res.status(500).json({ error: "Error al listar backups" });
  }
};

exports.downloadBackup = async (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = path.join(process.cwd(), "backups", fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Archivo no encontrado" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Error al descargar backup:", error);
    res.status(500).json({ error: "Error al descargar backup" });
  }
};

exports.restoreFromServer = async (req, res) => {
  try {
    const { fileName } = req.body;
    // Usamos path.resolve para asegurar ruta absoluta basada en el directorio de trabajo actual
    const backupsDir = path.resolve(process.cwd(), "backups");
    const filePath = path.join(backupsDir, fileName);

    console.log(`Intentando restaurar desde: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.error(`Archivo no encontrado: ${filePath}`);
      return res.status(404).json({ error: "Archivo no encontrado en el servidor" });
    }

    const dbName = process.env.DB_NAME || "sgm_db";
    const dbUser = process.env.DB_USER || "postgres";
    const dbPassword = process.env.DB_PASSWORD || "postgres";
    const dbHost = process.env.DB_HOST || "localhost";
    const dbPort = process.env.DB_PORT || 5432;
    const PG_RESTORE = process.env.PG_RESTORE || "pg_restore";

    // En Linux es mejor no usar comillas en el binario si no tiene espacios
    const cmdBinary = PG_RESTORE.includes(" ") ? `"${PG_RESTORE}"` : PG_RESTORE;
    const command = `${cmdBinary} -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --clean --if-exists --no-owner --no-privileges --disable-triggers -v "${filePath}"`;

    console.log(`Ejecutando comando de restauración: ${command.replace(dbPassword, '****')}`);

    exec(command, {
      env: { ...process.env, PGPASSWORD: dbPassword }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error("Error de ejecución pg_restore:", error.message);
        console.error("Salida de error (stderr):", stderr);
        return res.status(500).json({
          error: "Error al restaurar base de datos",
          details: stderr || error.message,
        });
      }

      console.log("Restauración desde servidor completada exitosamente");
      res.json({ message: "Restauración exitosa desde el servidor" });
    });

  } catch (error) {
    console.error("Error crítico en restoreFromServer:", error);
    res.status(500).json({ 
      error: "Error interno del servidor", 
      details: error.message 
    });
  }
};