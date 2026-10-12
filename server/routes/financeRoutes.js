const express = require("express");
const router = express.Router();
const financeController = require("../controllers/financeController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

router.use(verifyToken);

// Shift end counter cash audit
router.post("/cash-closing", financeController.performCashClosing);

// Tally Prime XML Export
router.get("/tally-xml", isAdmin, financeController.getTallyXmlExport);

// GSTR-1 CA-Ready CSV Export
router.get("/gstr1-export", isAdmin, financeController.getGstr1Export);

// GST Return Reports (GSTR-1, GSTR-3B, HSN)
router.get("/gst-reports", isAdmin, financeController.getGstReports);

// Live Profit & Loss Dashboard
router.get("/pnl", isAdmin, financeController.getPnlSummary);

// Anti-Fraud Audit Trail Logs
router.get("/audit-logs", isAdmin, financeController.getAuditLogs);
router.delete("/audit-logs/:id", isAdmin, financeController.deleteAuditLog);
router.delete("/audit-logs", isAdmin, financeController.clearAllAuditLogs);

// Shift Cash Closings History & Delete
router.get("/cash-closings", isAdmin, financeController.getCashClosings);
router.delete("/cash-closings/:id", isAdmin, financeController.deleteCashClosing);

// Financial & Tax Preferences (GST Slabs, Tally Ledgers, Drawer Float)
router.get("/settings", isAdmin, financeController.getFinancialSettings);
router.put("/settings", isAdmin, financeController.updateFinancialSettings);

module.exports = router;

