"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dish } from "@/lib/dishes";
import { Loader2 } from "lucide-react";

interface ModelViewerProps {
  dish: Dish;
  onLoaded?: () => void;
  onError?: () => void;
}

export function ModelViewer({ dish, onLoaded, onError }: ModelViewerProps) {
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dynamically import @google/model-viewer if element is not registered yet
    if (typeof window !== "undefined" && !customElements.get("model-viewer")) {
      import("@google/model-viewer").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    setIsLoading(true);

    const handleLoad = () => {
      setIsLoading(false);
      onLoaded?.();
    };

    const handleError = () => {
      setIsLoading(false);
      onError?.();
    };

    // If model is already loaded in memory/cache
    if (el.loaded) {
      setIsLoading(false);
      onLoaded?.();
    }

    el.addEventListener("load", handleLoad);
    el.addEventListener("error", handleError);

    // Safety timeout to ensure loading overlay doesn't hang
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(safetyTimer);
      el.removeEventListener("load", handleLoad);
      el.removeEventListener("error", handleError);
    };
  }, [dish.model, onLoaded, onError]);

  return (
    <div className="relative w-full h-[360px] sm:h-[480px] rounded-2xl overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 shadow-xl">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <span className="text-xs font-semibold text-zinc-300 tracking-wide">
            Loading 3D Model…
          </span>
        </div>
      )}

      {/* @ts-ignore custom element */}
      <model-viewer
        ref={viewerRef}
        src={dish.model}
        ios-src={dish.iosSrc}
        poster={dish.poster}
        alt={`3D view of ${dish.name}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        camera-controls
        touch-action="pan-y"
        auto-rotate
        shadow-intensity="1.2"
        shadow-softness="0.8"
        exposure="1"
        loading="eager"
        reveal="auto"
        environment-image="neutral"
        camera-orbit={dish.cameraOrbit || "0deg 75deg 105%"}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}

// Global method helpers to interact with model-viewer instance
export function resetViewerCamera() {
  const mv: any = document.querySelector("model-viewer");
  if (mv) {
    if (typeof mv.resetTurntableRotation === "function") {
      mv.resetTurntableRotation();
    }
    mv.cameraOrbit = "0deg 75deg 105%";
  }
}

export function toggleViewerFullscreen() {
  const mv: any = document.querySelector("model-viewer");
  if (mv) {
    if (!document.fullscreenElement) {
      (mv.requestFullscreen || mv.webkitRequestFullscreen)?.call(mv);
    } else {
      (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
    }
  }
}

export function triggerNativeAR(): boolean {
  const mv: any = document.querySelector("model-viewer");
  if (mv && mv.canActivateAR) {
    mv.activateAR();
    return true;
  }
  return false;
}
