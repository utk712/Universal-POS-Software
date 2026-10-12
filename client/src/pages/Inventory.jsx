import React, { useEffect, useState } from "react";
import API_URL from "../config";
import { authFetch } from "../utils/auth";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [storeInfo, setStoreInfo] = useState({});

  // Bharat ERP Feature: Barcode Label Sticker Generator
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
  const [barcodeCount, setBarcodeCount] = useState(24);

  // Production Feature: Bulk Product Import (Excel / CSV)
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importMsg, setImportMsg] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  const activeVertical = storeInfo?.active_vertical || "supermarket";

  const [form, setForm] = useState({
    name: "",
    barcode: "",
    hsn_code: "1905",
    category: "General",
    unit: "pcs",
    cost_price: "",
    mrp: "",
    selling_price: "",
    stock_quantity: "",
    min_stock_alert: "5",
    tax_rate: "0",
    batch_no: "",
    expiry_date: "",
    salt_name: "",
    is_rx: false,
    food_type: "veg",
    size_color: "",
    imei_serial: "",
    warranty_months: "",
    liquor_size: "",
    alcohol_percent: "",
    material_spec: "",
    purity_karat: "22K",
    gross_weight_gm: "",
    making_charge: ""
  });

  const getCategories = () => {
    switch (activeVertical) {
      case "pharmacy":
        return ["Medicines", "Syrups & Drops", "Injections", "Ointments & Creams", "Supplements & Vitamins", "Personal Care", "Surgical & First Aid", "General"];
      case "restaurant":
        return ["Starters", "Main Course", "Beverages & Shakes", "Desserts", "Breads & Rice", "Snacks", "General"];
      case "apparel":
        return ["Shirts & Tops", "Pants & Jeans", "Ethnic Wear", "Footwear", "Innerwear", "Accessories", "General"];
      case "electronics":
        return ["Smartphones", "Laptops & PCs", "Accessories", "Home Appliances", "Gadgets", "General"];
      case "liquor":
        return ["Whisky", "Rum", "Vodka", "Beer", "Wine", "Gin", "Brandy", "General"];
      case "hardware":
        return ["Electricals", "Plumbing", "Paints", "Tools & Fasteners", "Sanitaryware", "General"];
      case "jewelry":
        return ["Gold Rings & Chains", "Necklaces", "Bangles", "Silver Ornaments", "Coins & Bars", "General"];
      default:
        return ["General", "Grocery", "Beverages & Drinks", "Dairy & Bakery", "Personal Care", "Snacks & Munchies", "Apparel"];
    }
  };

  const getUnits = () => {
    switch (activeVertical) {
      case "pharmacy":
        return ["strip", "tab", "bottle", "box", "pack", "pcs", "ml", "gm", "kg"];
      case "restaurant":
        return ["plate", "portion", "glass", "cup", "pcs", "bowl"];
      case "apparel":
        return ["pcs", "pair", "set", "box"];
      case "electronics":
        return ["pcs", "box", "set"];
      case "liquor":
        return ["bottle", "can", "case", "peg"];
      case "hardware":
        return ["meter", "feet", "kg", "pcs", "box", "roll", "set"];
      case "jewelry":
        return ["gm", "mg", "pcs", "pair", "set"];
      default:
        return ["pcs", "kg", "gm", "ltr", "ml", "box", "pack"];
    }
  };

  const categories = getCategories();
  const units = getUnits();
  const taxRates = [0, 5, 12, 18, 28];

  const fetchProducts = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/products`);
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch {
      setMessage("Error loading catalog ❌");
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/business/settings`);
      const data = await res.json();
      if (data) setStoreInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStoreInfo();

    const onVerticalChange = () => {
      fetchStoreInfo();
      fetchProducts();
    };

    window.addEventListener("business-vertical-changed", onVerticalChange);
    window.addEventListener("store-settings-updated", onVerticalChange);

    return () => {
      window.removeEventListener("business-vertical-changed", onVerticalChange);
      window.removeEventListener("store-settings-updated", onVerticalChange);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setMessage("Product saved successfully! ✅");
        setForm({
          name: "",
          barcode: "",
          hsn_code: "1905",
          category: categories[0] || "General",
          unit: units[0] || "pcs",
          cost_price: "",
          mrp: "",
          selling_price: "",
          stock_quantity: "",
          min_stock_alert: "5",
          tax_rate: "0",
          batch_no: "",
          expiry_date: "",
          salt_name: "",
          is_rx: false,
          food_type: "veg",
          size_color: "",
          imei_serial: "",
          warranty_months: "",
          liquor_size: "",
          alcohol_percent: "",
          material_spec: "",
          purity_karat: "22K",
          gross_weight_gm: "",
          making_charge: ""
        });
        fetchProducts();
      } else {
        setMessage("Failed to add product ❌");
      }
    } catch {
      setMessage("Server error ❌");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await authFetch(`${API_URL}/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Product deleted 🗑️");
        fetchProducts();
      }
    } catch {
      setMessage("Error deleting ❌");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setImportMsg("File is empty or missing data rows");
        return;
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[\"']/g, ""));
      const parsedItems = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim().replace(/[\"']/g, ""));
        if (cols.length < 2 || !cols[0]) continue;
        const itemObj = {};
        headers.forEach((h, idx) => {
          itemObj[h] = cols[idx] || "";
        });
        parsedItems.push({
          name: itemObj.name || cols[0],
          barcode: itemObj.barcode || cols[1] || "",
          category: itemObj.category || cols[2] || "General",
          unit: itemObj.unit || cols[3] || "pcs",
          cost_price: Number(itemObj.cost_price || 0),
          mrp: Number(itemObj.mrp || itemObj.selling_price || cols[4] || 0),
          selling_price: Number(itemObj.selling_price || itemObj.mrp || cols[5] || 0),
          stock_quantity: Number(itemObj.stock_quantity || cols[6] || 10),
          tax_rate: Number(itemObj.tax_rate || 0),
          hsn_code: itemObj.hsn_code || "1905"
        });
      }
      setImportData(parsedItems);
      setImportMsg(`✅ Successfully loaded ${parsedItems.length} products ready for import.`);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (importData.length === 0) return;
    setImportLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/products/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: importData })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || `Imported ${importData.length} products! ✅`);
        fetchProducts();
        setShowImportModal(false);
        setImportData([]);
        setImportMsg("");
      } else {
        setImportMsg(data.message || "Failed to import products ❌");
      }
    } catch {
      setImportMsg("Server error during bulk import ❌");
    } finally {
      setImportLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "name,barcode,category,unit,cost_price,mrp,selling_price,stock_quantity,tax_rate,hsn_code\n" +
      "Aloo Bhujia 200g,8901030800010,Snacks,pack,45,60,54,50,5,1905\n" +
      "Vim Bar 80g,8901030800027,Personal Care,pcs,4,5,4.7,100,18,3401\n" +
      "Jeera 1kg,8901030800034,Grocery,kg,220,430,271,20,0,0909\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "VyaparFlow_Product_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchLower) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchLower)) ||
      (p.salt_name && p.salt_name.toLowerCase().includes(searchLower)) ||
      (p.batch_no && p.batch_no.toLowerCase().includes(searchLower)) ||
      (p.imei_serial && p.imei_serial.toLowerCase().includes(searchLower)) ||
      (p.size_color && p.size_color.toLowerCase().includes(searchLower)) ||
      (p.material_spec && p.material_spec.toLowerCase().includes(searchLower));
    return matchesCat && matchesSearch;
  });

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div style={{ maxWidth: "1200px", display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">
      <div>
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "var(--text-dark)" }}>
          📦 Inventory & Product Catalog Management
        </h2>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
          Mode Active: <strong>{activeVertical.toUpperCase()}</strong> | Manage stock, prices, attributes, and print barcode stickers.
        </div>
      </div>

      {message && (
        <div style={{ background: message.includes("✅") ? "var(--accent-green-light)" : "var(--accent-red-light)", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "12px 16px", borderRadius: "8px", fontWeight: "700", fontSize: "14px" }}>
          {message}
        </div>
      )}

      {/* Product Form Card */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "800", color: "var(--primary)" }}>
          ➕ Add New Item Entry
        </h3>

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Item / Product Name *</label>
            <input
              type="text"
              placeholder="e.g. Paracetamol 500mg or Amul Butter 500g"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="pos-input"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Barcode / EAN Code</label>
            <input
              type="text"
              placeholder="e.g. 8901030800010"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              className="pos-input"
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="pos-input">
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Business Vertical Specific Attribute Inputs */}
          {activeVertical === "pharmacy" && (
            <>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Chemical Salt Composition</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol + Caffeine"
                  value={form.salt_name}
                  onChange={(e) => setForm({ ...form, salt_name: e.target.value })}
                  className="pos-input"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Batch Number</label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-882"
                  value={form.batch_no}
                  onChange={(e) => setForm({ ...form, batch_no: e.target.value })}
                  className="pos-input"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Expiry Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  className="pos-input"
                />
              </div>
            </>
          )}

          {activeVertical === "apparel" && (
            <div>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Garment Size & Color</label>
              <input
                type="text"
                placeholder="e.g. L / Navy Blue"
                value={form.size_color}
                onChange={(e) => setForm({ ...form, size_color: e.target.value })}
                className="pos-input"
              />
            </div>
          )}

          {activeVertical === "electronics" && (
            <>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Default IMEI / Serial No.</label>
                <input
                  type="text"
                  placeholder="e.g. 864201048821901"
                  value={form.imei_serial}
                  onChange={(e) => setForm({ ...form, imei_serial: e.target.value })}
                  className="pos-input"
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Warranty (Months)</label>
                <input
                  type="number"
                  placeholder="e.g. 12"
                  value={form.warranty_months}
                  onChange={(e) => setForm({ ...form, warranty_months: e.target.value })}
                  className="pos-input"
                />
              </div>
            </>
          )}

          {activeVertical === "liquor" && (
            <>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Bottle Volume Size</label>
                <select value={form.liquor_size} onChange={(e) => setForm({ ...form, liquor_size: e.target.value })} className="pos-input">
                  <option value="">Select Volume</option>
                  <option value="750ml Full">750ml Full Bottle</option>
                  <option value="375ml Half">375ml Half Bottle</option>
                  <option value="180ml Quarter">180ml Quarter</option>
                  <option value="60ml Peg">60ml Peg</option>
                  <option value="500ml Can">500ml Can</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Alcohol ABV (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 42.8"
                  value={form.alcohol_percent}
                  onChange={(e) => setForm({ ...form, alcohol_percent: e.target.value })}
                  className="pos-input"
                />
              </div>
            </>
          )}

          {activeVertical === "hardware" && (
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Material / Gauge Specification</label>
              <input
                type="text"
                placeholder="e.g. 1.5 sq mm Copper / SS-304 Grade"
                value={form.material_spec}
                onChange={(e) => setForm({ ...form, material_spec: e.target.value })}
                className="pos-input"
              />
            </div>
          )}

          {activeVertical === "jewelry" && (
            <>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Purity Karat</label>
                <select value={form.purity_karat} onChange={(e) => setForm({ ...form, purity_karat: e.target.value })} className="pos-input">
                  <option value="24K Gold">24K Pure Gold</option>
                  <option value="22K Gold">22K Standard Gold</option>
                  <option value="18K Gold">18K Jewelry Gold</option>
                  <option value="925 Silver">925 Sterling Silver</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Gross Weight (Grams)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 10.5"
                  value={form.gross_weight_gm}
                  onChange={(e) => setForm({ ...form, gross_weight_gm: e.target.value })}
                  className="pos-input"
                />
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Unit of Measurement</label>
            <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="pos-input">
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>MRP Price (₹)</label>
            <input
              type="number"
              placeholder="e.g. 100"
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              className="pos-input"
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Selling Price * (₹)</label>
            <input
              type="number"
              placeholder="e.g. 90"
              value={form.selling_price}
              onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
              className="pos-input"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Stock Quantity *</label>
            <input
              type="number"
              placeholder="Qty"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              className="pos-input"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>GST Rate (%)</label>
            <select value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} className="pos-input">
              {taxRates.map((r) => (
                <option key={r} value={r}>GST {r}%</option>
              ))}
            </select>
          </div>

          {activeVertical === "pharmacy" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "20px" }}>
              <input
                type="checkbox"
                id="is_rx"
                checked={form.is_rx}
                onChange={(e) => setForm({ ...form, is_rx: e.target.checked })}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <label htmlFor="is_rx" style={{ fontSize: "13px", fontWeight: "700", color: "#b91c1c", cursor: "pointer" }}>
                🔴 Prescription Required (Rx Only / Schedule H)
              </label>
            </div>
          )}

          <div style={{ gridColumn: "1 / -1", marginTop: "6px" }}>
            <button type="submit" className="pos-btn-primary" style={{ padding: "12px 24px" }}>
              ➕ Save Product Entry
            </button>
          </div>
        </form>
      </div>

      {/* Product Catalog Table Card & Bharat ERP Barcode Generator Button */}
      <div className="pos-card" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>Product Inventory Catalog</h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{filteredProducts.length} items listed</div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Production Feature: Bulk CSV Import Button */}
            <button
              onClick={() => setShowImportModal(true)}
              className="pos-btn-secondary"
              style={{ padding: "10px 14px", fontSize: "13px", background: "#f0fdf4", color: "#15803d", fontWeight: "700", border: "1px solid #bbf7d0" }}
            >
              📥 Bulk Import (CSV)
            </button>

            {/* Bharat ERP Feature: Print Barcode Labels Button */}
            <button
              onClick={() => {
                if (products.length > 0) setSelectedBarcodeProduct(products[0]);
                setShowBarcodeModal(true);
              }}
              className="pos-btn-secondary"
              style={{ padding: "10px 14px", fontSize: "13px", background: "#eff6ff", color: "var(--primary)", fontWeight: "700" }}
            >
              🏷️ Print Barcode Labels
            </button>

            <input
              type="text"
              placeholder="Search catalog by name, barcode, attributes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pos-input"
              style={{ width: "260px" }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--surface-alt)", textAlign: "left", color: "var(--text-muted)" }}>
                <th style={{ padding: "12px 14px", borderRadius: "6px 0 0 6px" }}>Item Name & Attributes</th>
                <th style={{ padding: "12px 14px" }}>Barcode</th>
                <th style={{ padding: "12px 14px" }}>Category</th>
                <th style={{ padding: "12px 14px" }}>MRP</th>
                <th style={{ padding: "12px 14px" }}>Selling Price</th>
                <th style={{ padding: "12px 14px" }}>Stock</th>
                <th style={{ padding: "12px 14px" }}>GST</th>
                <th style={{ padding: "12px 14px", textAlign: "right", borderRadius: "0 6px 6px 0" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const price = p.selling_price || p.mrp || p.price_full;
                const isLow = p.stock_quantity <= (p.min_stock_alert || 5);
                const isExp = p.expiry_date && p.expiry_date < todayStr;

                return (
                  <tr key={p.product_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 14px", fontWeight: "700", color: "var(--text-dark)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {p.food_type === "non_veg" && <span title="Non-Veg">🔴</span>}
                        {p.food_type === "veg" && activeVertical === "restaurant" && <span title="Veg">🟢</span>}
                        {p.food_type === "egg" && <span title="Egg">🟡</span>}
                        {p.name}
                        {p.is_rx === 1 && (
                          <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "10px", fontWeight: "800", padding: "2px 6px", borderRadius: "4px" }}>
                            Rx
                          </span>
                        )}
                      </div>

                      {/* Dynamic Domain Subtext Tags */}
                      {p.salt_name && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                          🧪 {p.salt_name} {p.batch_no ? `| B:${p.batch_no}` : ""} {p.expiry_date ? `| Exp:${p.expiry_date}` : ""}
                        </div>
                      )}
                      {p.size_color && (
                        <div style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "600" }}>
                          👕 {p.size_color}
                        </div>
                      )}
                      {p.imei_serial && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          📱 IMEI/Serial: {p.imei_serial} {p.warranty_months ? `(${p.warranty_months}m warranty)` : ""}
                        </div>
                      )}
                      {p.liquor_size && (
                        <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600" }}>
                          🍾 Vol: {p.liquor_size} {p.alcohol_percent ? `| ${p.alcohol_percent}% ABV` : ""}
                        </div>
                      )}
                      {p.material_spec && (
                        <div style={{ fontSize: "11px", color: "#475569" }}>
                          🔧 Spec: {p.material_spec}
                        </div>
                      )}
                      {p.purity_karat && activeVertical === "jewelry" && (
                        <div style={{ fontSize: "11px", color: "#b45309", fontWeight: "700" }}>
                          💎 {p.purity_karat} | Wt: {p.gross_weight_gm}g | Making: ₹{p.making_charge}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "12px" }}>{p.barcode}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span className="badge-pill badge-blue">{p.category}</span>
                    </td>
                    <td style={{ padding: "12px 14px", textDecoration: "line-through", color: "var(--text-light)" }}>₹{p.mrp || price}</td>
                    <td style={{ padding: "12px 14px", fontWeight: "800", color: "var(--accent-green)" }}>₹{price}</td>
                    <td style={{ padding: "12px 14px" }}>
                      <span className={`badge-pill ${isLow ? "badge-red" : "badge-green"}`}>
                        {p.stock_quantity} {p.unit || "pcs"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: "600" }}>{p.tax_rate || 0}%</td>
                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <button
                        onClick={() => {
                          setSelectedBarcodeProduct(p);
                          setShowBarcodeModal(true);
                        }}
                        style={{ background: "#eff6ff", color: "var(--primary)", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px", marginRight: "6px" }}
                      >
                        🏷️ Label
                      </button>
                      <button
                        onClick={() => handleDelete(p.product_id)}
                        style={{ background: "var(--accent-red-light)", color: "#b91c1c", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px" }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🏷️ BARCODE LABEL STICKER PRINT MODAL (Bharat ERP Style) */}
      {showBarcodeModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "620px", maxWidth: "95%", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-dark)" }}>
                🏷️ Barcode Sticker Label Generator
              </h3>
              <button onClick={() => setShowBarcodeModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "800" }}>✖</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Select Item for Sticker Printing:</label>
                <select
                  value={selectedBarcodeProduct ? selectedBarcodeProduct.product_id : ""}
                  onChange={(e) => {
                    const found = products.find((p) => p.product_id === Number(e.target.value));
                    setSelectedBarcodeProduct(found || null);
                  }}
                  className="pos-input"
                >
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.name} | Price: ₹{p.selling_price} | Barcode: {p.barcode || "Auto"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Sticker Qty:</label>
                <input
                  type="number"
                  value={barcodeCount}
                  onChange={(e) => setBarcodeCount(Math.max(1, Number(e.target.value)))}
                  className="pos-input"
                />
              </div>
            </div>

            {selectedBarcodeProduct && (
              <div style={{ background: "var(--surface-alt)", padding: "16px", borderRadius: "12px", marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>Live Sticker Sheet Preview ({barcodeCount} Labels):</div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                  {Array.from({ length: barcodeCount }).map((_, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "white",
                        border: "1.5px solid #000",
                        padding: "8px",
                        borderRadius: "6px",
                        textAlign: "center",
                        fontSize: "10px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                      }}
                    >
                      <div style={{ fontWeight: "800", textTransform: "uppercase", fontSize: "9px" }}>{storeInfo.store_name || "VyaparFlow Retail"}</div>
                      <div style={{ fontWeight: "700", color: "#000", fontSize: "11px", margin: "2px 0" }}>{selectedBarcodeProduct.name}</div>
                      
                      {/* Barcode Graphic simulation */}
                      <div style={{ background: "#000", color: "#fff", padding: "2px", letterSpacing: "3px", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: "800" }}>
                        ||||||||||||||||||
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", margin: "2px 0" }}>
                        {selectedBarcodeProduct.barcode || `890${selectedBarcodeProduct.product_id}001`}
                      </div>
                      
                      <div style={{ fontWeight: "800", fontSize: "11px", color: "#000" }}>
                        MRP: <span style={{ textDecoration: "line-through" }}>₹{selectedBarcodeProduct.mrp || selectedBarcodeProduct.selling_price}</span> SALE: ₹{selectedBarcodeProduct.selling_price}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => window.print()}
                className="pos-btn-success"
                style={{ flex: 1, padding: "12px", fontSize: "15px" }}
              >
                🖨️ Print Barcode Stickers
              </button>
              <button
                onClick={() => setShowBarcodeModal(false)}
                style={{ padding: "12px 20px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📥 BULK PRODUCT IMPORT MODAL */}
      {showImportModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "580px", maxWidth: "95%", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-dark)" }}>
                📥 Bulk Import Products (CSV / Excel)
              </h3>
              <button onClick={() => setShowImportModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "800" }}>✖</button>
            </div>

            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
              Upload your existing product catalog in CSV format to import hundreds of products in seconds.
            </p>

            <div style={{ background: "var(--surface-alt)", padding: "16px", borderRadius: "12px", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: "700" }}>Step 1: Download Template</span>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="pos-btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "11px", fontWeight: "700" }}
                >
                  📄 Download Sample CSV Template
                </button>
              </div>

              <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "10px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Step 2: Select Your Prepared CSV File:</label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  style={{ fontSize: "13px" }}
                />
              </div>

              {importMsg && (
                <div style={{ padding: "8px 12px", borderRadius: "6px", background: importMsg.includes("❌") ? "#fee2e2" : "#f0fdf4", color: importMsg.includes("❌") ? "#b91c1c" : "#15803d", fontSize: "12px", fontWeight: "700" }}>
                  {importMsg}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleExecuteImport}
                disabled={importData.length === 0 || importLoading}
                className="pos-btn-success"
                style={{ flex: 1, padding: "12px", fontSize: "15px", opacity: importData.length > 0 ? 1 : 0.5 }}
              >
                {importLoading ? "Importing..." : `🚀 Import ${importData.length} Products Now`}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportData([]);
                  setImportMsg("");
                }}
                style={{ padding: "12px 20px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}