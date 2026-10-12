const db = require("../config/db");
const bcrypt = require("bcrypt");
const { SALT_ROUNDS } = require("../config/authConfig");

// Add Cashier / Employee
exports.addEmployee = async (req, res) => {
  const { name, email, password, role = "cashier" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const now = new Date().toISOString();

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    db.run(
      "INSERT INTO users (name, email, password, role, status, is_online, created_at) VALUES (?, ?, ?, ?, 'active', 0, ?)",
      [name.trim(), sanitizedEmail, hash, role, now],
      function (err) {
        if (err) {
          if (err.message && err.message.includes("UNIQUE")) {
            return res.status(400).json({ message: "User with this email already exists" });
          }
          return res.status(500).json({ message: "Failed to create user account" });
        }

        res.json({
          message: "Employee account created successfully! ✅",
          user_id: this.lastID,
          user: {
            user_id: this.lastID,
            name: name.trim(),
            email: sanitizedEmail,
            role,
            status: "active",
            is_online: 0,
            created_at: now
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error encrypting password" });
  }
};

// Get all staff users with live status and sales metrics
exports.getAllUsers = (req, res) => {
  const sql = `
    SELECT 
      u.user_id, 
      u.name, 
      u.email, 
      u.role, 
      COALESCE(u.status, 'active') as status,
      u.is_online,
      u.last_login,
      u.last_active,
      u.login_ip,
      u.created_at,
      COUNT(o.order_id) as total_orders,
      COALESCE(SUM(o.net_amount), 0) as total_sales_amount
    FROM users u
    LEFT JOIN orders o ON u.user_id = o.cashier_id
    GROUP BY u.user_id
    ORDER BY u.role ASC, u.user_id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("GET USERS ERROR:", err);
      return res.status(500).json({ message: "Failed to fetch user accounts" });
    }

    const now = Date.now();
    const formatted = (rows || []).map((user) => {
      let isLiveOnline = false;
      if (user.is_online === 1) {
        if (user.last_active) {
          const diffMs = now - new Date(user.last_active).getTime();
          // Active within the last 5 minutes
          isLiveOnline = diffMs < 5 * 60 * 1000;
        } else {
          isLiveOnline = true;
        }
      }

      return {
        ...user,
        is_online: isLiveOnline ? 1 : 0,
        total_orders: Number(user.total_orders) || 0,
        total_sales_amount: Number(Number(user.total_sales_amount || 0).toFixed(2))
      };
    });

    res.json(formatted);
  });
};

// Toggle user status (Active / Disabled)
exports.toggleUserStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["active", "disabled"].includes(status)) {
    return res.status(400).json({ message: "Valid status ('active' or 'disabled') is required" });
  }

  // Prevent disabling admin
  db.get("SELECT role FROM users WHERE user_id = ?", [id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin" && status === "disabled") {
      return res.status(400).json({ message: "Admin account cannot be deactivated" });
    }

    const isOnline = status === "disabled" ? 0 : undefined;
    const query = status === "disabled"
      ? "UPDATE users SET status = ?, is_online = 0 WHERE user_id = ?"
      : "UPDATE users SET status = ? WHERE user_id = ?";
    const params = status === "disabled" ? [status, id] : [status, id];

    db.run(query, params, function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ message: "Failed to update user status" });
      }

      res.json({ message: `Account status updated to ${status} ✅`, user_id: id, status });
    });
  });
};

// Delete user account
exports.deleteUser = (req, res) => {
  const { id } = req.params;

  db.get("SELECT role FROM users WHERE user_id = ?", [id], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin account cannot be deleted" });
    }

    db.run("DELETE FROM users WHERE user_id = ?", [id], function (delErr) {
      if (delErr) {
        return res.status(500).json({ message: "Failed to delete user" });
      }

      res.json({ message: "User account deleted successfully ✅" });
    });
  });
};

// Reset cashier password
exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ message: "Password must be at least 4 characters" });
  }

  try {
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    db.run("UPDATE users SET password = ? WHERE user_id = ?", [hash, id], function (err) {
      if (err) {
        return res.status(500).json({ message: "Failed to reset password" });
      }
      res.json({ message: "Password updated successfully ✅" });
    });
  } catch {
    res.status(500).json({ message: "Encryption error" });
  }
};