import jsPDF from "jspdf";

export interface ReceiptData {
  orderId?: string;
  dishName: string;
  price: string;
  quantity: number;
  tableNumber: string;
  tableToken?: string;
  lockDurationMins?: number;
  paymentMethod: "upi" | "cash";
  paymentStatus: "paid" | "pending_cash";
  txnId?: string;
  notes?: string;
  createdAt?: string;
}

export function generateAndDownloadReceiptPdf(data: ReceiptData) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 180], // Thermal receipt style width 80mm
  });

  const now = data.createdAt ? new Date(data.createdAt) : new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const basePrice = parseInt(data.price.replace(/[^0-9]/g, ""), 10) || 0;
  const totalPrice = basePrice * data.quantity;
  const orderIdShort = data.orderId || Math.floor(100000 + Math.random() * 900000).toString();
  const token = data.tableToken || "A8K9P";
  const duration = data.lockDurationMins || 30;

  // Background
  doc.setFillColor(15, 15, 18);
  doc.rect(0, 0, 80, 180, "F");

  // Header Banner Box
  doc.setFillColor(24, 24, 27);
  doc.rect(3, 3, 74, 22, "F");
  doc.setDrawColor(39, 39, 42);
  doc.rect(3, 3, 74, 22, "D");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("AR RESTAURANT", 40, 11, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(161, 161, 170);
  doc.text("3D & WebXR Dining Experience", 40, 16, { align: "center" });
  doc.text("OFFICIAL TABLE ORDER RECEIPT", 40, 20, { align: "center" });

  let y = 31;

  // Order Meta Block
  doc.setFillColor(24, 24, 27);
  doc.rect(3, y, 74, 24, "F");
  doc.rect(3, y, 74, 24, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`TABLE ${data.tableNumber.toUpperCase()}`, 6, y + 6);

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  doc.text(`Order ID: #${orderIdShort}`, 6, y + 12);
  doc.text(`Date: ${dateStr} at ${timeStr}`, 6, y + 17);

  // Table Token Highlight Box
  doc.setFillColor(39, 39, 42);
  doc.rect(48, y + 3, 26, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.text("TABLE TOKEN", 61, y + 8, { align: "center" });
  doc.setFontSize(10);
  doc.text(token, 61, y + 15, { align: "center" });

  y += 29;

  // Table Lock info
  doc.setTextColor(161, 161, 170);
  doc.setFontSize(7);
  doc.text(`Table Lock Duration: ${duration} Minutes`, 6, y);
  y += 5;

  // Dashed Divider
  doc.setDrawColor(63, 63, 70);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, 76, y);
  doc.setLineDashPattern([], 0);

  y += 5;

  // Items Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("ITEM", 6, y);
  doc.text("QTY", 48, y, { align: "center" });
  doc.text("PRICE", 74, y, { align: "right" });

  y += 3;
  doc.setDrawColor(39, 39, 42);
  doc.line(4, y, 76, y);

  y += 5;

  // Item Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  
  const dishNameShort = data.dishName.length > 22 ? data.dishName.substring(0, 20) + "…" : data.dishName;
  doc.text(dishNameShort, 6, y);
  doc.text(`${data.quantity}`, 48, y, { align: "center" });
  doc.text(`Rs. ${totalPrice}`, 74, y, { align: "right" });

  if (data.notes) {
    y += 5;
    doc.setFontSize(6.5);
    doc.setTextColor(161, 161, 170);
    const noteShort = data.notes.length > 35 ? data.notes.substring(0, 33) + "…" : data.notes;
    doc.text(`Note: ${noteShort}`, 6, y);
  }

  y += 8;
  doc.setDrawColor(63, 63, 70);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(4, y, 76, y);
  doc.setLineDashPattern([], 0);

  y += 6;

  // Payment Info & Totals Box
  doc.setFillColor(24, 24, 27);
  doc.rect(3, y, 74, 26, "F");
  doc.rect(3, y, 74, 26, "D");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  doc.text("Payment Mode:", 6, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(data.paymentMethod === "upi" ? "INSTANT UPI" : "CASH ON DELIVERY", 32, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  doc.text("Status:", 6, y + 12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(data.paymentStatus === "paid" ? "PAID (COMPLETED)" : "PENDING CASH", 32, y + 12);

  if (data.txnId) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(161, 161, 170);
    doc.text(`Txn Ref: ${data.txnId}`, 6, y + 17);
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL:", 6, y + 22);
  doc.text(`Rs. ${totalPrice}`, 74, y + 22, { align: "right" });

  y += 32;

  // Footer Message
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(161, 161, 170);
  doc.text(`Use Token ${token} to add more dishes to Table ${data.tableNumber}`, 40, y, { align: "center" });
  doc.text(`within your ${duration}-minute table reservation window.`, 40, y + 4, { align: "center" });

  doc.text("★ Thank you for dining with AR Restaurant! ★", 40, y + 10, { align: "center" });

  // Trigger Automatic Download
  const filename = `AR_Restaurant_Receipt_Table_${data.tableNumber.replace(/[^a-zA-Z0-9]/g, "_")}_${token}.pdf`;
  doc.save(filename);
}
