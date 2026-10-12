const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// =====================
// 🔥 STRICT DB PATH (NO FALLBACK)
// =====================
if (!process.env.DB_PATH) {
  throw new Error("❌ DB_PATH not set. Server cannot start.");
}

const dbPath = process.env.DB_PATH;

// =====================
// 🔥 ENSURE FOLDER EXISTS
// =====================
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// =====================
// 🔍 DEBUG
// =====================
console.log("🔥 USING DB:", dbPath);

// =====================
// 🔗 CONNECT DATABASE
// =====================
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ DB ERROR:", err);
  } else {
    console.log("✅ Database Connected");
  }
});

module.exports = db;