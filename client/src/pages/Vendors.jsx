import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { authFetch } from "../utils/auth";

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  // Add Vendor Form
  const [vendorForm, setVendorForm] = useState({
    name: "",
    mobile: "",
    email: "",
    company: "",
    gstin: "",
    address: ""
  });

  // Purchase Bill Entry Form
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [billNo, setBillNo] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [purchaseItems, setPurchaseItems] = useState([
    { product_id: "", product_name: "", quantity: 1, purchase_cost: 0 }
  ]);

  const fetchVendors = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/vendors`);
      const data = await res.json();
      if (Array.isArray(data)) setVendors(data);
    } catch {
      setMessage("Error loading suppliers catalog ❌");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/products`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch {
      console.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchProducts();
  }, []);

  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!vendorForm.name || !vendorForm.company) {
      setMessage("Vendor Name and Company Name are required ❌");
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm)
      });

      if (res.ok) {
        setMessage("Supplier Account Registered Successfully! ✅");
        setVendorForm({ name: "", mobile: "", email: "", company: "", gstin: "", address: "" });
        fetchVendors();
      } else {
        setMessage("Failed to register supplier ❌");
      }
    } catch {
      setMessage("Server error ❌");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  // Add Row to Purchase Order
  const addPurchaseRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      { product_id: "", product_name: "", quantity: 1, purchase_cost: 0 }
    ]);
  };

  const handleRecordPurchase = async () => {
    if (!selectedVendor || purchaseItems.length === 0) {
      alert("Please select supplier and add purchase items");
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/vendors/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: Number(selectedVendor),
          bill_no: billNo || `PUR-${Date.now()}`,
          items: purchaseItems,
          paid_amount: Number(paidAmount || 0)
        })
      });

      if (res.ok) {
        setMessage("Supplier Purchase Bill Recorded & Inventory Stock Updated! ✅");
        setShowPurchaseModal(false);
        setBillNo("");
        setPaidAmount("");
        setPurchaseItems([{ product_id: "", product_name: "", quantity: 1, purchase_cost: 0 }]);
        fetchVendors();
      } else {
        alert("Failed to record purchase bill");
      }
    } catch {
      alert("Server error");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const totalPayableDue = vendors.reduce((acc, v) => acc + (v.balance_due || 0), 0);

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.company.toLowerCase().includes(search.toLowerCase()) ||
      v.mobile.includes(search)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }} className="animate-fade-in">
      
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--text-dark)" }}>
            🏭 Supplier Directory & Vendor Payable Ledgers
          </h2>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
            Track distributor credit bills, supplier payables, and inventory replenishment.
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div className="pos-card" style={{ padding: "8px 14px", background: "linear-gradient(135deg, #ffffff, #fee2e2)" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#b91c1c" }}>TOTAL SUPPLIER PAYABLES DUE</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#991b1b", fontFamily: "var(--font-mono)" }}>
              ₹{totalPayableDue.toFixed(2)}
            </div>
          </div>

          <button onClick={() => setShowPurchaseModal(true)} className="pos-btn-success" style={{ padding: "10px 16px" }}>
            📦 Record Supplier Purchase Bill
          </button>
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes("✅") ? "var(--accent-green-light)" : "var(--accent-red-light)", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "12px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
          {message}
        </div>
      )}

      {/* Add Vendor Form Card */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
          🏭 Register New Distributor / Wholesaler
        </h3>

        <form onSubmit={handleAddVendor} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Distributor Company Name *</label>
            <input
              type="text"
              placeholder="e.g. Royal Traders Pvt Ltd"
              value={vendorForm.company}
              onChange={(e) => setVendorForm({ ...vendorForm, company: e.target.value })}
              className="pos-input"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Contact Person Name *</label>
            <input
              type="text"
              placeholder="e.g. Suresh Patel"
              value={vendorForm.name}
              onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
              className="pos-input"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Mobile Number</label>
            <input
              type="text"
              placeholder="9876543210"
              value={vendorForm.mobile}
              onChange={(e) => setVendorForm({ ...vendorForm, mobile: e.target.value })}
              className="pos-input"
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Supplier GSTIN</label>
            <input
              type="text"
              placeholder="22AAAAA0000A1Z5"
              value={vendorForm.gstin}
              onChange={(e) => setVendorForm({ ...vendorForm, gstin: e.target.value })}
              className="pos-input"
            />
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: "6px" }}>
            <button type="submit" className="pos-btn-primary" style={{ padding: "12px 24px" }}>
              🏭 Register Supplier Account
            </button>
          </div>
        </form>
      </div>

      {/* Vendor Table Card */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>Supplier Directory</h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{filteredVendors.length} vendors listed</div>
          </div>

          <input
            type="text"
            placeholder="Search supplier by name, company, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pos-input"
            style={{ width: "280px" }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 14px", borderRadius: "6px 0 0 6px" }}>Company / Wholesaler</th>
                <th style={{ padding: "12px 14px" }}>Contact Person</th>
                <th style={{ padding: "12px 14px" }}>Mobile</th>
                <th style={{ padding: "12px 14px" }}>GSTIN</th>
                <th style={{ padding: "12px 14px", textAlign: "right", borderRadius: "0 6px 6px 0" }}>Payable Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((v) => (
                <tr key={v.vendor_id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 14px", fontWeight: "700", color: "var(--text-dark)" }}>{v.company}</td>
                  <td style={{ padding: "12px 14px" }}>{v.name}</td>
                  <td style={{ padding: "12px 14px", color: "var(--text-muted)" }}>{v.mobile || "N/A"}</td>
                  <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>{v.gstin || "N/A"}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <span className={`badge-pill ${(v.balance_due || 0) > 0 ? "badge-red" : "badge-green"}`}>
                      ₹{v.balance_due ? v.balance_due.toFixed(2) : 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Bill Modal */}
      {showPurchaseModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "650px", maxWidth: "90%", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px" }}>
            <h3 style={{ marginTop: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-dark)" }}>
              📦 Record Supplier Purchase Invoice
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Select Supplier *</label>
                <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className="pos-input">
                  <option value="">Choose Wholesaler</option>
                  {vendors.map((v) => (
                    <option key={v.vendor_id} value={v.vendor_id}>{v.company} ({v.name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Purchase Bill / Invoice No.</label>
                <input
                  type="text"
                  placeholder="e.g. INV-9988"
                  value={billNo}
                  onChange={(e) => setBillNo(e.target.value)}
                  className="pos-input"
                />
              </div>
            </div>

            {/* Purchase Item Rows */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-dark)" }}>Items Purchased & Unit Cost:</label>
                <button onClick={addPurchaseRow} style={{ background: "var(--primary-light)", color: "var(--primary-hover)", border: "none", padding: "4px 10px", borderRadius: "4px", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
                  + Add Row
                </button>
              </div>

              {purchaseItems.map((row, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Product Item Name"
                    value={row.product_name}
                    onChange={(e) => {
                      const newItems = [...purchaseItems];
                      newItems[idx].product_name = e.target.value;
                      setPurchaseItems(newItems);
                    }}
                    className="pos-input"
                    style={{ flex: 2 }}
                  />

                  <input
                    type="number"
                    placeholder="Qty"
                    value={row.quantity}
                    onChange={(e) => {
                      const newItems = [...purchaseItems];
                      newItems[idx].quantity = Number(e.target.value);
                      setPurchaseItems(newItems);
                    }}
                    className="pos-input"
                    style={{ width: "70px" }}
                  />

                  <input
                    type="number"
                    placeholder="Unit Cost ₹"
                    value={row.purchase_cost}
                    onChange={(e) => {
                      const newItems = [...purchaseItems];
                      newItems[idx].purchase_cost = Number(e.target.value);
                      setPurchaseItems(newItems);
                    }}
                    className="pos-input"
                    style={{ width: "100px" }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Paid Amount (₹):</label>
              <input
                type="number"
                placeholder="Amount paid now (Rest added to credit due)"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="pos-input"
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleRecordPurchase} className="pos-btn-success" style={{ flex: 1, padding: "12px" }}>
                ✅ Save Purchase & Update Stock
              </button>
              <button onClick={() => setShowPurchaseModal(false)} style={{ padding: "12px 18px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

