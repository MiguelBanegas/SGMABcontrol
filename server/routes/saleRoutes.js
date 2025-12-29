const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.post("/", verifyToken, saleController.createSale);
router.get("/stats", verifyToken, isAdmin, saleController.getSalesStats);
router.get("/history", verifyToken, isAdmin, saleController.getSalesHistory);
router.patch(
  "/:id/status",
  verifyToken,
  isAdmin,
  saleController.toggleSaleStatus
);

module.exports = router;
