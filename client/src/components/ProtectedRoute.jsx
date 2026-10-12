import { Navigate } from "react-router-dom";
import { isTokenValid, getRole } from "../utils/auth";

function ProtectedRoute({ children, roleRequired }) {
  const valid = isTokenValid();
  const role = getRole();

  // ❌ Not logged in or expired token
  if (!valid) {
    return <Navigate to="/" replace />;
  }

  // ❌ Wrong role
  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/sales" replace />;
  }

  return children;
}

export default ProtectedRoute;