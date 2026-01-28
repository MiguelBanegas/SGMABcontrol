const express = require("express");
const router = express.Router();
const containerController = require("../controllers/containerController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get(
  "/customer/:customerId/balances",
  verifyToken,
  containerController.getCustomerBalances,
);
router.post("/record-return", verifyToken, containerController.recordReturn);
router.post(
  "/return/:customerId",
  verifyToken,
  containerController.recordReturn,
);
router.get(
  "/customer/:customerId/history",
  verifyToken,
  containerController.getTransactionHistory,
);

module.exports = router;
