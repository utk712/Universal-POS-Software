import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { authFetch } from "../utils/auth";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: ""
  });

  const fetchCustomers = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/customers`);
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch {
      setMessage("Error loading customer database ❌");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setMessage("Name and Phone are required ❌");
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setMessage("Customer Account Registered Successfully! ✅");
        setForm({ name: "", phone: "", email: "", address: "", gstin: "" });
        fetchCustomers();
      } else {
        const data = await res.json();
        setMessage(data.message || "Failed to register customer ❌");
      }
    } catch {
      setMessage("Server error ❌");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleCollectPayment = async () => {
    if (!selectedCustomer || !payAmount) return;

    try {
      const res = await authFetch(`${API_URL}/api/customers/pay-khata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer.customer.customer_id,
          amount: Number(payAmount),
          note: payNote || "Khata debt settlement"
        })
      });

      if (res.ok) {
        setMessage("Khata Payment Collected & Ledger Updated! ✅");
        setPayAmount("");
        setPayNote("");
        setSelectedCustomer(null);
        fetchCustomers();
      }
    } catch {
      setMessage("Payment recording failed ❌");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const viewKhataDetails = async (id) => {
    try {
      const res = await authFetch(`${API_URL}/api/customers/${id}`);
      const data = await res.json();
      setSelectedCustomer(data);
    } catch {
      alert("Failed to load customer details");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const totalKhataDue = customers.reduce((acc, c) => acc + (c.khata_balance || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }} className="animate-fade-in">
      
      {/* CRM Stats Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
        <div className="pos-card" style={{ padding: "16px", background: "linear-gradient(135deg, #ffffff, #eff6ff)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)" }}>TOTAL REGISTERED CUSTOMERS</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--text-dark)", marginTop: "4px" }}>{customers.length}</div>
        </div>

        <div className="pos-card" style={{ padding: "16px", background: totalKhataDue > 0 ? "linear-gradient(135deg, #ffffff, #fee2e2)" : "var(--surface)" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", color: totalKhataDue > 0 ? "#b91c1c" : "var(--text-muted)" }}>TOTAL KHATA OUTSTANDING DUE</div>
          <div style={{ fontSize: "28px", fontWeight: "800", color: totalKhataDue > 0 ? "#dc2626" : "var(--text-dark)", marginTop: "4px", fontFamily: "var(--font-mono)" }}>
            ₹{totalKhataDue.toFixed(2)}
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes("✅") ? "var(--accent-green-light)" : "var(--accent-red-light)", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "12px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
          {message}
        </div>
      )}

      {/* Customer Registration Card */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
          👤 Register New Customer Account
        </h3>

        <form onSubmit={handleAddCustomer} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Full Name *</label>
            <input
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="pos-input"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Mobile Number *</label>
            <input
              type="text"
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="pos-input"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>B2B GSTIN (Optional)</label>
            <input
              type="text"
              placeholder="22AAAAA0000A1Z5"
              value={form.gstin}
              onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              className="pos-input"
            />
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: "6px" }}>
            <button type="submit" className="pos-btn-primary" style={{ padding: "12px 24px" }}>
              👤 Register Customer Account
            </button>
          </div>
        </form>
      </div>

      {/* Customer List Card */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>Customer Directory</h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{filteredCustomers.length} accounts found</div>
          </div>

          <input
            type="text"
            placeholder="Search by name or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pos-input"
            style={{ width: "260px" }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 14px", borderRadius: "6px 0 0 6px" }}>Customer Name</th>
                <th style={{ padding: "12px 14px" }}>Mobile Number</th>
                <th style={{ padding: "12px 14px" }}>GSTIN</th>
                <th style={{ padding: "12px 14px" }}>Khata Balance (Udhar)</th>
                <th style={{ padding: "12px 14px", textAlign: "right", borderRadius: "0 6px 6px 0" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const isDue = (c.khata_balance || 0) > 0;

                return (
                  <tr key={c.customer_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "var(--text-dark)" }}>{c.name}</td>
                    <td style={{ padding: "12px 14px", color: "var(--text-muted)" }}>{c.phone}</td>
                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>{c.gstin || "N/A"}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span className={`badge-pill ${isDue ? "badge-red" : "badge-green"}`}>
                        ₹{c.khata_balance || 0}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => viewKhataDetails(c.customer_id)}
                        className="pos-btn-primary"
                        style={{ padding: "6px 14px", fontSize: "12px" }}
                      >
                        📒 Khata Ledger & Collect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Khata Ledger Modal */}
      {selectedCustomer && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "520px", maxWidth: "90%", maxHeight: "85vh", overflowY: "auto", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-dark)" }}>
              📒 Khata Statement: {selectedCustomer.customer.name}
            </h3>

            <div style={{ background: "var(--accent-red-light)", color: "#b91c1c", padding: "14px", borderRadius: "10px", fontWeight: "800", fontSize: "16px", marginBottom: "16px" }}>
              Outstanding Debt Due: ₹{selectedCustomer.customer.khata_balance || 0}
            </div>

            {selectedCustomer.customer.khata_balance > 0 && (
              <div style={{ background: "var(--surface-alt)", padding: "14px", borderRadius: "10px", marginBottom: "16px", border: "1px solid var(--border)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "var(--text-dark)" }}>💵 Collect Debt Payment</h4>
                <input
                  type="number"
                  placeholder="Amount Received (₹)"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="pos-input"
                  style={{ marginBottom: "8px", fontWeight: "800", fontSize: "16px" }}
                />
                <input
                  type="text"
                  placeholder="Note (e.g. Cash / PhonePe payment)"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="pos-input"
                  style={{ marginBottom: "10px" }}
                />
                <button onClick={handleCollectPayment} className="pos-btn-success" style={{ width: "100%", padding: "12px" }}>
                  Collect Payment & Update Ledger
                </button>
              </div>
            )}

            <h4 style={{ color: "var(--text-dark)", marginBottom: "8px" }}>Audit Transaction History</h4>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "8px" }}>Date</th>
                  <th style={{ padding: "8px" }}>Type</th>
                  <th style={{ padding: "8px" }}>Amount</th>
                  <th style={{ padding: "8px" }}>Note</th>
                </tr>
              </thead>
              <tbody>
                {selectedCustomer.transactions.map((t) => (
                  <tr key={t.transaction_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px", color: "var(--text-muted)" }}>{new Date(t.date_time).toLocaleDateString()}</td>
                    <td style={{ padding: "8px", fontWeight: "700", color: t.type === "debit" ? "#dc2626" : "#16a34a" }}>
                      {t.type === "debit" ? "Credit Given" : "Payment Received"}
                    </td>
                    <td style={{ padding: "8px", fontWeight: "800" }}>₹{t.amount}</td>
                    <td style={{ padding: "8px" }}>{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={() => setSelectedCustomer(null)} style={{ marginTop: "16px", padding: "10px 20px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
              Close Statement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
