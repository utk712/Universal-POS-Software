const db = require("../config/db");

// Get all vendors
exports.getAllVendors = (req, res) => {
  db.all("SELECT * FROM vendors ORDER BY vendor_id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to load vendors" });
    res.json(rows);
  });
};

// Add vendor
exports.addVendor = (req, res) => {
  const { name, mobile, email, company, gstin, address } = req.body;

  if (!name || !company) {
    return res.status(400).json({ message: "Vendor name and company are required" });
  }

  db.run(
    "INSERT INTO vendors (name, mobile, email, company, gstin, address) VALUES (?, ?, ?, ?, ?, ?)",
    [name, mobile || "", email || "", company, gstin || "", address || ""],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to register vendor" });
      res.json({ message: "Supplier registered successfully! ✅", vendor_id: this.lastID });
    }
  );
};

// Record Purchase Bill from Supplier
exports.recordPurchase = (req, res) => {
  const { vendor_id, bill_no, items, paid_amount = 0, payment_terms_days = 30 } = req.body;

  if (!vendor_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Vendor ID and purchase items are required" });
  }

  let totalAmount = 0;
  const processedItems = items.map((i) => {
    const qty = Number(i.quantity) || 1;
    const cost = Number(i.purchase_cost) || 0;
    const subtotal = qty * cost;
    totalAmount += subtotal;
    return { ...i, quantity: qty, purchase_cost: cost, subtotal };
  });

  const dueAmount = totalAmount - Number(paid_amount);
  const paymentStatus = dueAmount <= 0 ? "paid" : Number(paid_amount) > 0 ? "partial" : "pending";

  db.serialize(() => {
    db.run(
      `INSERT INTO purchases (vendor_id, bill_no, total_amount, paid_amount, due_amount, payment_status, payment_terms_days) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [vendor_id, bill_no || `PUR-${Date.now()}`, totalAmount, Number(paid_amount), dueAmount, paymentStatus, payment_terms_days],
      function (err) {
        if (err) return res.status(500).json({ message: "Failed to record purchase" });

        const purchaseId = this.lastID;

        // Insert purchase items & increase product stock
        processedItems.forEach((i) => {
          db.run(
            "INSERT INTO purchase_items (purchase_id, product_id, product_name, quantity, purchase_cost, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
            [purchaseId, i.product_id || null, i.product_name, i.quantity, i.purchase_cost, i.subtotal]
          );

          if (i.product_id) {
            db.run(
              "UPDATE products SET stock_quantity = stock_quantity + ?, cost_price = ? WHERE product_id = ?",
              [i.quantity, i.purchase_cost, i.product_id]
            );
          }
        });

        // Update vendor balance due
        if (dueAmount > 0) {
          db.run("UPDATE vendors SET balance_due = balance_due + ? WHERE vendor_id = ?", [dueAmount, vendor_id]);
        }

        res.json({ message: "Purchase bill recorded & stock updated! ✅", purchase_id: purchaseId });
      }
    );
  });
};

