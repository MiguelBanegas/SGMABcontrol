const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.post("/", verifyToken, purchaseController.createPurchase);
router.get(
  "/report",
  verifyToken,
  isAdmin,
  purchaseController.getPurchasesReport
);
router.get("/:id", verifyToken, isAdmin, purchaseController.getPurchaseDetail);

module.exports = router;
