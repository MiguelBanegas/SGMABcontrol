const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.post("/", verifyToken, notificationController.createNotification);
router.get("/", verifyToken, isAdmin, notificationController.getNotifications);
router.patch(
  "/:id/read",
  verifyToken,
  isAdmin,
  notificationController.markAsRead
);

module.exports = router;
