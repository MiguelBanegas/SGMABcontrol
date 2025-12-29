const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, customerController.getAllCustomers);
router.post("/", verifyToken, customerController.createCustomer);
router.put("/:id", verifyToken, customerController.updateCustomer);
router.delete("/:id", verifyToken, customerController.deleteCustomer);

module.exports = router;
