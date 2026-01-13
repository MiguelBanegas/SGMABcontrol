const db = require("../db");
const fs = require("fs");
const path = require("path");

async function linkImages() {
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

  console.log(`Archivos en uploads: ${files.length}`);
  console.log(`Productos en base de datos: ${products.length}`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    // 1. Prioridad: Coincidencia exacta (SKU.jpg o SKU.png)
    let matchedFile = files.find(
      (f) =>
        f.toLowerCase() === product.sku.toLowerCase() + ".jpg" ||
        f.toLowerCase() === product.sku.toLowerCase() + ".png"
    );

    // 2. Prioridad: Si no hay exacta, buscar si el SKU es parte del nombre
    if (!matchedFile) {
      matchedFile = files.find((f) =>
        f.toLowerCase().includes(product.sku.toLowerCase())
      );
    }

    if (matchedFile) {
      const imageUrl = `/uploads/${matchedFile}`;

      await db("products")
        .where({ id: product.id })
        .update({ image_url: imageUrl });

      updatedCount++;
      if (updatedCount % 50 === 0) process.stdout.write(".");
    } else {
      skippedCount++;
    }
  }

  console.log(`\n\nResultados de vinculación:`);
  console.log(`- Productos actualizados con imagen: ${updatedCount}`);
  console.log(`- Productos sin coincidencias: ${skippedCount}`);

  process.exit(0);
}

linkImages().catch((err) => {
  console.error("Fallo la vinculación:", err);
  process.exit(1);
});
