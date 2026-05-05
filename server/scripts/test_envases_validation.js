const db = require("../db");
const saleController = require("../controllers/saleController");

async function runTest() {
  console.log("=== INICIANDO PRUEBA DE VALIDACIÓN DE ENVASES ===");

  try {
    // 1. Obtener un negocio y usuario válido
    const anyProduct = await db("products").first();
    if (!anyProduct) {
        console.error("No hay productos en la base de datos para realizar la prueba.");
        process.exit(1);
    }
    const business_id = anyProduct.business_id;
    const user = await db("users").where({ business_id }).first();

    // 2. Buscar un producto que sea envase
    let container = await db("products")
      .where({ is_container: true, business_id })
      .first();
    
    let createdContainer = false;
    if (!container) {
      console.log("No se encontró un envase, creando uno temporal...");
      const [newContainer] = await db("products").insert({
        name: "Envase de Prueba",
        sku: "TEST-ENV-" + Date.now(),
        price_sell: 100,
        is_container: true,
        business_id: business_id,
        stock: 10
      }).returning("*");
      container = newContainer;
      createdContainer = true;
    }

    // 3. Buscar al Consumidor Final
    let genericCustomer = await db("customers")
      .where({ business_id })
      .where((builder) => {
        builder.whereRaw("LOWER(name) LIKE ?", ["%cons. final%"])
               .orWhereRaw("LOWER(name) LIKE ?", ["%consumidor final%"]);
      })
      .first();

    let createdCustomer = false;
    if (!genericCustomer) {
      console.log("No se encontró Consumidor Final, creando uno temporal...");
      const [newCustomer] = await db("customers").insert({
        name: "Consumidor Final TEST",
        business_id: business_id
      }).returning("*");
      genericCustomer = newCustomer;
      createdCustomer = true;
    }

    console.log(`Usando Producto: ${container.name} (is_container: ${container.is_container})`);
    console.log(`Usando Cliente: ${genericCustomer.name}`);

    // 4. Simular request
    const req = {
      body: {
        id: "test-sale-" + Date.now(),
        items: [{ product_id: container.id, quantity: 1 }],
        customer_id: genericCustomer.id,
        payment_method: "Efectivo",
        amount_paid: 100,
        change_given: 0,
        debt_amount: 0
      },
      user: {
        id: user.id,
        business_id: business_id
      },
      app: {
        get: () => ({ emit: () => {} }) // Mock socket.io
      }
    };

    const res = {
      statusCode: 200,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.data = data;
        return this;
      }
    };

    // 5. Ejecutar validación (llamando a la función del controlador)
    console.log("\nEjecutando createSale...");
    await saleController.createSale(req, res);

    console.log("Resultado Status:", res.statusCode);
    console.log("Resultado Mensaje:", res.data ? res.data.message : "N/A");

    if (res.statusCode === 400 && res.data.message.includes("No se pueden prestar envases")) {
      console.log("\n✅ PRUEBA EXITOSA: La validación bloqueó la venta correctamente.");
    } else {
      console.log("\n❌ PRUEBA FALLIDA: La validación no funcionó como se esperaba.");
    }

    // Limpieza si creamos datos temporales
    if (createdContainer) {
      await db("products").where({ id: container.id }).delete();
      console.log("Producto temporal eliminado.");
    }
    if (createdCustomer) {
      await db("customers").where({ id: genericCustomer.id }).delete();
      console.log("Cliente temporal eliminado.");
    }

  } catch (error) {
    console.error("\n❌ ERROR DURANTE LA PRUEBA:", error);
  } finally {
    await db.destroy();
    process.exit(0);
  }
}

runTest();
