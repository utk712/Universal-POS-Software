const db = require("../config/db");

// ==============================
// ✅ ADD PRODUCT
// ==============================
exports.addProduct = (req, res) => {
  let {
    name,
    barcode,
    hsn_code,
    category,
    unit,
    cost_price,
    mrp,
    selling_price,
    stock_quantity,
    min_stock_alert,
    tax_rate,
    batch_no,
    expiry_date,
    salt_name,
    is_rx,
    food_type,
    size_color,
    imei_serial,
    warranty_months,
    liquor_size,
    alcohol_percent,
    material_spec,
    purity_karat,
    gross_weight_gm,
    making_charge
  } = req.body;

  if (!name || !selling_price) {
    return res.status(400).json({ message: "Product name and selling price are required" });
  }

  // Generate fallback barcode if missing
  if (!barcode || !barcode.trim()) {
    barcode = "POS-" + Date.now().toString().slice(-8);
  }

  mrp = Number(mrp) || Number(selling_price);
  selling_price = Number(selling_price);
  cost_price = Number(cost_price) || 0;
  stock_quantity = Number(stock_quantity) || 0;
  min_stock_alert = Number(min_stock_alert) || 5;
  tax_rate = Number(tax_rate) || 0;
  hsn_code = hsn_code?.trim() || "1905";
  category = category?.trim() || "General";
  unit = unit?.trim() || "pcs";
  batch_no = batch_no?.trim() || "";
  expiry_date = expiry_date?.trim() || "";
  salt_name = salt_name?.trim() || "";
  is_rx = is_rx ? 1 : 0;
  food_type = food_type?.trim() || "veg";
  size_color = size_color?.trim() || "";
  imei_serial = imei_serial?.trim() || "";
  warranty_months = Number(warranty_months) || 0;
  liquor_size = liquor_size?.trim() || "";
  alcohol_percent = Number(alcohol_percent) || 0;
  material_spec = material_spec?.trim() || "";
  purity_karat = purity_karat?.trim() || "";
  gross_weight_gm = Number(gross_weight_gm) || 0;
  making_charge = Number(making_charge) || 0;

  // Check duplicate barcode
  db.get(
    "SELECT product_id FROM products WHERE barcode = ?",
    [barcode],
    (err, existing) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (existing) {
        return res.status(400).json({ message: "Product with this barcode already exists" });
      }

      db.run(
        `INSERT INTO products 
        (name, barcode, hsn_code, category, unit, cost_price, mrp, selling_price, price_full, stock_quantity, min_stock_alert, tax_rate, batch_no, expiry_date, salt_name, is_rx, food_type, size_color, imei_serial, warranty_months, liquor_size, alcohol_percent, material_spec, purity_karat, gross_weight_gm, making_charge) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          barcode,
          hsn_code,
          category,
          unit,
          cost_price,
          mrp,
          selling_price,
          selling_price, // legacy price_full
          stock_quantity,
          min_stock_alert,
          tax_rate,
          batch_no,
          expiry_date,
          salt_name,
          is_rx,
          food_type,
          size_color,
          imei_serial,
          warranty_months,
          liquor_size,
          alcohol_percent,
          material_spec,
          purity_karat,
          gross_weight_gm,
          making_charge
        ],
        function (err) {
          if (err) {
            console.error("ADD PRODUCT ERROR:", err);
            return res.status(500).json({ message: "Error adding product" });
          }

          res.json({
            message: "Product added successfully",
            product_id: this.lastID,
            barcode
          });
        }
      );
    }
  );
};

// ==============================
// ✅ GET ALL PRODUCTS (With Search & Category Filter)
// ==============================
exports.getAllProducts = (req, res) => {
  const { search, category, low_stock } = req.query;

  let query = "SELECT * FROM products WHERE is_active = 1";
  let params = [];

  if (search) {
    query += " AND (name LIKE ? OR barcode LIKE ? OR hsn_code LIKE ? OR salt_name LIKE ? OR imei_serial LIKE ? OR material_spec LIKE ? OR size_color LIKE ? OR purity_karat LIKE ?)";
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term, term, term);
  }

  if (category && category !== "All") {
    query += " AND category = ?";
    params.push(category);
  }

  if (low_stock === "true") {
    query += " AND stock_quantity <= min_stock_alert";
  }

  query += " ORDER BY product_id DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("GET PRODUCTS ERROR:", err);
      return res.status(500).json({ message: "Error fetching products" });
    }
    res.json(rows);
  });
};

// ==============================
// ✅ GET PRODUCT BY BARCODE
// ==============================
exports.getProductByBarcode = (req, res) => {
  const { barcode } = req.params;

  db.get(
    "SELECT * FROM products WHERE barcode = ? AND is_active = 1",
    [barcode],
    (err, product) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (!product) {
        // Also check variants
        return db.get(
          `SELECT v.*, p.name as parent_name, p.hsn_code, p.category, p.unit, p.tax_rate 
           FROM product_variants v 
           JOIN products p ON v.product_id = p.product_id 
           WHERE v.barcode = ?`,
          [barcode],
          (vErr, variant) => {
            if (vErr || !variant) {
              return res.status(404).json({ message: "Product not found" });
            }
            res.json({
              product_id: variant.product_id,
              variant_id: variant.variant_id,
              name: `${variant.parent_name} (${variant.variant_name})`,
              barcode: variant.barcode,
              hsn_code: variant.hsn_code,
              category: variant.category,
              unit: variant.unit,
              mrp: variant.mrp,
              selling_price: variant.selling_price,
              stock_quantity: variant.stock_quantity,
              tax_rate: variant.tax_rate
            });
          }
        );
      }

      res.json(product);
    }
  );
};

// ==============================
// ✅ UPDATE PRODUCT
// ==============================
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    name,
    barcode,
    hsn_code,
    category,
    unit,
    cost_price,
    mrp,
    selling_price,
    stock_quantity,
    min_stock_alert,
    tax_rate,
    batch_no,
    expiry_date,
    salt_name,
    is_rx,
    food_type,
    size_color,
    imei_serial,
    warranty_months,
    liquor_size,
    alcohol_percent,
    material_spec,
    purity_karat,
    gross_weight_gm,
    making_charge
  } = req.body;

  db.run(
    `UPDATE products SET 
      name = ?, 
      barcode = ?, 
      hsn_code = ?, 
      category = ?, 
      unit = ?, 
      cost_price = ?, 
      mrp = ?, 
      selling_price = ?, 
      price_full = ?, 
      stock_quantity = ?, 
      min_stock_alert = ?, 
      tax_rate = ?,
      batch_no = ?,
      expiry_date = ?,
      salt_name = ?,
      is_rx = ?,
      food_type = ?,
      size_color = ?,
      imei_serial = ?,
      warranty_months = ?,
      liquor_size = ?,
      alcohol_percent = ?,
      material_spec = ?,
      purity_karat = ?,
      gross_weight_gm = ?,
      making_charge = ? 
    WHERE product_id = ?`,
    [
      name,
      barcode,
      hsn_code || "1905",
      category || "General",
      unit || "pcs",
      Number(cost_price) || 0,
      Number(mrp) || Number(selling_price),
      Number(selling_price),
      Number(selling_price),
      Number(stock_quantity) || 0,
      Number(min_stock_alert) || 5,
      Number(tax_rate) || 0,
      batch_no?.trim() || "",
      expiry_date?.trim() || "",
      salt_name?.trim() || "",
      is_rx ? 1 : 0,
      food_type?.trim() || "veg",
      size_color?.trim() || "",
      imei_serial?.trim() || "",
      Number(warranty_months) || 0,
      liquor_size?.trim() || "",
      Number(alcohol_percent) || 0,
      material_spec?.trim() || "",
      purity_karat?.trim() || "",
      Number(gross_weight_gm) || 0,
      Number(making_charge) || 0,
      id
    ],
    function (err) {
      if (err) {
        console.error("UPDATE PRODUCT ERROR:", err);
        return res.status(500).json({ message: "Failed to update product" });
      }
      res.json({ message: "Product updated successfully" });
    }
  );
};

// ==============================
// ✅ DELETE PRODUCT
// ==============================
exports.deleteProduct = (req, res) => {
  const { id } = req.params;

  db.run("UPDATE products SET is_active = 0 WHERE product_id = ?", [id], function (err) {
    if (err) {
      console.error("DELETE PRODUCT ERROR:", err);
      return res.status(500).json({ message: "Failed to delete product" });
    }
    res.json({ message: "Product deleted successfully" });
  });
};

// ==============================
// 🔥 ADD STOCK BY SCAN
// ==============================
exports.addStockByScan = (req, res) => {
  let { barcode, quantity, name, selling_price, mrp, category } = req.body;

  if (!barcode || !quantity) {
    return res.status(400).json({ message: "Barcode and quantity required" });
  }

  quantity = Number(quantity);

  db.get("SELECT * FROM products WHERE barcode = ?", [barcode], (err, product) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (product) {
      db.run(
        "UPDATE products SET stock_quantity = stock_quantity + ? WHERE barcode = ?",
        [quantity, barcode],
        function (err) {
          if (err) {
            return res.status(500).json({ message: "Error updating stock" });
          }
          res.json({ message: "Stock updated successfully", type: "existing" });
        }
      );
    } else {
      if (!name || !selling_price) {
        return res.status(400).json({ message: "New product requires name and selling price" });
      }

      db.run(
        `INSERT INTO products 
        (name, barcode, selling_price, mrp, price_full, stock_quantity, category) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, barcode, Number(selling_price), Number(mrp) || Number(selling_price), Number(selling_price), quantity, category || "General"],
        function (err) {
          if (err) {
            return res.status(500).json({ message: "Error adding product" });
          }
          res.json({ message: "Product created & stock added", type: "new" });
        }
      );
    }
  });
};

// ==============================
// ✅ REDUCE STOCK HELPER
// ==============================
exports.reduceStock = (barcode, quantity) => {
  db.run(
    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE barcode = ?",
    [quantity, barcode],
    (err) => {
      if (err) console.error("STOCK REDUCE ERROR:", err);
    }
  );
};

// ==============================
// 📥 BULK PRODUCT IMPORT (Excel / CSV)
// ==============================
exports.bulkImportProducts = (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No product items provided for import" });
  }

  let imported = 0;
  let errors = 0;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products (
        name, barcode, hsn_code, category, unit, cost_price, mrp, selling_price,
        price_full, stock_quantity, min_stock_alert, tax_rate, batch_no, expiry_date,
        salt_name, is_rx, food_type, size_color, imei_serial, warranty_months,
        liquor_size, alcohol_percent, material_spec, purity_karat, gross_weight_gm, making_charge
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    items.forEach((item, index) => {
      const name = item.name?.toString().trim();
      if (!name) {
        errors++;
        return;
      }
      const barcode = item.barcode?.toString().trim() || ("POS-" + Date.now().toString().slice(-6) + index);
      const selling_price = Number(item.selling_price || item.mrp || 0);
      const mrp = Number(item.mrp || selling_price);
      const cost_price = Number(item.cost_price || 0);
      const stock_quantity = Number(item.stock_quantity || 0);
      const min_stock_alert = Number(item.min_stock_alert || 5);
      const tax_rate = Number(item.tax_rate || 0);
      const category = item.category?.toString().trim() || "General";
      const unit = item.unit?.toString().trim() || "pcs";
      const hsn_code = item.hsn_code?.toString().trim() || "1905";
      const batch_no = item.batch_no?.toString().trim() || "";
      const expiry_date = item.expiry_date?.toString().trim() || "";
      const salt_name = item.salt_name?.toString().trim() || "";
      const is_rx = item.is_rx ? 1 : 0;
      const food_type = item.food_type?.toString().trim() || "veg";
      const size_color = item.size_color?.toString().trim() || "";
      const imei_serial = item.imei_serial?.toString().trim() || "";
      const warranty_months = Number(item.warranty_months || 0);
      const liquor_size = item.liquor_size?.toString().trim() || "";
      const alcohol_percent = Number(item.alcohol_percent || 0);
      const material_spec = item.material_spec?.toString().trim() || "";
      const purity_karat = item.purity_karat?.toString().trim() || "";
      const gross_weight_gm = Number(item.gross_weight_gm || 0);
      const making_charge = Number(item.making_charge || 0);

      stmt.run([
        name, barcode, hsn_code, category, unit, cost_price, mrp, selling_price,
        selling_price, stock_quantity, min_stock_alert, tax_rate, batch_no, expiry_date,
        salt_name, is_rx, food_type, size_color, imei_serial, warranty_months,
        liquor_size, alcohol_percent, material_spec, purity_karat, gross_weight_gm, making_charge
      ], (err) => {
        if (!err) imported++;
        else errors++;
      });
    });

    stmt.finalize();

    db.run("COMMIT", (err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to commit bulk import transaction" });
      }
      res.json({
        message: `Successfully imported ${imported} products! ✅ (${errors} skipped)`,
        imported,
        errors
      });
    });
  });
};