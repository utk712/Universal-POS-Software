import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config";
import RupeeTreeBackground from "../components/RupeeTreeBackground";

export default function Register() {
  const [step, setStep] = useState(1);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [storeName, setStoreName] = useState("");
  const [gstin, setGstin] = useState("");
  const [activeVertical, setActiveVertical] = useState("supermarket");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // All 8 Market Businesses in the daily Indian market
  const marketBusinesses = [
    {
      id: "supermarket",
      icon: "🛒",
      title: "Supermarket / Kirana / DMart",
      description: "Barcode scanning, loose items weight (kg/gm), MRP discount badges & fast billing."
    },
    {
      id: "liquor",
      icon: "🍺",
      title: "Liquor Store / Wine & Beer Shop",
      description: "Bottle sizes (750ml, 375ml, 180ml), excise brand categories & fast cash billing."
    },
    {
      id: "restaurant",
      icon: "🍽️",
      title: "Restaurant / Cafe / Hotel / Bakery",
      description: "Table layout management, Dine-in vs Takeaway, KDS kitchen order tokens."
    },
    {
      id: "apparel",
      icon: "👕",
      title: "Apparel & Footwear Boutique",
      description: "Size variants (S, M, L, XL), Color variants, Brand & Style code tracking."
    },
    {
      id: "electronics",
      icon: "📱",
      title: "Electronics / Mobile & Hardware",
      description: "Serial Number & IMEI tracking, Warranty duration receipts & quote billing."
    },
    {
      id: "pharmacy",
      icon: "💊",
      title: "Pharmacy / Medical & Chemist",
      description: "Batch number entry, Expiry date alert badges & prescription notes."
    },
    {
      id: "salon",
      icon: "✂️",
      title: "Salon, Spa & Beauty Services",
      description: "Service packages, Staff commission tracking & appointment duration."
    },
    {
      id: "general",
      icon: "🏬",
      title: "General Retail / Custom Store",
      description: "Custom units of measure, flexible product catalog & quick checkout."
    }
  ];

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!name || !email || !password || !mobile) {
      setMessage("Please fill in all store admin details ❌");
      return;
    }
    setMessage("");
    setStep(2);
  };

  const handleFinalRegister = async (e) => {
    e.preventDefault();
    if (!storeName) {
      setMessage("Please enter your Store / Business Name ❌");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          mobile,
          store_name: storeName,
          gstin,
          active_vertical: activeVertical
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Admin setup completed! Redirecting to login... ✅");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        setMessage(data.message || "Registration failed ❌");
      }
    } catch {
      setMessage("Server connection failed. Make sure backend is running ❌");
    }

    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <RupeeTreeBackground showBothSides={true}>
      <div
        className="animate-fade-in"
        style={{
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          width: step === 1 ? "440px" : "880px",
          maxWidth: "100%",
          padding: "36px 32px",
          boxShadow: "0 30px 60px -12px rgba(0,0,0,0.9), 0 0 45px rgba(234, 88, 12, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          transition: "all 0.3s ease",
          boxSizing: "border-box"
        }}
      >
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #7c3aed, #ea580c)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: "900",
              marginBottom: "10px",
              boxShadow: "0 6px 16px rgba(234, 88, 12, 0.35)"
            }}
          >
            ₹
          </div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: "22px", fontWeight: "800" }}>
            {step === 1 ? "Step 1: Admin Account Setup" : "Step 2: Select Your Market Business"}
          </h2>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            {step === 1 ? "Create your primary store owner login credentials" : "Choose your business vertical so our software adapts to your exact needs"}
          </div>
        </div>

        {message && (
          <div style={{ background: message.includes("✅") ? "#dcfce7" : "#fee2e2", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "12px", borderRadius: "8px", marginBottom: "18px", textAlign: "center", fontSize: "13px", fontWeight: "700" }}>
            {message}
          </div>
        )}

        {/* STEP 1: ADMIN CREDENTIALS */}
        {step === 1 && (
          <>
            <form onSubmit={handleNextStep}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Shop Owner / Admin Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pos-input"
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Mobile Number *</label>
                <input
                  type="text"
                  placeholder="9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="pos-input"
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Email Address (Login ID) *</label>
                <input
                  type="email"
                  placeholder="owner@posstore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pos-input"
                  required
                />
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Password *</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pos-input"
                  required
                />
              </div>

              <button type="submit" className="pos-btn-primary" style={{ width: "100%", padding: "14px", fontSize: "15px", borderRadius: "10px", marginBottom: "14px" }}>
                Next: Select Business Type ➔
              </button>
            </form>

            <div style={{ textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginTop: "10px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Already have a registered account? </span>
              <button
                type="button"
                onClick={() => navigate("/")}
                style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "12px", cursor: "pointer", textDecoration: "underline" }}
              >
                🔒 Sign In to POS
              </button>
            </div>
          </>
        )}

        {/* STEP 2: SELECT MARKET BUSINESS TYPE */}
        {step === 2 && (
          <form onSubmit={handleFinalRegister}>
            
            {/* Store Name & GSTIN Input */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>Store / Shop Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Wine Shop / Sharma Kirana"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="pos-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "block", marginBottom: "4px" }}>GSTIN Registration (Optional)</label>
                <input
                  type="text"
                  placeholder="22AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="pos-input"
                />
              </div>
            </div>

            <label style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", display: "block", marginBottom: "10px" }}>
              Choose Your Daily Market Business Vertical:
            </label>

            {/* Grid of Market Businesses */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {marketBusinesses.map((biz) => {
                const isSelected = activeVertical === biz.id;

                return (
                  <div
                    key={biz.id}
                    onClick={() => setActiveVertical(biz.id)}
                    style={{
                      border: isSelected ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                      background: isSelected ? "#eff6ff" : "#f8fafc",
                      borderRadius: "12px",
                      padding: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      flexDirection: "column",
                      justify: "space-between",
                      boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.2)" : "none"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "28px", marginBottom: "6px" }}>{biz.icon}</div>
                      <div style={{ fontSize: "13px", fontWeight: "800", color: isSelected ? "#1d4ed8" : "#0f172a", marginBottom: "4px" }}>
                        {biz.title}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.3" }}>
                        {biz.description}
                      </div>
                    </div>

                    <div style={{ marginTop: "10px", textAlign: "right" }}>
                      <span style={{ fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", background: isSelected ? "#2563eb" : "#cbd5e1", color: isSelected ? "white" : "#475569" }}>
                        {isSelected ? "Selected ✅" : "Select"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ padding: "14px 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
              >
                ⬅️ Back
              </button>

              <button
                type="submit"
                disabled={loading}
                className="pos-btn-success"
                style={{ flex: 1, padding: "14px", fontSize: "16px", borderRadius: "10px" }}
              >
                {loading ? "Configuring Software..." : "🚀 Complete Setup & Launch POS"}
              </button>
            </div>
          </form>
        )}
      </div>
    </RupeeTreeBackground>
  );
}