const db = require("../config/db");

// ==========================================
// 🔥 DMART-GRADE MULTI-ITEM CHECKOUT & BILLING
// ==========================================
exports.checkoutOrder = (req, res) => {
  const {
    customer_id,
    customer_gstin = "",
    cashier_id,
    counter_id = 1,
    counter_code = "C1",
    counter_name = "Counter 1",
    items,
    discount = 0,
    payment_method = "cash",
    notes = ""
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Cart cannot be empty" });
  }

  const cleanCounterCode = (counter_code || "C1").toUpperCase();
  const invoiceNo = `INV-${cleanCounterCode}-` + Date.now().toString().slice(-8);
  const cleanCustomerGstin = (customer_gstin || "").trim().toUpperCase();
  const invoiceType = cleanCustomerGstin.length >= 15 ? "B2B" : "B2C";

  let totalMRP = 0;
  let subtotal = 0;
  let totalTax = 0;

  // Process item calculations
  const processedItems = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const mrp = Number(item.mrp) || Number(item.selling_price);
    const sellingPrice = Number(item.selling_price);
    const taxRate = Number(item.tax_rate) || 0;

    const itemTotalMRP = mrp * qty;
    const itemSubtotal = sellingPrice * qty;
    const itemTax = (itemSubtotal * taxRate) / (100 + taxRate); // Inclusive tax calculation

    totalMRP += itemTotalMRP;
    subtotal += itemSubtotal;
    totalTax += itemTax;

    let details = item.item_details || "";
    if (!details) {
      const parts = [];
      if (item.batch_no) parts.push(`B:${item.batch_no}`);
      if (item.expiry_date) parts.push(`Exp:${item.expiry_date}`);
      if (item.size_color) parts.push(`Size/Color:${item.size_color}`);
      if (item.imei_number) parts.push(`IMEI:${item.imei_number}`);
      details = parts.join(" | ");
    }

    return {
      product_id: item.product_id || null,
      variant_id: item.variant_id || null,
      product_name: item.name || item.product_name,
      hsn_code: item.hsn_code || "1905",
      batch_no: item.batch_no || "",
      expiry_date: item.expiry_date || "",
      item_details: details,
      quantity: qty,
      unit: item.unit || "pcs",
      mrp: mrp,
      selling_price: sellingPrice,
      tax_rate: taxRate,
      tax_amount: itemTax,
      subtotal: itemSubtotal
    };
  });

  const cartDiscount = Number(discount) || 0;
  const netAmount = Math.max(0, subtotal - cartDiscount);
  const totalSavings = Math.max(0, totalMRP - netAmount);

  db.serialize(() => {
    // 1. Insert Orders Header
    db.run(
      `INSERT INTO orders 
      (invoice_no, customer_id, customer_gstin, invoice_type, cashier_id, counter_id, counter_code, counter_name, total_mrp, total_savings, subtotal, tax_amount, discount, net_amount, payment_method, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNo,
        customer_id || null,
        cleanCustomerGstin,
        invoiceType,
        cashier_id || null,
        counter_id || 1,
        cleanCounterCode,
        counter_name || "Counter 1",
        totalMRP,
        totalSavings,
        subtotal,
        totalTax,
        cartDiscount,
        netAmount,
        payment_method,
        notes
      ],
      function (err) {
        if (err) {
          console.error("CHECKOUT ERROR:", err);
          return res.status(500).json({ message: "Failed to create order" });
        }

        const orderId = this.lastID;

        // 2. Insert Order Items & Deduct Stock
        const itemStmt = db.prepare(
          `INSERT INTO order_items 
          (order_id, product_id, variant_id, product_name, hsn_code, batch_no, expiry_date, item_details, quantity, unit, mrp, selling_price, tax_rate, tax_amount, subtotal) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        processedItems.forEach((item) => {
          itemStmt.run([
            orderId,
            item.product_id,
            item.variant_id,
            item.product_name,
            item.hsn_code,
            item.batch_no,
            item.expiry_date,
            item.item_details,
            item.quantity,
            item.unit,
            item.mrp,
            item.selling_price,
            item.tax_rate,
            item.tax_amount,
            item.subtotal
          ]);

          // Deduct main inventory stock
          if (item.product_id) {
            db.run(
              "UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE product_id = ?",
              [item.quantity, item.product_id]
            );
          }

          // Deduct variant stock if applicable
          if (item.variant_id) {
            db.run(
              "UPDATE product_variants SET stock_quantity = MAX(0, stock_quantity - ?) WHERE variant_id = ?",
              [item.quantity, item.variant_id]
            );
          }
        });

        itemStmt.finalize();

        // 3. If Khata / Udhar Sale, update customer balance & write debit ledger
        if (payment_method === "khata" && customer_id) {
          db.run(
            "UPDATE customers SET khata_balance = khata_balance + ? WHERE customer_id = ?",
            [netAmount, customer_id]
          );
          db.run(
            "INSERT INTO khata_transactions (customer_id, order_id, amount, type, note) VALUES (?, ?, ?, 'debit', ?)",
            [customer_id, orderId, netAmount, `Invoice #${invoiceNo}`]
          );
        }

        // Also insert into legacy sales table for backward reports compatibility
        processedItems.forEach((item) => {
          if (item.product_id) {
            db.run(
              "INSERT INTO sales (product_id, quantity, total_amount, employee_id) VALUES (?, ?, ?, ?)",
              [item.product_id, item.quantity, item.subtotal, cashier_id || null]
            );
          }
        });

        // Fetch business details for receipt rendering
        db.get("SELECT * FROM business_settings LIMIT 1", (bErr, storeInfo) => {
          res.json({
            message: "Order placed successfully! ✅",
            order_id: orderId,
            invoice_no: invoiceNo,
            invoice_type: invoiceType,
            customer_gstin: cleanCustomerGstin,
            net_amount: netAmount,
            total_savings: totalSavings,
            store_info: storeInfo,
            receipt_items: processedItems,
            payment_method
          });
        });
      }
    );
  });
};

// ==========================================
// ✅ GET ORDER HISTORY
// ==========================================
exports.getOrderHistory = (req, res) => {
  const { limit = 50 } = req.query;

  db.all(
    `SELECT o.*, c.name as customer_name, c.phone as customer_phone 
     FROM orders o 
     LEFT JOIN customers c ON o.customer_id = c.customer_id 
     ORDER BY o.order_id DESC LIMIT ?`,
    [Number(limit)],
    (err, rows) => {
      if (err) {
        console.error("GET ORDERS ERROR:", err);
        return res.status(500).json({ message: "Error fetching sales history" });
      }
      res.json(rows);
    }
  );
};

// ==========================================
// ✅ GET SINGLE INVOICE DETAILS
// ==========================================
exports.getInvoiceDetails = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.gstin as customer_gstin 
     FROM orders o 
     LEFT JOIN customers c ON o.customer_id = c.customer_id 
     WHERE o.order_id = ? OR o.invoice_no = ?`,
    [id, id],
    (err, order) => {
      if (err || !order) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      db.all("SELECT * FROM order_items WHERE order_id = ?", [order.order_id], (iErr, items) => {
        db.get("SELECT * FROM business_settings LIMIT 1", (bErr, storeInfo) => {
          res.json({
            order,
            items: items || [],
            store_info: storeInfo || {}
          });
        });
      });
    }
  );
};

// Legacy single-product sale route support
exports.saveSale = (req, res) => {
  const { product_id, quantity, employee_id } = req.body;

  if (!product_id || !quantity) {
    return res.status(400).json({ message: "Missing fields" });
  }

  db.get("SELECT * FROM products WHERE product_id = ?", [product_id], (err, product) => {
    if (err || !product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const price = product.selling_price || product.mrp || product.price_full || 0;
    const total = price * Number(quantity);

    // Call checkoutOrder format internally
    req.body.items = [
      {
        product_id: product.product_id,
        product_name: product.name,
        quantity: Number(quantity),
        unit: product.unit || "pcs",
        selling_price: price,
        mrp: product.mrp || price,
        tax_rate: product.tax_rate || 0
      }
    ];
    exports.checkoutOrder(req, res);
  });
};

// Delete / Void an invoice and restore stock
exports.deleteOrder = (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM orders WHERE order_id = ?", [id], (err, order) => {
    if (err || !order) {
      return res.status(404).json({ message: "Invoice / Order not found" });
    }

    // 1. Get items to restore inventory stock
    db.all("SELECT product_id, quantity FROM order_items WHERE order_id = ?", [id], (iErr, items) => {
      if (items && items.length > 0) {
        items.forEach((item) => {
          if (item.product_id) {
            db.run(
              "UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?",
              [item.quantity, item.product_id]
            );
          }
        });
      }

      // 2. Delete order items
      db.run("DELETE FROM order_items WHERE order_id = ?", [id], () => {
        // 3. Delete order
        db.run("DELETE FROM orders WHERE order_id = ?", [id], function (delErr) {
          if (delErr) {
            return res.status(500).json({ message: "Failed to delete order" });
          }
          res.json({
            message: `Invoice ${order.invoice_no} deleted & inventory restored 🗑️`,
            deleted_id: id
          });
        });
      });
    });
  });
};