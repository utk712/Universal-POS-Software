const db = require("../config/db");

// Get all active billing counters
exports.getAllCounters = (req, res) => {
  db.all("SELECT * FROM billing_counters ORDER BY counter_id ASC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch billing counters" });
    }
    res.json(rows || []);
  });
};

// Create a new billing counter
exports.addCounter = (req, res) => {
  const { counter_code, counter_name, location_notes } = req.body;

  if (!counter_code || !counter_name) {
    return res.status(400).json({ message: "Counter code and counter name are required" });
  }

  const cleanCode = counter_code.trim().toUpperCase();

  db.run(
    "INSERT INTO billing_counters (counter_code, counter_name, location_notes) VALUES (?, ?, ?)",
    [cleanCode, counter_name, location_notes || ""],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({ message: `Counter code '${cleanCode}' already exists` });
        }
        return res.status(500).json({ message: "Failed to add billing counter" });
      }
      res.json({
        message: "Billing counter added successfully ✅",
        counter_id: this.lastID,
        counter_code: cleanCode,
        counter_name
      });
    }
  );
};

// Update counter details or active status
exports.updateCounter = (req, res) => {
  const { id } = req.params;
  const { counter_name, location_notes, is_active } = req.body;

  db.run(
    "UPDATE billing_counters SET counter_name = COALESCE(?, counter_name), location_notes = COALESCE(?, location_notes), is_active = COALESCE(?, is_active) WHERE counter_id = ?",
    [counter_name, location_notes, is_active, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to update counter" });
      }
      res.json({ message: "Counter updated successfully ✅" });
    }
  );
};

// Delete counter by ID
exports.deleteCounter = (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM billing_counters WHERE counter_id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ message: "Failed to delete counter" });
    }
    res.json({ message: "Counter deleted / undone successfully 🗑️" });
  });
};

