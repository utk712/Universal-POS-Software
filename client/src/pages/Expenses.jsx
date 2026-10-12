import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { authFetch } from "../utils/auth";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [category, setCategory] = useState("Tea & Refreshments");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const categories = [
    "Tea & Refreshments",
    "Staff Salaries & Advance",
    "Shop Rent",
    "Electricity & Utilities",
    "Transport & Freight",
    "Maintenance & Repairs",
    "Stationery & Packing",
    "Miscellaneous"
  ];

  const fetchExpenses = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/expenses`);
      const data = await res.json();
      if (Array.isArray(data)) setExpenses(data);
    } catch {
      setMessage("Error loading expenses catalog ❌");
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setMessage("Please enter a valid expense amount ❌");
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          amount: Number(amount),
          payment_method: paymentMethod,
          note
        })
      });

      if (res.ok) {
        setMessage("Expense Logged Successfully! ✅");
        setAmount("");
        setNote("");
        fetchExpenses();
      } else {
        setMessage("Failed to log expense ❌");
      }
    } catch {
      setMessage("Server error ❌");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense voucher?")) return;
    try {
      const res = await authFetch(`${API_URL}/api/expenses/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Expense deleted successfully 🗑️");
        fetchExpenses();
      } else {
        setMessage(data.message || "Failed to delete expense ❌");
      }
    } catch {
      setMessage("Server error deleting expense ❌");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const totalExpense = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }} className="animate-fade-in">
      
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--text-dark)" }}>
            💸 Petty Cash & Daily Shop Expense Logger
          </h2>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Track daily non-inventory payouts (Salaries, Rent, Tea/Snacks, Freight, Maintenance).
          </div>
        </div>

        <div className="pos-card" style={{ padding: "10px 18px", background: "linear-gradient(135deg, #ffffff, #fee2e2)" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#b91c1c" }}>TOTAL LOGGED EXPENSES</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#991b1b", fontFamily: "var(--font-mono)" }}>
            ₹{totalExpense.toFixed(2)}
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes("✅") ? "var(--accent-green-light)" : "var(--accent-red-light)", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "12px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
          {message}
        </div>
      )}

      {/* Add Expense Form Card */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
          ➕ Log New Expense Payout
        </h3>

        <form onSubmit={handleAddExpense} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Expense Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="pos-input">
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Amount (₹) *</label>
            <input
              type="number"
              placeholder="e.g. 150"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pos-input"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Payment Mode</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="pos-input">
              <option value="cash">💵 Cash (Petty Counter)</option>
              <option value="upi">📱 UPI / Online</option>
              <option value="bank">🏦 Bank Transfer / Cheque</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Expense Note / Voucher Reason</label>
            <input
              type="text"
              placeholder="e.g. Staff tea bill for 10 days"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="pos-input"
            />
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: "6px" }}>
            <button type="submit" className="pos-btn-primary" style={{ padding: "12px 24px" }}>
              ➕ Record Expense Payout
            </button>
          </div>
        </form>
      </div>

      {/* Expense History Table Card */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
          Recent Expense Transactions ({expenses.length})
        </h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 14px", borderRadius: "6px 0 0 6px" }}>Date & Time</th>
                <th style={{ padding: "12px 14px" }}>Category</th>
                <th style={{ padding: "12px 14px" }}>Payment Mode</th>
                <th style={{ padding: "12px 14px" }}>Voucher Note</th>
                <th style={{ padding: "12px 14px", textAlign: "right" }}>Amount (₹)</th>
                <th style={{ padding: "12px 14px", textAlign: "center", borderRadius: "0 6px 6px 0" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.expense_id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 14px", color: "var(--text-muted)" }}>{new Date(e.date_time).toLocaleString()}</td>
                  <td style={{ padding: "12px 14px", fontWeight: "700" }}>{e.category}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span className="badge-pill badge-blue">{e.payment_method.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>{e.note || "N/A"}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "800", color: "#dc2626" }}>
                    ₹{e.amount ? e.amount.toFixed(2) : 0}
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    <button
                      onClick={() => handleDeleteExpense(e.expense_id)}
                      style={{
                        padding: "5px 10px",
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "1px solid #fca5a5",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "700",
                        fontSize: "12px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Delete expense voucher"
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
    </div>
  );
}

