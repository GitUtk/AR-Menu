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
      if (!document.body.classList.contains("ar-mode-active")) {
        document.body.removeAttribute("style");
        document.documentElement.removeAttribute("style");
      }
    }, 100);

    return () => {
      isMounted = false;
      clearInterval(cleanupInterval);
      document.documentElement.classList.remove("ar-mode-active");
      document.body.classList.remove("ar-mode-active");
      
      // Completely strip inline style attributes injected by AR.js
      document.documentElement.removeAttribute("style");
      document.body.removeAttribute("style");

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      // Stop camera streams and clean up video/canvas elements
      const videoElements = document.querySelectorAll("video, #arjs-video, .a-canvas, a-scene");
      videoElements.forEach((v: any) => {
        if (v.srcObject && typeof v.srcObject.getTracks === "function") {
          v.srcObject.getTracks().forEach((track: any) => track.stop());
        }
        if (v.parentNode) {
          v.parentNode.removeChild(v);
        } else if (typeof v.remove === "function") {
          v.remove();
        }
      });

      window.dispatchEvent(new Event("resize"));
    };
  }, [isOpen, dish]);

  useEffect(() => {
    if (!isOpen || !dish || !scriptsLoaded || !containerRef.current) return;

    containerRef.current.innerHTML = `
      <a-scene embedded background="transparent: true" arjs="sourceType: webcam; debugUIEnabled: false; trackingMethod: best;" vr-mode-ui="enabled: false" renderer="logarithmicDepthBuffer: true; colorManagement: true; antialias: true;">
        <!-- High-Intensity 360 Light Rig -->
        <a-light type="ambient" color="#ffffff" intensity="4.0"></a-light>
        <a-light type="directional" color="#ffffff" intensity="2.5" position="2 6 3"></a-light>
        <a-light type="directional" color="#ffffff" intensity="2.5" position="-2 6 -3"></a-light>
        <a-light type="directional" color="#ffffff" intensity="2.0" position="0 -5 0"></a-light>
        <a-light type="directional" color="#ffffff" intensity="2.0" position="5 0 0"></a-light>
        <a-light type="directional" color="#ffffff" intensity="2.0" position="-5 0 0"></a-light>

        <a-marker preset="hiro" id="hiroMarker">
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
      const entity = document.getElementById("arDishEntity");
      if (entity) {
        entity.addEventListener("model-loaded", () => {
          const mesh = (entity as any).getObject3D("mesh");
          if (mesh) {
            mesh.traverse((node: any) => {
              if (node.isMesh && node.material) {
                // Ensure materials absorb full lighting and don't render black
                if (Array.isArray(node.material)) {
                  node.material.forEach((m: any) => {
                    m.roughness = 0.6;
                    m.metalness = 0.0;
                    m.needsUpdate = true;
                  });
                } else {
                  node.material.roughness = 0.6;
                  node.material.metalness = 0.0;
                  node.material.needsUpdate = true;
                }
              }
            });
          }
        });
      }
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
