const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const settingsController = require("../controllers/settingsController");

router.get("/", verifyToken, settingsController.getSettings);
router.put("/", verifyToken, isAdmin, settingsController.updateSetting);

module.exports = router;
