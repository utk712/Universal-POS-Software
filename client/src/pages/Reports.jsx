import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { authFetch } from "../utils/auth";

export default function Reports() {
  const [daily, setDaily] = useState({});
  const [monthly, setMonthly] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSummaryReports();
  }, []);

  const fetchSummaryReports = async () => {
    try {
      const [dRes, mRes] = await Promise.all([
        authFetch(`${API_URL}/api/reports/daily`),
        authFetch(`${API_URL}/api/reports/monthly`)
      ]);

      const dData = await dRes.json();
      const mData = await mRes.json();

      setDaily(dData || {});
      setMonthly(mData || {});
    } catch {
      setMessage("Error loading report metrics ❌");
    }
    setLoading(false);
  };

  // Helper for Excel Download
  const downloadExcel = async (endpoint, filename) => {
    try {
      setMessage(`Generating ${filename}... ⏳`);
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_URL}/api/reports/excel/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${Date.now()}.xlsx`;
      a.click();

      setMessage(`${filename} Downloaded Successfully! ✅`);
    } catch {
      setMessage(`Failed to generate ${filename} ❌`);
    }
    setTimeout(() => setMessage(""), 3500);
  };

  if (loading) {
    return <h3 style={{ padding: "20px" }}>Loading Excel Report Center...</h3>;
  }

  const excelCards = [
    {
      id: "sales",
      title: "Sales & Invoices Excel Report",
      description: "Includes Multi-Sheet Excel workbook with Invoice Summaries and Itemized Line Details.",
      filename: "Sales_Report",
      icon: "📊",
      btnColor: "var(--primary)"
    },
    {
      id: "gst",
      title: "GSTR-1 & HSN Tax Excel Report",
      description: "Includes B2B Sales Table, Buyer GSTINs, and HSN-wise tax breakdown ready for monthly return filing.",
      filename: "GSTR1_Report",
      icon: "📋",
      btnColor: "var(--accent-green)"
    },
    {
      id: "inventory",
      title: "Inventory Stock Valuation Report",
      description: "Complete catalog export with Barcodes, HSN Codes, Cost Prices, Selling Prices, Stock Quantities, and Valuation.",
      filename: "Inventory_Stock_Report",
      icon: "📦",
      btnColor: "#8b5cf6"
    },
    {
      id: "khata",
      title: "Customer Khata Ledger Report",
      description: "Customer accounts list with phone numbers, GSTINs, total Udhar credit due, and transaction history.",
      filename: "Customer_Khata_Ledger",
      icon: "📒",
      btnColor: "#f59e0b"
    }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }} className="animate-fade-in">
      
      {/* Header Banner */}
      <div>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--text-dark)" }}>
          📊 Excel Reports & Business Analytics Hub
        </h2>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
          Export multi-sheet Microsoft Excel (.xlsx) workbooks for accounting, tax returns, and inventory audits.
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes("✅") ? "var(--accent-green-light)" : "var(--accent-red-light)", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "12px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
          {message}
        </div>
      )}

      {/* Live Sales Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div className="pos-card" style={{ padding: "20px", background: "linear-gradient(135deg, #ffffff, #eff6ff)", borderColor: "var(--primary-border)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase" }}>
            📅 Today's Sales Performance
          </div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "var(--text-dark)", marginTop: "6px", fontFamily: "var(--font-mono)" }}>
            ₹{daily.total_revenue ? Number(daily.total_revenue).toFixed(2) : "0.00"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            {daily.total_sales || 0} completed orders today
          </div>
        </div>

        <div className="pos-card" style={{ padding: "20px", background: "linear-gradient(135deg, #ffffff, #dcfce7)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#15803d", textTransform: "uppercase" }}>
            📆 This Month's Cumulative Sales
          </div>
          <div style={{ fontSize: "32px", fontWeight: "800", color: "#047857", marginTop: "6px", fontFamily: "var(--font-mono)" }}>
            ₹{monthly.total_revenue ? Number(monthly.total_revenue).toFixed(2) : "0.00"}
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            {monthly.total_sales || 0} completed orders this month
          </div>
        </div>
      </div>

      {/* Excel Download Cards Grid */}
      <h3 style={{ margin: "10px 0 0 0", fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
        📑 One-Click Excel (.xlsx) Report Downloads
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
        {excelCards.map((card) => (
          <div
            key={card.id}
            className="pos-card"
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justify: "space-between"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <span style={{ fontSize: "28px" }}>{card.icon}</span>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "var(--text-dark)" }}>
                  {card.title}
                </h4>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4", margin: 0 }}>
                {card.description}
              </p>
            </div>

            <button
              onClick={() => downloadExcel(card.id, card.filename)}
              style={{
                marginTop: "16px",
                padding: "12px",
                background: card.btnColor,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
              }}
            >
              <span>📥 Download {card.filename}.xlsx</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}