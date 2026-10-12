const db = require("../config/db");

// Get all customers
exports.getAllCustomers = (req, res) => {
  const { search } = req.query;
  let query = "SELECT * FROM customers";
  let params = [];

  if (search) {
    query += " WHERE name LIKE ? OR phone LIKE ?";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY customer_id DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("GET CUSTOMERS ERROR:", err);
      return res.status(500).json({ message: "Error fetching customers" });
    }
    res.json(rows);
  });
};

// Add customer
exports.addCustomer = (req, res) => {
  const { name, phone, email, address, gstin } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Customer name and phone number required" });
  }

  const cleanPhone = phone.trim();
  const cleanName = name.trim();

  db.run(
    "INSERT INTO customers (name, phone, email, address, gstin) VALUES (?, ?, ?, ?, ?)",
    [cleanName, cleanPhone, email || "", address || "", gstin || ""],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          db.get("SELECT * FROM customers WHERE phone = ?", [cleanPhone], (qErr, existing) => {
            if (existing) {
              return res.json({
                message: "Customer already registered ✅",
                customer_id: existing.customer_id,
                customer: existing
              });
            }
            return res.status(400).json({ message: "Customer with this phone number already exists" });
          });
          return;
        }
        return res.status(500).json({ message: "Failed to add customer" });
      }

      const newCust = {
        customer_id: this.lastID,
        name: cleanName,
        phone: cleanPhone,
        email: email || "",
        address: address || "",
        gstin: gstin || "",
        khata_balance: 0
      };

      res.json({
        message: "Customer added successfully ✅",
        customer_id: this.lastID,
        customer: newCust
      });
    }
  );
};

// Get single customer with Khata transactions
exports.getCustomerDetails = (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM customers WHERE customer_id = ?", [id], (err, customer) => {
    if (err || !customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    db.all(
      "SELECT * FROM khata_transactions WHERE customer_id = ? ORDER BY transaction_id DESC",
      [id],
      (tErr, transactions) => {
        res.json({
          customer,
          transactions: transactions || []
        });
      }
    );
  });
};

// Record Khata Payment Collection (Paying back credit)
exports.collectKhataPayment = (req, res) => {
  const { customer_id, amount, note } = req.body;

  if (!customer_id || !amount) {
    return res.status(400).json({ message: "Customer ID and amount are required" });
  }

  const payAmt = Number(amount);

  db.serialize(() => {
    // Reduce debt
    db.run(
      "UPDATE customers SET khata_balance = khata_balance - ? WHERE customer_id = ?",
      [payAmt, customer_id],
      (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to update customer balance" });
        }

        // Record credit transaction
        db.run(
          "INSERT INTO khata_transactions (customer_id, amount, type, note) VALUES (?, ?, 'credit', ?)",
          [customer_id, payAmt, note || "Khata payment collected"],
          function (kErr) {
            if (kErr) {
              return res.status(500).json({ message: "Failed to log payment transaction" });
            }
            res.json({ message: "Payment recorded successfully! Balance updated. ✅" });
          }
        );
      }
    );
  });
};

