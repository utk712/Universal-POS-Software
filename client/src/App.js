import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Dashboard from "./pages/Dashboard";
import AddEmployee from "./pages/AddEmployee";
import Reports from "./pages/Reports";
import Customers from "./pages/Customers";
import BusinessSettings from "./pages/BusinessSettings";
import FinanceDashboard from "./pages/FinanceDashboard";
import Expenses from "./pages/Expenses";
import Vendors from "./pages/Vendors";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* POS Sales Terminal (Cashiers & Admins) */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout>
                <FinanceDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/expenses"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout>
                <Expenses />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendors"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout>
                <Vendors />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout>
                <BusinessSettings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-employee"
          element={
            <ProtectedRoute roleRequired="admin">
              <Layout>
                <AddEmployee />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 🛡️ Catch-All Route (Prevents Blank White Screen on any invalid URL) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;