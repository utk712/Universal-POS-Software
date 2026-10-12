const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 📊 Dashboard stats
router.get("/", (req, res) => {
  db.get(`
    SELECT 
      (SELECT SUM(total_amount) FROM sales WHERE DATE(date_time)=DATE('now')) AS today_sales,
      (SELECT COUNT(*) FROM sales) AS total_orders,
      (SELECT COUNT(*) FROM products WHERE stock_quantity < 5) AS low_stock
  `, [], (err, row) => {

    if (err) {
      console.log("Dashboard error:", err);
      return res.status(500).json({ message: "Dashboard error" });
    }

    res.json({
      today_sales: row.today_sales || 0,
      total_orders: row.total_orders || 0,
      low_stock: row.low_stock || 0
    });
  });
});

module.exports = router;