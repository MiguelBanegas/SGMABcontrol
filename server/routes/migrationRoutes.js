const express = require("express");
const router = express.Router();
const migrationController = require("../controllers/migrationController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Ejecutar migración (solo admin)
router.post(
  "/run-migration",
  verifyToken,
  isAdmin,
  migrationController.runMigration,
);

// Obtener estado de la base de datos
router.get(
  "/migration-status",
  verifyToken,
  isAdmin,
  migrationController.getMigrationStatus,
);

module.exports = router;
