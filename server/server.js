const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// =====================
// 🔥 FIXED BASE PATH (Electron Safe)
// =====================
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";

const basePath = isDev
  ? process.cwd()
  : path.dirname(process.execPath);

// =====================
// 🔥 FIXED DB PATH
// =====================
process.env.DB_PATH = path.join(basePath, "database", "data.db");

console.log("🔥 FINAL DB PATH:", process.env.DB_PATH);

// =====================
// 🔹 MIDDLEWARES
// =====================
app.use(cors());
app.use(express.json());

// =====================
// 🔥 IMPORT DATABASE
// =====================
const db = require("./config/db");

// =====================
// 🔥 BACKUP FUNCTION
// =====================
function backupDatabase() {
  try {
    const dbFile = db.filename;

    if (!fs.existsSync(dbFile)) return;

    const backupDir = path.join(basePath, "backup");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

    fs.copyFileSync(dbFile, backupPath);

    console.log("✅ Backup created:", backupPath);

  } catch (err) {
    console.log("❌ Backup failed:", err);
  }
}

// =====================
// 🔹 TEST ROUTE
// =====================
app.get("/", (req, res) => {
  res.send("✅ Server running successfully");
});

// =====================
// 🔹 CHECK ADMIN ROUTE
// =====================
app.get("/api/check-admin", (req, res) => {
  res.json({ exists: true });
});

// =====================
// 🔹 BACKUP & RESTORE ROUTES
// =====================
app.get("/api/backup", (req, res) => {
  backupDatabase();
  res.json({ message: "Backup created" });
});

app.get("/api/system/backup/download", (req, res) => {
  const dbFile = process.env.DB_PATH || path.join(basePath, "database", "data.db");
  if (!fs.existsSync(dbFile)) {
    return res.status(404).json({ message: "Database file not found" });
  }
  const dateStr = new Date().toISOString().split("T")[0];
  res.download(dbFile, `VyaparFlow_Backup_${dateStr}.db`);
});

// =====================
// 🔹 ROUTES IMPORT
// =====================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const salesRoutes = require("./routes/salesRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const businessRoutes = require("./routes/businessRoutes");
const customerRoutes = require("./routes/customerRoutes");
const financeRoutes = require("./routes/financeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const counterRoutes = require("./routes/counterRoutes");

// Initialize Database schema
require("./models/initDB");

// =====================
// 🔹 ROUTES USE
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/counters", counterRoutes);

// =====================
// 🔹 ERROR HANDLING
// =====================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    message: "Internal Server Error",
  });
});

// =====================
// 🔹 GLOBAL ERROR LOGGING
// =====================
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

// =====================
// 🔥 AUTO BACKUP (EVERY 1 HOUR)
// =====================
setInterval(backupDatabase, 60 * 60 * 1000);

// =====================
// 🔥 BACKUP ON EXIT
// =====================
process.on("SIGINT", () => {
  console.log("🔻 Closing server...");
  backupDatabase();
  process.exit();
});

// =====================
// 🔹 START SERVER
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "127.0.0.1", () => {
  console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);

  // ✅ CRITICAL: Notify Electron that backend is ready
  if (process.send) {
    process.send("READY");
  }
});