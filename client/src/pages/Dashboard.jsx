import { useEffect, useState } from "react";
import API_URL from "../config";

export default function Dashboard() {
  const [data, setData] = useState({
    totalSales: 0,
    totalOrders: 0,
    lowStock: 0
  });

  const [loading, setLoading] = useState(true);

  // 🔄 Fetch dashboard data
  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard`);
      const result = await res.json();

      // ✅ FIX: map backend → frontend
      setData({
        totalSales: result.today_sales || 0,
        totalOrders: result.total_orders || 0,
        lowStock: result.low_stock || 0
      });

      setLoading(false);

    } catch (err) {
      console.log("Dashboard error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // 🔥 OPTIONAL: auto refresh every 5 sec
    const interval = setInterval(fetchDashboard, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px"
        }}>
          
          {/* 💰 Total Sales */}
          <div style={cardStyle}>
            <h4>Today's Sales</h4>
            <h2>₹ {data.totalSales}</h2>
          </div>

          {/* 🧾 Orders */}
          <div style={cardStyle}>
            <h4>Total Orders</h4>
            <h2>{data.totalOrders}</h2>
          </div>

          {/* 📦 Low Stock */}
          <div style={cardStyle}>
            <h4>Low Stock</h4>
            <h2>{data.lowStock}</h2>
          </div>

        </div>
      )}
    </div>
  );
}

// 🎨 Card styling
const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "8px",
  flex: 1,
  boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  textAlign: "center"
};