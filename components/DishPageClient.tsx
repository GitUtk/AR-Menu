"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DISHES, Dish } from "@/lib/dishes";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DishDetailCard } from "@/components/DishDetailCard";
import { ModelViewer, resetViewerCamera, toggleViewerFullscreen, triggerNativeAR } from "@/components/ModelViewer";
import { ArCameraOverlay } from "@/components/ArCameraOverlay";
import { HiroMarkerModal } from "@/components/HiroMarkerModal";
import { Toast, ToastMessage } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

interface DishPageClientProps {
  id: string;
}

export function DishPageClient({ id }: DishPageClientProps) {
  const router = useRouter();
  const dish = id ? DISHES[id.toLowerCase()] : null;

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isArOverlayOpen, setIsArOverlayOpen] = useState(false);
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState(false);

  const triggerToast = (message: string, type: "info" | "success" | "warning" = "info") => {
    setToast({ id: Date.now().toString(), message, type });
  };

  const handleBackToMenu = () => {
    router.push("/");
  };

  const handleLaunchAR = () => {
    const nativeActivated = triggerNativeAR();
    if (!nativeActivated) {
      setIsArOverlayOpen(true);
      triggerToast("Opening AR camera mode… Point at Hiro marker");
    }
  };

  if (!dish) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-between">
        <Header onHomeClick={handleBackToMenu} />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
            <AlertTriangle className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Dish Not Found</h1>
          <p className="text-sm text-zinc-400 max-w-sm mb-6">
            We couldn't find the dish you're looking for. Please return to our menu.
          </p>
          <Button onClick={handleBackToMenu} className="bg-white text-zinc-950 hover:bg-zinc-200">
            Return to Menu
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between">
      <Header onHomeClick={handleBackToMenu} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBackToMenu}
              className="gap-2 text-xs border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Menu</span>
            </Button>

            <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-800">
              Dish Code: {dish.id}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 w-full">
              <ModelViewer
                dish={dish}
                onError={() => triggerToast("Error loading 3D model", "warning")}
              />
            </div>

            <div className="lg:col-span-5 w-full">
              <DishDetailCard
                dish={dish}
                onLaunchAR={handleLaunchAR}
                onResetCamera={() => {
                  resetViewerCamera();
                  triggerToast("Camera view reset");
                }}
                onToggleFullscreen={toggleViewerFullscreen}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <ArCameraOverlay
        isOpen={isArOverlayOpen}
        dish={dish}
        onClose={() => setIsArOverlayOpen(false)}
        onShowMarker={() => setIsMarkerModalOpen(true)}
      />

      <HiroMarkerModal
        isOpen={isMarkerModalOpen}
        onClose={() => setIsMarkerModalOpen(false)}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
