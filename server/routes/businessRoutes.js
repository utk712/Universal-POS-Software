const express = require("express");
const router = express.Router();
const businessController = require("../controllers/businessController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Public endpoint so Layout, Login, and POS can always read store profile & active vertical
router.get("/settings", businessController.getBusinessSettings);

// Protected endpoints for updating settings
router.put("/settings", verifyToken, isAdmin, businessController.updateBusinessSettings);
router.put("/vertical", verifyToken, isAdmin, businessController.switchVertical);

module.exports = router;

