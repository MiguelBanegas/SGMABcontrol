const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const PENDING_DIR = path.join(__dirname, "../spooler/pending");
const PROCESSING_DIR = path.join(__dirname, "../spooler/processing");
const COMPLETED_DIR = path.join(__dirname, "../spooler/completed");
const LOG_FILE = path.join(__dirname, "../spooler/print_log.txt");
const EDGE_PATH =
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

let isRunning = false;

function log(message) {
  const timestamp = new Date().toLocaleString();
  const entry = `[${timestamp}] ${message}\n`;
  console.log(`[Spooler] ${message}`);
  try {
    fs.appendFileSync(LOG_FILE, entry);
  } catch (e) {}
}

/**
 * Registra la impresora predeterminada para diagnóstico
 */
function logDefaultPrinter() {
  exec(
    'powershell -Command "Get-CimInstance Win32_Printer | Where-Object { $_.Default -eq $true } | Select-Object Name"',
    (error, stdout) => {
      if (stdout) {
        log(`Impresora detectada: ${stdout.trim().replace(/\n/g, " ")}`);
      } else {
        log(
          "ADVERTENCIA: No se detectó ninguna impresora predeterminada. La impresión automática fallará."
        );
      }
    }
  );
}

/**
 * Inicia el vigilante de la cola de impresión
 */
function startSpooler() {
  log("Servicio de Spooler v8 (Edge Kiosk Direct) iniciado.");
  logDefaultPrinter();

  setInterval(async () => {
    if (isRunning) return;

    try {
      if (!fs.existsSync(PENDING_DIR)) return;

      const files = fs
        .readdirSync(PENDING_DIR)
        .filter((f) => f.endsWith(".html"));

      if (files.length > 0) {
        log(`Archivos detectados: ${files.length}. Iniciando procesamiento.`);
        isRunning = true;
        for (const file of files) {
          await processJob(file);
        }
        isRunning = false;
      }
    } catch (error) {
      log(`Error en scan: ${error.message}`);
      isRunning = false;
    }
  }, 3000);
}

/**
 * Procesa un archivo individual:
 * Envía a Edge en modo Kiosk para impresión automática
 */
async function processJob(fileName) {
  const pendingPath = path.join(PENDING_DIR, fileName);
  const processingPath = path.join(PROCESSING_DIR, fileName);
  const completedPath = path.join(COMPLETED_DIR, fileName);

  return new Promise((resolve) => {
    try {
      if (fs.existsSync(pendingPath)) {
        fs.renameSync(pendingPath, processingPath);
      } else {
        return resolve();
      }

      log(`Enviando a impresión automática: ${fileName}`);

      // Comando Edge Kiosk:
      // --headless: Ejecutar sin ventana visible (si es posible con kiosk)
      // --kiosk: Modo pantalla completa
      // --kiosk-printing: Salta el diálogo de impresión y va directo a la predeterminada
      // Nota: Si headless + kiosk no se llevan bien, usaremos una ventana mínima.
      const command = `"${EDGE_PATH}" --kiosk --kiosk-printing --no-sandbox "file:///${processingPath}"`;

      const edgeProcess = exec(command, (error) => {
        if (error && error.code !== 0 && !error.killed) {
          log(`Error en proceso Edge para ${fileName}: ${error.message}`);
        }
      });

      // Esperar 10 segundos para que se complete la impresión y luego matar el proceso de Edge
      // ya que el modo kiosk mantiene la ventana abierta.
      setTimeout(() => {
        try {
          edgeProcess.kill();
          log(`Proceso de impresión finalizado para ${fileName}.`);
          if (fs.existsSync(processingPath)) {
            fs.renameSync(processingPath, completedPath);
          }
        } catch (e) {
          log(`Error al finalizar trabajo: ${e.message}`);
        }
        resolve();
      }, 10000);
    } catch (e) {
      log(`Error crítico: ${e.message}`);
      resolve();
    }
  });
}

module.exports = { startSpooler };
