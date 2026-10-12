const crypto = require("crypto");

const fallbackSecret = process.env.JWT_SECRET || "VYAPARFLOW_ENTERPRISE_SECRET_KEY_2026_PRODUCTION_SECURE";

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || fallbackSecret,
  JWT_EXPIRES_IN: "7d",
  SALT_ROUNDS: 10
};

