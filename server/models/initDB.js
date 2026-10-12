const db = require("../config/db");

db.serialize(() => {
  // 1. Business Settings
  db.run(`CREATE TABLE IF NOT EXISTS business_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_name TEXT DEFAULT 'VyaparFlow Superstore',
    tagline TEXT DEFAULT 'Universal Retail & Smart Accounting ERP',
    address TEXT DEFAULT 'Main Market, City Center',
    mobile TEXT DEFAULT '9876543210',
    email TEXT DEFAULT 'contact@vyaparflow.com',
    gstin TEXT DEFAULT '22AAAAA0000A1Z5',
    currency TEXT DEFAULT '₹',
    active_vertical TEXT DEFAULT 'supermarket',
    thermal_printer_width TEXT DEFAULT '80mm',
    auto_print INTEGER DEFAULT 1,
    upi_id TEXT DEFAULT '9876543210@upi'
  )`);

  db.get("SELECT COUNT(*) as count FROM business_settings", (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(`INSERT INTO business_settings (store_name, tagline) VALUES ('VyaparFlow Superstore', 'Universal Retail & Smart Accounting ERP')`);
    }
  });

  // 2. Users Table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'cashier',
    is_online INTEGER DEFAULT 0,
    last_login TEXT,
    last_active TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    login_ip TEXT
  )`);

  // Safe migrations for existing databases
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (!err && Array.isArray(columns)) {
      const colNames = columns.map((c) => c.name);
      if (!colNames.includes("is_online")) {
        db.run("ALTER TABLE users ADD COLUMN is_online INTEGER DEFAULT 0");
      }
      if (!colNames.includes("last_login")) {
        db.run("ALTER TABLE users ADD COLUMN last_login TEXT");
      }
      if (!colNames.includes("last_active")) {
        db.run("ALTER TABLE users ADD COLUMN last_active TEXT");
      }
      if (!colNames.includes("status")) {
        db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
      }
      if (!colNames.includes("created_at")) {
        db.run("ALTER TABLE users ADD COLUMN created_at TEXT");
      }
      if (!colNames.includes("login_ip")) {
        db.run("ALTER TABLE users ADD COLUMN login_ip TEXT");
      }
    }
  });

  // 3. Categories
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT
  )`);

  // Seed default categories
  const defaultCategories = ["General", "Grocery", "Beverages & Drinks", "Dairy & Bakery", "Personal Care", "Snacks & Munchies", "Apparel"];
  defaultCategories.forEach((cat) => {
    db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [cat]);
  });

  // 4. Units of Measurement
  db.run(`CREATE TABLE IF NOT EXISTS units (
    unit_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    symbol TEXT
  )`);

  const defaultUnits = [
    ["Pieces", "pcs"],
    ["Kilogram", "kg"],
    ["Gram", "gm"],
    ["Liter", "ltr"],
    ["Milliliter", "ml"],
    ["Strip", "strip"],
    ["Tablet", "tab"],
    ["Bottle", "bottle"],
    ["Box", "box"],
    ["Pack", "pack"]
  ];
  defaultUnits.forEach(([name, symbol]) => {
    db.run(`INSERT OR IGNORE INTO units (name, symbol) VALUES (?, ?)`, [name, symbol]);
  });

  // 5. Tax Rates (GST)
  db.run(`CREATE TABLE IF NOT EXISTS tax_rates (
    tax_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    rate REAL
  )`);

  const defaultTaxes = [
    ["GST 0%", 0],
    ["GST 5%", 5],
    ["GST 12%", 12],
    ["GST 18%", 18],
    ["GST 28%", 28]
  ];
  defaultTaxes.forEach(([name, rate]) => {
    db.run(`INSERT OR IGNORE INTO tax_rates (name, rate) VALUES (?, ?)`, [name, rate]);
  });

  // 6. Products Table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    product_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    barcode TEXT UNIQUE,
    hsn_code TEXT DEFAULT '1905',
    category TEXT DEFAULT 'General',
    unit TEXT DEFAULT 'pcs',
    cost_price REAL DEFAULT 0,
    mrp REAL DEFAULT 0,
    selling_price REAL DEFAULT 0,
    price_full REAL,
    stock_quantity REAL DEFAULT 0,
    min_stock_alert REAL DEFAULT 5,
    tax_rate REAL DEFAULT 0,
    batch_no TEXT DEFAULT '',
    expiry_date TEXT DEFAULT '',
    salt_name TEXT DEFAULT '',
    is_rx INTEGER DEFAULT 0,
    food_type TEXT DEFAULT 'veg',
    size_color TEXT DEFAULT '',
    imei_serial TEXT DEFAULT '',
    warranty_months INTEGER DEFAULT 0,
    liquor_size TEXT DEFAULT '',
    alcohol_percent REAL DEFAULT 0,
    material_spec TEXT DEFAULT '',
    purity_karat TEXT DEFAULT '',
    gross_weight_gm REAL DEFAULT 0,
    making_charge REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Migration helper for legacy products table columns
  db.all("PRAGMA table_info(products)", (err, columns) => {
    if (!err && columns) {
      const colNames = columns.map((c) => c.name);
      if (!colNames.includes("mrp")) {
        db.run("ALTER TABLE products ADD COLUMN mrp REAL DEFAULT 0", () => {
          db.run("UPDATE products SET mrp = price_full WHERE mrp = 0 AND price_full IS NOT NULL");
        });
      }
      if (!colNames.includes("selling_price")) {
        db.run("ALTER TABLE products ADD COLUMN selling_price REAL DEFAULT 0", () => {
          db.run("UPDATE products SET selling_price = price_full WHERE selling_price = 0 AND price_full IS NOT NULL");
        });
      }
      if (!colNames.includes("hsn_code")) db.run("ALTER TABLE products ADD COLUMN hsn_code TEXT DEFAULT '1905'");
      if (!colNames.includes("unit")) db.run("ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'pcs'");
      if (!colNames.includes("category")) db.run("ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'General'");
      if (!colNames.includes("cost_price")) db.run("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0");
      if (!colNames.includes("min_stock_alert")) db.run("ALTER TABLE products ADD COLUMN min_stock_alert REAL DEFAULT 5");
      if (!colNames.includes("tax_rate")) db.run("ALTER TABLE products ADD COLUMN tax_rate REAL DEFAULT 0");
      if (!colNames.includes("batch_no")) db.run("ALTER TABLE products ADD COLUMN batch_no TEXT DEFAULT ''");
      if (!colNames.includes("expiry_date")) db.run("ALTER TABLE products ADD COLUMN expiry_date TEXT DEFAULT ''");
      if (!colNames.includes("salt_name")) db.run("ALTER TABLE products ADD COLUMN salt_name TEXT DEFAULT ''");
      if (!colNames.includes("is_rx")) db.run("ALTER TABLE products ADD COLUMN is_rx INTEGER DEFAULT 0");
      if (!colNames.includes("food_type")) db.run("ALTER TABLE products ADD COLUMN food_type TEXT DEFAULT 'veg'");
      if (!colNames.includes("size_color")) db.run("ALTER TABLE products ADD COLUMN size_color TEXT DEFAULT ''");
      if (!colNames.includes("imei_serial")) db.run("ALTER TABLE products ADD COLUMN imei_serial TEXT DEFAULT ''");
      if (!colNames.includes("warranty_months")) db.run("ALTER TABLE products ADD COLUMN warranty_months INTEGER DEFAULT 0");
      if (!colNames.includes("liquor_size")) db.run("ALTER TABLE products ADD COLUMN liquor_size TEXT DEFAULT ''");
      if (!colNames.includes("alcohol_percent")) db.run("ALTER TABLE products ADD COLUMN alcohol_percent REAL DEFAULT 0");
      if (!colNames.includes("material_spec")) db.run("ALTER TABLE products ADD COLUMN material_spec TEXT DEFAULT ''");
      if (!colNames.includes("purity_karat")) db.run("ALTER TABLE products ADD COLUMN purity_karat TEXT DEFAULT ''");
      if (!colNames.includes("gross_weight_gm")) db.run("ALTER TABLE products ADD COLUMN gross_weight_gm REAL DEFAULT 0");
      if (!colNames.includes("making_charge")) db.run("ALTER TABLE products ADD COLUMN making_charge REAL DEFAULT 0");
    }
  });

  // 7. Product Variants
  db.run(`CREATE TABLE IF NOT EXISTS product_variants (
    variant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    variant_name TEXT,
    barcode TEXT UNIQUE,
    mrp REAL,
    selling_price REAL,
    stock_quantity REAL DEFAULT 0,
    FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
  )`);

  // 8. Customers Table (CRM + Khata Ledger)
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    phone TEXT UNIQUE,
    email TEXT,
    address TEXT,
    gstin TEXT,
    khata_balance REAL DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 9. Khata Transactions
  db.run(`CREATE TABLE IF NOT EXISTS khata_transactions (
    transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    order_id INTEGER,
    amount REAL,
    type TEXT,
    note TEXT,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
  )`);

  // 10. Orders Header Table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_no TEXT UNIQUE,
    customer_id INTEGER,
    cashier_id INTEGER,
    total_mrp REAL DEFAULT 0,
    total_savings REAL DEFAULT 0,
    subtotal REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    net_amount REAL DEFAULT 0,
    payment_method TEXT DEFAULT 'cash',
    payment_status TEXT DEFAULT 'paid',
    notes TEXT,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    customer_gstin TEXT DEFAULT '',
    invoice_type TEXT DEFAULT 'B2C',
    FOREIGN KEY(customer_id) REFERENCES customers(customer_id)
  )`);

  // Safe migrations for orders table
  db.all("PRAGMA table_info(orders)", (err, columns) => {
    if (!err && Array.isArray(columns)) {
      const colNames = columns.map((c) => c.name);
      if (!colNames.includes("customer_gstin")) {
        db.run("ALTER TABLE orders ADD COLUMN customer_gstin TEXT DEFAULT ''");
      }
      if (!colNames.includes("invoice_type")) {
        db.run("ALTER TABLE orders ADD COLUMN invoice_type TEXT DEFAULT 'B2C'");
      }
    }
  });

  // Safe migrations for business_settings table
  db.all("PRAGMA table_info(business_settings)", (err, columns) => {
    if (!err && Array.isArray(columns)) {
      const colNames = columns.map((c) => c.name);
      if (!colNames.includes("state")) {
        db.run("ALTER TABLE business_settings ADD COLUMN state TEXT DEFAULT 'Madhya Pradesh'");
      }
      if (!colNames.includes("state_code")) {
        db.run("ALTER TABLE business_settings ADD COLUMN state_code TEXT DEFAULT '23'");
      }
      if (!colNames.includes("default_gst_rate")) {
        db.run("ALTER TABLE business_settings ADD COLUMN default_gst_rate REAL DEFAULT 5.0");
      }
      if (!colNames.includes("is_tax_inclusive")) {
        db.run("ALTER TABLE business_settings ADD COLUMN is_tax_inclusive INTEGER DEFAULT 1");
      }
      if (!colNames.includes("is_composition_scheme")) {
        db.run("ALTER TABLE business_settings ADD COLUMN is_composition_scheme INTEGER DEFAULT 0");
      }
      if (!colNames.includes("tally_sales_ledger")) {
        db.run("ALTER TABLE business_settings ADD COLUMN tally_sales_ledger TEXT DEFAULT 'Sales Account'");
      }
      if (!colNames.includes("tally_cgst_ledger")) {
        db.run("ALTER TABLE business_settings ADD COLUMN tally_cgst_ledger TEXT DEFAULT 'CGST'");
      }
      if (!colNames.includes("tally_sgst_ledger")) {
        db.run("ALTER TABLE business_settings ADD COLUMN tally_sgst_ledger TEXT DEFAULT 'SGST'");
      }
      if (!colNames.includes("tally_cash_ledger")) {
        db.run("ALTER TABLE business_settings ADD COLUMN tally_cash_ledger TEXT DEFAULT 'Cash Retail Buyer'");
      }
      if (!colNames.includes("default_opening_cash")) {
        db.run("ALTER TABLE business_settings ADD COLUMN default_opening_cash REAL DEFAULT 2000.0");
      }
    }
  });

  // 11. Order Items Table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_id INTEGER,
    variant_id INTEGER,
    product_name TEXT,
    hsn_code TEXT,
    batch_no TEXT DEFAULT '',
    expiry_date TEXT DEFAULT '',
    item_details TEXT DEFAULT '',
    quantity REAL,
    unit TEXT,
    mrp REAL,
    selling_price REAL,
    tax_rate REAL,
    tax_amount REAL,
    subtotal REAL,
    FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE
  )`);

  db.all("PRAGMA table_info(order_items)", (err, columns) => {
    if (!err && columns) {
      const colNames = columns.map((c) => c.name);
      if (!colNames.includes("item_details")) db.run("ALTER TABLE order_items ADD COLUMN item_details TEXT DEFAULT ''");
      if (!colNames.includes("batch_no")) db.run("ALTER TABLE order_items ADD COLUMN batch_no TEXT DEFAULT ''");
      if (!colNames.includes("expiry_date")) db.run("ALTER TABLE order_items ADD COLUMN expiry_date TEXT DEFAULT ''");
    }
  });

  // 20. Billing Counters Table
  db.run(`CREATE TABLE IF NOT EXISTS billing_counters (
    counter_id INTEGER PRIMARY KEY AUTOINCREMENT,
    counter_code TEXT UNIQUE,
    counter_name TEXT,
    location_notes TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.get("SELECT COUNT(*) as count FROM billing_counters", (err, row) => {
    if (!err && row && row.count === 0) {
      const defaultCounters = [
        ["C1", "Counter 1 - Main Gate", "Ground Floor Front"],
        ["C2", "Counter 2 - Express Lane", "Express Checkout"],
        ["C3", "Counter 3 - General", "Main Market Hub"]
      ];
      defaultCounters.forEach(([code, name, loc]) => {
        db.run(`INSERT OR IGNORE INTO billing_counters (counter_code, counter_name, location_notes) VALUES (?, ?, ?)`, [code, name, loc]);
      });
    }
  });

  // Orders Counter Migration
  db.all("PRAGMA table_info(orders)", (err, columns) => {
    if (!err && columns) {
      const colNames = columns.map((c) => c.name);
      if (!colNames.includes("counter_id")) db.run("ALTER TABLE orders ADD COLUMN counter_id INTEGER DEFAULT 1");
      if (!colNames.includes("counter_code")) db.run("ALTER TABLE orders ADD COLUMN counter_code TEXT DEFAULT 'C1'");
      if (!colNames.includes("counter_name")) db.run("ALTER TABLE orders ADD COLUMN counter_name TEXT DEFAULT 'Counter 1'");
    }
  });

  // 12. Shift End Cash Counter Closing Audit
  db.run(`CREATE TABLE IF NOT EXISTS cash_closings (
    closing_id INTEGER PRIMARY KEY AUTOINCREMENT,
    counter_id INTEGER DEFAULT 1,
    counter_code TEXT DEFAULT 'C1',
    counter_name TEXT DEFAULT 'Counter 1',
    cashier_id INTEGER,
    cashier_name TEXT,
    opening_cash REAL DEFAULT 0,
    cash_sales REAL DEFAULT 0,
    petty_expenses REAL DEFAULT 0,
    expected_cash REAL DEFAULT 0,
    actual_cash REAL DEFAULT 0,
    shortage_amount REAL DEFAULT 0,
    denominations TEXT,
    notes TEXT,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.all("PRAGMA table_info(cash_closings)", (err, columns) => {
    if (!err && columns) {
      const colNames = columns.map((c) => c.name);
      if (!colNames.includes("counter_id")) db.run("ALTER TABLE cash_closings ADD COLUMN counter_id INTEGER DEFAULT 1");
      if (!colNames.includes("counter_code")) db.run("ALTER TABLE cash_closings ADD COLUMN counter_code TEXT DEFAULT 'C1'");
      if (!colNames.includes("counter_name")) db.run("ALTER TABLE cash_closings ADD COLUMN counter_name TEXT DEFAULT 'Counter 1'");
    }
  });

  // 13. Petty Cash & Shop Expenses
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT DEFAULT 'General',
    amount REAL,
    payment_method TEXT DEFAULT 'cash',
    note TEXT,
    cashier_id INTEGER,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 14. Vendors / Wholesalers (Suppliers)
  db.run(`CREATE TABLE IF NOT EXISTS vendors (
    vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    mobile TEXT,
    email TEXT,
    company TEXT,
    gstin TEXT,
    address TEXT,
    balance_due REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 15. Purchases (Supplier Bills)
  db.run(`CREATE TABLE IF NOT EXISTS purchases (
    purchase_id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER,
    bill_no TEXT,
    total_amount REAL,
    paid_amount REAL,
    due_amount REAL,
    payment_status TEXT DEFAULT 'pending',
    payment_terms_days INTEGER DEFAULT 30,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(vendor_id) REFERENCES vendors(vendor_id)
  )`);

  // 16. Purchase Items Line Items
  db.run(`CREATE TABLE IF NOT EXISTS purchase_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER,
    product_id INTEGER,
    product_name TEXT,
    batch_no TEXT DEFAULT '',
    expiry_date TEXT DEFAULT '',
    quantity REAL,
    purchase_cost REAL,
    subtotal REAL,
    FOREIGN KEY(purchase_id) REFERENCES purchases(purchase_id) ON DELETE CASCADE
  )`);

  // 17. Anti-Fraud Security Audit Logs
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_name TEXT,
    action TEXT,
    details TEXT,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 18. Restaurant Tables
  db.run(`CREATE TABLE IF NOT EXISTS restaurant_tables (
    table_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT UNIQUE,
    capacity INTEGER DEFAULT 4,
    status TEXT DEFAULT 'available',
    current_order_id INTEGER
  )`);

  // 19. Legacy sales table
  db.run(`CREATE TABLE IF NOT EXISTS sales (
    sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity REAL,
    total_amount REAL,
    employee_id INTEGER,
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log("Pharmacy & Multi-Vertical Database Schema Initialized Successfully ✅");
});