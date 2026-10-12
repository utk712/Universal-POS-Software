const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } = require("../config/authConfig");

// Category Presets for Market Verticals
const verticalCategoryPresets = {
  supermarket: ["Grocery", "Dairy & Bakery", "Spices & Oils", "Beverages", "Personal Care", "Snacks & Munchies", "Household Goods"],
  liquor: ["Beer", "Whiskey", "Rum", "Vodka", "Wine", "Gin & Brandy", "Soda & Mixers"],
  restaurant: ["Starters & Snacks", "Main Course", "Roti & Rice", "Desserts & Sweets", "Beverages", "Dine-In Combos"],
  apparel: ["Men's Wear", "Women's Wear", "Kid's Wear", "Footwear & Shoes", "Bags & Accessories"],
  electronics: ["Smartphones & Accessories", "Laptops & Computers", "Home Appliances", "Audio & Speakers", "Hardware Tools"],
  pharmacy: ["Tablets & Capsules", "Syrups & Liquids", "Ointments & Creams", "Surgical & First Aid", "Baby & Personal Care"],
  salon: ["Haircut & Styling", "Facial & Skincare", "Beard & Grooming", "Spa & Massage", "Beauty Packages"],
  general: ["General Items", "Stationery", "Gifts & Toys", "Custom Services"]
};

// Unit Presets for Market Verticals
const verticalUnitPresets = {
  supermarket: [["Kilogram", "kg"], ["Gram", "gm"], ["Liter", "ltr"], ["Pieces", "pcs"], ["Pack", "pack"]],
  liquor: [["750ml Bottle", "750ml"], ["375ml Half", "375ml"], ["180ml Quarter", "180ml"], ["Can", "can"], ["Case", "case"]],
  restaurant: [["Full Plate", "plate"], ["Half Plate", "half"], ["Portion", "portion"], ["Glass", "glass"], ["Box", "box"]],
  apparel: [["Piece", "pcs"], ["Pair", "pair"], ["Set", "set"]],
  electronics: [["Unit", "unit"], ["Piece", "pcs"], ["Box", "box"]],
  pharmacy: [["Strip", "strip"], ["Bottle", "bottle"], ["Tube", "tube"], ["Box", "box"]],
  salon: [["Session", "session"], ["Service", "service"], ["Package", "pkg"]],
  general: [["Piece", "pcs"], ["Pack", "pack"]]
};

// ================= LOGIN =================
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const sanitizedEmail = email.trim().toLowerCase();

  db.get("SELECT * FROM users WHERE LOWER(email) = ?", [sanitizedEmail], async (err, user) => {
    if (err) {
      console.error("LOGIN DB ERROR:", err);
      return res.status(500).json({ message: "Internal server database error" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    try {
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.status === "disabled") {
        return res.status(403).json({ message: "This account has been disabled by store administrator. Contact Master PC." });
      }

      const clientIp = (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || req.ip || "127.0.0.1").replace("::ffff:", "");
      const now = new Date().toISOString();

      db.run(
        "UPDATE users SET is_online = 1, last_login = ?, last_active = ?, login_ip = ? WHERE user_id = ?",
        [now, now, clientIp, user.user_id],
        (updateErr) => {
          if (updateErr) console.error("LOGIN TRACKING ERROR:", updateErr);
        }
      );

      const token = jwt.sign(
        { id: user.user_id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        message: "Login successful ✅",
        token,
        role: user.role,
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status || "active",
          last_login: now,
          login_ip: clientIp
        }
      });
    } catch (error) {
      console.error("BCRYPT COMPARE ERROR:", error);
      res.status(500).json({ message: "Error authenticating user" });
    }
  });
};

// ================= LOGOUT =================
exports.logout = (req, res) => {
  const userId = req.body?.user_id || req.query?.user_id;
  if (userId) {
    const now = new Date().toISOString();
    db.run("UPDATE users SET is_online = 0, last_active = ? WHERE user_id = ?", [now, userId]);
  }
  res.json({ message: "Logged out successfully ✅" });
};

// ================= HEARTBEAT (KEEP ALIVE) =================
exports.heartbeat = (req, res) => {
  const userId = req.body?.user_id;
  if (userId) {
    const now = new Date().toISOString();
    db.run("UPDATE users SET is_online = 1, last_active = ? WHERE user_id = ?", [now, userId]);
  }
  res.json({ status: "alive" });
};

// ================= REGISTER ADMIN & INITIALIZE BUSINESS =================
exports.registerAdmin = async (req, res) => {
  const { name, email, password, store_name, mobile, active_vertical = "supermarket", gstin = "" } = req.body;

  if (!name || !email || !password || !store_name) {
    return res.status(400).json({ message: "Name, email, password, and store name are required" });
  }

  if (password.length < 4) {
    return res.status(400).json({ message: "Password must be at least 4 characters long" });
  }

  const sanitizedEmail = email.trim().toLowerCase();

  db.get("SELECT * FROM users WHERE role = 'admin'", [], async (err, admin) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (admin) {
      return res.status(400).json({ message: "System Admin account already registered" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      db.run(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name.trim(), sanitizedEmail, hashedPassword, "admin"],
        function (err) {
          if (err) return res.status(500).json({ message: "Failed to register admin account" });

          const userId = this.lastID;

          // Configure Business Profile Settings
          db.run(
            `UPDATE business_settings SET 
              store_name = ?, 
              mobile = ?, 
              gstin = ?, 
              active_vertical = ? 
            WHERE id = 1`,
            [store_name.trim(), mobile || "9876543210", gstin || "", active_vertical],
            () => {
              // Seed Categories for selected market vertical
              const categories = verticalCategoryPresets[active_vertical] || verticalCategoryPresets.supermarket;
              categories.forEach((cat) => {
                db.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", [cat]);
              });

              // Seed Units for selected market vertical
              const units = verticalUnitPresets[active_vertical] || verticalUnitPresets.supermarket;
              units.forEach(([name, symbol]) => {
                db.run("INSERT OR IGNORE INTO units (name, symbol) VALUES (?, ?)", [name, symbol]);
              });

              res.json({
                message: `Store setup completed for ${store_name}! You can now log in. ✅`,
                user_id: userId,
                active_vertical
              });
            }
          );
        }
      );
    } catch (error) {
      res.status(500).json({ message: "Encryption error" });
    }
  });
};

// ================= CHECK ADMIN EXISTS =================
exports.checkAdmin = (req, res) => {
  db.get("SELECT user_id FROM users WHERE role = 'admin' LIMIT 1", [], (err, admin) => {
    if (err) return res.status(500).json({ exists: false });
    res.json({ exists: !!admin });
  });
};