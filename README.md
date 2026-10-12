# 🚀 VyaparFlow Universal POS & ERP

> **A high-speed, offline-first Point of Sale (POS) and Enterprise Resource Planning (ERP) desktop application designed for Indian retail enterprises.**

![React](https://img.shields.io/badge/Frontend-React%2018-blue?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green?logo=node.js)
![SQLite](https://img.shields.io/badge/Database-SQLite3-skyblue?logo=sqlite)
![Electron](https://img.shields.io/badge/Desktop-Electron%2028-teal?logo=electron)
![GST](https://img.shields.io/badge/Tax-Indian%20GST%20Ready-orange)
![Tally](https://img.shields.io/badge/Accounting-Tally%20XML%20Sync-purple)

---

## 🌟 Highlights & Key Features

### 🛒 1. High-Speed DMart-Grade POS Terminal
* **Hardware Barcode Scanner Integration**: Instant keyboard wedge scanning with sub-second cart addition.
* **Loose / Damaged Barcode Handling**: Manual item entry modal and `F7` Quick-Add product directly from checkout without disrupting queue flow.
* **Multi-Payment Modalities**: Cash (with instant change calculation), Dynamic UPI QR generation (`upi://pay`), Credit Cards, and Khata (Udhar).
* **Silent Thermal Printing**: Hardware-level silent printing to 58mm/80mm thermal receipt printers via Electron IPC without annoying OS print dialogs.

### 🏢 2. Multi-Vertical Retail Architecture
Configurable for any retail business vertical:
* **Supermarket & Kirana**: FMCG attributes, bulk barcode management.
* **Pharmacy**: Chemical salt search, batch numbers, expiry alerts, Rx verification.
* **Apparel & Footwear**: Size/color variants, garment tags.
* **Wine & Liquor**: Volume (750ml, 375ml, 180ml), ABV percentages.
* **Electronics & Mobile**: IMEI and serial number warranty tracking.
* **Restaurants**: Table orders, KOT tracking.

### 📊 3. Indian GST & Accounting
* **Tax Calculations**: Inclusive and exclusive GST calculations across 0%, 5%, 12%, 18%, and 28% slabs.
* **Tax Filing**: Automatic generation of GSTR-1 (B2B and B2C) and GSTR-3B tax summaries.
* **Tally Prime & ERP 9 Export**: One-click XML export to sync sales invoices straight into your Chartered Accountant's Tally software.

### 📒 4. Customer CRM & Khata Ledger
* **Udhar / Credit Management**: Double-entry ledger tracking balances and debt settlements.
* **WhatsApp Receipts**: Share digital receipts and payment reminders via WhatsApp Web API.

### 🔒 5. Cash Drawer & Anti-Fraud Auditing
* **`F9` Shift-End Cash Closing**: Compares expected cash with physical cash across denominations (₹500, ₹200, ₹100, etc.) to immediately detect cashier shortages.
* **Security Audit Logs**: Immutable audit trail of bill cancellations, custom discounts, and price modifications.

---

## 🏛️ System Architecture

```
+-----------------------------------------------------------------------+
|                       DESKTOP LAYER (Electron)                        |
|  - main.js (Single Instance Lock, Backend Process Fork, Window Shell) |
|  - preload.js (Secure IPC Bridge for Silent Thermal Printing)         |
+-----------------------------------------------------------------------+
                                  |
        +-------------------------+-------------------------+
        |                                                   |
        v                                                   v
+-----------------------------+         +-------------------------------+
|    FRONTEND (React 18)      |         |     BACKEND (Node/Express)    |
| - HashRouter (Electron safe)|  HTTP   | - REST API (Port 5000)        |
| - Role Protected Routes     | ======> | - JWT + Bcrypt Authentication |
| - High-Speed POS Terminal   |  JSON   | - Business Logic & Auditing   |
| - Barcode & QR Code Engine  |         | - Auto Hourly Backup Rotation |
+-----------------------------+         +-------------------------------+
                                                        |
                                                        v
                                        +-------------------------------+
                                        |    DATABASE (SQLite3 Engine)  |
                                        | - Zero-config local database  |
                                        | - 20 Relational Tables        |
                                        | - Full ACID Compliance        |
                                        +-------------------------------+
```

---

## ⌨️ POS Hotkeys Reference

| Shortcut | Action |
|:---:|:---|
| **`Enter`** | Quick Checkout / Add Scanned Barcode |
| **`F4`** | Open Manual / Damaged Barcode Custom Item Modal |
| **`F7`** | Quick Add New Product to Inventory from POS |
| **`F9`** | Day/Shift End Cash Drawer Reconciliation |
| **`Esc`** | Close Open Dialogs / Clear Active Search |

---

## 📁 Repository Structure

```
VyaparFlow/
├── client/                     # React 18 Single-Page Application
│   ├── src/
│   │   ├── components/         # Layout, ProtectedRoute, RupeeTreeBackground
│   │   ├── pages/              # Sales, Inventory, Customers, Finance, etc.
│   │   ├── App.js              # HashRouter and Route definitions
│   │   └── config.js           # API URL configuration
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # Database connection (SQLite3)
│   ├── controllers/            # Sales, Products, Auth, Finance, etc.
│   ├── models/                 # initDB.js (20 Relational Tables Schema)
│   ├── routes/                 # Express API Endpoints
│   ├── server.js               # Entry point, backup engine & lifecycle
│   └── package.json
│
├── electron/                   # Desktop Native Wrapper
│   ├── main.js                 # Electron process manager & IPC printing
│   ├── preload.js              # Secure IPC bridge
│   └── package.json            # Electron Builder configuration
│
├── sample_inventory_products.csv # Ready-to-import sample retail inventory
└── README.md                   # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** (v9 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/utk712/Universal-POS-Software.git
cd Universal-POS-Software
```

### 2. Install Dependencies
```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install

# Install Electron Dependencies
cd ../electron
npm install
```

### 3. Running in Development
```bash
# Terminal 1: Start Server
cd server
npm start

# Terminal 2: Start Client
cd client
npm start

# Terminal 3: Launch Electron
cd electron
npm start
```

### 4. Building the Production Windows Installer
```bash
# 1. Build Client Assets
cd client
npm run build

# 2. Package Electron Windows Setup (.exe)
cd ../electron
npm run build
```
The compiled installer will be generated in `electron/dist/VyaparFlow POS & ERP Setup 1.0.0.exe`.

---

## 🛡️ License
Licensed under the ISC License. Created with ❤️ for Indian Retailers.
