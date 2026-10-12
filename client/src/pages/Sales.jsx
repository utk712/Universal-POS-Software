import React, { useEffect, useState, useRef } from "react";
import API_URL from "../config";
import ThermalReceiptModal from "../components/ThermalReceiptModal";
import { authFetch } from "../utils/auth";

export default function Sales() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustLoading, setNewCustLoading] = useState(false);
  const [newCustMsg, setNewCustMsg] = useState("");
  const [discount, setDiscount] = useState(0);
  const [storeInfo, setStoreInfo] = useState({});

  // 🏷️ Manual Entry / Custom Item Modal (For Damaged Barcodes & Loose Counter Items)
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemQty, setCustomItemQty] = useState(1);
  const [customItemTax, setCustomItemTax] = useState(0);
  const [customItemUnit, setCustomItemUnit] = useState("pcs");
  const [customItemNote, setCustomItemNote] = useState("");

  // ➕ Quick Add Product to Inventory Modal from POS
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickCategory, setQuickCategory] = useState("General");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickMrp, setQuickMrp] = useState("");
  const [quickStock, setQuickStock] = useState("10");
  const [quickBarcode, setQuickBarcode] = useState("");
  const [quickUnit, setQuickUnit] = useState("pcs");
  const [quickTaxRate, setQuickTaxRate] = useState("0");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState("");

  // Cart Hold / Parking Feature (Bharat ERP Style)
  const [heldCarts, setHeldCarts] = useState([]);
  const [showHeldModal, setShowHeldModal] = useState(false);

  // Business Vertical Specific States
  const [selectedTable, setSelectedTable] = useState("Table 1");
  const [orderType, setOrderType] = useState("Dine-In");
  const [selectedSize, setSelectedSize] = useState("M");
  const [imeiNumber, setImeiNumber] = useState("");

  // Checkout & Payment Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [splitCash, setSplitCash] = useState("");
  const [splitUpi, setSplitUpi] = useState("");
  const [notes, setNotes] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [isB2B, setIsB2B] = useState(false);
  const [message, setMessage] = useState("");
  const [receiptData, setReceiptData] = useState(null);

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [cart, showPaymentModal, showHeldModal]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchStoreInfo();

    const onVerticalChange = () => {
      fetchStoreInfo();
      fetchProducts();
    };

    window.addEventListener("business-vertical-changed", onVerticalChange);
    window.addEventListener("store-settings-updated", onVerticalChange);

    return () => {
      window.removeEventListener("business-vertical-changed", onVerticalChange);
      window.removeEventListener("store-settings-updated", onVerticalChange);
    };
  }, []);

  const fetchProducts = async (overrideInfo) => {
    try {
      const res = await authFetch(`${API_URL}/api/products`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        const info = overrideInfo || storeInfo;
        const vert = info?.active_vertical || "liquor";
        const defaultCats = {
          liquor: ["Whisky", "Rum", "Vodka", "Beer", "Wine", "Gin", "Brandy", "Snacks", "General"],
          pharmacy: ["Medicines", "Syrups & Drops", "Injections", "Ointments", "Supplements", "General"],
          restaurant: ["Starters", "Main Course", "Beverages & Shakes", "Desserts", "Snacks", "General"],
          apparel: ["Shirts & Tops", "Pants & Jeans", "Ethnic Wear", "Footwear", "General"],
          electronics: ["Smartphones", "Accessories", "Gadgets", "General"],
          hardware: ["Electricals", "Plumbing", "Paints", "Tools", "General"],
          jewelry: ["Gold Rings", "Necklaces", "Bangles", "Silver", "General"],
          supermarket: ["Grocery", "Beverages", "Dairy & Bakery", "Snacks", "General"]
        };
        const vCats = defaultCats[vert] || ["General", "Grocery", "Beverages", "Snacks"];
        const existingCats = data.map((p) => p.category).filter(Boolean);
        const cats = ["All", ...new Set([...vCats, ...existingCats])];
        setCategories(cats);
      }
    } catch {
      setMessage("Error loading catalog ❌");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/customers`);
      const data = await res.json();
      if (Array.isArray(data)) setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStoreInfo = async () => {
    try {
      const res = await authFetch(`${API_URL}/api/business/settings`);
      const data = await res.json();
      if (data) {
        setStoreInfo(data);
        fetchProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCustomerFromPOS = async (e) => {
    if (e) e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setNewCustMsg("Please enter both Customer Name and Mobile number ❌");
      return;
    }
    setNewCustLoading(true);
    setNewCustMsg("");
    try {
      const res = await authFetch(`${API_URL}/api/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustName.trim(),
          phone: newCustPhone.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomers((prev) => {
          const exists = prev.find((c) => c.customer_id === data.customer.customer_id);
          return exists ? prev : [data.customer, ...prev];
        });
        setSelectedCustomer(data.customer);
        setShowAddCustomerModal(false);
        setNewCustName("");
        setNewCustPhone("");
        setCustomerSearch("");
        setMessage(`Customer linked: ${data.customer.name} (📱 ${data.customer.phone}) ✅`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setNewCustMsg(data.message || "Failed to add customer ❌");
      }
    } catch {
      setNewCustMsg("Server error adding customer ❌");
    }
    setNewCustLoading(false);
  };

  // 🏷️ Handler: Add Custom / Unbarcoded Item Directly to Bill (F4)
  const handleAddCustomItem = (e) => {
    if (e) e.preventDefault();
    const priceNum = Number(customItemPrice);
    if (!customItemName.trim()) {
      setMessage("⚠️ Please enter Item Name for custom item");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      setMessage("⚠️ Please enter a valid price greater than ₹0");
      return;
    }
    const qty = Number(customItemQty) || 1;
    const tax = Number(customItemTax) || 0;

    const newCustomItem = {
      product_id: null,
      custom_id: "custom_" + Date.now(),
      name: customItemName.trim(),
      barcode: "",
      hsn_code: "9999",
      batch_no: "",
      expiry_date: "",
      item_details: customItemNote.trim() || "Manual / Damaged Barcode Item",
      unit: customItemUnit || "pcs",
      mrp: priceNum,
      selling_price: priceNum,
      tax_rate: tax,
      quantity: qty,
      subtotal: priceNum * qty
    };

    setCart((prev) => [...prev, newCustomItem]);
    setShowCustomItemModal(false);
    setCustomItemName("");
    setCustomItemPrice("");
    setCustomItemQty(1);
    setCustomItemTax(0);
    setCustomItemNote("");
    setSearch("");
    setMessage(`✅ Added "${newCustomItem.name}" (₹${priceNum}) to cart!`);
    setTimeout(() => setMessage(""), 3500);
  };

  // ➕ Handler: Quick Add Product to Inventory from POS (F7)
  const handleQuickAddProduct = async (e) => {
    if (e) e.preventDefault();
    if (!quickName.trim() || !quickPrice) {
      setQuickError("Product name and selling price are required ❌");
      return;
    }
    setQuickLoading(true);
    setQuickError("");
    try {
      const priceNum = Number(quickPrice);
      const mrpNum = Number(quickMrp || quickPrice);
      const stockNum = Number(quickStock || 10);
      const taxNum = Number(quickTaxRate || 0);

      const payload = {
        name: quickName.trim(),
        category: quickCategory || "General",
        selling_price: priceNum,
        mrp: mrpNum,
        stock_quantity: stockNum,
        barcode: quickBarcode.trim() || undefined,
        unit: quickUnit || "pcs",
        tax_rate: taxNum
      };

      const res = await authFetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        const createdProd = {
          product_id: data.product_id,
          barcode: data.barcode || payload.barcode,
          ...payload
        };

        setProducts((prev) => [createdProd, ...prev]);
        addToCart(createdProd);
        setShowQuickAddModal(false);
        setQuickName("");
        setQuickPrice("");
        setQuickMrp("");
        setQuickBarcode("");
        setQuickStock("10");
        setSearch("");
        setMessage(`✅ Product "${createdProd.name}" saved to catalog & added to bill!`);
        setTimeout(() => setMessage(""), 3500);
      } else {
        setQuickError(data.message || "Failed to add product ❌");
      }
    } catch {
      setQuickError("Server error while adding product ❌");
    }
    setQuickLoading(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    const query = search.trim().toLowerCase();

    // 0. 🔥 GS1 Electronic Weigh-Scale Barcode Parser (Prefix 29, 13 Digits)
    if (query.startsWith("29") && query.length === 13) {
      const scaleSku = query.substring(2, 7); // 5-digit item SKU
      const scaleGrams = parseInt(query.substring(7, 12), 10) || 0; // 5-digit weight in grams
      const parsedWeightKg = Number((scaleGrams / 1000).toFixed(3)); // Convert to kg (e.g. 01250 -> 1.250 kg)

      const matchedScaleProd = products.find(
        (p) =>
          (p.barcode && (p.barcode.toLowerCase() === scaleSku || p.barcode === query)) ||
          (p.hsn_code && p.hsn_code === scaleSku) ||
          (p.product_id && p.product_id.toString() === scaleSku)
      );

      if (matchedScaleProd) {
        addToCart(matchedScaleProd, parsedWeightKg);
        setSearch("");
        setMessage(`⚖️ Weigh-Scale Item Added: "${matchedScaleProd.name}" (${parsedWeightKg} kg) ✅`);
        setTimeout(() => setMessage(""), 3500);
        return;
      }
    }

    // 1. Exact Barcode Match
    const matchedBarcode = products.find(
      (p) => p.barcode && p.barcode.toLowerCase() === query
    );

    if (matchedBarcode) {
      addToCart(matchedBarcode);
      setSearch("");
      return;
    }

    // 2. Exact Name Match
    const exactName = products.find((p) => p.name.toLowerCase() === query);
    if (exactName) {
      addToCart(exactName);
      setSearch("");
      return;
    }

    // 3. Partial Name Matches
    const matchedNames = products.filter((p) =>
      p.name.toLowerCase().includes(query)
    );

    if (matchedNames.length === 1) {
      addToCart(matchedNames[0]);
      setSearch("");
      return;
    }

    // 4. Fallback for Damaged / Unrecognized Barcode or Unlisted Items
    if (matchedNames.length === 0) {
      setCustomItemName(search.trim());
      setQuickName(search.trim());
      setShowCustomItemModal(true);
      setMessage(`ℹ️ Barcode/Name "${search}" not found. Enter price to add manually!`);
    }
  };

  const addToCart = (product, customQty = 1) => {
    const addQty = Number(customQty) || 1;
    const existingIndex = product.product_id 
      ? cart.findIndex((i) => i.product_id === product.product_id)
      : -1;
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity = Number((newCart[existingIndex].quantity + addQty).toFixed(3));
      newCart[existingIndex].subtotal = Number((newCart[existingIndex].quantity * newCart[existingIndex].selling_price).toFixed(2));
      setCart(newCart);
    } else {
      const price = Number(product.selling_price || product.mrp || product.price_full || 0);
      const mrp = Number(product.mrp || price);

      const detailsParts = [];
      if (product.batch_no) detailsParts.push(`B:${product.batch_no}`);
      if (product.expiry_date) detailsParts.push(`Exp:${product.expiry_date}`);
      if (product.size_color || (storeInfo.active_vertical === "apparel" && selectedSize)) {
        detailsParts.push(`Size:${product.size_color || selectedSize}`);
      }
      if (product.imei_serial || imeiNumber) detailsParts.push(`IMEI:${product.imei_serial || imeiNumber}`);
      if (product.food_type && product.food_type !== "veg") detailsParts.push(`[${product.food_type.toUpperCase()}]`);
      if (product.purity_karat) detailsParts.push(`Purity:${product.purity_karat}`);
      if (product.material_spec) detailsParts.push(`Spec:${product.material_spec}`);
      if (product.liquor_size) detailsParts.push(`Vol:${product.liquor_size}`);

      const itemDetails = detailsParts.join(" | ");

      setCart([
        ...cart,
        {
          product_id: product.product_id,
          name: product.name + (storeInfo.active_vertical === "apparel" && selectedSize ? ` (${selectedSize})` : ""),
          barcode: product.barcode,
          category: product.category || "General",
          hsn_code: product.hsn_code || (storeInfo.active_vertical === "pharmacy" ? "3004" : storeInfo.active_vertical === "liquor" ? "2208" : "1905"),
          batch_no: product.batch_no || "",
          expiry_date: product.expiry_date || "",
          salt_name: product.salt_name || "",
          is_rx: product.is_rx || 0,
          food_type: product.food_type || "veg",
          size_color: product.size_color || (storeInfo.active_vertical === "apparel" ? selectedSize : ""),
          imei_serial: product.imei_serial || imeiNumber || "",
          warranty_months: product.warranty_months || 0,
          liquor_size: product.liquor_size || "",
          alcohol_percent: product.alcohol_percent || 0,
          material_spec: product.material_spec || "",
          purity_karat: product.purity_karat || "",
          gross_weight_gm: product.gross_weight_gm || 0,
          making_charge: product.making_charge || 0,
          item_details: itemDetails,
          unit: product.unit || (storeInfo.active_vertical === "pharmacy" ? "strip" : "pcs"),
          mrp,
          selling_price: price,
          tax_rate: product.tax_rate || 0,
          quantity: addQty,
          subtotal: Number((price * addQty).toFixed(2))
        }
      ]);
    }
  };

  const updateQuantity = (index, newQty) => {
    const qty = Math.max(0.001, Number(newQty));
    const newCart = [...cart];
    newCart[index].quantity = qty;
    newCart[index].subtotal = qty * newCart[index].selling_price;
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculations
  const totalMRP = cart.reduce((acc, i) => acc + i.mrp * i.quantity, 0);
  const cartSubtotal = cart.reduce((acc, i) => acc + i.subtotal, 0);
  const netPayable = Math.max(0, cartSubtotal - Number(discount || 0));
  const totalSavings = Math.max(0, totalMRP - netPayable);

  // Bharat ERP Feature: Cart Parking / Hold Bill
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const newHeld = {
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cart: [...cart],
      customer: selectedCustomer,
      discount: discount,
      netPayable: netPayable
    };
    setHeldCarts([newHeld, ...heldCarts]);
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setMessage("Bill held / parked successfully! ⏸️");
    setTimeout(() => setMessage(""), 3000);
  };

  const handleResumeCart = (heldItem) => {
    setCart(heldItem.cart);
    setSelectedCustomer(heldItem.customer || null);
    setDiscount(heldItem.discount || 0);
    setHeldCarts(heldCarts.filter((h) => h.id !== heldItem.id));
    setShowHeldModal(false);
  };

  // Keyboard Hotkeys (F2: Pay, F4: Custom Item, F7: Quick Add, F8: Hold Bill, Esc: Close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0) setShowPaymentModal(true);
      } else if (e.key === "F4") {
        e.preventDefault();
        setCustomItemName(search.trim());
        setShowCustomItemModal(true);
      } else if (e.key === "F7") {
        e.preventDefault();
        setQuickName(search.trim());
        setShowQuickAddModal(true);
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) handleHoldCart();
      } else if (e.key === "Escape") {
        setShowPaymentModal(false);
        setShowHeldModal(false);
        setShowAddCustomerModal(false);
        setShowCustomItemModal(false);
        setShowQuickAddModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, heldCarts, discount, selectedCustomer, netPayable, search]);

  const handleFinalCheckout = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === "khata" && !selectedCustomer) {
      alert("Please select a customer for Khata / Udhar payment");
      return;
    }

    // ⚠️ Indian Income Tax Section 269ST Compliance Check (>= Rs. 2,00,000 cash)
    const effectiveCashAmount = paymentMethod === "cash"
      ? netPayable
      : paymentMethod === "split"
      ? Number(splitCash || 0)
      : 0;

    if (effectiveCashAmount >= 200000) {
      const confirmProceed = window.confirm(
        "⚠️ INCOME TAX STATUTORY ALERT (Section 269ST):\n\n" +
        `You are recording a cash payment of ₹${effectiveCashAmount.toLocaleString("en-IN")}.\n\n` +
        "Under Indian Income Tax rules, single cash transactions of ₹2,00,000 or more are prohibited and attract a 100% penalty on the business.\n\n" +
        "Recommended: Collect via UPI, Card, Net Banking, or Cheque.\n\n" +
        "Click OK to proceed anyway, or Cancel to choose digital payment."
      );
      if (!confirmProceed) return;
    }

    const notePayload = paymentMethod === "split"
      ? `Split Pay: Cash ₹${splitCash || 0} + UPI ₹${splitUpi || 0} ${notes ? "| " + notes : ""}`
      : storeInfo.active_vertical === "restaurant"
      ? `${orderType} | ${selectedTable} ${notes ? "| " + notes : ""}`
      : storeInfo.active_vertical === "electronics" && imeiNumber
      ? `IMEI/Serial: ${imeiNumber} ${notes ? "| " + notes : ""}`
      : notes;

    const activeCounterId = localStorage.getItem("active_counter_id") || 1;
    const activeCounterCode = localStorage.getItem("active_counter_code") || "C1";
    const activeCounterName = localStorage.getItem("active_counter_name") || "Counter 1";
    const cleanGstin = isB2B ? customerGstin.trim().toUpperCase() : "";

    try {
      const res = await authFetch(`${API_URL}/api/sales/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomer ? selectedCustomer.customer_id : null,
          customer_gstin: cleanGstin,
          counter_id: Number(activeCounterId),
          counter_code: activeCounterCode,
          counter_name: activeCounterName,
          items: cart,
          discount: Number(discount || 0),
          payment_method: paymentMethod,
          notes: notePayload
        })
      });

      const data = await res.json();

      if (res.ok) {
        setReceiptData({
          invoice_no: data.invoice_no,
          order_id: data.order_id,
          invoice_type: data.invoice_type || (cleanGstin ? "B2B" : "B2C"),
          customer_gstin: cleanGstin,
          counter_code: activeCounterCode,
          counter_name: activeCounterName,
          net_amount: netPayable,
          total_savings: totalSavings,
          store_info: data.store_info || storeInfo,
          receipt_items: cart,
          payment_method: paymentMethod === "split" ? `Split (Cash ₹${splitCash || 0} + UPI ₹${splitUpi || 0})` : paymentMethod,
          customer: selectedCustomer,
          date_time: new Date()
        });

        setCart([]);
        setDiscount(0);
        setCashReceived("");
        setSplitCash("");
        setSplitUpi("");
        setImeiNumber("");
        setCustomerGstin("");
        setIsB2B(false);
        setShowPaymentModal(false);
        setSelectedCustomer(null);
        fetchProducts();
      } else {
        alert(data.message || "Checkout failed");
      }
    } catch {
      alert("Server error during checkout");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchLower) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchLower)) ||
      (p.salt_name && p.salt_name.toLowerCase().includes(searchLower)) ||
      (p.batch_no && p.batch_no.toLowerCase().includes(searchLower)) ||
      (p.imei_serial && p.imei_serial.toLowerCase().includes(searchLower)) ||
      (p.size_color && p.size_color.toLowerCase().includes(searchLower)) ||
      (p.material_spec && p.material_spec.toLowerCase().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  const upiId = storeInfo.upi_id || "9876543210@upi";
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeInfo.store_name || "Store")}&am=${netPayable}&cu=INR`;
  const modalQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`;

  const activeVertical = storeInfo.active_vertical || "supermarket";
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div style={{ display: "flex", gap: "18px", height: "calc(100vh - 100px)" }} className="animate-fade-in">
      
      {/* 🚀 LEFT PANEL: Adaptive Product Catalog (60%) */}
      <div
        className="pos-card"
        style={{
          flex: "1.4",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          overflow: "hidden"
        }}
      >
        {/* Messages */}
        {message && (
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "8px 12px", borderRadius: "8px", fontWeight: "700", fontSize: "12px", marginBottom: "10px" }}>
            {message}
          </div>
        )}

        {/* Dynamic Business Header Adaptations */}
        {activeVertical === "pharmacy" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", background: "linear-gradient(135deg, #f0fdf4, #e0f2fe)", padding: "10px 14px", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "18px" }}>💊</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#15803d" }}>Pharmacy & Medical Counter</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Search by Drug Name or Chemical Salt composition</div>
              </div>
            </div>
            <span className="badge-pill badge-green" style={{ fontSize: "11px" }}>Batch & Expiry Safe Active</span>
          </div>
        )}

        {activeVertical === "restaurant" && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px", background: "var(--surface-alt)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Table Layout</label>
              <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="pos-input" style={{ padding: "6px" }}>
                {["Table 1", "Table 2", "Table 3", "Table 4", "Table 5", "VIP Booth 1"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>Order Mode</label>
              <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="pos-input" style={{ padding: "6px" }}>
                <option value="Dine-In">🍽️ Dine-In</option>
                <option value="Takeaway">📦 Takeaway / Parcel</option>
                <option value="Delivery">🛵 Home Delivery</option>
              </select>
            </div>
          </div>
        )}

        {activeVertical === "apparel" && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", background: "var(--surface-alt)", padding: "8px 12px", borderRadius: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-dark)" }}>Garment Size Bar:</span>
            {["S", "M", "L", "XL", "XXL", "30", "32", "34", "36"].map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: selectedSize === sz ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: selectedSize === sz ? "var(--primary-light)" : "var(--surface)",
                  color: selectedSize === sz ? "var(--primary-hover)" : "var(--text-dark)",
                  fontWeight: "800",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                {sz}
              </button>
            ))}
          </div>
        )}

        {activeVertical === "jewelry" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", background: "linear-gradient(135deg, #fffbeb, #fef3c7)", padding: "8px 12px", borderRadius: "10px", border: "1px solid #fde68a" }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "#b45309" }}>💎 Jewelry Billing Mode (Weight & Karat Billing Active)</div>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#92400e" }}>Gold 22K: ₹7,450 / gm</span>
          </div>
        )}

        {activeVertical === "hardware" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", background: "var(--surface-alt)", padding: "8px 12px", borderRadius: "10px" }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: "var(--text-dark)" }}>🔧 Hardware & Electricals (Decimal Quantity Billing Supported)</div>
          </div>
        )}

        {/* Scanner Search Header & Quick Action Bar */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px", alignItems: "center" }}>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: "flex", margin: 0 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", color: "var(--text-muted)" }}>
                🔍
              </span>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder={
                  activeVertical === "pharmacy"
                    ? "Search Medicine by Brand Name, Salt composition or Batch..."
                    : activeVertical === "electronics"
                    ? "Scan Model Barcode or Serial IMEI..."
                    : activeVertical === "restaurant"
                    ? "Search Food Items / Dishes..."
                    : activeVertical === "apparel"
                    ? "Search Garment Name, Size or Color..."
                    : activeVertical === "hardware"
                    ? "Search Wire Gauge, Pipe Size or Material Spec..."
                    : activeVertical === "jewelry"
                    ? "Search Gold/Silver Ornaments by Karat or Barcode..."
                    : "Scan Barcode or Search Item Name (Press F2 to Checkout)..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pos-input"
                style={{
                  paddingLeft: "42px",
                  paddingRight: search ? "36px" : "12px",
                  height: "46px",
                  fontSize: "14px",
                  fontWeight: "600",
                  borderColor: "var(--primary)"
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* 🏷️ Manual Entry / Custom Item (For Damaged Barcodes & Loose Items) */}
          <button
            type="button"
            onClick={() => {
              setCustomItemName(search.trim());
              setShowCustomItemModal(true);
            }}
            style={{
              padding: "0 12px",
              height: "46px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              color: "#92400e",
              border: "1px solid #f59e0b",
              fontWeight: "800",
              fontSize: "12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            title="Add unlisted / damaged barcode item directly to bill (F4)"
          >
            <span>🏷️</span> Custom Item (F4)
          </button>

          {/* ➕ Quick Add Product to Catalog */}
          <button
            type="button"
            onClick={() => {
              setQuickName(search.trim());
              setShowQuickAddModal(true);
            }}
            style={{
              padding: "0 12px",
              height: "46px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
              color: "#065f46",
              border: "1px solid #10b981",
              fontWeight: "800",
              fontSize: "12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            title="Register new product to catalog and add to bill (F7)"
          >
            <span>➕</span> Quick Add (F7)
          </button>

          {/* Bharat ERP Cart Hold & Park Buttons */}
          <button
            type="button"
            onClick={handleHoldCart}
            disabled={cart.length === 0}
            style={{
              padding: "0 10px",
              height: "46px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#1e40af",
              border: "1px solid #bfdbfe",
              fontWeight: "700",
              fontSize: "12px",
              cursor: cart.length > 0 ? "pointer" : "not-allowed",
              opacity: cart.length > 0 ? 1 : 0.6,
              whiteSpace: "nowrap"
            }}
            title="Park active bill to serve next customer (F8)"
          >
            ⏸️ Hold (F8)
          </button>

          <button
            type="button"
            onClick={() => setShowHeldModal(true)}
            style={{
              padding: "0 10px",
              height: "46px",
              borderRadius: "8px",
              background: heldCarts.length > 0 ? "#f0fdf4" : "#f3f4f6",
              color: heldCarts.length > 0 ? "#15803d" : "#6b7280",
              border: "1px solid var(--border)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            📋 ({heldCarts.length})
          </button>
        </div>

        {/* Category Pills Slider */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "12px" }}>
          {categories.map((cat) => {
            const count = cat === "All" ? products.length : products.filter((p) => p.category === cat).length;
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "30px",
                  border: "none",
                  background: isSelected ? "var(--primary)" : "var(--surface-alt)",
                  color: isSelected ? "white" : "var(--text-dark)",
                  cursor: "pointer",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>{cat}</span>
                <span
                  style={{
                    background: isSelected ? "rgba(255,255,255,0.25)" : "#cbd5e1",
                    color: isSelected ? "white" : "#475569",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    fontSize: "11px"
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Products Grid / Fallback for Damaged Barcodes & Unlisted Items */}
        {filteredProducts.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#f8fafc",
              border: "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "32px 20px",
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: "42px", marginBottom: "10px" }}>🏷️</div>
            <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#1e293b", fontWeight: "800" }}>
              {search ? `No catalog match for "${search}"` : "No Products in View"}
            </h4>
            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#64748b", maxWidth: "420px", lineHeight: "1.4" }}>
              Damaged barcode label, unlisted item, or loose product? Ring it up directly on this bill or register it in 5 seconds.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => {
                  setCustomItemName(search.trim());
                  setShowCustomItemModal(true);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white",
                  border: "none",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 4px rgba(217, 119, 6, 0.25)"
                }}
              >
                <span>🏷️</span> Add as Custom Item (F4)
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickName(search.trim());
                  setShowQuickAddModal(true);
                }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  border: "none",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: "0 2px 4px rgba(16, 185, 129, 0.25)"
                }}
              >
                <span>➕</span> Quick Add to Catalog (F7)
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "12px",
              alignContent: "start",
              paddingRight: "4px"
            }}
          >
            {filteredProducts.map((product) => {
            const price = Number(product.selling_price || product.mrp || product.price_full || 0);
            const mrp = Number(product.mrp || price);
            const savings = mrp - price;
            const isLow = product.stock_quantity <= (product.min_stock_alert || 5);
            const isExpired = product.expiry_date && product.expiry_date < todayStr;

            return (
              <div
                key={product.product_id}
                onClick={() => addToCart(product)}
                style={{
                  background: isExpired ? "#fef2f2" : "var(--surface)",
                  border: isExpired ? "1px solid #f87171" : "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                {savings > 0 && !isExpired && (
                  <div style={{ position: "absolute", top: "8px", right: "8px", background: "#dcfce7", color: "#15803d", fontSize: "10px", fontWeight: "800", padding: "2px 6px", borderRadius: "6px" }}>
                    SAVE ₹{savings.toFixed(0)}
                  </div>
                )}

                {isExpired && (
                  <div style={{ position: "absolute", top: "8px", right: "8px", background: "#fee2e2", color: "#b91c1c", fontSize: "10px", fontWeight: "800", padding: "2px 6px", borderRadius: "6px" }}>
                    ⚠️ EXPIRED
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase" }}>
                      {product.category || "General"}
                    </div>
                    {product.is_rx === 1 && (
                      <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "10px", fontWeight: "800", padding: "1px 5px", borderRadius: "4px" }}>
                        Rx
                      </span>
                    )}
                  </div>

                  <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--text-dark)", lineHeight: "1.3", marginBottom: "4px" }}>
                    {product.food_type === "non_veg" && "🔴 "}
                    {product.food_type === "veg" && activeVertical === "restaurant" && "🟢 "}
                    {product.food_type === "egg" && "🟡 "}
                    {product.name}
                  </div>

                  {/* Multi-Vertical Badges on Product Cards */}
                  {activeVertical === "pharmacy" && product.salt_name && (
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "4px" }}>
                      🧪 {product.salt_name}
                    </div>
                  )}

                  {activeVertical === "pharmacy" && (product.batch_no || product.expiry_date) && (
                    <div style={{ fontSize: "10px", color: isExpired ? "#b91c1c" : "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                      {product.batch_no ? `B:${product.batch_no} ` : ""}
                      {product.expiry_date ? `Exp:${product.expiry_date}` : ""}
                    </div>
                  )}

                  {product.size_color && (
                    <div style={{ fontSize: "11px", color: "var(--primary)", fontWeight: "600", marginBottom: "2px" }}>
                      👕 {product.size_color}
                    </div>
                  )}

                  {product.imei_serial && (
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "2px" }}>
                      📱 {product.imei_serial}
                    </div>
                  )}

                  {product.liquor_size && (
                    <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600", marginBottom: "2px" }}>
                      🍾 {product.liquor_size}
                    </div>
                  )}

                  {product.purity_karat && (
                    <div style={{ fontSize: "11px", color: "#b45309", fontWeight: "700", marginBottom: "2px" }}>
                      💎 {product.purity_karat}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: "8px", borderTop: "1px dashed var(--border)", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    {savings > 0 && (
                      <span style={{ textDecoration: "line-through", fontSize: "11px", color: "var(--text-light)", marginRight: "4px" }}>
                        ₹{mrp}
                      </span>
                    )}
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "var(--accent-green)" }}>
                      ₹{price} <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>/ {product.unit || "pcs"}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", background: isLow ? "#fee2e2" : "#f1f5f9", color: isLow ? "#b91c1c" : "#475569" }}>
                    {product.stock_quantity}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* 🛒 RIGHT PANEL: Active Billing Cart (40%) */}
      <div
        className="pos-card"
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          padding: "16px",
          border: "1px solid var(--border)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "2px solid var(--surface-alt)", paddingBottom: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--text-dark)" }}>
              🛒 Billing Cart
            </h3>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{cart.length} line items added</div>
          </div>

          {cart.length > 0 && (
            <button onClick={() => setCart([])} style={{ background: "var(--accent-red-light)", color: "#b91c1c", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>
              Clear Cart
            </button>
          )}
        </div>

        {/* 👤 Customer Identification & Quick Add Bar */}
        <div
          style={{
            background: selectedCustomer ? "#f0fdf4" : "#f8fafc",
            border: selectedCustomer ? "1.5px solid #86efac" : "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "10px",
            marginBottom: "12px",
            transition: "all 0.2s ease"
          }}
        >
          {selectedCustomer ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#166534", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>👤</span> {selectedCustomer.name}
                  <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "600" }}>({selectedCustomer.phone})</span>
                </div>
                <div style={{ fontSize: "11px", color: "#15803d", marginTop: "2px" }}>
                  {selectedCustomer.khata_balance > 0 ? (
                    <span style={{ color: "#b91c1c", fontWeight: "700" }}>⚠️ Udhar Due: ₹{Number(selectedCustomer.khata_balance).toFixed(2)}</span>
                  ) : (
                    <span>✔ Khata Clear (Balance: ₹0.00)</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  background: "#fee2e2",
                  color: "#991b1b",
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
                title="Detach customer from bill"
              >
                ✕ Change
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type="text"
                    placeholder="📱 Search Customer Mobile / Name..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: "white"
                    }}
                  />
                  {customerSearch && (
                    <button
                      onClick={() => setCustomerSearch("")}
                      style={{ position: "absolute", right: "8px", top: "8px", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (customerSearch && /^\d+$/.test(customerSearch.trim())) {
                      setNewCustPhone(customerSearch.trim());
                    }
                    setShowAddCustomerModal(true);
                  }}
                  className="pos-btn-primary"
                  style={{
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: "700",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span>➕</span> Add Customer
                </button>
              </div>

              {/* Instant Search Suggestions Dropdown */}
              {customerSearch && (
                <div
                  style={{
                    marginTop: "6px",
                    background: "white",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    maxHeight: "140px",
                    overflowY: "auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                  }}
                >
                  {customers.filter((c) =>
                    (c.phone && c.phone.includes(customerSearch)) || (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                  ).slice(0, 5).map((c) => (
                    <div
                      key={c.customer_id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearch("");
                      }}
                      style={{
                        padding: "7px 10px",
                        fontSize: "12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                    >
                      <span style={{ fontWeight: "700", color: "#1e293b" }}>👤 {c.name} ({c.phone})</span>
                      {c.khata_balance > 0 && <span style={{ color: "#b91c1c", fontSize: "11px", fontWeight: "700" }}>₹{c.khata_balance} due</span>}
                    </div>
                  ))}

                  {customers.filter((c) =>
                    (c.phone && c.phone.includes(customerSearch)) || (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                  ).length === 0 && (
                    <div
                      onClick={() => {
                        if (/^\d+$/.test(customerSearch.trim())) {
                          setNewCustPhone(customerSearch.trim());
                        } else {
                          setNewCustName(customerSearch.trim());
                        }
                        setShowAddCustomerModal(true);
                      }}
                      style={{ padding: "8px 10px", fontSize: "12px", color: "#2563eb", cursor: "pointer", fontWeight: "700" }}
                    >
                      ➕ No match for "{customerSearch}". Click to Add Customer!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Electronics IMEI / Serial Number Field */}
        {activeVertical === "electronics" && (
          <div style={{ marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="📱 Enter IMEI / Serial Number (Optional)..."
              value={imeiNumber}
              onChange={(e) => setImeiNumber(e.target.value)}
              className="pos-input"
              style={{ fontSize: "13px", fontWeight: "600" }}
            />
          </div>
        )}

        {/* Cart Item Rows */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px", marginBottom: "12px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-light)", marginTop: "60px" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>🛒</div>
              <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--text-muted)" }}>Cart is Currently Empty</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>Scan barcode or click items to add</div>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "var(--surface-alt)",
                  marginBottom: "8px",
                  border: "1px solid var(--border)"
                }}
              >
                <div style={{ flex: 1, paddingRight: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text-dark)" }}>{item.name}</span>
                    {item.category && (
                      <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "10px", fontWeight: "700", padding: "1px 6px", borderRadius: "4px" }} title="Anti-Shoplifting Verification Tag">
                        🏷️ {item.category}
                      </span>
                    )}
                    {item.is_rx === 1 && (
                      <span style={{ background: "#fee2e2", color: "#b91c1c", fontSize: "10px", fontWeight: "800", padding: "1px 4px", borderRadius: "4px" }}>Rx</span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    ₹{item.selling_price} / {item.unit}
                    {item.item_details && (
                      <span style={{ marginLeft: "6px", fontFamily: "var(--font-mono)", fontWeight: "600", color: "#475569" }}>
                        [{item.item_details}]
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input
                    type="number"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(idx, e.target.value)}
                    style={{
                      width: "60px",
                      padding: "4px 8px",
                      textAlign: "center",
                      borderRadius: "6px",
                      border: "1.5px solid var(--border)",
                      fontWeight: "700",
                      fontSize: "14px"
                    }}
                  />
                  <div style={{ fontWeight: "800", fontSize: "14px", minWidth: "65px", textAlign: "right", color: "var(--text-dark)" }}>
                    ₹{item.subtotal.toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DMart Savings & Totals Panel */}
        <div style={{ background: "#0f172a", color: "white", padding: "16px", borderRadius: "12px", boxShadow: "var(--shadow-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>
            <span>Total Item MRP:</span>
            <span>₹{totalMRP.toFixed(2)}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>Extra Discount (₹):</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              style={{
                width: "85px",
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #334155",
                background: "#1e293b",
                color: "white",
                textAlign: "right",
                fontWeight: "700"
              }}
            />
          </div>

          {totalSavings > 0 && (
            <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", padding: "8px 12px", borderRadius: "8px", textAlign: "center", fontWeight: "800", fontSize: "13px", marginBottom: "10px" }}>
              🎉 YOU SAVED ₹{totalSavings.toFixed(2)} TODAY!
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #1e293b", paddingTop: "10px" }}>
            <span style={{ fontWeight: "700", fontSize: "15px", color: "#e2e8f0" }}>NET PAYABLE:</span>
            <span style={{ fontWeight: "800", fontSize: "24px", color: "#34d399", fontFamily: "var(--font-mono)" }}>
              ₹{netPayable.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Checkout Trigger */}
        <button
          onClick={() => setShowPaymentModal(true)}
          disabled={cart.length === 0}
          className="pos-btn-success"
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "16px",
            fontSize: "17px",
            borderRadius: "10px",
            opacity: cart.length > 0 ? 1 : 0.5
          }}
        >
          ⚡ PROCEED TO PAY (F2)
        </button>
      </div>

      {/* 💳 PAYMENT & UPI MODAL */}
      {showPaymentModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "28px", width: "480px", maxWidth: "90%", borderRadius: "16px" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "800", color: "var(--text-dark)" }}>Complete Checkout</h2>

            <div style={{ background: "var(--primary-light)", border: "1px solid var(--primary-border)", padding: "14px", borderRadius: "10px", textAlign: "center", marginBottom: "18px" }}>
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)" }}>NET AMOUNT PAYABLE</div>
              <div style={{ fontSize: "28px", fontWeight: "800", color: "var(--primary-hover)", fontFamily: "var(--font-mono)" }}>
                ₹{netPayable.toFixed(2)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "18px" }}>
              {["cash", "upi", "card", "split", "khata"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: "10px 6px",
                    borderRadius: "10px",
                    border: paymentMethod === method ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: paymentMethod === method ? "var(--primary-light)" : "var(--surface)",
                    color: paymentMethod === method ? "var(--primary-hover)" : "var(--text-dark)",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  {method === "khata" ? "📒 Udhar Khata" : method === "split" ? "💵+📱 Split Pay" : method.toUpperCase()}
                </button>
              ))}
            </div>

            {/* ⚠️ Income Tax Section 269ST Cash Alert */}
            {((paymentMethod === "cash" && netPayable >= 200000) || (paymentMethod === "split" && Number(splitCash || 0) >= 200000)) && (
              <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", color: "#991b1b", fontSize: "11px", lineHeight: "1.4" }}>
                <strong>⚠️ Income Tax Sec 269ST Compliance Alert:</strong> Single cash transaction of ₹2,00,000 or more is restricted by law and attracts a 100% penalty. Consider collecting digitally via UPI / Card.
              </div>
            )}

            {/* 🏢 B2B GSTIN Input for Corporate / Business Customers */}
            <div style={{ marginBottom: "14px", padding: "10px 12px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <label style={{ fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#334155" }}>
                <input
                  type="checkbox"
                  checked={isB2B}
                  onChange={(e) => setIsB2B(e.target.checked)}
                />
                🏢 Issue B2B Tax Invoice (With Buyer GSTIN)
              </label>
              {isB2B && (
                <div style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    placeholder="Enter Buyer 15-digit GSTIN (e.g. 23ABCDE1234F1Z5)"
                    value={customerGstin}
                    onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                    maxLength={15}
                    className="pos-input"
                    style={{ textTransform: "uppercase", fontSize: "12px", fontWeight: "700" }}
                  />
                </div>
              )}
            </div>

            {paymentMethod === "cash" && (
              <div style={{ marginBottom: "18px", background: "var(--surface-alt)", padding: "14px", borderRadius: "10px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Cash Tendered (₹):</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="pos-input"
                  style={{ fontSize: "18px", fontWeight: "800" }}
                />
                {cashReceived && Number(cashReceived) >= netPayable && (
                  <div style={{ marginTop: "10px", color: "var(--accent-green)", fontWeight: "800", fontSize: "15px" }}>
                    Return Change: ₹{(Number(cashReceived) - netPayable).toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "split" && (
              <div style={{ marginBottom: "18px", background: "var(--surface-alt)", padding: "14px", borderRadius: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", display: "block", marginBottom: "4px" }}>Cash Amount (₹):</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={splitCash}
                      onChange={(e) => {
                        setSplitCash(e.target.value);
                        setSplitUpi(Math.max(0, netPayable - Number(e.target.value || 0)).toFixed(2));
                      }}
                      className="pos-input"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", display: "block", marginBottom: "4px" }}>UPI Amount (₹):</label>
                    <input
                      type="number"
                      placeholder="e.g. 250"
                      value={splitUpi}
                      onChange={(e) => setSplitUpi(e.target.value)}
                      className="pos-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "upi" && (
              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <img src={modalQrCode} alt="UPI QR" style={{ width: "160px", height: "160px", borderRadius: "8px", border: "1px solid var(--border)", padding: "8px" }} />
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", fontWeight: "600" }}>Scan & Pay via GPay / PhonePe / Paytm</div>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleFinalCheckout} className="pos-btn-success" style={{ flex: 1, padding: "14px", fontSize: "15px" }}>
                ✅ Confirm & Print Receipt
              </button>
              <button onClick={() => setShowPaymentModal(false)} style={{ padding: "14px 20px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 HELD CARTS MODAL (Bharat ERP Style) */}
      {showHeldModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "550px", maxWidth: "95%", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--text-dark)" }}>
                📋 Held / Parked Bills Directory ({heldCarts.length})
              </h3>
              <button onClick={() => setShowHeldModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "800" }}>✖</button>
            </div>

            {heldCarts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                No bills currently on hold. Press <strong>F8</strong> while billing to hold an active bill.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "350px", overflowY: "auto" }}>
                {heldCarts.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justify: "space-between",
                      alignItems: "center",
                      background: "var(--surface-alt)",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1px solid var(--border)"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "800", fontSize: "14px", color: "var(--primary)" }}>
                        Held at {item.time} {item.customer ? `| Customer: ${item.customer.name}` : ""}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {item.cart.length} line items | Total: <strong>₹{item.netPayable.toFixed(2)}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleResumeCart(item)}
                        className="pos-btn-primary"
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                      >
                        ▶️ Resume Bill
                      </button>
                      <button
                        onClick={() => setHeldCarts(heldCarts.filter((h) => h.id !== item.id))}
                        style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ➕ POPUP MODAL: Add Customer Directly from POS Terminal */}
      {showAddCustomerModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "420px", maxWidth: "92%", borderRadius: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "var(--text-dark)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>👤</span> Add & Link New Customer
              </h3>
              <button onClick={() => setShowAddCustomerModal(false)} style={{ background: "none", border: "none", fontSize: "16px", cursor: "pointer", fontWeight: "800" }}>✕</button>
            </div>

            {newCustMsg && (
              <div style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", marginBottom: "12px" }}>
                {newCustMsg}
              </div>
            )}

            <form onSubmit={handleAddCustomerFromPOS}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Customer Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  maxLength={15}
                  required
                  autoFocus
                  className="pos-input"
                  style={{ fontSize: "14px", fontWeight: "700" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar / Wine Club Member"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                  className="pos-input"
                  style={{ fontSize: "14px", fontWeight: "700" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  disabled={newCustLoading}
                  className="pos-btn-success"
                  style={{ flex: 1, padding: "12px", fontSize: "14px", fontWeight: "800", borderRadius: "8px" }}
                >
                  {newCustLoading ? "Saving..." : "💾 Save & Link to Bill"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  style={{ padding: "12px 16px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🏷️ POPUP MODAL: Add Custom / Unbarcoded Item Directly to Bill (F4) */}
      {showCustomItemModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "460px", maxWidth: "92%", borderRadius: "14px", border: "2px solid #f59e0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#b45309", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>🏷️</span> Add Custom / Unbarcoded Item
                </h3>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  For damaged barcodes, loose counter items, or emergency manual sales
                </div>
              </div>
              <button onClick={() => setShowCustomItemModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "800", color: "#64748b" }}>✕</button>
            </div>

            {/* Quick Preset Buttons for High-Frequency Loose / Counter Items */}
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>
                ⚡ Quick Presets:
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { name: "Snacks / Chakhna", price: 30 },
                  { name: "Ice Bag", price: 20 },
                  { name: "Plastic Glass / Cups", price: 10 },
                  { name: "Soda / Mixer", price: 25 },
                  { name: "Damaged Barcode Bottle", price: "" }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setCustomItemName(preset.name);
                      if (preset.price) setCustomItemPrice(preset.price);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px solid #fed7aa",
                      background: "#fff7ed",
                      color: "#c2410c",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddCustomItem}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Item Description / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Challenge (Damaged Barcode) / Namkeen"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  required
                  autoFocus={!customItemName}
                  className="pos-input"
                  style={{ fontSize: "14px", fontWeight: "700" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 180"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    required
                    autoFocus={!!customItemName}
                    className="pos-input"
                    style={{ fontSize: "15px", fontWeight: "800", color: "var(--accent-green)" }}
                  />
                </div>

                <div style={{ width: "90px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(e.target.value)}
                    className="pos-input"
                    style={{ fontSize: "14px", fontWeight: "700", textAlign: "center" }}
                  />
                </div>

                <div style={{ width: "90px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    GST %
                  </label>
                  <select
                    value={customItemTax}
                    onChange={(e) => setCustomItemTax(Number(e.target.value))}
                    className="pos-input"
                    style={{ fontSize: "13px", fontWeight: "700" }}
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Cashier Note / Reason (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Barcode unreadable, scanned manually at counter"
                  value={customItemNote}
                  onChange={(e) => setCustomItemNote(e.target.value)}
                  className="pos-input"
                  style={{ fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "800",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(217, 119, 6, 0.3)"
                  }}
                >
                  🏷️ Add to Bill (Enter)
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  style={{ padding: "12px 16px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  Cancel (Esc)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📦 POPUP MODAL: Quick Add Product to Catalog (F7) */}
      {showQuickAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
          <div className="pos-card animate-fade-in" style={{ padding: "24px", width: "480px", maxWidth: "92%", borderRadius: "14px", border: "2px solid #10b981" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#065f46", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📦</span> Quick Register Product to Inventory
                </h3>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Saves to inventory database and automatically adds 1 qty to current bill
                </div>
              </div>
              <button onClick={() => setShowQuickAddModal(false)} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", fontWeight: "800", color: "#64748b" }}>✕</button>
            </div>

            {quickError && (
              <div style={{ background: "#fee2e2", color: "#991b1b", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", marginBottom: "12px" }}>
                {quickError}
              </div>
            )}

            <form onSubmit={handleQuickAddProduct}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Carlsberg Elephant Beer Can 500ml"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  required
                  autoFocus={!quickName}
                  className="pos-input"
                  style={{ fontSize: "14px", fontWeight: "700" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Category
                  </label>
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="pos-input"
                    style={{ fontSize: "13px", fontWeight: "700" }}
                  >
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    {!categories.includes("General") && <option value="General">General</option>}
                  </select>
                </div>

                <div style={{ width: "100px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Unit
                  </label>
                  <select
                    value={quickUnit}
                    onChange={(e) => setQuickUnit(e.target.value)}
                    className="pos-input"
                    style={{ fontSize: "13px", fontWeight: "700" }}
                  >
                    <option value="pcs">pcs</option>
                    <option value="bottle">bottle</option>
                    <option value="can">can</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 150"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(e.target.value)}
                    required
                    autoFocus={!!quickName}
                    className="pos-input"
                    style={{ fontSize: "15px", fontWeight: "800", color: "var(--accent-green)" }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional (Defaults to SP)"
                    value={quickMrp}
                    onChange={(e) => setQuickMrp(e.target.value)}
                    className="pos-input"
                    style={{ fontSize: "14px", fontWeight: "700" }}
                  />
                </div>

                <div style={{ width: "90px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Stock Qty
                  </label>
                  <input
                    type="number"
                    value={quickStock}
                    onChange={(e) => setQuickStock(e.target.value)}
                    className="pos-input"
                    style={{ fontSize: "14px", fontWeight: "700", textAlign: "center" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty for auto-generated POS barcode"
                    value={quickBarcode}
                    onChange={(e) => setQuickBarcode(e.target.value)}
                    className="pos-input"
                    style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}
                  />
                </div>

                <div style={{ width: "100px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                    GST Rate
                  </label>
                  <select
                    value={quickTaxRate}
                    onChange={(e) => setQuickTaxRate(e.target.value)}
                    className="pos-input"
                    style={{ fontSize: "13px", fontWeight: "700" }}
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  disabled={quickLoading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "800",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "white",
                    border: "none",
                    cursor: quickLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 4px rgba(16, 185, 129, 0.3)"
                  }}
                >
                  {quickLoading ? "Saving..." : "💾 Save to Catalog & Add to Bill"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  style={{ padding: "12px 16px", background: "var(--surface-alt)", border: "1px solid var(--border)", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiptData && (
        <ThermalReceiptModal
          receiptData={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}