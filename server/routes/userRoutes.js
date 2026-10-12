const express = require("express");
const router = express.Router();

const {
  addEmployee,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  resetPassword
} = require("../controllers/userController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// 👥 Get all staff accounts (with live online & sales data)
router.get("/", verifyToken, isAdmin, getAllUsers);

// ➕ Add new staff / cashier account
router.post("/add-employee", verifyToken, isAdmin, addEmployee);

// 🔄 Toggle active/disabled status
router.patch("/:id/status", verifyToken, isAdmin, toggleUserStatus);

// 🔑 Reset password
router.post("/:id/reset-password", verifyToken, isAdmin, resetPassword);

// 🗑️ Delete staff account
router.delete("/:id", verifyToken, isAdmin, deleteUser);

module.exports = router;