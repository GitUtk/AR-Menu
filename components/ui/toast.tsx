"use client";

import * as React from "react";
import { Info, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastMessage {
  id: string;
  message: string;
  type?: "info" | "success" | "warning";
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss?: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 2800);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-100 shadow-2xl backdrop-blur-lg animate-in slide-in-from-bottom-5 fade-in duration-200">
      {toast.type === "success" && (
        <CheckCircle className="h-4 w-4 text-white" />
      )}
      {toast.type === "warning" && (
        <AlertTriangle className="h-4 w-4 text-zinc-300" />
      )}
      {(!toast.type || toast.type === "info") && (
        <Info className="h-4 w-4 text-zinc-400" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
