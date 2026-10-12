const express = require("express");
const router = express.Router();
const vendorController = require("../controllers/vendorController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.use(verifyToken);

router.get("/", vendorController.getAllVendors);
router.post("/", vendorController.addVendor);
router.post("/purchase", isAdmin, vendorController.recordPurchase);

module.exports = router;

