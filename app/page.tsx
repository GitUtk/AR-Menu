"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DISH_LIST, CATEGORIES, Dish } from "@/lib/dishes";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DishCard } from "@/components/DishCard";
import { OrderModal } from "@/components/OrderModal";
import { Toast, ToastMessage } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrderDish, setSelectedOrderDish] = useState<Dish | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const triggerToast = (message: string, type: "info" | "success" | "warning" = "info") => {
    setToast({ id: Date.now().toString(), message, type });
  };

  const handleSelectDish = (dish: Dish) => {
    router.push(`/dish/${dish.id}`);
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  const filteredDishes = DISH_LIST.filter((dish) => {
    const matchesCategory =
      activeCategory === "all" || dish.tags.includes(activeCategory);
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between">
      <Header onHomeClick={handleHomeClick} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="space-y-10 animate-in fade-in duration-300">
          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4 pt-4 sm:pt-8">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Explore Our Culinary Dishes in{" "}
              <span className="text-zinc-300 underline decoration-zinc-700 underline-offset-8">
                3D & AR
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
              Select a dish to interact with its 3D model — then project it right onto your dining table using mobile AR.
            </p>

            {/* Search Bar */}
            <div className="pt-2 max-w-md mx-auto relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search dishes by name, cuisine, or tag…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:border-transparent transition-all shadow-xl"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-center overflow-x-auto pb-2 gap-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeCategory === cat.id
                    ? "bg-white text-zinc-950 font-bold shadow-md shadow-white/5"
                    : "bg-zinc-900/70 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Dish Grid */}
          {filteredDishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onSelect={handleSelectDish}
                  onOrder={(d) => setSelectedOrderDish(d)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-zinc-400 space-y-3">
              <AlertCircle className="h-10 w-10 text-zinc-500 mx-auto" />
              <h3 className="text-base font-semibold text-zinc-200">No dishes match your filter</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Try searching for another dish or click "All Items" to view our complete menu.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs"
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <OrderModal
        isOpen={!!selectedOrderDish}
        dish={selectedOrderDish}
        onClose={() => setSelectedOrderDish(null)}
        onSuccess={(msg) => triggerToast(msg, "success")}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
