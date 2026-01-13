const db = require("../db");
const fs = require("fs");
const path = require("path");

async function diagnoseImages() {
  const uploadsDir = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    console.error("No existe la carpeta uploads");
    process.exit(1);
  }

  const files = fs
    .readdirSync(uploadsDir)
    .filter(
      (f) =>
        f.toLowerCase().endsWith(".jpg") || f.toLowerCase().endsWith(".png")
    );
  const products = await db("products").select("id", "sku", "name");

  console.log(`Archivos encontrados: ${files.length}`);
  console.log(`Productos encontrados: ${products.length}`);

  let matches = 0;
  let partialMatches = 0;
  const matchDetails = [];

  for (const product of products) {
    // 1. Exact SKU match
    const exactMatch = files.find((f) => f.startsWith(product.sku + "."));
    if (exactMatch) {
      matches++;
      matchDetails.push({
        product: product.sku,
        file: exactMatch,
        type: "exact",
      });
      continue;
    }

    // 2. Search if SKU is part of the filename (e.g. "SKUNAME.jpg")
    const partialMatch = files.find((f) => f.includes(product.sku));
    if (partialMatch) {
      partialMatches++;
      matchDetails.push({
        product: product.sku,
        file: partialMatch,
        type: "partial_sku",
      });
      continue;
    }
  }

  console.log(`\nCoincidencias exactas por SKU: ${matches}`);
  console.log(`Coincidencias parciales por SKU: ${partialMatches}`);

  if (matchDetails.length > 0) {
    console.log("\nEjemplos de coincidencias:");
    console.log(JSON.stringify(matchDetails.slice(0, 10), null, 2));
  }

  process.exit(0);
}

diagnoseImages();
