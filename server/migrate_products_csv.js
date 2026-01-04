/**
 * Script de migración de productos desde CSV
 * Migra productos del archivo CSV a la base de datos
 * Solo inserta productos nuevos, omite los que ya existen
 *
 * USO:
 * - Local (modo rápido):
 *   node migrate_products_csv.js
 *
 * - Con ruta personalizada:
 *   node migrate_products_csv.js /ruta/al/archivo.csv
 *
 * - Modo BATCH (para VPS con servers activos):
 *   node migrate_products_csv.js --batch
 *   node migrate_products_csv.js /ruta/al/archivo.csv --batch
 *
 * EJEMPLO EN VPS:
 *   node migrate_products_csv.js /home/usuario/productos.csv --batch
 */

const fs = require("fs");
const path = require("path");
const knex = require("./db");

// Parsear argumentos
const args = process.argv.slice(2);
const batchMode = args.includes("--batch");
const csvArg = args.find((arg) => !arg.startsWith("--"));

// Obtener la ruta del CSV
const CSV_PATH = csvArg || path.join(__dirname, "..", "miguel - Hoja1.csv");

// Configuración del modo batch
const BATCH_SIZE = 100; // Productos por lote
const BATCH_DELAY = 1000; // Pausa entre lotes en ms (1 segundo)

// Función para pausar la ejecución
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Función para parsear una línea CSV considerando comillas
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Función para procesar un producto
async function processProduct(fields, lineNumber) {
  // Extraer código y descripción
  const code = fields[0]?.trim();
  const description = fields[1]?.trim();

  // Validar que tenemos los datos mínimos
  if (!code || !description) {
    return {
      status: "error",
      line: lineNumber,
      code: code || "SIN_CODIGO",
      error: "Código o descripción vacíos",
    };
  }

  // Verificar si el producto ya existe
  const existingProduct = await knex("products").where("sku", code).first();

  if (existingProduct) {
    return {
      status: "skipped",
      code,
      description,
    };
  }

  // Insertar el nuevo producto
  await knex("products").insert({
    sku: code,
    name: description,
    price_buy: 0,
    price_sell: 0,
    stock: 0,
    category_id: null,
    description: null,
    image_url: null,
  });

  return {
    status: "inserted",
    code,
    description,
  };
}

// Función principal de migración
async function migrateProducts() {
  console.log("🚀 Iniciando migración de productos desde CSV...\n");
  console.log(`📂 Ruta del archivo CSV: ${CSV_PATH}`);
  console.log(`⚙️  Modo: ${batchMode ? "BATCH (con pausas)" : "RÁPIDO"}\n`);

  if (batchMode) {
    console.log(`📦 Tamaño de lote: ${BATCH_SIZE} productos`);
    console.log(`⏱️  Pausa entre lotes: ${BATCH_DELAY}ms\n`);
  }

  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`No se encuentra el archivo CSV en: ${CSV_PATH}`);
    }

    // Leer el archivo CSV
    const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim());

    console.log(`📄 Archivo CSV cargado: ${lines.length} líneas encontradas\n`);

    // Saltar la primera línea (encabezados)
    const dataLines = lines.slice(1);

    // Contadores para el reporte
    let inserted = 0;
    let skipped = 0;
    let errors = 0;
    const errorDetails = [];

    console.log("⏳ Procesando productos...\n");

    // Procesar cada línea
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];

      try {
        const fields = parseCSVLine(line);
        const result = await processProduct(fields, i + 2);

        if (result.status === "inserted") {
          inserted++;
          if (inserted <= 5) {
            console.log(`✅ Insertado: ${result.code} - ${result.description}`);
          }
        } else if (result.status === "skipped") {
          skipped++;
          if (skipped <= 5) {
            console.log(
              `⏭️  Omitido (ya existe): ${result.code} - ${result.description}`
            );
          }
        } else if (result.status === "error") {
          errors++;
          errorDetails.push(result);
        }

        // Modo batch: pausar cada BATCH_SIZE productos
        if (batchMode && (i + 1) % BATCH_SIZE === 0) {
          console.log(
            `\n⏸️  Pausa de ${BATCH_DELAY}ms después de ${i + 1} productos...`
          );
          await sleep(BATCH_DELAY);
        }

        // Mostrar progreso cada 1000 productos (o cada lote en modo batch)
        const progressInterval = batchMode ? BATCH_SIZE : 1000;
        if ((i + 1) % progressInterval === 0) {
          console.log(
            `\n📊 Progreso: ${i + 1}/${dataLines.length} líneas procesadas`
          );
          console.log(
            `   ✅ Insertados: ${inserted} | ⏭️  Omitidos: ${skipped} | ❌ Errores: ${errors}\n`
          );
        }
      } catch (error) {
        errors++;
        errorDetails.push({
          line: i + 2,
          code: "ERROR",
          error: error.message,
        });
      }
    }

    // Reporte final
    console.log("\n" + "=".repeat(60));
    console.log("📊 REPORTE FINAL DE MIGRACIÓN");
    console.log("=".repeat(60));
    console.log(`✅ Productos insertados:     ${inserted}`);
    console.log(`⏭️  Productos omitidos:       ${skipped} (ya existían)`);
    console.log(`❌ Errores encontrados:      ${errors}`);
    console.log(`📝 Total líneas procesadas:  ${dataLines.length}`);
    console.log("=".repeat(60));

    // Mostrar detalles de errores si los hay
    if (errorDetails.length > 0) {
      console.log("\n⚠️  DETALLES DE ERRORES:");
      errorDetails.slice(0, 10).forEach((err) => {
        console.log(`   Línea ${err.line}: ${err.code} - ${err.error}`);
      });
      if (errorDetails.length > 10) {
        console.log(`   ... y ${errorDetails.length - 10} errores más`);
      }
    }

    console.log("\n✨ Migración completada exitosamente!\n");
  } catch (error) {
    console.error("\n❌ Error fatal durante la migración:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cerrar la conexión a la base de datos
    await knex.destroy();
  }
}

// Ejecutar la migración
migrateProducts();
