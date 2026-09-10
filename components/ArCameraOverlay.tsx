"use client";

import React, { useEffect, useRef, useState } from "react";
import { Dish } from "@/lib/dishes";
import { QrCode, Sparkles, X } from "lucide-react";
import { Button } from "./ui/button";

interface ArCameraOverlayProps {
  isOpen: boolean;
  dish: Dish | null;
  onClose: () => void;
  onShowMarker: () => void;
}

export function ArCameraOverlay({
  isOpen,
  dish,
  onClose,
  onShowMarker,
}: ArCameraOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen || !dish) return;

    let isMounted = true;

    // Helper to dynamically load external scripts needed for AR.js
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = () => resolve();
        document.head.appendChild(s);
      });
    };

    // Load A-Frame and AR.js
    Promise.all([
      loadScript("https://aframe.io/releases/1.4.2/aframe.min.js"),
      loadScript(
        "https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@master/aframe/build/aframe-ar.js"
      ),
    ]).then(() => {
      if (isMounted) setScriptsLoaded(true);
    });

    document.documentElement.classList.add("ar-mode-active");
    document.body.classList.add("ar-mode-active");

    const cleanupInterval = setInterval(() => {
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.marginLeft = "";
      document.body.style.marginTop = "";
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(cleanupInterval);
      document.documentElement.classList.remove("ar-mode-active");
      document.body.classList.remove("ar-mode-active");
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.marginLeft = "";
      document.body.style.marginTop = "";

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      // Stop camera streams and clean up video elements
      const videoElements = document.querySelectorAll("video, #arjs-video");
      videoElements.forEach((v: any) => {
        if (v.srcObject && typeof v.srcObject.getTracks === "function") {
          v.srcObject.getTracks().forEach((track: any) => track.stop());
        }
        v.remove();
      });
    };
  }, [isOpen, dish]);

  useEffect(() => {
    if (!isOpen || !dish || !scriptsLoaded || !containerRef.current) return;

    containerRef.current.innerHTML = `
      <a-scene embedded background="transparent: true" arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best;" vr-mode-ui="enabled: false" renderer="logarithmicDepthBuffer: true; colorManagement: true; antialias: true;">
        <a-marker preset="hiro" id="hiroMarker">
          <a-entity light="type: ambient; intensity: 1.6;"></a-entity>
          <a-entity light="type: directional; intensity: 1.4;" position="1 4 2"></a-entity>
          <a-entity
            id="arDishEntity"
            gltf-model="${dish.model}"
            position="${dish.position || "0 0.05 0"}"
            scale="${dish.arScale || "2.2 2.2 2.2"}"
            rotation="${dish.rotation || "0 0 0"}"
          ></a-entity>
        </a-marker>
        <a-entity camera></a-entity>
      </a-scene>
    `;

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 200);
  }, [isOpen, dish, scriptsLoaded]);

  if (!isOpen || !dish) return null;

  return (
    <div className="ar-overlay pointer-events-none">
      {/* AR Scene Canvas Container */}
      <div ref={containerRef} className="ar-scene-container pointer-events-none" />

      {/* UI Overlay on top */}
      <div className="fixed inset-0 z-[5000] p-4 sm:p-6 flex flex-col justify-end pointer-events-none">
        {/* Bottom Instructions Card */}
        <div className="pointer-events-auto max-w-md mx-auto w-full mb-4 z-[5001] relative">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-xl text-center flex flex-col items-center pointer-events-auto">
            <div className="flex items-center justify-center gap-2 text-zinc-300 mb-1">
              <Sparkles className="h-4 w-4" />
              <h3 className="font-semibold text-base text-white">
                Point camera at Hiro Marker
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4 max-w-xs">
              Scan the Hiro marker on your dining table to render{" "}
              <strong className="text-white font-medium">{dish.name}</strong> in 3D.
            </p>

            <div className="flex items-center justify-center gap-2.5 pointer-events-auto">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowMarker();
                }}
                className="gap-2 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800 cursor-pointer pointer-events-auto relative z-[5002]"
              >
                <QrCode className="h-3.5 w-3.5 text-zinc-300" />
                View / Print Hiro Marker
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="gap-1.5 text-xs border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 hover:text-white cursor-pointer pointer-events-auto relative z-[5002]"
              >
                <X className="h-3.5 w-3.5 text-zinc-400" />
                Close AR
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
