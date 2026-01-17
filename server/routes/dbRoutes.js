const express = require("express");
const router = express.Router();
const dbController = require("../controllers/dbController");
const multer = require("multer");
const os = require("os");

// Configurar multer para almacenamiento temporal de archivos de restauración
const upload = multer({ dest: os.tmpdir() });

router.get("/backup", dbController.backupDatabase);
router.post("/restore", upload.single("backup"), dbController.restoreDatabase);

module.exports = router;
