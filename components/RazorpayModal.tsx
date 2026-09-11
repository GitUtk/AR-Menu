"use client";

import React, { useState } from "react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import {
  ShieldCheck,
  QrCode,
  Smartphone,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  CreditCard,
  Building2,
  Lock,
} from "lucide-react";

interface RazorpayModalProps {
  isOpen: boolean;
  amount: number;
  dishName: string;
  tableNumber: string;
  onClose: () => void;
  onSuccess: (txnId: string) => void;
}

export function RazorpayModal({
  isOpen,
  amount,
  dishName,
  tableNumber,
  onClose,
  onSuccess,
}: RazorpayModalProps) {
  const [activeTab, setActiveTab] = useState<"qr" | "vpa">("qr");
  const [vpaInput, setVpaInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [txnId, setTxnId] = useState("");

  if (!isOpen) return null;

  const handleSimulatePayment = (inputVpa?: string) => {
    setIsProcessing(true);
    setProcessingStage("Connecting to UPI Network…");

    setTimeout(() => {
      setProcessingStage("Verifying Razorpay Gateway Token…");
    }, 1000);

    setTimeout(() => {
      setProcessingStage("Authenticating with Bank…");
    }, 2000);

    setTimeout(() => {
      const generatedTxn = `PAY_${Math.floor(100000000 + Math.random() * 900000000)}`;
      setTxnId(generatedTxn);
      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        onSuccess(generatedTxn);
      }, 1500);
    }, 3200);
  };

  return (
    <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-blue-900/40 bg-zinc-950 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Razorpay Top Header Bar */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-zinc-950 p-4 border-b border-blue-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Razorpay Blue Badge */}
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-600/30">
              R
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-wide">
                  Razorpay
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  TEST MODE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">AR Restaurant & Dining</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold block">
              Total Price
            </span>
            <span className="text-xl font-black text-white font-mono">
              ₹{amount}
            </span>
          </div>
        </div>

        {/* Processing State */}
        {isProcessing ? (
          <div className="p-8 text-center space-y-4">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                Processing UPI Payment
              </h3>
              <p className="text-xs text-blue-300 font-mono animate-pulse">
                {processingStage}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              Please do not close or refresh this window…
            </div>
          </div>
        ) : isSuccess ? (
          /* Success State */
          <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">
                Payment Successful!
              </h3>
              <p className="text-xs text-zinc-400 font-mono">Txn ID: {txnId}</p>
            </div>
            <p className="text-xs text-emerald-400 font-medium">
              Placing table order for Table {tableNumber}…
            </p>
          </div>
        ) : (
          /* Normal Razorpay Payment Options */
          <div className="p-5 space-y-5">
            {/* Order Summary Strip */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-medium">Ordering: <strong className="text-white">{dishName}</strong></span>
              <span className="text-zinc-400">Table <strong className="text-amber-400 font-mono">{tableNumber}</strong></span>
            </div>

            {/* UPI Sub-Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab("qr")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "qr"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <QrCode className="h-4 w-4" />
                <span>UPI QR Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("vpa")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "vpa"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>UPI ID / VPA</span>
              </button>
            </div>

            {/* QR Code Tab View */}
            {activeTab === "qr" && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="relative p-3 rounded-2xl bg-white shadow-2xl border-4 border-zinc-200">
                  {/* Generated Stylized QR Code SVG */}
                  <svg
                    className="w-36 h-36"
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="100" height="100" fill="white" />
                    {/* Corner Position Detection Blocks */}
                    <rect x="5" y="5" width="25" height="25" fill="#09090b" rx="4" />
                    <rect x="9" y="9" width="17" height="17" fill="white" rx="2" />
                    <rect x="13" y="13" width="9" height="9" fill="#2563eb" rx="1" />

                    <rect x="70" y="5" width="25" height="25" fill="#09090b" rx="4" />
                    <rect x="74" y="9" width="17" height="17" fill="white" rx="2" />
                    <rect x="78" y="13" width="9" height="9" fill="#2563eb" rx="1" />

                    <rect x="5" y="70" width="25" height="25" fill="#09090b" rx="4" />
                    <rect x="9" y="74" width="17" height="17" fill="white" rx="2" />
                    <rect x="13" y="78" width="9" height="9" fill="#2563eb" rx="1" />

                    {/* Data Pattern Matrix */}
                    <rect x="35" y="10" width="6" height="6" fill="#09090b" />
                    <rect x="45" y="10" width="6" height="6" fill="#2563eb" />
                    <rect x="55" y="10" width="6" height="6" fill="#09090b" />
                    <rect x="35" y="22" width="6" height="6" fill="#2563eb" />
                    <rect x="50" y="22" width="12" height="6" fill="#09090b" />
                    <rect x="10" y="35" width="12" height="6" fill="#09090b" />
                    <rect x="25" y="35" width="6" height="6" fill="#2563eb" />
                    <rect x="35" y="35" width="12" height="12" fill="#09090b" />
                    <rect x="55" y="35" width="12" height="6" fill="#2563eb" />
                    <rect x="72" y="35" width="18" height="6" fill="#09090b" />
                    <rect x="10" y="45" width="6" height="18" fill="#2563eb" />
                    <rect x="22" y="45" width="6" height="6" fill="#09090b" />
                    <rect x="52" y="50" width="12" height="12" fill="#2563eb" />
                    <rect x="70" y="45" width="10" height="10" fill="#09090b" />
                    <rect x="85" y="45" width="8" height="8" fill="#2563eb" />
                    <rect x="35" y="55" width="12" height="6" fill="#09090b" />
                    <rect x="10" y="65" width="18" height="4" fill="#09090b" />
                    <rect x="35" y="70" width="8" height="20" fill="#2563eb" rx="2" />
                    <rect x="48" y="70" width="14" height="8" fill="#09090b" />
                    <rect x="68" y="70" width="8" height="8" fill="#2563eb" />
                    <rect x="80" y="70" width="14" height="14" fill="#09090b" rx="2" />
                    <rect x="48" y="82" width="28" height="12" fill="#09090b" rx="2" />
                  </svg>
                  {/* Center UPI Badge */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-blue-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-lg border border-white">
                      UPI
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-zinc-300 font-semibold">
                    Scan with Google Pay, PhonePe, Paytm or BHIM
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Point your camera or any UPI app to pay ₹{amount}
                  </p>
                </div>
              </div>
            )}

            {/* VPA / UPI ID Tab View */}
            {activeTab === "vpa" && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-300">
                  Enter your VPA / UPI ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. mobile@upi, name@okaxis"
                    value={vpaInput}
                    onChange={(e) => setVpaInput(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold uppercase">
                    UPI
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  A payment request will be sent to your UPI smartphone app.
                </p>
              </div>
            )}

            {/* Razorpay Simulate Payment Action Button */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <Button
                type="button"
                onClick={() => handleSimulatePayment(vpaInput || "user@upi")}
                className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-600/20 gap-2"
              >
                <Sparkles className="h-4 w-4 text-blue-200" />
                <span>Simulate Successful Payment (₹{amount})</span>
                <ArrowRight className="h-4 w-4 text-blue-200 ml-auto" />
              </Button>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="hover:text-zinc-300 transition-colors"
                >
                  Cancel Order
                </button>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-emerald-500" /> 256-bit Encrypted
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
