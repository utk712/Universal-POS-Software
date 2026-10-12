const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const db = require("../config/db");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Enable verifyToken on report routes
router.use(verifyToken);

// 📊 Excel Report Exports
router.get("/excel/sales", isAdmin, reportController.exportSalesReportExcel);
router.get("/excel/gst", isAdmin, reportController.exportGstReportExcel);
router.get("/excel/inventory", isAdmin, reportController.exportInventoryExcel);
router.get("/excel/khata", isAdmin, reportController.exportKhataExcel);

// 📊 Daily Summary API
router.get("/daily", (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) AS total_sales,
      COALESCE(SUM(net_amount), 0) AS total_revenue
     FROM orders
     WHERE DATE(date_time) = DATE('now')`,
    [],
    (err, row) => {
      if (err) return res.status(500).json(err);
      res.json(row || { total_sales: 0, total_revenue: 0 });
    }
  );
});

// 📊 Monthly Summary API
router.get("/monthly", (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) AS total_sales,
      COALESCE(SUM(net_amount), 0) AS total_revenue
     FROM orders
     WHERE strftime('%Y-%m', date_time) = strftime('%Y-%m', 'now')`,
    [],
    (err, row) => {
      if (err) return res.status(500).json(err);
      res.json(row || { total_sales: 0, total_revenue: 0 });
    }
  );
});

// 🔥 Dashboard API
router.get("/dashboard", (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) AS total_orders,
      COALESCE(SUM(net_amount), 0) AS total_revenue
     FROM orders
     WHERE DATE(date_time) = DATE('now')`,
    [],
    (err, row) => {
      if (err) return res.status(500).json(err);

      db.get(
        `SELECT COUNT(*) AS low_stock FROM products WHERE stock_quantity <= 5 AND is_active = 1`,
        [],
        (err2, stockRow) => {
          if (err2) return res.status(500).json(err2);

          res.json({
            todaySales: row ? row.total_revenue || 0 : 0,
            totalOrders: row ? row.total_orders || 0 : 0,
            lowStock: stockRow ? stockRow.low_stock || 0 : 0
          });
        }
      );
    }
  );
});

module.exports = router;