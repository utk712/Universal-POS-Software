const http = require('http');

const API_BASE = 'http://127.0.0.1:5000';
let authToken = '';

function request(method, path, body = null, token = null) {
  return new Promise((resolve) => {
    const url = new URL(path, API_BASE);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      hostname: '127.0.0.1',
      port: 5000,
      path: url.pathname + url.search,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, raw: data });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message, body: {} });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runAllTests() {
  console.log("=================================================");
  console.log("🧪 STARTING COMPREHENSIVE END-TO-END FEATURE TEST");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(res, condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} (Status: ${res ? res.status : 'N/A'}, Error: ${res ? (res.error || JSON.stringify(res.body)) : 'N/A'})`);
      failed++;
    }
  }

  try {
    // ---------------------------------------------------------
    // TEST 1: User Registration & Authentication
    // ---------------------------------------------------------
    console.log("--- TEST MODULE 1: AUTHENTICATION & LOGIN ---");
    const regRes = await request('POST', '/api/auth/register-admin', {
      name: 'Owner Admin',
      email: 'owner@posstore.com',
      password: 'AdminPassword123!',
      store_name: 'Metro Care Superstore',
      mobile: '9876543210',
      active_vertical: 'supermarket'
    });
    assert(regRes, regRes.status === 200 || regRes.status === 400, "Admin Registration (/api/auth/register-admin)");

    const loginRes = await request('POST', '/api/auth/login', {
      email: 'owner@posstore.com',
      password: 'AdminPassword123!'
    });
    assert(loginRes, loginRes.status === 200 && loginRes.body.token, "Admin Login & JWT Token Generation (/api/auth/login)");
    authToken = loginRes.body.token;

    // ---------------------------------------------------------
    // TEST 2: Business Settings & Multi-Vertical Selection
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 2: BUSINESS SETTINGS & VERTICAL SWITCHING ---");
    const getSettingsRes = await request('GET', '/api/business/settings', null, authToken);
    assert(getSettingsRes, getSettingsRes.status === 200 && getSettingsRes.body.store_name, "Fetch Business Settings (/api/business/settings)");

    const updateVerticalRes = await request('PUT', '/api/business/settings', {
      store_name: 'Metro Care Pharmacy & Superstore',
      tagline: 'Quality Health & Grocery',
      active_vertical: 'pharmacy',
      gstin: '27AAAAA0000A1Z5',
      thermal_printer_width: '80mm'
    }, authToken);
    assert(updateVerticalRes, updateVerticalRes.status === 200, "Switch Active Business Vertical to 'pharmacy'");

    // ---------------------------------------------------------
    // TEST 3: Multi-Vertical Product Inventory Management
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 3: INVENTORY CATALOG & MULTI-VERTICAL PRODUCTS ---");
    
    // Add Pharmacy Product
    const addPharma = await request('POST', '/api/products', {
      name: 'Dolo 650mg Tablet Strip',
      barcode: 'PHARMA-DOL-650',
      hsn_code: '3004',
      category: 'Medicines',
      unit: 'strip',
      cost_price: 20,
      mrp: 35,
      selling_price: 30,
      stock_quantity: 100,
      min_stock_alert: 10,
      tax_rate: 12,
      batch_no: 'B2026-DOL',
      expiry_date: '2027-12-31',
      salt_name: 'Paracetamol 650mg',
      is_rx: 0
    }, authToken);
    assert(addPharma, addPharma.status === 200 && addPharma.body.product_id, "Add Pharmacy Product (Salt, Batch, Expiry)");

    // Add Restaurant Dish Product
    const addDish = await request('POST', '/api/products', {
      name: 'Paneer Butter Masala',
      barcode: 'REST-PNEER-01',
      hsn_code: '2106',
      category: 'Main Course',
      unit: 'portion',
      cost_price: 120,
      mrp: 260,
      selling_price: 240,
      stock_quantity: 50,
      min_stock_alert: 5,
      tax_rate: 5,
      food_type: 'veg'
    }, authToken);
    assert(addDish, addDish.status === 200, "Add Restaurant Dish Product (Veg Tag)");

    // Add Apparel Item
    const addApparel = await request('POST', '/api/products', {
      name: 'Men Slim Denim Jeans',
      barcode: 'APP-JEAN-32',
      hsn_code: '6203',
      category: 'Pants & Jeans',
      unit: 'pcs',
      cost_price: 600,
      mrp: 1499,
      selling_price: 1199,
      stock_quantity: 30,
      min_stock_alert: 5,
      tax_rate: 12,
      size_color: 'Size: 32, Blue'
    }, authToken);
    assert(addApparel, addApparel.status === 200, "Add Apparel Item (Size & Color)");

    // Add Electronics Item
    const addElectronics = await request('POST', '/api/products', {
      name: 'Samsung Galaxy Smartphone',
      barcode: 'ELEC-S24-128',
      hsn_code: '8517',
      category: 'Smartphones',
      unit: 'pcs',
      cost_price: 45000,
      mrp: 64999,
      selling_price: 59999,
      stock_quantity: 15,
      min_stock_alert: 2,
      tax_rate: 18,
      imei_serial: '864920104928174',
      warranty_months: 12
    }, authToken);
    assert(addElectronics, addElectronics.status === 200, "Add Electronics Device (IMEI & Warranty)");

    // Get Catalog with Salt & Barcode Search
    const searchRes = await request('GET', '/api/products?search=Paracetamol', null, authToken);
    assert(searchRes, searchRes.status === 200 && Array.isArray(searchRes.body) && searchRes.body.length > 0 && searchRes.body[0].salt_name.includes('Paracetamol'), "Product Search by Chemical Salt Name ('Paracetamol')");

    // ---------------------------------------------------------
    // TEST 4: Customers & Khata Ledger (Udhar)
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 4: CUSTOMERS & KHATA LEDGER ---");
    const addCustRes = await request('POST', '/api/customers', {
      name: 'Ramesh Kumar',
      phone: '9876543210',
      email: 'ramesh@gmail.com',
      address: 'Shop No 14, Main Market',
      gstin: '27BCDE0000F1Z5'
    }, authToken);
    assert(addCustRes, addCustRes.status === 200 || addCustRes.status === 400, "Add Customer Account");

    const getCustsRes = await request('GET', '/api/customers', null, authToken);
    assert(getCustsRes, getCustsRes.status === 200 && Array.isArray(getCustsRes.body) && getCustsRes.body.length > 0, "Fetch Customer Directory");
    const customerId = (getCustsRes.body && getCustsRes.body[0]) ? getCustsRes.body[0].customer_id : 1;

    // ---------------------------------------------------------
    // TEST 5: POS Checkout & Billing Terminal
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 5: POS CHECKOUT & INVOICING ---");
    const checkoutRes = await request('POST', '/api/sales/checkout', {
      customer_id: customerId,
      items: [
        {
          product_id: addPharma.body?.product_id || 1,
          product_name: 'Dolo 650mg Tablet Strip',
          hsn_code: '3004',
          quantity: 2,
          unit: 'strip',
          mrp: 35,
          selling_price: 30,
          tax_rate: 12,
          batch_no: 'B2026-DOL',
          expiry_date: '2027-12-31',
          salt_name: 'Paracetamol 650mg',
          item_details: 'B:B2026-DOL | Exp:2027-12-31'
        }
      ],
      discount: 5,
      payment_method: 'cash',
      notes: 'Customer Paid Cash'
    }, authToken);

    assert(checkoutRes, checkoutRes.status === 200 && checkoutRes.body.invoice_no, "Process POS Checkout Order & Generate Invoice Number");
    const orderId = checkoutRes.body?.order_id || 1;

    // Fetch Invoice Details
    const invoiceDetailsRes = await request('GET', `/api/sales/invoice/${orderId}`, null, authToken);
    assert(invoiceDetailsRes, invoiceDetailsRes.status === 200 && invoiceDetailsRes.body.items.length > 0, "Fetch Single Invoice Details & Line Items");

    // Fetch Sales History
    const historyRes = await request('GET', '/api/sales/history', null, authToken);
    assert(historyRes, historyRes.status === 200 && Array.isArray(historyRes.body) && historyRes.body.length > 0, "Fetch Sales Order History List");

    // ---------------------------------------------------------
    // TEST 6: Financial Closing Audit & Physical Cash Counter
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 6: DAILY CASH CLOSING AUDIT ---");
    const closingRes = await request('POST', '/api/finance/cash-closing', {
      opening_cash: 1000,
      actual_cash: 1055,
      denominations: { "500": 2, "50": 1, "5": 1 },
      notes: 'Shift Closing Checked'
    }, authToken);
    assert(closingRes, closingRes.status === 200, "Submit Physical Cash Denomination Audit Report");

    // ---------------------------------------------------------
    // TEST 7: Petty Cash Expenses & Vendor Payables
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 7: EXPENSES & VENDORS ---");
    const addExpenseRes = await request('POST', '/api/expenses', {
      category: 'Tea & Snacks',
      amount: 150,
      payment_method: 'cash',
      note: 'Evening Tea for Staff'
    }, authToken);
    assert(addExpenseRes, addExpenseRes.status === 200, "Log Petty Shop Expense");

    const addVendorRes = await request('POST', '/api/vendors', {
      name: 'Sun Pharma Distributors Ltd',
      mobile: '9820011223',
      company: 'Sun Pharma Ltd',
      gstin: '27SUNP0000F1Z1',
      address: 'Pharma Wholesale Hub, Mumbai'
    }, authToken);
    assert(addVendorRes, addVendorRes.status === 200, "Add Wholesale Vendor / Supplier");

    // ---------------------------------------------------------
    // TEST 8: 1-Click Tally Prime XML Exporter
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 8: TALLY PRIME XML EXPORT ---");
    const tallyRes = await request('GET', '/api/finance/tally-xml', null, authToken);
    assert(tallyRes, tallyRes.status === 200 && tallyRes.raw.includes('ENVELOPE'), "Generate 1-Click Tally Prime XML Export File");

    // ---------------------------------------------------------
    // TEST 9: Multi-Sheet Excel Reports (.xlsx)
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 9: MULTI-SHEET EXCEL REPORT WORKBOOKS ---");
    
    const excelSales = await request('GET', '/api/reports/excel/sales', null, authToken);
    assert(excelSales, excelSales.status === 200 && excelSales.headers['content-type'].includes('spreadsheetml'), "Download Sales Excel Workbook ('Sales_Report.xlsx')");

    const excelGst = await request('GET', '/api/reports/excel/gst', null, authToken);
    assert(excelGst, excelGst.status === 200 && excelGst.headers['content-type'].includes('spreadsheetml'), "Download GSTR-1 Excel Workbook ('GSTR1_Report.xlsx')");

    const excelInv = await request('GET', '/api/reports/excel/inventory', null, authToken);
    assert(excelInv, excelInv.status === 200 && excelInv.headers['content-type'].includes('spreadsheetml'), "Download Inventory Excel Workbook ('Inventory_Stock_Report.xlsx')");

    const excelKhata = await request('GET', '/api/reports/excel/khata', null, authToken);
    assert(excelKhata, excelKhata.status === 200 && excelKhata.headers['content-type'].includes('spreadsheetml'), "Download Customer Khata Excel Workbook ('Customer_Khata_Ledger.xlsx')");

    // ---------------------------------------------------------
    // TEST 10: Multi-Counter Supermarket Billing Hub
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 10: MULTI-COUNTER SUPERMARKET BILLING HUB ---");
    
    const getCountersRes = await request('GET', '/api/counters', null, authToken);
    assert(getCountersRes, getCountersRes.status === 200 && Array.isArray(getCountersRes.body) && getCountersRes.body.length >= 3, "Fetch Active Billing Counters Directory");

    const addCounterRes = await request('POST', '/api/counters', {
      counter_code: 'C4',
      counter_name: 'Counter 4 - Bakery & Fresh',
      location_notes: '1st Floor Dept'
    }, authToken);
    assert(addCounterRes, addCounterRes.status === 200 || addCounterRes.status === 400, "Register New Billing Counter ('C4')");

    const counterCheckoutRes = await request('POST', '/api/sales/checkout', {
      counter_id: 2,
      counter_code: 'C2',
      counter_name: 'Counter 2 - Express Lane',
      items: [
        {
          product_id: addPharma.body?.product_id || 1,
          product_name: 'Dolo 650mg Tablet Strip',
          hsn_code: '3004',
          quantity: 1,
          unit: 'strip',
          mrp: 35,
          selling_price: 30,
          tax_rate: 12
        }
      ],
      payment_method: 'cash',
      notes: 'Counter 2 Checkout'
    }, authToken);
    assert(counterCheckoutRes, counterCheckoutRes.status === 200 && counterCheckoutRes.body.invoice_no && counterCheckoutRes.body.invoice_no.includes('INV-C2-'), "Process Counter 2 Checkout Order (Invoice Prefix 'INV-C2-')");

    // ---------------------------------------------------------
    // TEST MODULE 11: PRODUCTION ENTERPRISE READINESS FEATURES
    // ---------------------------------------------------------
    console.log("\n--- TEST MODULE 11: PRODUCTION ENTERPRISE READINESS ---");

    const bulkImportRes = await request('POST', '/api/products/bulk-import', {
      items: [
        {
          name: 'Haldiram Bhujia 150g',
          barcode: '890123450001',
          category: 'Snacks',
          unit: 'pack',
          cost_price: 35,
          mrp: 50,
          selling_price: 45,
          stock_quantity: 40,
          tax_rate: 12,
          hsn_code: '2106'
        },
        {
          name: 'Amul Butter 100g',
          barcode: '890123450002',
          category: 'Dairy',
          unit: 'pack',
          cost_price: 50,
          mrp: 60,
          selling_price: 58,
          stock_quantity: 30,
          tax_rate: 12,
          hsn_code: '0402'
        }
      ]
    }, authToken);
    assert(bulkImportRes, bulkImportRes.status === 200 && bulkImportRes.body.imported === 2, "Bulk Product Import (Excel / CSV) (/api/products/bulk-import)");

    const backupDownloadRes = await request('GET', '/api/system/backup/download');
    assert(backupDownloadRes, backupDownloadRes.status === 200, "1-Click Full Database Backup Download (/api/system/backup/download)");

    // ---------------------------------------------------------
    // FINAL TEST SUMMARY
    // ---------------------------------------------------------
    console.log("\n=================================================");
    console.log(`🎉 TEST SUITE COMPLETE: ${passed} PASSED | ${failed} FAILED`);
    console.log("=================================================");
    
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("CRITICAL TEST RUNNER ERROR:", err);
    process.exit(1);
  }
}

runAllTests();
