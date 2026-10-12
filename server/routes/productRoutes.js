const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// All product routes require valid JWT authentication
router.use(verifyToken);

router.get("/", productController.getAllProducts);
router.get("/barcode/:barcode", productController.getProductByBarcode);
router.post("/", productController.addProduct);
router.post("/bulk-import", productController.bulkImportProducts);
router.put("/:id", productController.updateProduct);
router.delete("/:id", isAdmin, productController.deleteProduct);
router.post("/add-stock", productController.addStockByScan);

module.exports = router;