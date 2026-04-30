const db = require("./db");

async function testContainerUpdate() {
  try {
    // Listar todos los productos
    const products = await db("products")
      .select("id", "name", "sku", "is_container")
      .limit(5);

    console.log("=== PRODUCTOS DISPONIBLES ===");
    products.forEach((p) => {
      console.log(
        `ID: ${p.id} | SKU: ${p.sku} | Nombre: ${p.name} | is_container: ${p.is_container}`,
      );
    });

    if (products.length > 0) {
      const testProductId = products[0].id;
      console.log(`\n=== ACTUALIZANDO PRODUCTO ID ${testProductId} ===`);

      // Actualizar el primer producto como envase
      await db("products")
        .where("id", testProductId)
        .update({ is_container: true });

      // Verificar la actualización
      const updated = await db("products").where("id", testProductId).first();

      console.log("Producto actualizado:");
      console.log(
        `ID: ${updated.id} | Nombre: ${updated.name} | is_container: ${updated.is_container}`,
      );

      if (updated.is_container) {
        console.log("\n✅ La actualización funcionó correctamente!");
      } else {
        console.log("\n❌ La actualización NO funcionó");
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testContainerUpdate();
