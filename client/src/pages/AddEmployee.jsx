import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../utils/auth";
import API_URL from "../config";

export default function AddEmployee() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // Add Employee Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [formLoading, setFormLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);

  // Fetch all staff users
  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
          setLastSync(new Date());
        }
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial Load + Auto-Sync every 5 seconds
  useEffect(() => {
    fetchUsers(false);
    const syncInterval = setInterval(() => {
      fetchUsers(true);
    }, 5000);

    return () => clearInterval(syncInterval);
  }, [fetchUsers]);

  // Show Toast Banner
  const notify = (text, type = "success") => {
    setBannerMessage({ text, type });
    setTimeout(() => setBannerMessage(null), 4000);
  };

  // Add Cashier Handler
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      notify("Please fill all required fields", "error");
      return;
    }

    setFormLoading(true);
    try {
      const res = await authFetch(`${API_URL}/api/users/add-employee`, {
        method: "POST",
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Cashier "${name}" added successfully! ✅`, "success");
        setName("");
        setEmail("");
        setPassword("");
        setRole("cashier");
        setShowAddModal(false);
        fetchUsers(true);
      } else {
        notify(data.message || "Failed to create account", "error");
      }
    } catch {
      notify("Network error while adding user", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Account Active / Disabled Status
  const handleToggleStatus = async (user) => {
    if (user.role === "admin") {
      notify("Admin account cannot be deactivated", "error");
      return;
    }

    const newStatus = user.status === "disabled" ? "active" : "disabled";
    const confirmMsg = newStatus === "disabled"
      ? `Are you sure you want to deactivate cashier "${user.name}"? They will not be able to log in or bill.`
      : `Re-activate cashier account for "${user.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await authFetch(`${API_URL}/api/users/${user.user_id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Account for "${user.name}" is now ${newStatus.toUpperCase()} ✅`, "success");
        fetchUsers(true);
      } else {
        notify(data.message || "Failed to update status", "error");
      }
    } catch {
      notify("Error updating account status", "error");
    }
  };

  // Delete Cashier
  const handleDeleteUser = async (user) => {
    if (user.role === "admin") {
      notify("Admin account cannot be deleted", "error");
      return;
    }

    if (!window.confirm(`⚠️ Permanently remove cashier account "${user.name}" (${user.email})? Historical invoices will remain intact.`)) {
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/users/${user.user_id}`, {
        method: "DELETE"
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Account "${user.name}" deleted successfully ✅`, "success");
        fetchUsers(true);
      } else {
        notify(data.message || "Failed to delete account", "error");
      }
    } catch {
      notify("Error deleting user account", "error");
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword || newPassword.length < 4) {
      notify("Password must be at least 4 characters", "error");
      return;
    }

    try {
      const res = await authFetch(`${API_URL}/api/users/${resetModalUser.user_id}/reset-password`, {
        method: "POST",
        body: JSON.stringify({ newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        notify(`Password for "${resetModalUser.name}" reset successfully! ✅`, "success");
        setResetModalUser(null);
        setNewPassword("");
      } else {
        notify(data.message || "Failed to reset password", "error");
      }
    } catch {
      notify("Error resetting password", "error");
    }
  };

  // Format Date / Time Helper
  const formatTime = (isoString) => {
    if (!isoString) return "Never logged in";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
  };

  // KPI Calculations
  const totalUsers = users.length;
  const onlineCashiers = users.filter((u) => u.is_online === 1);
  const activeUsers = users.filter((u) => u.status !== "disabled");
  const disabledUsers = users.filter((u) => u.status === "disabled");

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "20px 10px" }}>
      {/* Toast Notification Banner */}
      {bannerMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 9999,
            padding: "14px 20px",
            borderRadius: "10px",
            background: bannerMessage.type === "success" ? "#065f46" : "#991b1b",
            color: "white",
            fontWeight: "700",
            fontSize: "14px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <span>{bannerMessage.type === "success" ? "✅" : "⚠️"}</span>
          <span>{bannerMessage.text}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#0f172a" }}>
              👥 Cashier & Staff Command Center
            </h1>
            <span
              style={{
                background: "#ecfdf5",
                color: "#059669",
                border: "1px solid #a7f3d0",
                padding: "3px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10b981",
                  boxShadow: "0 0 6px #10b981"
                }}
              />
              Live Master Sync (5s)
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
            Real-time counter visibility, active cashier status monitoring, and terminal access control for Master PC.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => fetchUsers(false)}
            style={{
              padding: "10px 16px",
              background: "white",
              color: "#334155",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            🔄 Refresh ({lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "10px 18px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
            }}
          >
            ➕ Register New Cashier
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        {/* Total Staff */}
        <div
          style={{
            background: "white",
            padding: "18px 20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Staff Accounts
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>{totalUsers}</span>
            <span style={{ fontSize: "22px" }}>👥</span>
          </div>
          <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px", fontWeight: "600" }}>
            {activeUsers.length} Active in store
          </div>
        </div>

        {/* Counters Online Now */}
        <div
          style={{
            background: onlineCashiers.length > 0 ? "linear-gradient(135deg, #064e3b, #047857)" : "white",
            color: onlineCashiers.length > 0 ? "white" : "#0f172a",
            padding: "18px 20px",
            borderRadius: "12px",
            border: onlineCashiers.length > 0 ? "none" : "1px solid #e2e8f0",
            boxShadow: onlineCashiers.length > 0 ? "0 8px 20px rgba(4,120,87,0.3)" : "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: onlineCashiers.length > 0 ? "#a7f3d0" : "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}
          >
            Counters Online Now
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800" }}>{onlineCashiers.length}</span>
            <span style={{ fontSize: "22px" }}>⚡</span>
          </div>
          <div
            style={{
              fontSize: "12px",
              color: onlineCashiers.length > 0 ? "#d1fae5" : "#64748b",
              marginTop: "4px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: onlineCashiers.length > 0 ? "#34d399" : "#94a3b8",
                boxShadow: onlineCashiers.length > 0 ? "0 0 8px #34d399" : "none"
              }}
            />
            {onlineCashiers.length > 0 ? "Live Terminals Active" : "No Cashiers Billing"}
          </div>
        </div>

        {/* Total Orders Handled */}
        <div
          style={{
            background: "white",
            padding: "18px 20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Invoices Handled
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>
              {users.reduce((acc, u) => acc + (u.total_orders || 0), 0)}
            </span>
            <span style={{ fontSize: "22px" }}>🧾</span>
          </div>
          <div style={{ fontSize: "12px", color: "#2563eb", marginTop: "4px", fontWeight: "600" }}>
            ₹{users.reduce((acc, u) => acc + (u.total_sales_amount || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} Total Revenue
          </div>
        </div>

        {/* Suspended Accounts */}
        <div
          style={{
            background: "white",
            padding: "18px 20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Suspended Accounts
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: disabledUsers.length > 0 ? "#dc2626" : "#0f172a" }}>
              {disabledUsers.length}
            </span>
            <span style={{ fontSize: "22px" }}>🔒</span>
          </div>
          <div style={{ fontSize: "12px", color: disabledUsers.length > 0 ? "#dc2626" : "#64748b", marginTop: "4px", fontWeight: "600" }}>
            {disabledUsers.length > 0 ? "Terminal Access Blocked" : "All Accounts Active"}
          </div>
        </div>
      </div>

      {/* Cashier Directory Table Card */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f8fafc"
          }}
        >
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
            📋 Master Cashier Directory & Live Counter Status
          </h2>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            Showing <strong>{users.length}</strong> staff accounts
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            🔄 Loading cashier records from Master Database...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            No cashier accounts found. Click <strong>"Register New Cashier"</strong> above to add your first counter operator.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", color: "#475569", fontWeight: "700", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px" }}>Staff Member</th>
                  <th style={{ padding: "12px 16px" }}>Role</th>
                  <th style={{ padding: "12px 16px" }}>Live Status</th>
                  <th style={{ padding: "12px 16px" }}>Last Login & Terminal</th>
                  <th style={{ padding: "12px 16px" }}>Invoices Handled</th>
                  <th style={{ padding: "12px 16px" }}>Sales Volume</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Master Controls</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isOnline = u.is_online === 1;
                  const isDisabled = u.status === "disabled";

                  return (
                    <tr
                      key={u.user_id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: isDisabled ? "#fef2f2" : isOnline ? "#f0fdf4" : "white",
                        transition: "background 0.2s"
                      }}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: u.role === "admin" ? "#7c3aed" : isOnline ? "#059669" : "#64748b",
                              color: "white",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: "700",
                              fontSize: "14px"
                            }}
                          >
                            {u.name ? u.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "#0f172a" }}>
                              {u.name}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            background: u.role === "admin" ? "#ede9fe" : "#e0f2fe",
                            color: u.role === "admin" ? "#6d28d9" : "#0369a1"
                          }}
                        >
                          {u.role === "admin" ? "👑 Admin" : "🛒 Cashier"}
                        </span>
                      </td>

                      {/* Live Status Badge */}
                      <td style={{ padding: "14px 16px" }}>
                        {isDisabled ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "#fee2e2",
                              color: "#b91c1c",
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "700"
                            }}
                          >
                            🚫 Disabled
                          </span>
                        ) : isOnline ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: "#dcfce7",
                              color: "#15803d",
                              padding: "3px 10px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "700"
                            }}
                          >
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "50%",
                                background: "#16a34a",
                                boxShadow: "0 0 6px #16a34a"
                              }}
                            />
                            🟢 Online Now
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "#f1f5f9",
                              color: "#64748b",
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "600"
                            }}
                          >
                            ⚪ Offline
                          </span>
                        )}
                      </td>

                      {/* Last Login & IP */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ color: "#334155", fontWeight: "600" }}>
                          {formatTime(u.last_login)}
                        </div>
                        {u.login_ip && (
                          <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>
                            Counter IP: <code>{u.login_ip}</code>
                          </div>
                        )}
                      </td>

                      {/* Invoices Handled */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: "700", color: "#0f172a" }}>
                          {u.total_orders}
                        </span>{" "}
                        bills
                      </td>

                      {/* Sales Volume */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: "700", color: "#059669" }}>
                          ₹{Number(u.total_sales_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          {/* Toggle Active/Disabled */}
                          {u.role !== "admin" && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              title={isDisabled ? "Re-activate account" : "Temporarily disable account"}
                              style={{
                                padding: "6px 10px",
                                fontSize: "11px",
                                fontWeight: "700",
                                borderRadius: "6px",
                                border: "1px solid",
                                cursor: "pointer",
                                background: isDisabled ? "#dcfce7" : "#fff1f2",
                                color: isDisabled ? "#15803d" : "#be123c",
                                borderColor: isDisabled ? "#bbf7d0" : "#fecdd3"
                              }}
                            >
                              {isDisabled ? "✅ Enable" : "⏸️ Disable"}
                            </button>
                          )}

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword("");
                            }}
                            title="Reset cashier password"
                            style={{
                              padding: "6px 10px",
                              fontSize: "11px",
                              fontWeight: "600",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              background: "white",
                              color: "#334155",
                              cursor: "pointer"
                            }}
                          >
                            🔑 Password
                          </button>

                          {/* Delete */}
                          {u.role !== "admin" && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete staff account"
                              style={{
                                padding: "6px 10px",
                                fontSize: "11px",
                                fontWeight: "600",
                                borderRadius: "6px",
                                border: "1px solid #fee2e2",
                                background: "white",
                                color: "#ef4444",
                                cursor: "pointer"
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ➕ Modal: Register New Cashier */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "white",
              width: "100%",
              maxWidth: "460px",
              borderRadius: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
                ➕ Register New Cashier / Staff
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ padding: "20px" }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Login Email / Username *
                </label>
                <input
                  type="email"
                  placeholder="ramesh@posstore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Temporary Login Password *
                </label>
                <input
                  type="password"
                  placeholder="At least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box"
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                  Counter Role & Permission
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: "white"
                  }}
                >
                  <option value="cashier">🛒 Cashier (POS Billing Terminal Only)</option>
                  <option value="admin">👑 Store Admin (Full Managerial & Financial Control)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: "10px 16px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: "10px 20px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  {formLoading ? "Creating Account..." : "Create Account ✅"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔑 Modal: Reset Password */}
      {resetModalUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div
            style={{
              background: "white",
              width: "100%",
              maxWidth: "400px",
              borderRadius: "14px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              overflow: "hidden"
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                🔑 Reset Password for {resetModalUser.name}
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#64748b"
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} style={{ padding: "20px" }}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (min 4 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box"
                  }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  style={{
                    padding: "10px 16px",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 18px",
                    background: "#059669",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Update Password ✅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}