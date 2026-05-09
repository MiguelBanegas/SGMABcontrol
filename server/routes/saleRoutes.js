const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const {
  validateQueryParams,
  sanitizeSearchParams,
  validators,
} = require("../middleware/queryValidator");

router.post("/", verifyToken, saleController.createSale);
router.get("/stats", verifyToken, isAdmin, saleController.getSalesStats);
router.get(
  "/product-stats/:productId",
  verifyToken,
  saleController.getProductSalesStats,
);
router.get(
  "/product-evolution/:productId",
  verifyToken,
  saleController.getProductEvolutionHistory,
);
router.get(
  "/products-report",
  verifyToken,
  isAdmin,
  saleController.getProductsReport,
);
router.get(
  "/history",
  verifyToken,
  isAdmin,
  sanitizeSearchParams(),
  validateQueryParams({
    date: validators.date,
    seller: (value) => validators.string(value, 80) && validators.safe(value),
    customer: (value) => validators.string(value, 80) && validators.safe(value),
    payment: (value) => validators.string(value, 50) && validators.safe(value),
    status: (value) => validators.string(value, 50) && validators.safe(value),
  }),
  saleController.getSalesHistory,
);
router.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  saleController.toggleSaleStatus,
);

// Rutas para ventas en progreso (sistema antiguo - una sola venta)
router.get("/pending", verifyToken, saleController.getPendingSale);
router.post("/pending", verifyToken, saleController.savePendingSale);
router.delete("/pending", verifyToken, saleController.clearPendingSale);

// Rutas para ventas múltiples (sistema nuevo - múltiples ventas)
const pendingSalesController = require("../controllers/pendingSalesController");
router.get(
  "/pending-multiple",
  verifyToken,
  pendingSalesController.getAllPendingSales,
);
router.post(
  "/pending-multiple",
  verifyToken,
  pendingSalesController.createPendingSale,
);
router.put(
  "/pending-multiple/:id",
  verifyToken,
  pendingSalesController.updatePendingSale,
);
router.delete(
  "/pending-multiple/:id",
  verifyToken,
  pendingSalesController.deletePendingSale,
);

// Ruta para obtener ventas del vendedor
router.get("/my-sales", verifyToken, saleController.getMySales);
router.put("/:id", verifyToken, saleController.updateSale);
router.get("/:id", verifyToken, saleController.getSaleDetail);

module.exports = router;
