const { migrate } = require("../migrate_backup");

exports.runMigration = async (req, res) => {
  try {
    console.log("Iniciando migración desde API...");

    // Ejecutar migración con callback de progreso
    const result = await migrate((message, percentage) => {
      // En una implementación real, podrías usar WebSockets para enviar progreso en tiempo real
      console.log(`[${percentage}%] ${message}`);
    });

    if (result.success) {
      res.json({
        success: true,
        message: "Migración completada exitosamente",
        stats: result.stats,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        stats: result.stats,
      });
    }
  } catch (error) {
    console.error("Error en runMigration:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getMigrationStatus = async (req, res) => {
  const knex = require("knex")(require("../knexfile").development);

  try {
    const stats = {
      categories: await knex("categories").count("* as count").first(),
      products: await knex("products").count("* as count").first(),
      customers: await knex("customers").count("* as count").first(),
      sales: await knex("sales").count("* as count").first(),
      saleItems: await knex("sale_items").count("* as count").first(),
    };

    res.json({
      success: true,
      stats: {
        categories: parseInt(stats.categories.count),
        products: parseInt(stats.products.count),
        customers: parseInt(stats.customers.count),
        sales: parseInt(stats.sales.count),
        saleItems: parseInt(stats.saleItems.count),
      },
    });
  } catch (error) {
    console.error("Error en getMigrationStatus:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    await knex.destroy();
  }
};
