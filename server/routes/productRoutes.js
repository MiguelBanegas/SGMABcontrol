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

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.get("/", verifyToken, productController.getAllProducts);
router.get("/search", verifyToken, productController.searchProducts);
router.get("/stats", verifyToken, productController.getProductStats);
router.get("/top-sellers", verifyToken, productController.getTopSellers);
router.get("/sku/:sku", verifyToken, productController.getProductBySku);

// Rutas protegidas (Solo Admin)
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("image"),
  productController.createProduct
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  productController.updateProduct
);
router.patch("/:id", verifyToken, isAdmin, productController.patchProduct);
router.delete("/:id", verifyToken, isAdmin, productController.deleteProduct);
router.post("/:id/adjust-stock", verifyToken, productController.adjustStock); // El ajuste de stock puede ser por vendedor o admin, según decidas. Lo dejo con verifyToken.
router.get("/categories", verifyToken, productController.getCategories);
router.post(
  "/categories",
  verifyToken,
  isAdmin,
  productController.createCategory
);
router.delete(
  "/categories/:id",
  verifyToken,
  isAdmin,
  productController.deleteCategory
);

module.exports = router;
