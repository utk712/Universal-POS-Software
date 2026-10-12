import React from "react";

// Convert number to Indian Rupees in words (e.g. 1688 -> "Rs. One Thousand Six Hundred and Eighty Eight only")
function numberToWordsRupees(num) {
  const n = Math.floor(Number(num) || 0);
  if (n === 0) return "Rs. Zero only";

  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

  function inWords(val) {
    if ((val = val.toString()).length > 9) return "overflow";
    let n = ("000000000" + val).substr(-9);
    let match = n.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return "";
    let str = "";
    str += Number(match[1]) !== 0 ? (a[Number(match[1])] || b[match[1][0]] + a[match[1][1]]) + "Crore " : "";
    str += Number(match[2]) !== 0 ? (a[Number(match[2])] || b[match[2][0]] + a[match[2][1]]) + "Lakh " : "";
    str += Number(match[3]) !== 0 ? (a[Number(match[3])] || b[match[3][0]] + a[match[3][1]]) + "Thousand " : "";
    str += Number(match[4]) !== 0 ? (a[Number(match[4])] || b[match[4][0]] + a[match[4][1]]) + "Hundred " : "";
    str += Number(match[5]) !== 0 ? (str !== "" ? "and " : "") + (a[Number(match[5])] || b[match[5][0]] + a[match[5][1]]) : "";
    return str.trim();
  }

  return `Rs. ${inWords(n)} only`;
}

export default function ThermalReceiptModal({ receiptData, onClose, onPrint }) {
  if (!receiptData) return null;

  const {
    invoice_no,
    order_id,
    invoice_type,
    customer_gstin = "",
    net_amount = 0,
    total_savings = 0,
    store_info = {},
    receipt_items = [],
    payment_method = "cash",
    customer = null,
    counter_name = "Counter 1",
    counter_code = "C1",
    date_time
  } = receiptData;

  const width = store_info.thermal_printer_width === "58mm" ? "240px" : "320px";
  const activeCustomerGstin = customer_gstin || customer?.gstin || "";
  const isB2B = !!(activeCustomerGstin && activeCustomerGstin.trim().length >= 15);

  // Calculate totals
  const subtotal = receipt_items.reduce((acc, item) => acc + (item.subtotal || 0), 0);
  const totalMRP = receipt_items.reduce((acc, item) => acc + ((item.mrp || item.selling_price) * item.quantity), 0);
  const totalQty = receipt_items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const totalItemsCount = receipt_items.length;
  const savings = total_savings || Math.max(0, totalMRP - net_amount);

  // Rate-wise GST Calculation (Rule 46 compliance)
  const gstBreakdown = {};
  receipt_items.forEach((item) => {
    const rate = Number(item.tax_rate) || 0;
    const itemSubtotal = Number(item.subtotal || (item.selling_price * item.quantity) || 0);
    const taxAmount = Number(item.tax_amount || (rate > 0 ? (itemSubtotal * rate) / (100 + rate) : 0));
    const taxableVal = Math.max(0, itemSubtotal - taxAmount);

    if (!gstBreakdown[rate]) {
      gstBreakdown[rate] = { rate, taxable: 0, cgst: 0, sgst: 0, total_tax: 0 };
    }
    gstBreakdown[rate].taxable += taxableVal;
    gstBreakdown[rate].cgst += taxAmount / 2;
    gstBreakdown[rate].sgst += taxAmount / 2;
    gstBreakdown[rate].total_tax += taxAmount;
  });

  const gstRatesList = Object.values(gstBreakdown).sort((a, b) => a.rate - b.rate);
  const totalTaxableSum = gstRatesList.reduce((acc, r) => acc + r.taxable, 0);
  const totalCgstSum = gstRatesList.reduce((acc, r) => acc + r.cgst, 0);
  const totalSgstSum = gstRatesList.reduce((acc, r) => acc + r.sgst, 0);
  const totalGstSum = gstRatesList.reduce((acc, r) => acc + r.total_tax, 0);

  // Generate UPI string
  const upiId = store_info.upi_id || "9876543210@upi";
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(store_info.store_name || "POS Store")}&am=${net_amount}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}`;

  const now = date_time ? new Date(date_time) : new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  const handleSilentPrint = async () => {
    if (window.electronAPI && typeof window.electronAPI.silentPrint === "function") {
      const res = await window.electronAPI.silentPrint();
      if (res && res.success !== false) {
        if (onPrint) onPrint();
        onClose();
        return;
      }
    }
    window.print();
    if (onPrint) onPrint();
  };

  const handleSendWhatsApp = () => {
    let phone = customer?.phone || prompt("Enter Customer WhatsApp Mobile Number (10 digits):");
    if (!phone) return;
    phone = phone.replace(/[^0-9]/g, "");
    if (phone.length === 10) phone = "91" + phone;

    const itemsSummary = receipt_items.map((it, idx) => 
      `${idx + 1}. ${it.name || it.product_name} x ${it.quantity} = Rs.${it.subtotal}`
    ).join("\n");

    const message = `*RECEIPT: ${store_info.store_name || "VyaparFlow Store"}*
*Bill No:* #${invoice_no || order_id}
*Date:* ${dateStr} ${timeStr}

*Items:*
${itemsSummary}

*Total Payable:* Rs. ${Number(net_amount).toFixed(2)}
${savings > 0 ? `*Total Savings:* Rs. ${savings.toFixed(2)} 🎉\n` : ""}*Paid via:* ${payment_method.toUpperCase()}

Thank you for your visit! Please visit again.`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
      }}
    >
      {/* Modal Box */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          maxHeight: "92vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
        }}
      >
        {/* Printable Thermal Receipt Container (Exact Sai Mart Style) */}
        <div
          id="printable-receipt"
          style={{
            width,
            padding: "12px 10px",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "11px",
            color: "#000",
            background: "#fff",
            border: "1px dashed #bbb",
            lineHeight: "1.3"
          }}
        >
          {/* Store Logo Header & Branding */}
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            <div style={{ fontSize: "18px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🛒 {store_info.store_name || "SAI MART"}
            </div>
            <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", margin: "1px 0" }}>
              {store_info.tagline || "SUPERIOR QUALITY, SUPERB SAVINGS"}
            </div>
            <div style={{ fontSize: "9px" }}>{store_info.address || "LINK ROAD, SADAR, BETUL, MADHYA PRADESH"}</div>
            <div style={{ fontSize: "9px", fontWeight: "600" }}>Phone : {store_info.mobile || "9876543210"}</div>
            {store_info.gstin && (
              <div style={{ fontSize: "9px", fontWeight: "700" }}>GSTIN : {store_info.gstin}</div>
            )}
            <div style={{ fontSize: "8.5px", fontWeight: "900", border: "1px solid #000", padding: "1px 6px", display: "inline-block", margin: "3px auto 0 auto", textTransform: "uppercase" }}>
              {isB2B ? "TAX INVOICE (B2B)" : "RETAIL TAX INVOICE (B2C)"}
            </div>
          </div>

          <div style={{ borderBottom: "1px dashed #000", margin: "5px 0" }}></div>

          {/* Customer & Bill Meta Header */}
          <div style={{ fontSize: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
            <div><strong>Name :</strong> {customer ? customer.name : "CASH"}</div>
            <div style={{ textAlign: "right" }}><strong>Date :</strong> {dateStr}</div>
            <div><strong>Phone :</strong> {customer ? customer.phone : ""}</div>
            <div style={{ textAlign: "right" }}><strong>Bill No :</strong> #{invoice_no || order_id}</div>
            {isB2B && (
              <div style={{ gridColumn: "span 2", fontWeight: "bold", fontSize: "9px", background: "#f5f5f5", padding: "2px 4px", border: "1px dotted #000", margin: "2px 0" }}>
                BUYER GSTIN: {activeCustomerGstin} | POS: {store_info.state || "23-MP"}
              </div>
            )}
            <div style={{ gridColumn: "span 2" }}><strong>Time :</strong> {timeStr} | {counter_name}</div>
          </div>

          <div style={{ borderBottom: "1px dashed #000", margin: "5px 0" }}></div>

          {/* Product Line Items Table (Product Description | MRP | Rate | QTY | Amount) */}
          <table style={{ width: "100%", fontSize: "9.5px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000", textAlign: "left", fontWeight: "bold" }}>
                <th style={{ padding: "2px 0" }}>Product Discription</th>
                <th style={{ textAlign: "right", padding: "2px 0" }}>MRP</th>
                <th style={{ textAlign: "right", padding: "2px 0" }}>Rate</th>
                <th style={{ textAlign: "center", padding: "2px 0" }}>QTY</th>
                <th style={{ textAlign: "right", padding: "2px 0" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt_items.map((item, idx) => {
                const itemMrp = Number(item.mrp || item.selling_price || 0);
                const itemRate = Number(item.selling_price || 0);

                return (
                  <tr key={idx} style={{ borderBottom: "1px dotted #ddd" }}>
                    <td style={{ padding: "3px 0", wordBreak: "break-word", fontWeight: "bold", paddingRight: "4px" }}>
                      {item.product_name || item.name}
                      {item.hsn_code ? <span style={{ fontSize: "8px", fontWeight: "normal", color: "#444" }}> (HSN:{item.hsn_code})</span> : null}
                      {item.item_details ? (
                        <div style={{ fontSize: "8px", color: "#333", fontWeight: "normal" }}>{item.item_details}</div>
                      ) : (item.batch_no || item.expiry_date) ? (
                        <div style={{ fontSize: "8px", color: "#333", fontWeight: "normal" }}>
                          {item.batch_no ? `B.No:${item.batch_no} ` : ""}
                          {item.expiry_date ? `Exp:${item.expiry_date}` : ""}
                        </div>
                      ) : null}
                    </td>
                    <td style={{ textAlign: "right", padding: "3px 0" }}>{itemMrp.toFixed(0)}</td>
                    <td style={{ textAlign: "right", padding: "3px 0" }}>{itemRate.toFixed(1)}</td>
                    <td style={{ textAlign: "center", padding: "3px 0" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: "3px 0", fontWeight: "bold" }}>{Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ borderBottom: "1px dashed #000", margin: "5px 0" }}></div>

          {/* Sub Total Amount Summary Row */}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11px" }}>
            <span>Sub Total Amount</span>
            <span>{totalMRP.toFixed(2)} &nbsp;&nbsp; {subtotal.toFixed(2)}</span>
          </div>

          {/* GST Tax Summary Table (Rule 46 Statutory Compliance) */}
          {store_info.gstin && totalGstSum > 0 && (
            <>
              <div style={{ borderBottom: "1px dashed #000", margin: "5px 0" }}></div>
              <div style={{ fontSize: "8.5px", fontWeight: "bold", textAlign: "center", marginBottom: "2px", letterSpacing: "0.3px" }}>
                -- GST TAX BREAKUP (INCLUSIVE) --
              </div>
              <table style={{ width: "100%", fontSize: "8.5px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #000", textAlign: "right" }}>
                    <th style={{ textAlign: "left", padding: "1px 0" }}>GST%</th>
                    <th style={{ padding: "1px 0" }}>Taxable</th>
                    <th style={{ padding: "1px 0" }}>CGST</th>
                    <th style={{ padding: "1px 0" }}>SGST</th>
                    <th style={{ padding: "1px 0" }}>Total Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {gstRatesList.map((row, idx) => (
                    <tr key={idx} style={{ textAlign: "right" }}>
                      <td style={{ textAlign: "left", fontWeight: "bold", padding: "1px 0" }}>{row.rate}%</td>
                      <td style={{ padding: "1px 0" }}>{row.taxable.toFixed(2)}</td>
                      <td style={{ padding: "1px 0" }}>{row.cgst.toFixed(2)}</td>
                      <td style={{ padding: "1px 0" }}>{row.sgst.toFixed(2)}</td>
                      <td style={{ fontWeight: "bold", padding: "1px 0" }}>{row.total_tax.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "1px solid #000", fontWeight: "bold", textAlign: "right" }}>
                    <td style={{ textAlign: "left", padding: "1px 0" }}>Total:</td>
                    <td style={{ padding: "1px 0" }}>{totalTaxableSum.toFixed(2)}</td>
                    <td style={{ padding: "1px 0" }}>{totalCgstSum.toFixed(2)}</td>
                    <td style={{ padding: "1px 0" }}>{totalSgstSum.toFixed(2)}</td>
                    <td style={{ padding: "1px 0" }}>{totalGstSum.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}

          <div style={{ borderBottom: "1px dashed #000", margin: "5px 0" }}></div>

          {/* Items / Savings / Payable Summary Grid */}
          <div style={{ fontSize: "11px", fontWeight: "bold", lineHeight: "1.4" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Items :- {totalItemsCount}</span>
              <span style={{ fontSize: "12px", color: "#000" }}>Your Saving Rs: {savings.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
              <span>Qty :- {totalQty}</span>
              <span style={{ fontSize: "13px", fontWeight: "900" }}>Payble Amount: {Number(net_amount).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderBottom: "1px dashed #000", margin: "5px 0" }}></div>

          {/* Mode of Pay & Amount in Words */}
          <div style={{ fontSize: "10px", fontWeight: "bold", textAlign: "left" }}>
            <div>Mode Of Pay: {payment_method.toUpperCase()}</div>
            <div style={{ fontStyle: "italic", margin: "2px 0" }}>{numberToWordsRupees(net_amount)}</div>
          </div>

          <div style={{ borderBottom: "1px dashed #000", margin: "5px 0" }}></div>

          {/* Store Return Terms & Conditions (Exact Sai Mart Style) */}
          <div style={{ fontSize: "8.5px", textAlign: "center", color: "#222", lineHeight: "1.3" }}>
            <div>"Original bill is mandatory for any exchange or return."</div>
            <div>"Sales Return Time: Strictly 12:00 PM to 04:00 PM only."</div>
            <div>"Items can be exchanged within 7 days of purchase."</div>
            <div>"Prices are subject to change as per market fluctuations."</div>
          </div>

          <div style={{ borderBottom: "1px dashed #000", margin: "5px 0" }}></div>

          {/* Footer Promotion & WhatsApp Line */}
          <div style={{ textAlign: "center", fontSize: "9px", fontWeight: "bold" }}>
            <div>"Big Savings UpTo 66% OFF And Exclusive Offers."</div>
            <div style={{ fontSize: "8px", fontWeight: "normal", margin: "2px 0" }}>
              "Our Shopping Range: Grocery, Crockery, Toys, Gifts & Stationery"
            </div>
            <div>E. & O.E. {"{WHATSAPP NO. +" + (store_info.mobile || "91-9424001831") + "}"}</div>
            
            {/* UPI QR Code */}
            <div style={{ marginTop: "6px", textAlign: "center" }}>
              <img src={qrCodeUrl} alt="Scan & Pay UPI" style={{ width: "85px", height: "85px" }} />
              <div style={{ fontSize: "8px", marginTop: "2px" }}>Scan to Pay via PhonePe / GPay / Paytm</div>
            </div>

            <div style={{ marginTop: "6px", fontSize: "10px" }}>~~~~ Thank you visit again ~~~~</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "8px", marginTop: "15px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={handleSilentPrint}
            style={{
              padding: "10px 18px",
              background: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px"
            }}
            title="Print directly to thermal printer without dialog"
          >
            ⚡ Silent Print
          </button>

          <button
            onClick={() => {
              window.print();
              if (onPrint) onPrint();
            }}
            style={{
              padding: "10px 14px",
              background: "#0284c7",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px"
            }}
          >
            🖨️ Print Dialog
          </button>

          <button
            onClick={handleSendWhatsApp}
            style={{
              padding: "10px 14px",
              background: "#25D366",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "13px"
            }}
          >
            📲 WhatsApp Bill
          </button>

          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              background: "#6b7280",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "bold"
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Embedded CSS for Thermal Printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: ${width} !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
