import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { authFetch } from "../utils/auth";

export default function FinanceDashboard() {
  const [pnl, setPnl] = useState({});
  const [gstData, setGstData] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cashClosings, setCashClosings] = useState([]);
  const [message, setMessage] = useState("");

  // Cash Closing Modal State
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [openingCash, setOpeningCash] = useState("2000");
  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");
  const [denominations, setDenominations] = useState({
    n500: 0,
    n200: 0,
    n100: 0,
    n50: 0,
    n20: 0,
    n10: 0
  });

  // ⚙️ Financial & Tax Preferences Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("gst");
  const [finSettings, setFinSettings] = useState({
    gstin: "",
    state: "Madhya Pradesh",
    state_code: "23",
    default_gst_rate: 5,
    is_tax_inclusive: 1,
    is_composition_scheme: 0,
    tally_sales_ledger: "Sales Account",
    tally_cgst_ledger: "CGST",
    tally_sgst_ledger: "SGST",
    tally_cash_ledger: "Cash Retail Buyer",
    default_opening_cash: 2000
  });

  useEffect(() => {
    fetchPnl();
    fetchGstReports();
    fetchAuditLogs();
    fetchExpenses();
    fetchCashClosings();
    fetchFinancialSettings();
  }, []);

  const fetchFinancialSettings = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/finance/settings`);
      const data = await res.json();
      if (data) {
        setFinSettings(data);
        if (data.default_opening_cash) {
          setOpeningCash(String(data.default_opening_cash));
        }
      }
    } catch {
      console.error("Failed to load finance settings");
    }
  };

  const handleSaveFinancialSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await authFetch(`${API_URL}/api/finance/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finSettings)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Settings updated successfully! ✅");
        setShowSettingsModal(false);
        fetchFinancialSettings();
        fetchPnl();
        fetchGstReports();
      } else {
        setMessage(data.message || "Failed to update settings ❌");
      }
    } catch {
      setMessage("Server error updating settings ❌");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  const fetchPnl = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/finance/pnl`);
      const data = await res.json();
      if (data) setPnl(data);
    } catch {
      console.error("Failed to load P&L");
    }
  };

  const fetchGstReports = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/finance/gst-reports`);
      const data = await res.json();
      if (data) setGstData(data);
    } catch {
      console.error("Failed to load GST reports");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/finance/audit-logs`);
      const data = await res.json();
      if (Array.isArray(data)) setAuditLogs(data);
    } catch {
      console.error("Failed to load audit logs");
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/expenses`);
      const data = await res.json();
      if (Array.isArray(data)) setExpenses(data);
    } catch {
      console.error("Failed to load expenses");
    }
  };

  const fetchCashClosings = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/finance/cash-closings`);
      const data = await res.json();
      if (Array.isArray(data)) setCashClosings(data);
    } catch {
      console.error("Failed to load cash closings");
    }
  };

  // 🗑️ Delete Audit Log Entry
  const handleDeleteAuditLog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this audit log record?")) return;
    try {
      const res = await authFetch(`${API_URL}/api/finance/audit-logs/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Audit record deleted 🗑️");
        fetchAuditLogs();
      } else {
        setMessage(data.message || "Failed to delete audit record ❌");
      }
    } catch {
      setMessage("Server error deleting audit record ❌");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  // 🗑️ Clear All Audit Logs
  const handleClearAllAuditLogs = async () => {
    if (!window.confirm("Are you sure you want to clear ALL audit trail records?")) return;
    try {
      const res = await authFetch(`${API_URL}/api/finance/audit-logs`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "All audit records cleared 🗑️");
        fetchAuditLogs();
      } else {
        setMessage(data.message || "Failed to clear audit records ❌");
      }
    } catch {
      setMessage("Server error clearing audit logs ❌");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  // 🗑️ Delete Operating Expense
  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense record? This will update your P&L.")) return;
    try {
      const res = await authFetch(`${API_URL}/api/expenses/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Expense deleted 🗑️");
        fetchExpenses();
        fetchPnl();
      } else {
        setMessage(data.message || "Failed to delete expense ❌");
      }
    } catch {
      setMessage("Server error deleting expense ❌");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  // 🗑️ Delete Cash Closing Record
  const handleDeleteCashClosing = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shift cash closing audit?")) return;
    try {
      const res = await authFetch(`${API_URL}/api/finance/cash-closings/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Cash closing record deleted 🗑️");
        fetchCashClosings();
      } else {
        setMessage(data.message || "Failed to delete closing record ❌");
      }
    } catch {
      setMessage("Server error deleting closing record ❌");
    }
    setTimeout(() => setMessage(""), 3500);
  };

  // Denomination Auto Sum
  const calculatedPhysicalCash =
    denominations.n500 * 500 +
    denominations.n200 * 200 +
    denominations.n100 * 100 +
    denominations.n50 * 50 +
    denominations.n20 * 20 +
    denominations.n10 * 10;

  // Submit Shift Cash Closing
  const handleCashClosingSubmit = async () => {
    const cashToSubmit = actualCash ? Number(actualCash) : calculatedPhysicalCash;

    const activeCounterId = localStorage.getItem("active_counter_id") || 1;
    const activeCounterCode = localStorage.getItem("active_counter_code") || "C1";
    const activeCounterName = localStorage.getItem("active_counter_name") || "Counter 1";

    try {
      const res = await authFetch(`${API_URL}/api/finance/cash-closing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counter_id: Number(activeCounterId),
          counter_code: activeCounterCode,
          counter_name: activeCounterName,
          opening_cash: Number(openingCash),
          actual_cash: cashToSubmit,
          denominations,
          notes
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setShowClosingModal(false);
        setActualCash("");
        setNotes("");
        fetchCashClosings();
      } else {
        setMessage(data.message || "Cash closing failed ❌");
      }
    } catch {
      setMessage("Server error ❌");
    }
    setTimeout(() => setMessage(""), 4000);
  };

  // One-Click Tally XML Download
  const downloadTallyXml = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/finance/tally-xml`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tally_Sales_Import_${Date.now()}.xml`;
      a.click();
    } catch {
      alert("Failed to export Tally XML");
    }
  };

  // One-Click GSTR-1 CA-Ready CSV Download
  const downloadGstr1Csv = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/finance/gstr1-export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GSTR1_Monthly_Report_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch {
      alert("Failed to export GSTR-1 CSV");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }} className="animate-fade-in">
      
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--text-dark)" }}>
            📊 Financial Hub & Accounting Center
          </h2>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Real-time P&L statement, Tally Prime XML export, GSTR-1 returns, and Shift End Cash Audits.
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              padding: "10px 14px",
              fontSize: "13px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)"
            }}
          >
            ⚙️ Tax & Tally Settings
          </button>

          <button onClick={() => setShowClosingModal(true)} className="pos-btn-success" style={{ padding: "10px 14px", fontSize: "13px" }}>
            💵 Close Shift
          </button>

          <button onClick={downloadGstr1Csv} style={{ padding: "10px 14px", fontSize: "13px", background: "linear-gradient(135deg, #059669, #047857)", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            📥 GSTR-1 Return (CSV)
          </button>

          <button onClick={downloadTallyXml} className="pos-btn-primary" style={{ padding: "10px 14px", fontSize: "13px" }}>
            📑 Tally XML
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes("✅") ? "var(--accent-green-light)" : "var(--accent-red-light)", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "12px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
          {message}
        </div>
      )}

      {/* P&L Financial Performance Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        <div className="pos-card" style={{ padding: "16px", background: "linear-gradient(135deg, #ffffff, #eff6ff)" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary)" }}>TOTAL NET REVENUE</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "var(--text-dark)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
            ₹{pnl.revenue ? pnl.revenue.toFixed(2) : "0.00"}
          </div>
        </div>

        <div className="pos-card" style={{ padding: "16px", background: "linear-gradient(135deg, #ffffff, #fef3c7)" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#b45309" }}>COST OF GOODS SOLD (COGS)</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#92400e", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
            ₹{pnl.cogs ? pnl.cogs.toFixed(2) : "0.00"}
          </div>
        </div>

        <div className="pos-card" style={{ padding: "16px", background: "linear-gradient(135deg, #ffffff, #dcfce7)" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#15803d" }}>GROSS PROFIT ({pnl.gross_margin_pct || 0}%)</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#047857", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
            ₹{pnl.gross_profit ? pnl.gross_profit.toFixed(2) : "0.00"}
          </div>
        </div>

        <div className="pos-card" style={{ padding: "16px", background: "linear-gradient(135deg, #ffffff, #fee2e2)" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#b91c1c" }}>OPERATING EXPENSES</div>
          <div style={{ fontSize: "24px", fontWeight: "800", color: "#991b1b", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
            ₹{pnl.operating_expenses ? pnl.operating_expenses.toFixed(2) : "0.00"}
          </div>
        </div>

        <div className="pos-card" style={{ padding: "16px", background: (pnl.net_profit || 0) >= 0 ? "linear-gradient(135deg, #10b981, #059669)" : "#ef4444", color: "white" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", opacity: 0.9 }}>NET PROFIT ({pnl.net_margin_pct || 0}%)</div>
          <div style={{ fontSize: "24px", fontWeight: "800", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
            ₹{pnl.net_profit ? pnl.net_profit.toFixed(2) : "0.00"}
          </div>
        </div>
      </div>

      {/* GST Return Summary & HSN Breakdown Card */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>GST Returns & HSN Tax Summary (GSTR-1 Ready)</h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Itemized tax breakdowns for monthly filing</div>
          </div>

          <div style={{ display: "flex", gap: "12px", fontSize: "13px", fontWeight: "700" }}>
            <span style={{ padding: "4px 10px", borderRadius: "6px", background: "var(--primary-light)", color: "var(--primary-hover)" }}>
              CGST Total: ₹{gstData.cgst || 0}
            </span>
            <span style={{ padding: "4px 10px", borderRadius: "6px", background: "var(--accent-green-light)", color: "#15803d" }}>
              SGST Total: ₹{gstData.sgst || 0}
            </span>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "10px 14px" }}>HSN/SAC Code</th>
                <th style={{ padding: "10px 14px" }}>Item Description</th>
                <th style={{ padding: "10px 14px" }}>Total Qty Sold</th>
                <th style={{ padding: "10px 14px" }}>Tax Rate</th>
                <th style={{ padding: "10px 14px" }}>Total Value (₹)</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>GST Tax Collected (₹)</th>
              </tr>
            </thead>
            <tbody>
              {(gstData.hsn_summary || []).map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontWeight: "700" }}>{row.hsn_code}</td>
                  <td style={{ padding: "10px 14px", fontWeight: "600" }}>{row.product_name || "General Goods"}</td>
                  <td style={{ padding: "10px 14px" }}>{row.total_qty} {row.unit || "pcs"}</td>
                  <td style={{ padding: "10px 14px" }}>{row.tax_rate}%</td>
                  <td style={{ padding: "10px 14px", fontWeight: "700" }}>₹{row.total_val ? row.total_val.toFixed(2) : 0}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "800", color: "var(--accent-green)" }}>
                    ₹{row.total_tax ? row.total_tax.toFixed(2) : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💸 Operating Expenses & Expense Vouchers (P&L Impact) */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
              💸 Operating Expenses Ledger ({expenses.length} Records)
            </h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Items deducting from Gross Profit in your P&L Statement. Erroneous vouchers can be deleted here.
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto", maxHeight: "250px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "8px 12px" }}>Date & Time</th>
                <th style={{ padding: "8px 12px" }}>Category</th>
                <th style={{ padding: "8px 12px" }}>Payment Mode</th>
                <th style={{ padding: "8px 12px" }}>Voucher Note</th>
                <th style={{ padding: "8px 12px", textAlign: "right" }}>Amount (₹)</th>
                <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
                    No operating expenses logged yet.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.expense_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{new Date(e.date_time).toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", fontWeight: "700" }}>{e.category}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span className="badge-pill badge-blue">{e.payment_method?.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>{e.note || "N/A"}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800", color: "#dc2626" }}>
                      ₹{e.amount ? e.amount.toFixed(2) : 0}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <button
                        onClick={() => handleDeleteExpense(e.expense_id)}
                        style={{
                          padding: "4px 8px",
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "11px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px"
                        }}
                        title="Delete expense and update P&L"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💵 Counter Shift End Cash Closings Audit History */}
      {cashClosings.length > 0 && (
        <div className="pos-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
                💵 Shift Cash Closing History ({cashClosings.length})
              </h3>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Audited drawer reconciliations per cashier shift.
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto", maxHeight: "250px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "8px 12px" }}>Date & Time</th>
                  <th style={{ padding: "8px 12px" }}>Counter</th>
                  <th style={{ padding: "8px 12px" }}>Cashier</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Expected (₹)</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Actual (₹)</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Shortage / Diff (₹)</th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cashClosings.map((c) => (
                  <tr key={c.closing_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{new Date(c.closing_date).toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", fontWeight: "700" }}>{c.counter_code} ({c.counter_name})</td>
                    <td style={{ padding: "8px 12px" }}>{c.cashier_name}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "600" }}>₹{c.expected_cash?.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "700", color: "var(--primary)" }}>₹{c.actual_cash?.toFixed(2)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800", color: c.shortage_amount > 0 ? "#dc2626" : "#16a34a" }}>
                      {c.shortage_amount > 0 ? `-₹${c.shortage_amount.toFixed(2)}` : "Matched ✅"}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <button
                        onClick={() => handleDeleteCashClosing(c.closing_id)}
                        style={{
                          padding: "4px 8px",
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "11px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px"
                        }}
                        title="Delete cash closing record"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Anti-Fraud Security Audit Logs */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
              🛡️ Security & Anti-Fraud Audit Trail ({auditLogs.length})
            </h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              System audit trails and cashier activity logs
            </div>
          </div>

          {auditLogs.length > 0 && (
            <button
              onClick={handleClearAllAuditLogs}
              style={{
                padding: "6px 12px",
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
              title="Clear all audit log entries"
            >
              🗑️ Clear All Logs
            </button>
          )}
        </div>

        <div style={{ overflowX: "auto", maxHeight: "250px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "8px 12px" }}>Timestamp</th>
                <th style={{ padding: "8px 12px" }}>Staff Member</th>
                <th style={{ padding: "8px 12px" }}>Action</th>
                <th style={{ padding: "8px 12px" }}>Audit Details</th>
                <th style={{ padding: "8px 12px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
                    No audit records found.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.log_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{new Date(log.date_time).toLocaleString()}</td>
                    <td style={{ padding: "8px 12px", fontWeight: "700" }}>{log.user_name}</td>
                    <td style={{ padding: "8px 12px" }}>
                      <span className="badge-pill badge-amber">{log.action}</span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>{log.details}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <button
                        onClick={() => handleDeleteAuditLog(log.log_id)}
                        style={{
                          padding: "4px 8px",
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fca5a5",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "11px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px"
                        }}
                        title="Delete this audit record"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💵 Shift End Cash Reconciliation Audit Modal */}
      {showClosingModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "520px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-dark)" }}>
              💵 Counter Shift End Cash Audit
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block" }}>Opening Counter Cash (₹):</label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="pos-input"
                />
              </div>

              <div>
                <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block" }}>Direct Cash Total (₹):</label>
                <input
                  type="number"
                  placeholder="Or count notes below"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="pos-input"
                />
              </div>
            </div>

            <div style={{ background: "var(--surface-alt)", padding: "14px", borderRadius: "10px", marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-dark)", display: "block", marginBottom: "8px" }}>
                Physical Currency Notes Count (Auto-Sum):
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  ["n500", "₹500 Notes", 500],
                  ["n200", "₹200 Notes", 200],
                  ["n100", "₹100 Notes", 100],
                  ["n50", "₹50 Notes", 50],
                  ["n20", "₹20 Notes", 20],
                  ["n10", "₹10 Notes", 10]
                ].map(([key, label, val]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", width: "80px" }}>{label}:</span>
                    <input
                      type="number"
                      min="0"
                      value={denominations[key]}
                      onChange={(e) => setDenominations({ ...denominations, [key]: Number(e.target.value) })}
                      style={{ width: "60px", padding: "4px", borderRadius: "4px", border: "1px solid var(--border)", textAlign: "center", fontWeight: "700" }}
                    />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>= ₹{denominations[key] * val}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "8px", fontWeight: "800", fontSize: "15px", color: "var(--primary)" }}>
                Calculated Counter Cash: ₹{calculatedPhysicalCash}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Audit Notes / Reason for Shortage:</label>
              <input
                type="text"
                placeholder="e.g. Counter change shortage of ₹10"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="pos-input"
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleCashClosingSubmit} className="pos-btn-success" style={{ flex: 1, padding: "12px" }}>
                ✅ Save Shift Closing & Audit
              </button>
              <button onClick={() => setShowClosingModal(false)} style={{ padding: "12px 18px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ Financial & Tax Preferences Modal */}
      {showSettingsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "580px", maxWidth: "92%", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>⚙️</span> Financial & GST Preferences
                </h3>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  टैक्स दरें, बिलिंग नियम, और टैली लेजर कस्टमाइज़ करें
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "18px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              {[
                { id: "gst", label: "🧾 GST & Tax Rules" },
                { id: "tally", label: "📑 Tally Prime Ledgers" },
                { id: "counter", label: "💵 Shift Cash Float" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSettingsTab(tab.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    background: activeSettingsTab === tab.id ? "var(--primary)" : "var(--surface-alt)",
                    color: activeSettingsTab === tab.id ? "white" : "var(--text-dark)",
                    transition: "all 0.15s ease"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveFinancialSettings}>
              {/* TAB 1: GST & TAX RULES */}
              {activeSettingsTab === "gst" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Default GST Rate (%)
                      </label>
                      <select
                        value={finSettings.default_gst_rate}
                        onChange={(e) => setFinSettings({ ...finSettings, default_gst_rate: Number(e.target.value) })}
                        className="pos-input"
                      >
                        <option value={0}>0% (Exempted / Zero Tax)</option>
                        <option value={5}>5% (Groceries, Spices, Essential)</option>
                        <option value={12}>12% (Packaged Food, Electronics)</option>
                        <option value={18}>18% (Standard Retail / General)</option>
                        <option value={28}>28% (Luxury / Aerated / High Rate)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Tax Pricing Mode
                      </label>
                      <select
                        value={finSettings.is_tax_inclusive}
                        onChange={(e) => setFinSettings({ ...finSettings, is_tax_inclusive: Number(e.target.value) })}
                        className="pos-input"
                      >
                        <option value={1}>Tax-Inclusive (MRP includes GST)</option>
                        <option value={0}>Tax-Exclusive (GST added on subtotal)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ background: "var(--surface-alt)", padding: "12px", borderRadius: "8px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "700" }}>
                      <input
                        type="checkbox"
                        checked={finSettings.is_composition_scheme === 1}
                        onChange={(e) => setFinSettings({ ...finSettings, is_composition_scheme: e.target.checked ? 1 : 0 })}
                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                      />
                      <span>Enrolled in GST Composition Scheme (1% Flat Turnover Tax)</span>
                    </label>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", paddingLeft: "26px" }}>
                      Check this if you pay flat 1% GST and do not collect tax from customers on retail receipts.
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Store GSTIN (15-Digit)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 23AABCT1234F1Z9"
                        maxLength="15"
                        value={finSettings.gstin}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          const stateCode = val.length >= 2 ? val.slice(0, 2) : finSettings.state_code;
                          setFinSettings({ ...finSettings, gstin: val, state_code: stateCode });
                        }}
                        className="pos-input"
                        style={{ fontFamily: "var(--font-mono)", fontWeight: "700" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        State & Code (POS)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 23-Madhya Pradesh"
                        value={`${finSettings.state_code ? finSettings.state_code + ' - ' : ''}${finSettings.state || ''}`}
                        onChange={(e) => {
                          const parts = e.target.value.split("-");
                          if (parts.length > 1) {
                            setFinSettings({ ...finSettings, state_code: parts[0].trim(), state: parts[1].trim() });
                          } else {
                            setFinSettings({ ...finSettings, state: e.target.value });
                          }
                        }}
                        className="pos-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TALLY PRIME LEDGER MAPPING */}
              {activeSettingsTab === "tally" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", background: "#eff6ff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #bfdbfe", color: "#1e40af" }}>
                    💡 Set exact ledger account names as defined in your CA's Tally Prime so that XML imports execute without missing-ledger errors.
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Sales Account Ledger:
                      </label>
                      <input
                        type="text"
                        value={finSettings.tally_sales_ledger}
                        onChange={(e) => setFinSettings({ ...finSettings, tally_sales_ledger: e.target.value })}
                        className="pos-input"
                        placeholder="e.g. Sales Account"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        Cash Account Ledger:
                      </label>
                      <input
                        type="text"
                        value={finSettings.tally_cash_ledger}
                        onChange={(e) => setFinSettings({ ...finSettings, tally_cash_ledger: e.target.value })}
                        className="pos-input"
                        placeholder="e.g. Cash Retail Buyer"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        CGST Output Ledger:
                      </label>
                      <input
                        type="text"
                        value={finSettings.tally_cgst_ledger}
                        onChange={(e) => setFinSettings({ ...finSettings, tally_cgst_ledger: e.target.value })}
                        className="pos-input"
                        placeholder="e.g. CGST"
                        required
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                        SGST Output Ledger:
                      </label>
                      <input
                        type="text"
                        value={finSettings.tally_sgst_ledger}
                        onChange={(e) => setFinSettings({ ...finSettings, tally_sgst_ledger: e.target.value })}
                        className="pos-input"
                        placeholder="e.g. SGST"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COUNTER CASH FLOAT */}
              {activeSettingsTab === "counter" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-dark)", display: "block", marginBottom: "6px" }}>
                      Default Shift Opening Drawer Float (₹)
                    </label>
                    <input
                      type="number"
                      value={finSettings.default_opening_cash}
                      onChange={(e) => setFinSettings({ ...finSettings, default_opening_cash: Number(e.target.value) })}
                      className="pos-input"
                      placeholder="e.g. 2000"
                      required
                    />
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      This base currency float pre-fills the opening drawer amount whenever a cashier opens or reconciles a counter shift.
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                <button type="submit" className="pos-btn-primary" style={{ flex: 1, padding: "12px" }}>
                  💾 Save Financial Preferences
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  style={{ padding: "12px 18px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

