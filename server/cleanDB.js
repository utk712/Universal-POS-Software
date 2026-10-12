const fs = require("fs");
const path = require("path");

const dbPath = process.env.DB_PATH || path.join(__dirname, "database", "data.db");

console.log("🧹 Cleaning database file at:", dbPath);

// Delete data.db file if exists
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log("🗑️ Old database file deleted successfully.");
  } catch (err) {
    console.error("❌ Error deleting db file:", err);
  }
} else {
  console.log("ℹ️ No existing database file found.");
}

// Re-initialize fresh database schema
process.env.DB_PATH = dbPath;
require("./models/initDB");

console.log("✨ Database cleaned and fresh schema initialized! Ready for first-time use. ✅");

