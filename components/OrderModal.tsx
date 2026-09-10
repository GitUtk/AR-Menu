"use client";

import React, { useState } from "react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Dish } from "@/lib/dishes";
import { Utensils, Minus, Plus, Loader2, CheckCircle2 } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!dish) return null;

  // Calculate price total numeric string
  const basePriceNum = parseInt(dish.price.replace(/[^0-9]/g, ""), 10) || 0;
  const totalPrice = basePriceNum * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError("Please enter your Table Number.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dish_id: dish.id,
          dish_name: dish.name,
          price: `₹${totalPrice}`,
          quantity,
          table_number: tableNumber.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess?.(`Order placed successfully for Table ${tableNumber}!`);
        setTableNumber("");
        setQuantity(1);
        setNotes("");
        onClose();
      } else {
        setError(data.error || "Failed to place order. Please try again.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Place Table Order"
      description={`Ordering ${dish.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-xs text-red-300">
            {error}
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
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Table Number <span className="text-amber-400">*</span>
          </label>
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
              className="h-9 w-9 p-0 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-200"
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
              className="h-9 w-9 p-0 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
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
            disabled={isSubmitting}
            className="gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-bold px-6 py-2.5 rounded-xl shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                <span>Placing Order…</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-zinc-950" />
                <span>Confirm Order</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
