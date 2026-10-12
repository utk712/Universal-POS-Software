const express = require("express");
const router = express.Router();
const counterController = require("../controllers/counterController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Get active counters (any logged in user)
router.get("/", verifyToken, counterController.getAllCounters);

// Counter admin management
router.post("/", verifyToken, isAdmin, counterController.addCounter);
router.put("/:id", verifyToken, isAdmin, counterController.updateCounter);
router.delete("/:id", verifyToken, isAdmin, counterController.deleteCounter);

module.exports = router;

