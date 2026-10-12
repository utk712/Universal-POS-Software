import { useState } from "react";

export default function ScannerInput({ onScan }) {
  const [barcode, setBarcode] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onScan(barcode);
      setBarcode("");
    }
  };

  return (
    <input
      placeholder="Scan barcode..."
      value={barcode}
      onChange={(e) => setBarcode(e.target.value)}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  );
}