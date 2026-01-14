const express = require("express");
const router = express.Router();
const cashRegisterController = require("../controllers/cashRegisterController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.post("/open", verifyToken, cashRegisterController.openCashRegister);
router.post(
  "/:id/close",
  verifyToken,
  cashRegisterController.closeCashRegister
);
router.get(
  "/current",
  verifyToken,
  cashRegisterController.getCurrentCashRegister
);
router.post("/movement", verifyToken, cashRegisterController.addCashMovement);
router.get(
  "/history",
  verifyToken,
  cashRegisterController.getCashRegisterHistory
);
router.get("/:id", verifyToken, cashRegisterController.getCashRegisterDetail);

module.exports = router;
