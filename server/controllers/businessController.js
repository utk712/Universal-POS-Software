const db = require("../config/db");

// Category Presets for Market Verticals
const verticalCategoryPresets = {
  supermarket: ["Grocery", "Dairy & Bakery", "Spices & Oils", "Beverages", "Personal Care", "Snacks & Munchies", "Household Goods"],
  liquor: ["Beer", "Whiskey", "Rum", "Vodka", "Wine", "Gin & Brandy", "Soda & Mixers"],
  restaurant: ["Starters & Snacks", "Main Course", "Roti & Rice", "Desserts & Sweets", "Beverages", "Dine-In Combos"],
  apparel: ["Men's Wear", "Women's Wear", "Kid's Wear", "Footwear & Shoes", "Bags & Accessories"],
  electronics: ["Smartphones & Accessories", "Laptops & Computers", "Home Appliances", "Audio & Speakers", "Hardware Tools"],
  pharmacy: ["Tablets & Capsules", "Syrups & Liquids", "Ointments & Creams", "Surgical & First Aid", "Baby & Personal Care"],
  salon: ["Haircut & Styling", "Facial & Skincare", "Beard & Grooming", "Spa & Massage", "Beauty Packages"],
  hardware: ["Electricals", "Paints & Wall Care", "Plumbing & Pipes", "Hand Tools & Fasteners", "Cement & Building Materials"],
  jewelry: ["Gold Ornaments", "Silver Jewelry", "Diamond & Precious Stones", "Coins & Bullion", "Gemstones & Pearls"],
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
  hardware: [["Piece", "pcs"], ["Meter", "mtr"], ["Kilogram", "kg"], ["Box", "box"], ["Set", "set"]],
  jewelry: [["Gram", "gm"], ["Carat", "ct"], ["Piece", "pcs"], ["Tola", "tola"]],
  general: [["Piece", "pcs"], ["Pack", "pack"]]
};

function seedVerticalPresets(vertical) {
  const categories = verticalCategoryPresets[vertical] || verticalCategoryPresets.supermarket;
  categories.forEach((cat) => {
    db.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", [cat]);
  });

  const units = verticalUnitPresets[vertical] || verticalUnitPresets.supermarket;
  units.forEach(([name, symbol]) => {
    db.run("INSERT OR IGNORE INTO units (name, symbol) VALUES (?, ?)", [name, symbol]);
  });
}

// Get Business Profile & Settings
exports.getBusinessSettings = (req, res) => {
  db.get("SELECT * FROM business_settings LIMIT 1", (err, settings) => {
    if (err) {
      console.error("GET BUSINESS SETTINGS ERROR:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(settings || {});
  });
};

// Update Business Profile & Settings
exports.updateBusinessSettings = (req, res) => {
  const {
    store_name,
    tagline,
    address,
    mobile,
    email,
    gstin,
    currency,
    active_vertical,
    thermal_printer_width,
    auto_print,
    upi_id
  } = req.body;

  const verticalToSave = active_vertical || "supermarket";

  db.run(
    `UPDATE business_settings SET 
      store_name = ?, 
      tagline = ?, 
      address = ?, 
      mobile = ?, 
      email = ?, 
      gstin = ?, 
      currency = ?, 
      active_vertical = ?, 
      thermal_printer_width = ?, 
      auto_print = ?, 
      upi_id = ? 
    WHERE id = (SELECT id FROM business_settings LIMIT 1)`,
    [
      store_name || "My DMart Style Superstore",
      tagline || "Quality Products & Fast Service",
      address || "Main Market",
      mobile || "9876543210",
      email || "contact@pos.com",
      gstin || "22AAAAA0000A1Z5",
      currency || "₹",
      verticalToSave,
      thermal_printer_width || "80mm",
      auto_print ? 1 : 0,
      upi_id || "9876543210@upi"
    ],
    function (err) {
      if (err) {
        console.error("UPDATE BUSINESS SETTINGS ERROR:", err);
        return res.status(500).json({ message: "Failed to update business settings" });
      }

      seedVerticalPresets(verticalToSave);

      db.get("SELECT * FROM business_settings LIMIT 1", (fetchErr, updated) => {
        res.json({
          message: "Business settings updated successfully ✅",
          settings: updated
        });
      });
    }
  );
};

// Quick Switch Business Vertical Mode
exports.switchVertical = (req, res) => {
  const { vertical } = req.body;
  if (!vertical) {
    return res.status(400).json({ message: "Business vertical is required" });
  }

  db.run(
    `UPDATE business_settings SET active_vertical = ? WHERE id = (SELECT id FROM business_settings LIMIT 1)`,
    [vertical],
    function (err) {
      if (err) {
        console.error("SWITCH VERTICAL ERROR:", err);
        return res.status(500).json({ message: "Failed to switch business mode" });
      }

      seedVerticalPresets(vertical);

      db.get("SELECT * FROM business_settings LIMIT 1", (fetchErr, row) => {
        res.json({
          message: `Business mode switched to ${vertical} successfully ✅`,
          settings: row || { active_vertical: vertical }
        });
      });
    }
  );
};


