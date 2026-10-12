const db = require("../config/db");

// Get all expenses
exports.getAllExpenses = (req, res) => {
  db.all("SELECT * FROM expenses ORDER BY expense_id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to load expenses" });
    res.json(rows);
  });
};

// Add expense
exports.addExpense = (req, res) => {
  const { category = "General", amount, payment_method = "cash", note = "" } = req.body;
  const cashierId = req.user ? req.user.id : null;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ message: "Valid expense amount is required" });
  }

  db.run(
    "INSERT INTO expenses (category, amount, payment_method, note, cashier_id) VALUES (?, ?, ?, ?, ?)",
    [category, Number(amount), payment_method, note, cashierId],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to log expense" });

      res.json({
        message: "Expense logged successfully! ✅",
        expense_id: this.lastID
      });
    }
  );
};

// Delete expense
exports.deleteExpense = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM expenses WHERE expense_id = ?", [id], function (err) {
    if (err) {
      console.error("DELETE EXPENSE ERROR:", err);
      return res.status(500).json({ message: "Failed to delete expense record" });
    }
    res.json({ message: "Expense record deleted successfully 🗑️", deleted_id: id });
  });
};

