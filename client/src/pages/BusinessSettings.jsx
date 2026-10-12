import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { authFetch } from "../utils/auth";

export default function BusinessSettings() {
  const [form, setForm] = useState({
    store_name: "",
    tagline: "",
    address: "",
    mobile: "",
    email: "",
    gstin: "",
    currency: "₹",
    active_vertical: "supermarket",
    thermal_printer_width: "80mm",
    auto_print: 1,
    upi_id: ""
  });
  const [initialForm, setInitialForm] = useState({});
  const [message, setMessage] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/business/settings`);
      const data = await res.json();
      if (data) {
        setForm(data);
        setInitialForm(data);
      }
    } catch {
      setMessage("Error loading store settings ❌");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_URL}/api/business/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setMessage("Store Profile & Hardware Config Saved! ✅");
        fetchSettings();
        window.dispatchEvent(new CustomEvent("store-settings-updated", { detail: form }));
        window.dispatchEvent(new CustomEvent("business-vertical-changed", { detail: form.active_vertical }));
      } else {
        setMessage("Failed to save settings ❌");
      }
    } catch {
      setMessage("Server error ❌");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleUndoSettings = () => {
    setForm(initialForm);
    setMessage("Changes undone / reset to saved profile ↩️");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div style={{ maxWidth: "850px", display: "flex", flexDirection: "column", gap: "18px" }} className="animate-fade-in">
      <div>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--text-dark)" }}>
          ⚙️ Business Profile & Hardware Integration Setup
        </h2>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Configure shop details, GSTIN registration, ESC/POS thermal printer size, UPI QR codes, and Multi-Counter LAN IP.
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes("✅") ? "var(--accent-green-light)" : "var(--accent-red-light)", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "12px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
          {message}
        </div>
      )}

      {/* Main Store Settings Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        
        {/* Store Profile Card */}
        <div className="pos-card" style={{ padding: "22px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "800", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🏢</span> Store Branding & GST Details
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Store Name *</label>
              <input
                type="text"
                value={form.store_name || ""}
                onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                className="pos-input"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Tagline / Subtitle</label>
              <input
                type="text"
                placeholder="e.g. Quality Products & Fast Service"
                value={form.tagline || ""}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="pos-input"
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Contact Phone *</label>
              <input
                type="text"
                value={form.mobile || ""}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="pos-input"
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>GSTIN Registration No.</label>
              <input
                type="text"
                placeholder="22AAAAA0000A1Z5"
                value={form.gstin || ""}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="pos-input"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Printed Receipt Address</label>
              <input
                type="text"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="pos-input"
              />
            </div>
          </div>
        </div>

        {/* Thermal Printer & UPI Integration Card */}
        <div className="pos-card" style={{ padding: "22px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "800", color: "var(--primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🖨️</span> Thermal Printer & UPI QR Integration
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>UPI VPA Address (For Instant QR)</label>
              <input
                type="text"
                placeholder="e.g. 9876543210@upi"
                value={form.upi_id || ""}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                className="pos-input"
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Thermal Paper Roll Width</label>
              <select
                value={form.thermal_printer_width || "80mm"}
                onChange={(e) => setForm({ ...form, thermal_printer_width: e.target.value })}
                className="pos-input"
              >
                <option value="80mm">3 Inch / 80mm (Standard Supermarket ESC/POS)</option>
                <option value="58mm">2 Inch / 58mm (Small Handheld Printer)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Active Vertical Mode</label>
              <select
                value={form.active_vertical || "supermarket"}
                onChange={(e) => setForm({ ...form, active_vertical: e.target.value })}
                className="pos-input"
              >
                <option value="supermarket">🛒 Supermarket / Kirana / DMart Style</option>
                <option value="restaurant">🍽️ Restaurant / Cafe / Dining</option>
                <option value="apparel">👕 Apparel & Fashion</option>
                <option value="electronics">📱 Electronics & Hardware</option>
                <option value="salon">✂️ Salon & Services</option>
                <option value="liquor">🍺 Wine & Beer Shop</option>
                <option value="pharmacy">💊 Pharmacy & Medical</option>
                <option value="hardware">🔧 Hardware & Electricals</option>
                <option value="jewelry">💎 Jewelry & Gold Shop</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action buttons for Store Profile Form */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button type="submit" className="pos-btn-success" style={{ flex: 1, padding: "14px", fontSize: "15px", borderRadius: "10px", fontWeight: "700" }}>
            💾 Save & Apply Store Settings
          </button>
          <button type="button" onClick={handleUndoSettings} className="pos-btn-secondary" style={{ padding: "14px 20px", fontSize: "15px", borderRadius: "10px", fontWeight: "700", background: "var(--surface-alt)", color: "var(--text-muted)" }}>
            ↩️ Undo / Reset Form
          </button>
        </div>
      </form>

      {/* 🏬 Multi-Counter Billing Terminals & LAN IP Management (Independent of Main Form) */}
      <BillingCountersManager />
    </div>
  );
}

// Sub-component: Billing Counters & LAN Server IP Setup
function BillingCountersManager() {
  const [counters, setCounters] = useState([]);
  const [masterIp, setMasterIp] = useState(localStorage.getItem("master_server_ip") || "");
  const [newCounter, setNewCounter] = useState({ counter_code: "", counter_name: "", location_notes: "" });
  const [counterMsg, setCounterMsg] = useState("");

  useEffect(() => {
    fetchCounters();
  }, []);

  const fetchCounters = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/counters`);
      const data = await res.json();
      if (Array.isArray(data)) setCounters(data);
    } catch {}
  };

  const handleAddCounter = async (e) => {
    if (e) e.preventDefault();
    if (!newCounter.counter_code || !newCounter.counter_name) {
      setCounterMsg("Please provide both Counter Code and Counter Name ⚠️");
      setTimeout(() => setCounterMsg(""), 3000);
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/counters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCounter)
      });
      const data = await res.json();
      if (res.ok) {
        setCounterMsg(data.message);
        setNewCounter({ counter_code: "", counter_name: "", location_notes: "" });
        fetchCounters();
      } else {
        setCounterMsg(data.message || "Failed to add counter ❌");
      }
    } catch {
      setCounterMsg("Error adding counter ❌");
    }
    setTimeout(() => setCounterMsg(""), 3000);
  };

  const handleDeleteCounter = async (counterId) => {
    if (!window.confirm("Are you sure you want to delete / undo this billing counter?")) return;

    try {
      const res = await authFetch(`${API_URL}/api/counters/${counterId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        setCounterMsg(data.message || "Counter deleted / undone 🗑️");
        fetchCounters();
      } else {
        setCounterMsg(data.message || "Failed to delete counter ❌");
      }
    } catch {
      setCounterMsg("Error deleting counter ❌");
    }
    setTimeout(() => setCounterMsg(""), 3000);
  };

  const saveMasterIp = () => {
    if (masterIp.trim()) {
      localStorage.setItem("master_server_ip", masterIp.trim());
      alert(`Master Server IP saved as '${masterIp.trim()}'. Reloading page to connect...`);
      window.location.reload();
    } else {
      localStorage.removeItem("master_server_ip");
      alert("Reset to Local Master Server mode (localhost). Reloading page...");
      window.location.reload();
    }
  };

  const resetMasterIp = () => {
    localStorage.removeItem("master_server_ip");
    setMasterIp("");
    setCounterMsg("Master IP reset to local server default 🔄");
    setTimeout(() => setCounterMsg(""), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* 📡 LAN Master Server IP Configuration */}
      <div className="pos-card" style={{ padding: "20px", background: "linear-gradient(135deg, #ffffff, #eff6ff)" }}>
        <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "var(--primary)" }}>
          📡 Multi-Counter LAN / Master Server IP Setup
        </h3>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
          For Billing Counters 2, 3, 4: Enter your Main Master PC's local IP address (e.g. <code>192.168.1.100</code>) to connect over store Wi-Fi / Ethernet.
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="e.g. 192.168.1.100 (Leave empty if THIS PC is the Main Server)"
            value={masterIp}
            onChange={(e) => setMasterIp(e.target.value)}
            className="pos-input"
            style={{ maxWidth: "420px", flex: 1 }}
          />
          <button type="button" onClick={saveMasterIp} className="pos-btn-primary" style={{ padding: "10px 16px" }}>
            🔗 Save & Connect to Master IP
          </button>
          <button type="button" onClick={resetMasterIp} className="pos-btn-secondary" style={{ padding: "10px 16px", background: "#f3f4f6", color: "#4b5563" }}>
            🔄 Reset / Undo IP
          </button>
        </div>
      </div>

      {/* 🏪 Billing Counters Directory */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
              🏪 Store Billing Counters (Multi-Counter Hub)
            </h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Manage active counters (Counter 1, Counter 2, Counter 3, Express Lane)
            </div>
          </div>
        </div>

        {counterMsg && (
          <div style={{ padding: "8px 12px", borderRadius: "6px", background: counterMsg.includes("❌") ? "#fef2f2" : "var(--primary-light)", color: counterMsg.includes("❌") ? "#b91c1c" : "var(--primary)", fontWeight: "700", fontSize: "12px", marginBottom: "12px" }}>
            {counterMsg}
          </div>
        )}

        {/* Existing Counters Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "16px" }}>
          <thead>
            <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
              <th style={{ padding: "8px 12px" }}>Code</th>
              <th style={{ padding: "8px 12px" }}>Counter Name</th>
              <th style={{ padding: "8px 12px" }}>Location / Dept</th>
              <th style={{ padding: "8px 12px" }}>Status</th>
              <th style={{ padding: "8px 12px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {counters.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: "14px", textAlign: "center", color: "var(--text-muted)" }}>
                  No billing counters added yet.
                </td>
              </tr>
            ) : (
              counters.map((c) => (
                <tr key={c.counter_id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 12px", fontWeight: "800", color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
                    {c.counter_code}
                  </td>
                  <td style={{ padding: "8px 12px", fontWeight: "700" }}>{c.counter_name}</td>
                  <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{c.location_notes || "General"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span className="badge-pill badge-green">Active Counter</span>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteCounter(c.counter_id)}
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "6px",
                        fontWeight: "700",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      🗑️ Delete / Undo
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Add New Counter Form */}
        <div style={{ background: "var(--surface-alt)", padding: "14px", borderRadius: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-dark)", marginBottom: "8px" }}>
            ➕ Register New Billing Counter:
          </div>
          <form onSubmit={handleAddCounter} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr 140px", gap: "10px" }}>
            <input
              type="text"
              placeholder="Code (e.g. C4)"
              value={newCounter.counter_code}
              onChange={(e) => setNewCounter({ ...newCounter, counter_code: e.target.value })}
              className="pos-input"
              required
            />
            <input
              type="text"
              placeholder="Counter Name (e.g. Counter 4 - Bakery)"
              value={newCounter.counter_name}
              onChange={(e) => setNewCounter({ ...newCounter, counter_name: e.target.value })}
              className="pos-input"
              required
            />
            <input
              type="text"
              placeholder="Location Notes (e.g. 1st Floor)"
              value={newCounter.location_notes}
              onChange={(e) => setNewCounter({ ...newCounter, location_notes: e.target.value })}
              className="pos-input"
            />
            <button type="submit" className="pos-btn-success">
              + Add Counter
            </button>
          </form>
        </div>
      </div>

      {/* 💾 Database Backup & Disaster Recovery Card */}
      <div className="pos-card" style={{ padding: "20px", background: "linear-gradient(135deg, #ffffff, #f0fdf4)", border: "1px solid #bbf7d0" }}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#15803d", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>💾</span> Database Backup & Disaster Recovery
        </h3>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
          Download an offline backup copy of your entire business database (stock catalog, customers, invoices) to save onto a USB pen drive or external hard disk.
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <a
            href={`${API_URL}/api/system/backup/download`}
            download
            className="pos-btn-success"
            style={{ textDecoration: "none", padding: "10px 18px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            ⬇️ Download Full Database Backup (.db)
          </a>
        </div>
      </div>
    </div>
  );
}
