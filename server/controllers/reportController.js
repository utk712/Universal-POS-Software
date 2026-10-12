const db = require("../config/db");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

// Helper to ensure export folder exists
const getExportPath = (filename) => {
  const exportDir = path.join(__dirname, "../exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  return path.join(exportDir, `${filename}_${Date.now()}.xlsx`);
};

// ==========================================
// 📊 1. EXCEL SALES & INVOICE REPORT
// ==========================================
exports.exportSalesReportExcel = (req, res) => {
  db.all(
    `SELECT o.invoice_no, o.counter_code, o.counter_name, o.date_time, c.name as customer_name, c.phone as customer_phone, 
            o.payment_method, o.total_mrp, o.total_savings, o.subtotal, o.tax_amount, o.net_amount 
     FROM orders o 
     LEFT JOIN customers c ON o.customer_id = c.customer_id 
     ORDER BY o.order_id DESC`,
    [],
    (err, orders) => {
      if (err) return res.status(500).json({ message: "Failed to fetch sales for Excel" });

      db.all(
        `SELECT i.order_id, o.invoice_no, o.counter_code, o.counter_name, i.product_name, i.hsn_code, i.quantity, i.unit, i.mrp, i.selling_price, i.tax_rate, i.subtotal 
         FROM order_items i 
         JOIN orders o ON i.order_id = o.order_id 
         ORDER BY i.order_id DESC`,
        [],
        (iErr, items) => {
          const wb = XLSX.utils.book_new();

          // Sheet 1: Orders Summary
          const formattedOrders = (orders || []).map((o) => ({
            "Invoice No": o.invoice_no,
            "Billing Counter": o.counter_name ? `${o.counter_name} (${o.counter_code || 'C1'})` : "Counter 1 (C1)",
            "Date & Time": new Date(o.date_time).toLocaleString("en-IN"),
            "Customer Name": o.customer_name || "Retail Buyer",
            "Customer Mobile": o.customer_phone || "N/A",
            "Payment Method": (o.payment_method || "cash").toUpperCase(),
            "Total MRP (₹)": o.total_mrp || 0,
            "Total Savings (₹)": o.total_savings || 0,
            "Subtotal (₹)": o.subtotal || 0,
            "GST Tax (₹)": o.tax_amount || 0,
            "Net Amount Paid (₹)": o.net_amount || 0
          }));

          const wsOrders = XLSX.utils.json_to_sheet(formattedOrders);
          XLSX.utils.book_append_sheet(wb, wsOrders, "Sales Orders");

          // Sheet 2: Itemized Line Details
          const formattedItems = (items || []).map((i) => ({
            "Invoice No": i.invoice_no,
            "Product Name": i.product_name,
            "HSN Code": i.hsn_code || "1905",
            "Quantity": i.quantity,
            "Unit": i.unit || "pcs",
            "MRP (₹)": i.mrp,
            "Selling Price (₹)": i.selling_price,
            "GST Rate (%)": i.tax_rate || 0,
            "Item Subtotal (₹)": i.subtotal
          }));

          const wsItems = XLSX.utils.json_to_sheet(formattedItems);
          XLSX.utils.book_append_sheet(wb, wsItems, "Line Items Detail");

          const filePath = getExportPath("Sales_Report");
          XLSX.writeFile(wb, filePath);
          res.download(filePath);
        }
      );
    }
  );
};

// ==========================================
// 📋 2. EXCEL GST RETURN REPORT (GSTR-1 & HSN)
// ==========================================
exports.exportGstReportExcel = (req, res) => {
  db.all(
    `SELECT i.hsn_code, p.name as product_name, i.unit, 
            SUM(i.quantity) as total_qty, 
            SUM(i.subtotal) as total_value, 
            SUM(i.tax_amount) as total_tax, 
            i.tax_rate 
     FROM order_items i 
     LEFT JOIN products p ON i.product_id = p.product_id 
     GROUP BY i.hsn_code, i.tax_rate`,
    [],
    (err, hsnRows) => {
      if (err) return res.status(500).json({ message: "Failed to fetch GST data" });

      db.all(
        `SELECT o.invoice_no, o.date_time, c.name as buyer_name, c.gstin as buyer_gstin, 
                o.subtotal as taxable_value, o.tax_amount, o.net_amount 
         FROM orders o 
         JOIN customers c ON o.customer_id = c.customer_id 
         WHERE c.gstin IS NOT NULL AND c.gstin != ''`,
        [],
        (bErr, b2bRows) => {
          const wb = XLSX.utils.book_new();

          // Sheet 1: HSN Summary Table
          const formattedHsn = (hsnRows || []).map((h) => ({
            "HSN/SAC Code": h.hsn_code || "1905",
            "Item Description": h.product_name || "General Goods",
            "UOM": h.unit || "pcs",
            "Total Quantity": h.total_qty,
            "GST Tax Rate (%)": h.tax_rate || 0,
            "Total Value (₹)": h.total_value ? h.total_value.toFixed(2) : 0,
            "Central Tax CGST (₹)": h.total_tax ? (h.total_tax / 2).toFixed(2) : 0,
            "State Tax SGST (₹)": h.total_tax ? (h.total_tax / 2).toFixed(2) : 0,
            "Total Tax Collected (₹)": h.total_tax ? h.total_tax.toFixed(2) : 0
          }));

          const wsHsn = XLSX.utils.json_to_sheet(formattedHsn);
          XLSX.utils.book_append_sheet(wb, wsHsn, "HSN Sales Summary");

          // Sheet 2: B2B Invoices Table
          const formattedB2B = (b2bRows || []).map((b) => ({
            "Invoice No": b.invoice_no,
            "Invoice Date": new Date(b.date_time).toLocaleDateString("en-IN"),
            "Buyer Name": b.buyer_name,
            "Buyer GSTIN": b.buyer_gstin,
            "Taxable Value (₹)": b.taxable_value,
            "CGST (₹)": (b.tax_amount / 2).toFixed(2),
            "SGST (₹)": (b.tax_amount / 2).toFixed(2),
            "Total Invoice Amount (₹)": b.net_amount
          }));

          const wsB2B = XLSX.utils.json_to_sheet(formattedB2B);
          XLSX.utils.book_append_sheet(wb, wsB2B, "B2B Invoices");

          const filePath = getExportPath("GSTR1_Report");
          XLSX.writeFile(wb, filePath);
          res.download(filePath);
        }
      );
    }
  );
};

// ==========================================
// 📦 3. EXCEL INVENTORY STOCK REPORT
// ==========================================
exports.exportInventoryExcel = (req, res) => {
  db.all("SELECT * FROM products WHERE is_active = 1 ORDER BY product_id DESC", [], (err, products) => {
    if (err) return res.status(500).json({ message: "Failed to fetch inventory" });

    const wb = XLSX.utils.book_new();

    const formattedProducts = (products || []).map((p) => {
      const price = p.selling_price || p.mrp || p.price_full || 0;
      const stockValuation = price * (p.stock_quantity || 0);
      const isLow = p.stock_quantity <= (p.min_stock_alert || 5);

      return {
        "Product Name": p.name,
        "Barcode": p.barcode,
        "HSN Code": p.hsn_code || "1905",
        "Category": p.category || "General",
        "Unit": p.unit || "pcs",
        "MRP (₹)": p.mrp || price,
        "Selling Price (₹)": price,
        "Cost Price (₹)": p.cost_price || 0,
        "Stock Quantity": p.stock_quantity,
        "Stock Valuation (₹)": stockValuation.toFixed(2),
        "GST Rate (%)": p.tax_rate || 0,
        "Stock Status": isLow ? "LOW STOCK ALERT" : "OK"
      };
    });

    const ws = XLSX.utils.json_to_sheet(formattedProducts);
    XLSX.utils.book_append_sheet(wb, ws, "Product Stock Master");

    const filePath = getExportPath("Inventory_Stock_Report");
    XLSX.writeFile(wb, filePath);
    res.download(filePath);
  });
};

// ==========================================
// 📒 4. EXCEL KHATA LEDGER REPORT
// ==========================================
exports.exportKhataExcel = (req, res) => {
  db.all("SELECT * FROM customers ORDER BY customer_id DESC", [], (err, customers) => {
    if (err) return res.status(500).json({ message: "Failed to fetch customer Khata" });

    db.all(
      `SELECT k.*, c.name as customer_name, c.phone as customer_phone 
       FROM khata_transactions k 
       JOIN customers c ON k.customer_id = c.customer_id 
       ORDER BY k.transaction_id DESC`,
      [],
      (tErr, transactions) => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Customer Balances
        const formattedCust = (customers || []).map((c) => ({
          "Customer Name": c.name,
          "Mobile Number": c.phone,
          "GSTIN": c.gstin || "N/A",
          "Outstanding Udhar Due (₹)": c.khata_balance || 0,
          "Loyalty Points": c.loyalty_points || 0
        }));

        const wsCust = XLSX.utils.json_to_sheet(formattedCust);
        XLSX.utils.book_append_sheet(wb, wsCust, "Customer Balances");

        // Sheet 2: Transactions
        const formattedTx = (transactions || []).map((t) => ({
          "Date & Time": new Date(t.date_time).toLocaleString("en-IN"),
          "Customer Name": t.customer_name,
          "Mobile": t.customer_phone,
          "Transaction Type": t.type === "debit" ? "Credit Given (Udhar)" : "Payment Received",
          "Amount (₹)": t.amount,
          "Note / Invoice": t.note
        }));

        const wsTx = XLSX.utils.json_to_sheet(formattedTx);
        XLSX.utils.book_append_sheet(wb, wsTx, "Udhar & Payment History");

        const filePath = getExportPath("Customer_Khata_Ledger");
        XLSX.writeFile(wb, filePath);
        res.download(filePath);
      }
    );
  });
};

// Legacy Export Route
exports.exportSales = exports.exportSalesReportExcel;