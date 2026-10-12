const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const { verifyToken } = require("../middleware/authMiddleware");

// Require authentication for sales operations
router.use(verifyToken);

// Multi-item checkout
router.post("/checkout", salesController.checkoutOrder);

// Order history & invoice details
router.get("/history", salesController.getOrderHistory);
router.get("/invoice/:id", salesController.getInvoiceDetails);

// Legacy single-item sale
router.post("/", salesController.saveSale);

// Delete / Void an invoice & restore stock
router.delete("/:id", salesController.deleteOrder);

module.exports = router;