"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Order } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toast, ToastMessage } from "@/components/ui/toast";
import { AiModelGeneratorSection } from "@/components/AiModelGeneratorSection";
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  RefreshCw,
  Trash2,
  ShoppingBag,
  IndianRupee,
  AlertCircle,
  ChefHat,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  LogOut,
  Loader2,
  ShieldCheck,
  QrCode,
  Banknote,
  Key,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin View State
  const [activeAdminTab, setActiveAdminTab] = useState<"orders" | "generate_3d">("orders");

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Real-time ticking 1-second countdown clock for table lock timers
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingLockTime = (order: Order) => {
    if (order.unlocked_at) return null;
    if (order.status === "cancelled") return null;

    const lockDurationMins = order.lock_duration_mins || 30;
    const createdMs = new Date(order.created_at).getTime();
    const expireMs = createdMs + lockDurationMins * 60 * 1000;
    const remainingMs = expireMs - now;

    if (remainingMs <= 0) return null;

    const totalSecs = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;

    return {
      mins,
      secs: secs < 10 ? `0${secs}` : `${secs}`,
      formatted: `${mins}m ${secs < 10 ? `0${secs}` : secs}s`,
      lockDurationMins,
    };
  };

  const triggerToast = (message: string, type: "info" | "success" | "warning" = "info") => {
    setToast({ id: Date.now().toString(), message, type });
  };

  // Verify auth session on mount
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/login");
      const data = await res.json();
      setIsAuthenticated(!!data.authenticated);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch orders if authenticated
  const fetchOrders = useCallback(async (showToastNotification = false) => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        if (showToastNotification) {
          triggerToast("Orders refreshed", "info");
        }
      }
    } catch {
      triggerToast("Error fetching orders", "warning");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      const interval = setInterval(() => {
        fetchOrders(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchOrders]);

  // Handle Login Submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      setLoginError("Please enter admin password");
      return;
    }

    setLoginError("");
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setPasswordInput("");
        triggerToast("Welcome, Admin! Kitchen Dashboard unlocked.", "success");
      } else {
        setLoginError(data.error || "Invalid password");
      }
    } catch {
      setLoginError("Login request failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/login", { method: "DELETE" });
      setIsAuthenticated(false);
      triggerToast("Logged out of Admin Dashboard", "info");
    } catch {
      triggerToast("Logout failed", "warning");
    }
  };

  const updateStatus = async (id: string | number, newStatus: Order["status"]) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
        );
        triggerToast(`Order #${id} marked as ${newStatus}`, "success");
      }
    } catch {
      triggerToast("Failed to update status", "warning");
    }
  };

  const deleteOrder = async (id: string | number | "all") => {
    if (id === "all" && !confirm("Are you sure you want to clear all orders?")) {
      return;
    }

    try {
      const res = await fetch(`/api/orders?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (id === "all") {
          setOrders([]);
        }
      }
    } catch {
      triggerToast("Failed to delete order", "warning");
    }
  };

  const unlockTable = async (id: string | number) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "unlock" }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, unlocked_at: new Date().toISOString() } : o))
        );
        triggerToast(`Table unlocked for order #${id}`, "success");
      }
    } catch {
      triggerToast("Failed to unlock table", "warning");
    }
  };

  // Loading auth state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
      </div>
    );
  }

  // ── UNAUTHENTICATED LOGIN SCREEN ───────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-between">
        <Header onHomeClick={() => router.push("/")} />

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-white shadow-xl">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight pt-2">
                Admin Authentication
              </h1>
              <p className="text-xs text-zinc-400 max-w-xs">
                Enter your SHA-256 protected admin password to access the kitchen dashboard.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password…"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    autoFocus
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-4 pr-10 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-extrabold text-sm py-5 rounded-xl shadow-xl shadow-white/10"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
                    <span>Verifying Password…</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-zinc-950" />
                    <span>Login to Kitchen Dashboard</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </main>

        <Footer />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </div>
    );
  }

  // ── AUTHENTICATED ADMIN DASHBOARD ──────────────────────────────────────────
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;
  const totalRevenue = orders.reduce((sum, o) => {
    const num = parseInt(o.price.replace(/[^0-9]/g, ""), 10) || 0;
    return sum + num;
  }, 0);

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === "all") return true;
    return o.status === filterStatus;
  });

  const getTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins === 1) return "1 min ago";
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    return `${hours} hr ago`;
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 gap-1.5">🟡 Pending</Badge>;
      case "preparing":
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 gap-1.5">🔵 Preparing</Badge>;
      case "served":
        return <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 gap-1.5">🟢 Served</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/40 gap-1.5">🔴 Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between">
      <Header onHomeClick={() => router.push("/")} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
        {/* Top Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ChefHat className="h-6 w-6 text-white" />
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Kitchen Order Dashboard
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">
              Real-time table orders powered by MongoDB Atlas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(true)}
              className="gap-2 text-xs border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
            >
              <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
              <span>Refresh</span>
            </Button>

            {orders.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteOrder("all")}
                className="gap-2 text-xs border-red-900/50 bg-red-950/40 text-red-300 hover:bg-red-900/50"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                <span>Clear All Orders</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5 text-zinc-400" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setActiveAdminTab("orders")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === "orders"
                ? "bg-white text-zinc-950 shadow-lg"
                : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <ChefHat className="h-4 w-4" />
            <span>Kitchen Orders Dashboard</span>
            {activeOrders > 0 && (
              <Badge className="bg-amber-500 text-zinc-950 font-black text-[10px] px-1.5 py-0">
                {activeOrders}
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab("generate_3d")}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === "generate_3d"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-4 w-4 text-blue-300" />
            <span>Add & Edit Menu Items</span>
          </button>
        </div>

        {activeAdminTab === "generate_3d" ? (
          <AiModelGeneratorSection triggerToast={triggerToast} />
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">
                Active Orders
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                {activeOrders}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">
                Total Orders Placed
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                {totalOrders}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-800 border border-zinc-700">
              <ShoppingBag className="h-6 w-6 text-zinc-300" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-center justify-between shadow-xl">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">
                Total Revenue
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                ₹{totalRevenue}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <IndianRupee className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all", label: `All Orders (${orders.length})` },
            { id: "pending", label: `Pending (${orders.filter((o) => o.status === "pending").length})` },
            { id: "preparing", label: `Preparing (${orders.filter((o) => o.status === "preparing").length})` },
            { id: "served", label: `Served (${orders.filter((o) => o.status === "served").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === tab.id
                  ? "bg-white text-zinc-950 font-bold shadow-lg"
                  : "bg-zinc-900/70 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Feed */}
        {loading ? (
          <div className="text-center py-20 text-zinc-500 text-sm">
            Loading kitchen dashboard…
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
              >
                <div>
                  {/* Card Header: Table Number & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-lg bg-zinc-800 border border-zinc-700 font-extrabold text-sm text-white font-mono">
                        Table {order.table_number}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        #{order.id}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Dish Name & Quantity */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white">
                        {order.dish_name}
                      </h3>
                      <span className="text-xs font-bold text-white font-mono">
                        {order.price}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>Qty: <strong className="text-zinc-200">{order.quantity}</strong></span>
                      <span>·</span>
                      <span>{getTimeAgo(order.created_at)}</span>
                    </div>
                  </div>

                  {/* Payment Method & Live Real-Time Lock Countdown Badges */}
                  {(() => {
                    const lockTime = getRemainingLockTime(order);
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2 mt-2 mb-3">
                          {order.payment_method === "upi" ? (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 gap-1 text-[10px]">
                              <QrCode className="h-3 w-3 text-blue-400" />
                              <span>UPI PAID</span>
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 gap-1 text-[10px]">
                              <Banknote className="h-3 w-3 text-emerald-400" />
                              <span>CASH ON DELIVERY</span>
                            </Badge>
                          )}

                          {order.table_token && (
                            <Badge className="bg-amber-950/80 text-amber-300 border-amber-800/80 gap-1 text-[10px] font-mono font-bold tracking-wider">
                              <Key className="h-3 w-3 text-amber-400" />
                              <span>TOKEN: {order.table_token}</span>
                            </Badge>
                          )}

                          {lockTime ? (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 gap-1 text-[10px] font-mono animate-pulse">
                              <Clock className="h-3 w-3 text-amber-400" />
                              <span>Unlocks in {lockTime.formatted} ({lockTime.lockDurationMins}m Lock)</span>
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
                              <span>UNLOCKED</span>
                            </Badge>
                          )}
                        </div>

                        {/* Special Notes if any */}
                        {order.notes && (
                          <div className="mt-2 p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-xs text-amber-300 flex items-start gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              <strong className="text-amber-200 font-medium">Note:</strong> {order.notes}
                            </p>
                          </div>
                        )}

                        {/* Manual Unlock Table Action for Staff */}
                        {lockTime && (
                          <button
                            onClick={() => unlockTable(order.id)}
                            className="mt-3 w-full py-1.5 px-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 hover:bg-amber-900/50 transition-colors text-xs font-semibold flex items-center justify-center gap-1.5"
                          >
                            <Unlock className="h-3.5 w-3.5 text-amber-400" />
                            <span>Unlock Table {order.table_number} Now ({lockTime.formatted} left)</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Status Action Buttons */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, "preparing")}
                        className="flex-1 gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        <UtensilsCrossed className="h-3.5 w-3.5" />
                        <span>Start Preparing</span>
                      </Button>
                    )}

                    {order.status === "preparing" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, "served")}
                        className="flex-1 gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Served</span>
                      </Button>
                    )}

                    {order.status === "served" && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Served to Table
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteOrder(order.id)}
                    title="Delete Order"
                    className="h-8 w-8 p-0 border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 space-y-3">
            <AlertCircle className="h-10 w-10 text-zinc-500 mx-auto" />
            <h3 className="text-base font-semibold text-zinc-200">No orders found</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              When customers place an order from their table, orders will automatically appear here in real time.
            </p>
          </div>
        )}
        </>
        )}
      </main>

      <Footer />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
