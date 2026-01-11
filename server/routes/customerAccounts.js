const express = require("express");
const router = express.Router();
const customerAccountController = require("../controllers/customerAccountController");
const { verifyToken } = require("../middleware/authMiddleware");

// Obtener balances de todos los clientes
router.get(
  "/balances",
  verifyToken,
  customerAccountController.getCustomerBalances
);

// Obtener transacciones de un cliente
router.get(
  "/:id/transactions",
  verifyToken,
  customerAccountController.getCustomerTransactions
);

// Registrar pago
router.post(
  "/:id/payments",
  verifyToken,
  customerAccountController.recordPayment
);

module.exports = router;
