const express = require("express");
const router = express.Namespace ? express.Namespace() : express.Router();
const productController = require("../controllers/productController");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// Configuración de Multer para imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.get("/", productController.getAllProducts);
router.get("/stats", productController.getProductStats);
router.get("/top-sellers", productController.getTopSellers);
router.get("/sku/:sku", productController.getProductBySku);
router.post("/", upload.single("image"), productController.createProduct);
router.put("/:id", upload.single("image"), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.get("/categories", productController.getCategories);

module.exports = router;
