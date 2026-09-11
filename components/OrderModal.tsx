"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Dish } from "@/lib/dishes";
import { RazorpayModal } from "./RazorpayModal";
import { generateAndDownloadReceiptPdf } from "@/lib/generateReceiptPdf";
import {
  Utensils,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
  QrCode,
  Banknote,
  AlertCircle,
  Lock,
  Clock,
  Key,
  ShieldCheck,
} from "lucide-react";

interface OrderModalProps {
  isOpen: boolean;
  dish: Dish | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export function OrderModal({ isOpen, dish, onClose, onSuccess }: OrderModalProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cash">("upi");
  const [lockDuration, setLockDuration] = useState<number>(30);
  
  // 5-Digit Capital Table Token State
  const [userToken, setUserToken] = useState("");
  const [isLockChecking, setIsLockChecking] = useState(false);
  const [isTableLocked, setIsTableLocked] = useState(false);
  const [isTokenVerified, setIsTokenVerified] = useState(false);
  const [lockRemainingMins, setLockRemainingMins] = useState(0);

  // Submission & Razorpay state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [error, setError] = useState("");

  // Debounced check for table lock & token verification
  const checkTableLock = useCallback(async (tableStr: string, tokenStr: string) => {
    const trimmedTable = tableStr.trim();
    if (!trimmedTable) {
      setIsTableLocked(false);
      setIsTokenVerified(false);
      setLockRemainingMins(0);
      return;
    }

    setIsLockChecking(true);
    const cleanToken = tokenStr.trim().toUpperCase();

    try {
      const url = `/api/orders?check_table=${encodeURIComponent(trimmedTable)}${
        cleanToken ? `&token=${encodeURIComponent(cleanToken)}` : ""
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setIsTableLocked(!!data.locked);
        setIsTokenVerified(!!data.tokenVerified);
        setLockRemainingMins(data.remainingMinutes || 0);
        if (data.lockDurationMins) {
          setLockDuration(data.lockDurationMins);
        }
      } else {
        setIsTableLocked(false);
        setIsTokenVerified(false);
        setLockRemainingMins(0);
      }
    } catch {
      // Ignore network errors during typing check
    } finally {
      setIsLockChecking(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (tableNumber) {
        checkTableLock(tableNumber, userToken);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [tableNumber, userToken, checkTableLock]);

  if (!dish) return null;

  // Calculate price total numeric string
  const basePriceNum = parseInt(dish.price.replace(/[^0-9]/g, ""), 10) || 0;
  const totalPrice = basePriceNum * quantity;

  // Execute Order Submission to Backend & Auto Download Receipt PDF
  const executeOrderSubmission = async (
    method: "upi" | "cash",
    status: "paid" | "pending_cash",
    txnId?: string
  ) => {
    setError("");
    setIsSubmitting(true);

    const trimmedTable = tableNumber.trim();
    const cleanToken = userToken.trim().toUpperCase();

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dish_id: dish.id,
          dish_name: dish.name,
          price: `₹${totalPrice}`,
          quantity,
          table_number: trimmedTable,
          notes: notes.trim(),
          payment_method: method,
          payment_status: status,
          lock_duration_mins: lockDuration,
          table_token: cleanToken,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assignedToken = data.table_token || cleanToken;
        const orderIdStr = data.order?.id || data.order_id;

        // Auto Generate & Download PDF Receipt
        try {
          generateAndDownloadReceiptPdf({
            orderId: orderIdStr,
            dishName: dish.name,
            price: dish.price,
            quantity,
            tableNumber: trimmedTable,
            tableToken: assignedToken,
            lockDurationMins: lockDuration,
            paymentMethod: method,
            paymentStatus: status,
            txnId,
            notes: notes.trim(),
          });
        } catch (pdfErr) {
          console.error("Failed to generate PDF receipt:", pdfErr);
        }

        onSuccess?.(
          `Order placed for Table ${tableNumber}! Receipt PDF downloaded. [Table Token: ${assignedToken}]`
        );
        setTableNumber("");
        setUserToken("");
        setQuantity(1);
        setNotes("");
        setIsTableLocked(false);
        setIsTokenVerified(false);
        onClose();
      } else {
        if (data.locked) {
          setIsTableLocked(true);
        }
        setError(data.error || "Failed to place order. Please try again.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitialFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError("Please enter your Table Number.");
      return;
    }

    if (isTableLocked && !isTokenVerified) {
      setError(`Table ${tableNumber} is locked. Please enter the 5-digit Table Token (e.g. A8K9P).`);
      return;
    }

    setError("");

    if (paymentMethod === "upi") {
      // Launch Razorpay Simulator Card
      setIsRazorpayOpen(true);
    } else {
      // Direct Cash Order
      executeOrderSubmission("cash", "pending_cash");
    }
  };

  const handleRazorpaySuccess = (txnId: string) => {
    setIsRazorpayOpen(false);
    executeOrderSubmission("upi", "paid", txnId);
  };

  return (
    <>
      <Dialog
        isOpen={isOpen && !isRazorpayOpen}
        onClose={onClose}
        title="Place Table Order"
        description={`Ordering ${dish.name}`}
      >
        <form onSubmit={handleInitialFormSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Table Lock Active Warning & Token Entry Prompt */}
          {isTableLocked && !isTokenVerified && (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-3 shadow-lg">
              <div className="flex items-start gap-2.5">
                <Lock className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white mb-0.5">
                    Table {tableNumber} is Currently Locked ({lockDuration}-Min Lock)
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    An active order is in progress for Table {tableNumber}. Enter the 5-digit Table Token to add items to this table.
                  </p>
                </div>
              </div>

              {/* 5-Digit Capital Token Entry Input */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Enter 5-Digit Table Token</span>
                </label>
                <input
                  type="text"
                  maxLength={5}
                  placeholder="e.g. A8K9P"
                  value={userToken}
                  onChange={(e) => setUserToken(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-white font-mono uppercase font-black placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-400 tracking-widest text-center shadow-inner"
                />
              </div>
            </div>
          )}

          {/* Token Verified Banner */}
          {isTokenVerified && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-2 font-mono">
              <ShieldCheck className="h-4 w-4 text-zinc-300 shrink-0" />
              <span>
                <strong className="text-white font-bold">Token [{userToken}] Verified!</strong> You can now add items to Table {tableNumber}.
              </span>
            </div>
          )}

          {/* Selected Dish Summary Header */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            {dish.poster && (
              <img
                src={dish.poster}
                alt={dish.name}
                className="h-12 w-12 rounded-lg object-cover border border-zinc-800"
              />
            )}
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">{dish.name}</h4>
              <span className="text-xs text-zinc-400">{dish.price} each</span>
            </div>
          </div>

          {/* Table Number Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-300">
                Table Number <span className="text-zinc-400">*</span>
              </label>
              {isLockChecking ? (
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-zinc-400" /> Checking status…
                </span>
              ) : isTokenVerified ? (
                <span className="text-[11px] text-zinc-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-zinc-400" /> Token Access Granted
                </span>
              ) : tableNumber && !isTableLocked ? (
                <span className="text-[11px] text-zinc-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-zinc-400" /> Table Available
                </span>
              ) : null}
            </div>
            <input
              type="text"
              placeholder="e.g. 5, 12, or Outdoor 2"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all"
            />
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="h-9 w-9 p-0 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-base font-bold text-white w-8 text-center font-mono">
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuantity((q) => q + 1)}
                className="h-9 w-9 p-0 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Dynamic Table Lock Duration Option (20, 30, 40, 60 Mins) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>Table Lock Duration (Reserve Table)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[20, 30, 40, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setLockDuration(mins)}
                  className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center ${
                    lockDuration === mins
                      ? "border-zinc-700 bg-zinc-800 text-white font-bold shadow-sm"
                      : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {mins} mins
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Generates a 5-digit Token for Table {tableNumber || "X"} locked for {lockDuration} minutes.
            </p>
          </div>

          {/* Checkout Payment Options (UPI vs Cash) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Select Checkout / Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: UPI */}
              <button
                type="button"
                onClick={() => setPaymentMethod("upi")}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 ${
                  paymentMethod === "upi"
                    ? "border-zinc-700 bg-zinc-800/90 text-white ring-1 ring-zinc-700"
                    : "border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                    <span className="text-xs font-black tracking-widest text-white">
                      UPI
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-pulse" />
                  </div>
                  {paymentMethod === "upi" && (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">Instant UPI</h5>
                  <p className="text-[10px] text-zinc-400">GPay, PhonePe, Paytm QR</p>
                </div>
              </button>

              {/* Option 2: Cash (Call Waiter) */}
              <button
                type="button"
                onClick={() => setPaymentMethod("cash")}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 ${
                  paymentMethod === "cash"
                    ? "border-zinc-700 bg-zinc-800/90 text-white ring-1 ring-zinc-700"
                    : "border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                    <Banknote className="h-4 w-4" />
                  </div>
                  {paymentMethod === "cash" && (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  )}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">Cash / Waiter</h5>
                  <p className="text-[10px] text-zinc-400">Pay cash after dining</p>
                </div>
              </button>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Special Instructions <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Extra spicy, no onions, less oil…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all resize-none"
            />
          </div>

          {/* Total & Submit Button */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                Total Amount
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
                ₹{totalPrice}
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || (isTableLocked && !isTokenVerified)}
              className="gap-2 font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                  <span>Placing Order…</span>
                </>
              ) : paymentMethod === "upi" ? (
                <>
                  <QrCode className="h-4 w-4 text-zinc-950" />
                  <span>Proceed to UPI Payment</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-zinc-950" />
                  <span>Confirm Cash Order</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Razorpay Demo Payment Gateway Modal */}
      <RazorpayModal
        isOpen={isRazorpayOpen}
        amount={totalPrice}
        dishName={dish.name}
        tableNumber={tableNumber}
        onClose={() => setIsRazorpayOpen(false)}
        onSuccess={handleRazorpaySuccess}
      />
    </>
  );
}
