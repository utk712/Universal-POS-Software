const express = require("express");
const router = express.Router();

const {
  login,
  registerAdmin,
  checkAdmin,
  logout,
  heartbeat
} = require("../controllers/authController");

// 🔐 Login
router.post("/login", login);

// 🚪 Logout
router.post("/logout", logout);

// 💓 Heartbeat / Keep-alive
router.post("/heartbeat", heartbeat);

// 🆕 Register Admin (first time setup)
router.post("/register-admin", registerAdmin);

// 🔍 Check if admin exists
router.get("/check-admin", checkAdmin);

module.exports = router;