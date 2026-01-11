const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.post("/", verifyToken, saleController.createSale);
router.get("/stats", verifyToken, isAdmin, saleController.getSalesStats);
router.get(
  "/product-stats/:productId",
  verifyToken,
  saleController.getProductSalesStats
);
router.get("/history", verifyToken, isAdmin, saleController.getSalesHistory);
router.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  saleController.toggleSaleStatus
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
  pendingSalesController.getAllPendingSales
);
router.post(
  "/pending-multiple",
  verifyToken,
  pendingSalesController.createPendingSale
);
router.put(
  "/pending-multiple/:id",
  verifyToken,
  pendingSalesController.updatePendingSale
);
router.delete(
  "/pending-multiple/:id",
  verifyToken,
  pendingSalesController.deletePendingSale
);

// Ruta para obtener ventas del vendedor
router.get("/my-sales", verifyToken, saleController.getMySales);

router.get("/:id", verifyToken, saleController.getSaleDetail);

module.exports = router;
