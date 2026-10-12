const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/authConfig");

// 🔐 Verify JWT Token
exports.verifyToken = (req, res, next) => {
  let token = req.headers.authorization || req.headers.Authorization;

  if (!token) {
    return res.status(401).json({ message: "Access denied. Authentication token required." });
  }

  // Handle "Bearer <TOKEN>"
  if (token.startsWith("Bearer ")) {
    token = token.slice(7).trim();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
};

// 👨‍💼 Require Admin Role
exports.isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access forbidden. Admin privileges required." });
  }
  next();
};