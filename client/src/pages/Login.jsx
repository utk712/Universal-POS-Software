import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config";
import { saveAuthData } from "../utils/auth";
import RupeeTreeBackground from "../components/RupeeTreeBackground";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const hasChecked = useRef(false);

  // 🔍 Admin check (redirects to setup/register if no admin exists)
  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkAdmin = async () => {
      let attempts = 0;
      while (attempts < 3) {
        try {
          const res = await fetch(`${API_URL}/api/auth/check-admin`);
          if (res.ok) {
            const data = await res.json();
            if (!data.exists) {
              navigate("/register", { replace: true });
            }
            return;
          }
        } catch {}
        await new Promise((res) => setTimeout(res, 800));
        attempts++;
      }
    };

    checkAdmin();
  }, [navigate]);

  // 🔐 Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please enter email and password ❌");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        saveAuthData(data.token, data.role, data.user);
        setMessage("Login successful! Redirecting... ✅");

        setTimeout(() => {
          if (data.role === "admin") {
            navigate("/sales", { replace: true });
          } else {
            navigate("/sales", { replace: true });
          }
        }, 500);
      } else {
        setMessage(data.message || "Invalid credentials ❌");
      }
    } catch {
      setMessage("Server error. Please check backend status ❌");
    }

    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <RupeeTreeBackground showBothSides={true}>
      <div
        className="animate-fade-in"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          padding: "38px 34px",
          borderRadius: "22px",
          width: "410px",
          maxWidth: "92vw",
          boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.95), 0 0 50px rgba(168, 85, 247, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.45)",
          boxSizing: "border-box"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #7c3aed, #ea580c)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              fontWeight: "900",
              marginBottom: "12px",
              boxShadow: "0 8px 20px rgba(234, 88, 12, 0.4)"
            }}
          >
            ₹
          </div>
          <h2 style={{ margin: "0 0 4px 0", color: "#0f172a", fontSize: "24px", fontWeight: "900" }}>VyaparFlow POS</h2>
          <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>Sign in to open register & start billing</div>
        </div>

        {message && (
          <div style={{ background: message.includes("✅") ? "#dcfce7" : "#fee2e2", color: message.includes("✅") ? "#15803d" : "#b91c1c", padding: "10px", borderRadius: "8px", marginBottom: "15px", textAlign: "center", fontSize: "13px", fontWeight: "bold" }}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#334155", display: "block", marginBottom: "4px" }}>Email Address</label>
            <input
              type="email"
              placeholder="admin@pos.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#334155", display: "block", marginBottom: "4px" }}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#94a3b8" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "15px",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)"
            }}
          >
            {loading ? "Authenticating..." : "🔒 Sign In to POS"}
          </button>
        </form>

        <div style={{ textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "14px", marginTop: "10px" }}>
          <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "6px" }}>First time installing or setup new store?</div>
          <button
            type="button"
            onClick={() => navigate("/register")}
            style={{ background: "transparent", border: "none", color: "#ea580c", fontWeight: "700", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}
          >
            🆕 Register New Business & Select Vertical
          </button>
        </div>
      </div>
    </RupeeTreeBackground>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  fontSize: "14px"
};

export default Login;