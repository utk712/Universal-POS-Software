const db = require("../config/db");

// ========================================================
// 💵 1. SHIFT END COUNTER CASH CLOSING AUDIT
// ========================================================
exports.performCashClosing = (req, res) => {
  const { counter_id = 1, counter_code = "C1", counter_name = "Counter 1", opening_cash = 0, actual_cash = 0, denominations = {}, notes = "" } = req.body;
  const cashierId = req.user ? req.user.id : null;
  const cashierName = req.user ? req.user.name : "Cashier";

  const todayStart = new Date().toISOString().split("T")[0] + " 00:00:00";
  const cleanCounterCode = (counter_code || "C1").toUpperCase();

  // Calculate today's cash sales & cash petty expenses for this counter
  db.get(
    `SELECT 
      (SELECT COALESCE(SUM(net_amount), 0) FROM orders WHERE payment_method = 'cash' AND (counter_code = ? OR counter_id = ?) AND date_time >= ?) as cash_sales,
      (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE payment_method = 'cash' AND date_time >= ?) as petty_expenses`,
    [cleanCounterCode, counter_id, todayStart, todayStart],
    (err, result) => {
      if (err) {
        console.error("CASH CLOSING ERROR:", err);
        return res.status(500).json({ message: "Failed to calculate cash reconciliation" });
      }

      const cashSales = result ? Number(result.cash_sales) : 0;
      const pettyExpenses = result ? Number(result.petty_expenses) : 0;
      const expectedCash = Number(opening_cash) + cashSales - pettyExpenses;
      const shortageAmount = expectedCash - Number(actual_cash);

      db.run(
        `INSERT INTO cash_closings 
        (counter_id, counter_code, counter_name, cashier_id, cashier_name, opening_cash, cash_sales, petty_expenses, expected_cash, actual_cash, shortage_amount, denominations, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          counter_id || 1,
          cleanCounterCode,
          counter_name || "Counter 1",
          cashierId,
          cashierName,
          Number(opening_cash),
          cashSales,
          pettyExpenses,
          expectedCash,
          Number(actual_cash),
          shortageAmount,
          JSON.stringify(denominations),
          notes
        ],
        function (cErr) {
          if (cErr) {
            return res.status(500).json({ message: "Failed to save cash closing entry" });
          }

          res.json({
            message: shortageAmount > 0 
              ? `Shift Cash Closed! Shortage of ₹${shortageAmount.toFixed(2)} recorded ⚠️` 
              : "Shift Cash Closed! Counter balance perfectly matched ✅",
            closing_id: this.lastID,
            expected_cash: expectedCash,
            actual_cash: Number(actual_cash),
            shortage_amount: shortageAmount
          });
        }
      );
    }
  );
};

// ========================================================
// 📑 2. ONE-CLICK TALLY PRIME XML EXPORT GENERATOR
// ========================================================
exports.getTallyXmlExport = (req, res) => {
  const { start_date, end_date } = req.query;

  let query = "SELECT o.*, c.name as customer_name, c.gstin as customer_gstin FROM orders o LEFT JOIN customers c ON o.customer_id = c.customer_id";
  let params = [];

  if (start_date && end_date) {
    query += " WHERE o.date_time >= ? AND o.date_time <= ?";
    params.push(start_date + " 00:00:00", end_date + " 23:59:59");
  }

  query += " ORDER BY o.order_id ASC";

  db.all(query, params, (err, orders) => {
    if (err) {
      return res.status(500).json({ message: "Error building Tally export" });
    }

    db.get("SELECT * FROM business_settings LIMIT 1", (bErr, store) => {
      const storeName = store ? store.store_name : "POS Store";
      const salesLedger = store?.tally_sales_ledger || "Sales Account";
      const cgstLedger = store?.tally_cgst_ledger || "CGST";
      const sgstLedger = store?.tally_sgst_ledger || "SGST";
      const cashLedger = store?.tally_cash_ledger || "Cash Retail Buyer";
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<ENVELOPE>\n<HEADER>\n<TALLYREQUEST>Import Data</TALLYREQUEST>\n</HEADER>\n<BODY>\n<IMPORTDATA>\n<REQUESTDESC>\n<REPORTNAME>Vouchers</REPORTNAME>\n</REQUESTDESC>\n<REQUESTDATA>\n`;

      orders.forEach((ord) => {
        const dateStr = new Date(ord.date_time).toISOString().split("T")[0].replace(/-/g, "");
        const partyName = ord.customer_name ? ord.customer_name.replace(/&/g, "&amp;") : cashLedger;
        
        xml += `<TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
        xml += `<VOUCHER VCHTYPE="Sales" ACTION="Create">\n`;
        xml += `<DATE>${dateStr}</DATE>\n`;
        xml += `<VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>\n`;
        xml += `<VOUCHERNUMBER>${ord.invoice_no}</VOUCHERNUMBER>\n`;
        xml += `<PARTYLEDGERNAME>${partyName}</PARTYLEDGERNAME>\n`;
        xml += `<PERSISTEDVIEW>Invoice View</PERSISTEDVIEW>\n`;
        
        // Ledger Entries
        xml += `<ALLLEDGERENTRIES.LIST>\n`;
        xml += `<LEDGERNAME>${partyName}</LEDGERNAME>\n`;
        xml += `<ISDEEMEDPOSITIVE>YES</ISDEEMEDPOSITIVE>\n`;
        xml += `<AMOUNT>-${ord.net_amount}</AMOUNT>\n`;
        xml += `</ALLLEDGERENTRIES.LIST>\n`;

        xml += `<ALLLEDGERENTRIES.LIST>\n`;
        xml += `<LEDGERNAME>${salesLedger}</LEDGERNAME>\n`;
        xml += `<ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>\n`;
        xml += `<AMOUNT>${ord.subtotal}</AMOUNT>\n`;
        xml += `</ALLLEDGERENTRIES.LIST>\n`;

        if (ord.tax_amount > 0) {
          const halfTax = (ord.tax_amount / 2).toFixed(2);
          xml += `<ALLLEDGERENTRIES.LIST>\n<LEDGERNAME>${cgstLedger}</LEDGERNAME>\n<ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>\n<AMOUNT>${halfTax}</AMOUNT>\n</ALLLEDGERENTRIES.LIST>\n`;
          xml += `<ALLLEDGERENTRIES.LIST>\n<LEDGERNAME>${sgstLedger}</LEDGERNAME>\n<ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>\n<AMOUNT>${halfTax}</AMOUNT>\n</ALLLEDGERENTRIES.LIST>\n`;
        }

        xml += `</VOUCHER>\n`;
        xml += `</TALLYMESSAGE>\n`;
      });

      xml += `</REQUESTDATA>\n</IMPORTDATA>\n</BODY>\n</ENVELOPE>`;

      res.setHeader("Content-Type", "text/xml");
      res.setHeader("Content-Disposition", `attachment; filename=Tally_Sales_${Date.now()}.xml`);
      res.send(xml);
    });
  });
};

// ========================================================
// 📊 3. GST RETURN REPORTS (GSTR-1, GSTR-3B & HSN Summary)
// ========================================================
exports.getGstReports = (req, res) => {
  db.all(
    `SELECT 
      i.hsn_code,
      p.name as product_name,
      i.unit,
      SUM(i.quantity) as total_qty,
      SUM(i.subtotal) as total_val,
      SUM(i.tax_amount) as total_tax,
      i.tax_rate
     FROM order_items i
     LEFT JOIN products p ON i.product_id = p.product_id
     GROUP BY i.hsn_code, i.tax_rate`,
    [],
    (err, hsnSummary) => {
      if (err) {
        return res.status(500).json({ message: "Failed to generate HSN summary" });
      }

      db.get(
        `SELECT 
          COALESCE(SUM(subtotal), 0) as total_taxable,
          COALESCE(SUM(tax_amount), 0) as total_gst,
          COALESCE(SUM(net_amount), 0) as grand_total
         FROM orders`,
        [],
        (gErr, gstTotals) => {
          res.json({
            hsn_summary: hsnSummary || [],
            gst_totals: gstTotals || {},
            cgst: gstTotals ? (gstTotals.total_gst / 2).toFixed(2) : 0,
            sgst: gstTotals ? (gstTotals.total_gst / 2).toFixed(2) : 0
          });
        }
      );
    }
  );
};

// ========================================================
// 📈 4. LIVE PROFIT & LOSS (P&L) STATEMENT
// ========================================================
exports.getPnlSummary = (req, res) => {
  db.get(
    `SELECT 
      COALESCE(SUM(o.net_amount), 0) as total_revenue,
      COALESCE(SUM(o.subtotal), 0) as total_sales,
      COALESCE(SUM(i.quantity * p.cost_price), 0) as total_cogs
     FROM orders o
     JOIN order_items i ON o.order_id = i.order_id
     LEFT JOIN products p ON i.product_id = p.product_id`,
    [],
    (err, salesData) => {
      if (err) {
        console.error("PNL SALES ERROR:", err);
        return res.status(500).json({ message: "P&L calculation error" });
      }

      db.get("SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses", [], (eErr, expData) => {
        const revenue = Number(salesData.total_revenue || 0);
        const cogs = Number(salesData.total_cogs || 0);
        const grossProfit = revenue - cogs;
        const expenses = Number(expData.total_expenses || 0);
        const netProfit = grossProfit - expenses;

        res.json({
          revenue,
          cogs,
          gross_profit: grossProfit,
          operating_expenses: expenses,
          net_profit: netProfit,
          gross_margin_pct: revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0,
          net_margin_pct: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0
        });
      });
    }
  );
};

// ========================================================
// 🛡️ 5. ANTI-FRAUD AUDIT TRAIL LOGS
// ========================================================
exports.logAuditAction = (req, action, details) => {
  const userId = req.user ? req.user.id : null;
  const userName = req.user ? req.user.name : "System";

  db.run(
    "INSERT INTO audit_logs (user_id, user_name, action, details) VALUES (?, ?, ?, ?)",
    [userId, userName, action, details],
    (err) => {
      if (err) console.error("AUDIT LOG ERROR:", err);
    }
  );
};

exports.getAuditLogs = (req, res) => {
  db.all("SELECT * FROM audit_logs ORDER BY log_id DESC LIMIT 100", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch audit logs" });
    res.json(rows);
  });
};

// Delete single audit log entry
exports.deleteAuditLog = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM audit_logs WHERE log_id = ?", [id], function (err) {
    if (err) {
      console.error("DELETE AUDIT LOG ERROR:", err);
      return res.status(500).json({ message: "Failed to delete audit log entry" });
    }
    res.json({ message: "Audit log deleted successfully 🗑️", deleted_id: id });
  });
};

// Clear all audit logs
exports.clearAllAuditLogs = (req, res) => {
  db.run("DELETE FROM audit_logs", [], function (err) {
    if (err) {
      console.error("CLEAR AUDIT LOGS ERROR:", err);
      return res.status(500).json({ message: "Failed to clear audit trail logs" });
    }
    res.json({ message: "All audit trail records cleared successfully 🗑️" });
  });
};

// Get shift cash closing history
exports.getCashClosings = (req, res) => {
  db.all("SELECT * FROM cash_closings ORDER BY closing_id DESC LIMIT 50", [], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to fetch cash closings" });
    res.json(rows || []);
  });
};

// Delete shift cash closing record
exports.deleteCashClosing = (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM cash_closings WHERE closing_id = ?", [id], function (err) {
    if (err) {
      console.error("DELETE CASH CLOSING ERROR:", err);
      return res.status(500).json({ message: "Failed to delete cash closing record" });
    }
    res.json({ message: "Cash closing audit record deleted 🗑️", deleted_id: id });
  });
};

// ========================================================
// 🏛️ 6. 1-CLICK GSTR-1 CA-READY CSV EXPORT
// ========================================================
exports.getGstr1Export = (req, res) => {
  const { start_date, end_date } = req.query;

  let orderQuery = "SELECT * FROM orders";
  let params = [];

  if (start_date && end_date) {
    orderQuery += " WHERE date_time >= ? AND date_time <= ?";
    params.push(start_date + " 00:00:00", end_date + " 23:59:59");
  }

  orderQuery += " ORDER BY order_id ASC";

  db.all(orderQuery, params, (ordErr, orders) => {
    if (ordErr) {
      return res.status(500).json({ message: "Failed to fetch orders for GSTR-1" });
    }

    let itemQuery = `
      SELECT 
        i.hsn_code,
        p.name as product_name,
        i.unit,
        i.tax_rate,
        SUM(i.quantity) as total_qty,
        SUM(i.subtotal) as total_val,
        SUM(i.tax_amount) as total_tax
      FROM order_items i
      JOIN orders o ON i.order_id = o.order_id
      LEFT JOIN products p ON i.product_id = p.product_id
    `;
    let itemParams = [];

    if (start_date && end_date) {
      itemQuery += " WHERE o.date_time >= ? AND o.date_time <= ?";
      itemParams.push(start_date + " 00:00:00", end_date + " 23:59:59");
    }

    itemQuery += " GROUP BY i.hsn_code, i.tax_rate ORDER BY i.hsn_code ASC";

    db.all(itemQuery, itemParams, (itemErr, hsnRows) => {
      if (itemErr) {
        return res.status(500).json({ message: "Failed to compile HSN data for GSTR-1" });
      }

      db.get("SELECT * FROM business_settings LIMIT 1", (bErr, store) => {
        const storeName = store ? store.store_name : "VyaparFlow Superstore";
        const gstin = store ? store.gstin : "UNREGISTERED";
        const stateName = store?.state || "Madhya Pradesh";
        const stateCode = store?.state_code || "23";

        // Group by tax rates (0%, 5%, 12%, 18%, 28%)
        const rateGroups = {
          0: { rate: 0, taxable: 0, cgst: 0, sgst: 0, total_tax: 0, total_inv: 0 },
          5: { rate: 5, taxable: 0, cgst: 0, sgst: 0, total_tax: 0, total_inv: 0 },
          12: { rate: 12, taxable: 0, cgst: 0, sgst: 0, total_tax: 0, total_inv: 0 },
          18: { rate: 18, taxable: 0, cgst: 0, sgst: 0, total_tax: 0, total_inv: 0 },
          28: { rate: 28, taxable: 0, cgst: 0, sgst: 0, total_tax: 0, total_inv: 0 }
        };

        (hsnRows || []).forEach((row) => {
          const rate = Number(row.tax_rate) || 0;
          if (!rateGroups[rate]) {
            rateGroups[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, total_tax: 0, total_inv: 0 };
          }
          const totalVal = Number(row.total_val || 0);
          const totalTax = Number(row.total_tax || 0);
          const taxableVal = Math.max(0, totalVal - totalTax);

          rateGroups[rate].taxable += taxableVal;
          rateGroups[rate].cgst += totalTax / 2;
          rateGroups[rate].sgst += totalTax / 2;
          rateGroups[rate].total_tax += totalTax;
          rateGroups[rate].total_inv += totalVal;
        });

        // Filter B2B orders
        const b2bOrders = (orders || []).filter((o) => o.customer_gstin && o.customer_gstin.trim().length >= 15);

        // Build CSV Content
        let csv = `VYAPARFLOW POS & ERP - GSTR-1 MONTHLY TAX COMPLIANCE REPORT\n`;
        csv += `Trade Name,"${storeName}",GSTIN,"${gstin}",State,"${stateCode}-${stateName}"\n`;
        csv += `Report Generated,"${new Date().toLocaleString()}",Period,"${start_date || 'All-Time'} to ${end_date || 'Present'}"\n\n`;

        // TABLE 7: B2C Small Rate-wise
        csv += `--- GSTR-1 TABLE 7 (B2CS - RATE-WISE OUTWARD SUPPLIES SUMMARY) ---\n`;
        csv += `GST Rate,Taxable Value (Rs),Central Tax / CGST (Rs),State Tax / SGST (Rs),Integrated Tax / IGST (Rs),Total Tax (Rs),Total Invoice Value (Rs)\n`;

        let totTaxable = 0, totCgst = 0, totSgst = 0, totTax = 0, totInv = 0;
        [0, 5, 12, 18, 28].forEach((r) => {
          const g = rateGroups[r] || { taxable: 0, cgst: 0, sgst: 0, total_tax: 0, total_inv: 0 };
          totTaxable += g.taxable;
          totCgst += g.cgst;
          totSgst += g.sgst;
          totTax += g.total_tax;
          totInv += g.total_inv;

          csv += `${r}%,${g.taxable.toFixed(2)},${g.cgst.toFixed(2)},${g.sgst.toFixed(2)},0.00,${g.total_tax.toFixed(2)},${g.total_inv.toFixed(2)}\n`;
        });
        csv += `TOTAL,${totTaxable.toFixed(2)},${totCgst.toFixed(2)},${totSgst.toFixed(2)},0.00,${totTax.toFixed(2)},${totInv.toFixed(2)}\n\n`;

        // TABLE 12: HSN Summary
        csv += `--- GSTR-1 TABLE 12 (HSN / SAC SUMMARY OF OUTWARD SUPPLIES) ---\n`;
        csv += `HSN Code,Description,UQC,Total Qty,Total Value (Rs),Taxable Value (Rs),IGST (Rs),CGST (Rs),SGST (Rs),Total Tax (Rs)\n`;

        (hsnRows || []).forEach((h) => {
          const totalVal = Number(h.total_val || 0);
          const totalTax = Number(h.total_tax || 0);
          const taxableVal = Math.max(0, totalVal - totalTax);
          const halfTax = (totalTax / 2).toFixed(2);

          csv += `"${h.hsn_code || '1905'}","${(h.product_name || 'Item').replace(/"/g, '""')}","${(h.unit || 'pcs').toUpperCase()}",${h.total_qty},${totalVal.toFixed(2)},${taxableVal.toFixed(2)},0.00,${halfTax},${halfTax},${totalTax.toFixed(2)}\n`;
        });
        csv += `\n`;

        // TABLE 4A: B2B Invoices
        csv += `--- GSTR-1 TABLE 4A (B2B REGISTERED RECIPIENT INVOICES) ---\n`;
        csv += `Customer GSTIN,Invoice No,Invoice Date,Invoice Value (Rs),Place of Supply,Taxable Value (Rs),CGST (Rs),SGST (Rs),Total Tax (Rs)\n`;

        b2bOrders.forEach((b) => {
          const invVal = Number(b.net_amount || 0);
          const taxVal = Number(b.tax_amount || 0);
          const taxable = Math.max(0, invVal - taxVal);
          const halfTax = (taxVal / 2).toFixed(2);

          csv += `"${b.customer_gstin}","${b.invoice_no}","${b.date_time}",${invVal.toFixed(2)},"${stateCode}-${stateName}",${taxable.toFixed(2)},${halfTax},${halfTax},${taxVal.toFixed(2)}\n`;
        });

        if (b2bOrders.length === 0) {
          csv += `No B2B Invoices recorded in this period (All sales are B2C Retail)\n`;
        }

        const dateTag = new Date().toISOString().split("T")[0];
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=GSTR1_Monthly_Report_${dateTag}.csv`);
        res.send(csv);
      });
    });
  });
};

// ========================================================
// ⚙️ 7. GET FINANCIAL & TAX PREFERENCES
// ========================================================
exports.getFinancialSettings = (req, res) => {
  db.get("SELECT * FROM business_settings LIMIT 1", [], (err, settings) => {
    if (err) return res.status(500).json({ message: "Failed to fetch finance settings" });
    res.json({
      store_name: settings?.store_name || "VyaparFlow Superstore",
      gstin: settings?.gstin || "",
      state: settings?.state || "Madhya Pradesh",
      state_code: settings?.state_code || "23",
      default_gst_rate: settings?.default_gst_rate !== undefined ? settings.default_gst_rate : 5.0,
      is_tax_inclusive: settings?.is_tax_inclusive !== undefined ? settings.is_tax_inclusive : 1,
      is_composition_scheme: settings?.is_composition_scheme !== undefined ? settings.is_composition_scheme : 0,
      tally_sales_ledger: settings?.tally_sales_ledger || "Sales Account",
      tally_cgst_ledger: settings?.tally_cgst_ledger || "CGST",
      tally_sgst_ledger: settings?.tally_sgst_ledger || "SGST",
      tally_cash_ledger: settings?.tally_cash_ledger || "Cash Retail Buyer",
      default_opening_cash: settings?.default_opening_cash !== undefined ? settings.default_opening_cash : 2000.0
    });
  });
};

// ========================================================
// ⚙️ 8. UPDATE FINANCIAL & TAX PREFERENCES
// ========================================================
exports.updateFinancialSettings = (req, res) => {
  const {
    gstin,
    state,
    state_code,
    default_gst_rate,
    is_tax_inclusive,
    is_composition_scheme,
    tally_sales_ledger,
    tally_cgst_ledger,
    tally_sgst_ledger,
    tally_cash_ledger,
    default_opening_cash
  } = req.body;

  db.run(
    `UPDATE business_settings SET
      gstin = COALESCE(?, gstin),
      state = COALESCE(?, state),
      state_code = COALESCE(?, state_code),
      default_gst_rate = COALESCE(?, default_gst_rate),
      is_tax_inclusive = COALESCE(?, is_tax_inclusive),
      is_composition_scheme = COALESCE(?, is_composition_scheme),
      tally_sales_ledger = COALESCE(?, tally_sales_ledger),
      tally_cgst_ledger = COALESCE(?, tally_cgst_ledger),
      tally_sgst_ledger = COALESCE(?, tally_sgst_ledger),
      tally_cash_ledger = COALESCE(?, tally_cash_ledger),
      default_opening_cash = COALESCE(?, default_opening_cash)
     WHERE id = (SELECT id FROM business_settings LIMIT 1)`,
    [
      gstin,
      state,
      state_code,
      default_gst_rate !== undefined ? Number(default_gst_rate) : null,
      is_tax_inclusive !== undefined ? Number(is_tax_inclusive) : null,
      is_composition_scheme !== undefined ? Number(is_composition_scheme) : null,
      tally_sales_ledger,
      tally_cgst_ledger,
      tally_sgst_ledger,
      tally_cash_ledger,
      default_opening_cash !== undefined ? Number(default_opening_cash) : null
    ],
    function (err) {
      if (err) {
        console.error("UPDATE FINANCIAL SETTINGS ERROR:", err);
        return res.status(500).json({ message: "Failed to update financial settings" });
      }

      // Log to audit trail
      exports.logAuditAction(req, "FINANCE_CONFIG_UPDATE", `Updated tax rate (${default_gst_rate}%) and Tally preferences`);

      res.json({ message: "Financial & Tax preferences saved successfully! ✅" });
    }
  );
};


