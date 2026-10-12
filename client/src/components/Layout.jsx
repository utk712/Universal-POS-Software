import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout, getRole } from "../utils/auth";
import API_URL from "../config";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();
  const [storeInfo, setStoreInfo] = useState({});
  const [showVerticalMenu, setShowVerticalMenu] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [counters, setCounters] = useState([]);
  const [selectedCounterCode, setSelectedCounterCode] = useState(
    localStorage.getItem("active_counter_code") || "C1"
  );

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Heartbeat for Active Cashier / Counter
  useEffect(() => {
    const pingHeartbeat = () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u && u.user_id) {
            fetch(`${API_URL}/api/auth/heartbeat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: u.user_id })
            }).catch(() => {});
          }
        }
      } catch {}
    };

    pingHeartbeat();
    const heartbeatTimer = setInterval(pingHeartbeat, 30000); // every 30s
    return () => clearInterval(heartbeatTimer);
  }, []);

  const fetchStoreSettings = () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_URL}/api/business/settings`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data && (data.store_name || data.active_vertical)) {
          setStoreInfo(data);
        }
      })
      .catch(() => {});
  };

  // Fetch Store Info & Billing Counters
  useEffect(() => {
    fetchStoreSettings();

    const onSettingsUpdate = (e) => {
      if (e.detail) {
        setStoreInfo((prev) => ({ ...prev, ...e.detail }));
      } else {
        fetchStoreSettings();
      }
    };

    const onVerticalChange = (e) => {
      if (e.detail) {
        setStoreInfo((prev) => ({ ...prev, active_vertical: e.detail }));
      } else {
        fetchStoreSettings();
      }
    };

    window.addEventListener("store-settings-updated", onSettingsUpdate);
    window.addEventListener("business-vertical-changed", onVerticalChange);

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_URL}/api/counters`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setCounters(data);
            const activeCode = localStorage.getItem("active_counter_code") || "C1";
            const match = data.find((c) => c.counter_code === activeCode) || data[0];
            if (match) {
              localStorage.setItem("active_counter_id", match.counter_id);
              localStorage.setItem("active_counter_code", match.counter_code);
              localStorage.setItem("active_counter_name", match.counter_name);
            }
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("store-settings-updated", onSettingsUpdate);
      window.removeEventListener("business-vertical-changed", onVerticalChange);
    };
  }, [location.pathname]);

  const handleQuickVerticalSwitch = async (vKey) => {
    setShowVerticalMenu(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/business/vertical`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ vertical: vKey })
      });
      if (res.ok) {
        const data = await res.json();
        setStoreInfo((prev) => ({ ...prev, active_vertical: vKey }));
        window.dispatchEvent(new CustomEvent("business-vertical-changed", { detail: vKey }));
        window.dispatchEvent(new CustomEvent("store-settings-updated", { detail: { ...storeInfo, active_vertical: vKey } }));
      }
    } catch (err) {
      console.error("Vertical switch failed:", err);
    }
  };

  const handleCounterChange = (e) => {
    const code = e.target.value;
    setSelectedCounterCode(code);
    localStorage.setItem("active_counter_code", code);
    const match = counters.find((c) => c.counter_code === code);
    if (match) {
      localStorage.setItem("active_counter_id", match.counter_id);
      localStorage.setItem("active_counter_name", match.counter_name);
    }
  };

  const navItem = (path, label, icon) => {
    const isActive = location.pathname === path;

    return (
      <div
        onClick={() => navigate(path)}
        style={{
          position: "relative",
          padding: "10px 14px",
          borderRadius: "10px",
          cursor: "pointer",
          marginBottom: "5px",
          background: isActive ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "transparent",
          color: isActive ? "#ffffff" : "#94a3b8",
          fontWeight: isActive ? "700" : "500",
          fontSize: "13px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          transition: "all 0.15s ease",
          boxShadow: isActive ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none"
        }}
      >
        <span style={{ fontSize: "15px" }}>{icon}</span>
        <span>{label}</span>

        {isActive && (
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "20%",
              height: "60%",
              width: "4px",
              background: "#60a5fa",
              borderRadius: "0 4px 4px 0"
            }}
          />
        )}
      </div>
    );
  };

  const verticalBadges = {
    liquor: "🍾 Liquor & Wine Shop Mode",
    supermarket: "🛒 Supermarket / Kirana Mode",
    pharmacy: "💊 Pharmacy & Medical Mode",
    restaurant: "🍽️ Restaurant & Cafe Mode",
    apparel: "👕 Apparel & Fashion Mode",
    electronics: "📱 Electronics & Hardware Mode",
    salon: "✂️ Salon & Services Mode",
    hardware: "🔧 Hardware & Tools Mode",
    jewelry: "💎 Jewelry & Gold Mode",
    general: "🏬 General Retail Mode"
  };

  const verticalIcons = {
    liquor: "🍾",
    supermarket: "🛒",
    pharmacy: "💊",
    restaurant: "🍽️",
    apparel: "👕",
    electronics: "📱",
    salon: "✂️",
    hardware: "🔧",
    jewelry: "💎",
    general: "🏬"
  };

  const verticalBadgeStyles = {
    liquor: { bg: "#fef3c7", border: "#fde68a", color: "#92400e" },      // warm amber/wine
    supermarket: { bg: "#ecfdf5", border: "#a7f3d0", color: "#065f46" }, // emerald green
    pharmacy: { bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" },    // clinical blue
    restaurant: { bg: "#fff7ed", border: "#fed7aa", color: "#9a3412" },  // culinary orange
    apparel: { bg: "#fdf2f8", border: "#fbcfe8", color: "#9d174d" },     // rose/pink
    electronics: { bg: "#f5f3ff", border: "#ddd6fe", color: "#5b21b6" }, // purple/indigo
    salon: { bg: "#fdf4ff", border: "#f5d0fe", color: "#86198f" },       // fuchsia
    hardware: { bg: "#f8fafc", border: "#cbd5e1", color: "#334155" },    // slate
    jewelry: { bg: "#fefce8", border: "#fef08a", color: "#854d0e" },     // gold
    general: { bg: "#f1f5f9", border: "#cbd5e1", color: "#334155" }
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-main)", overflow: "hidden" }}>
      
      {/* 🚀 Dark Navigation Sidebar */}
      <div
        style={{
          width: "255px",
          background: "#090d16",
          color: "white",
          padding: "18px 12px",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #1e293b",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)"
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: "0 8px 16px 8px", borderBottom: "1px solid #1e293b", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563eb, #10b981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                boxShadow: "0 2px 8px rgba(37,99,235,0.4)"
              }}
            >
              {verticalIcons[storeInfo.active_vertical] || "🍾"}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.3px" }}>
                {storeInfo.store_name || "VyaparFlow POS"}
              </h2>
              <div style={{ fontSize: "11px", color: "#10b981", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                Online & Ready
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "2px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "1px", padding: "0 8px 6px 8px" }}>
            Main Billing
          </div>
          {navItem("/sales", "POS Terminal", "⚡")}
          {navItem("/customers", "Customers & Khata", "📒")}

          {role === "admin" && (
            <>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "1px", padding: "10px 8px 6px 8px" }}>
                Financial Control
              </div>
              {navItem("/finance", "Finance & Tally Sync", "📊")}
              {navItem("/expenses", "Shop Expenses", "💸")}
              {navItem("/vendors", "Suppliers & Payables", "🏭")}

              <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "1px", padding: "10px 8px 6px 8px" }}>
                Store Operations
              </div>
              {navItem("/inventory", "Inventory Catalog", "📦")}
              {navItem("/reports", "Reports & Sales", "📈")}
              {navItem("/settings", "Business Setup", "⚙️")}
              {navItem("/add-employee", "Staff & Cashiers", "👥")}
            </>
          )}
        </div>

        {/* User Profile & Logout */}
        <div style={{ borderTop: "1px solid #1e293b", paddingTop: "12px", marginTop: "8px" }}>
          <div
            style={{
              background: "#1e293b",
              borderRadius: "8px",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#3b82f6", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "13px" }}>
                {role ? role[0].toUpperCase() : "C"}
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#ffffff" }}>
                  {role === "admin" ? "Store Admin" : "Active Cashier"}
                </div>
                <div style={{ fontSize: "10px", color: "#94a3b8", textTransform: "capitalize" }}>
                  Role: {role || "Cashier"}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              width: "100%",
              background: "#ef4444",
              color: "white",
              border: "none",
              padding: "8px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </div>

      {/* 🖥️ Main Canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Header Bar */}
        <div
          style={{
            background: "var(--surface)",
            height: "60px",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "var(--shadow-sm)",
            borderBottom: "1px solid var(--border)",
            zIndex: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)", letterSpacing: "-0.2px" }}>
              {location.pathname.replace("/", "").toUpperCase() || "POS TERMINAL"}
            </h3>

            {/* Dynamic Interactive Vertical Badge */}
            <div style={{ position: "relative" }}>
              <div
                onClick={() => role === "admin" && setShowVerticalMenu(!showVerticalMenu)}
                title={role === "admin" ? "Click to switch business vertical" : "Active Business Mode"}
                style={{
                  background: verticalBadgeStyles[storeInfo.active_vertical]?.bg || "#fef3c7",
                  border: `1px solid ${verticalBadgeStyles[storeInfo.active_vertical]?.border || "#fde68a"}`,
                  color: verticalBadgeStyles[storeInfo.active_vertical]?.color || "#92400e",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "800",
                  cursor: role === "admin" ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "all 0.2s ease"
                }}
              >
                <span>{verticalBadges[storeInfo.active_vertical] || "🍾 Liquor & Wine Shop Mode"}</span>
                {role === "admin" && <span style={{ fontSize: "9px", opacity: 0.7 }}>▼</span>}
              </div>

              {showVerticalMenu && role === "admin" && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 99 }}
                    onClick={() => setShowVerticalMenu(false)}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "32px",
                      left: "0",
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
                      padding: "8px",
                      width: "260px",
                      zIndex: 100,
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px"
                    }}
                  >
                    <div style={{ fontSize: "10px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", padding: "4px 8px" }}>
                      Switch Business Vertical
                    </div>
                    {Object.entries(verticalBadges).map(([vKey, vLabel]) => (
                      <div
                        key={vKey}
                        onClick={() => handleQuickVerticalSwitch(vKey)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: storeInfo.active_vertical === vKey ? "800" : "600",
                          color: storeInfo.active_vertical === vKey ? "#1e40af" : "#334155",
                          background: storeInfo.active_vertical === vKey ? "#eff6ff" : "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                        onMouseEnter={(e) => {
                          if (storeInfo.active_vertical !== vKey) e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          if (storeInfo.active_vertical !== vKey) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span>{vLabel}</span>
                        {storeInfo.active_vertical === vKey && <span style={{ color: "#2563eb" }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                background: "#e0e7ff",
                border: "1px solid #c7d2fe",
                color: "#3730a3",
                padding: "3px 10px",
                borderRadius: "20px",
                fontSize: "11px",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>📍 Counter:</span>
              <select
                value={selectedCounterCode}
                onChange={handleCounterChange}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#3730a3",
                  fontWeight: "800",
                  fontSize: "11px",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                {counters.map((c) => (
                  <option key={c.counter_id} value={c.counter_code}>
                    {c.counter_code} - {c.counter_name}
                  </option>
                ))}
                {counters.length === 0 && <option value="C1">C1 - Counter 1</option>}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: "700", color: "var(--primary)" }}>
                {currentTime.toLocaleTimeString("en-IN")}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>
                {currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>

            <div
              onClick={() => navigate("/sales")}
              style={{
                background: "var(--primary-light)",
                border: "1px solid var(--primary-border)",
                color: "var(--primary-hover)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              <span>⚡ F2 POS Billing</span>
            </div>
          </div>
        </div>

        {/* Dynamic Page */}
        <div style={{ flex: 1, padding: "16px", overflowY: "auto", background: "var(--bg-main)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}