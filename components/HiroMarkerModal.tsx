"use client";

import React from "react";
import { Dialog } from "./ui/dialog";
import Image from "next/image";

interface HiroMarkerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HiroMarkerModal({ isOpen, onClose }: HiroMarkerModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Hiro AR Target Marker"
      description="Point your phone camera at this marker image to project the 3D food dish onto your surface:"
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="relative p-4 rounded-xl border border-zinc-800 bg-white flex items-center justify-center shadow-2xl">
          <img
            src="/hiro.png"
            alt="Hiro AR Marker Target"
            className="w-48 h-48 sm:w-60 sm:h-60 object-contain rounded-md"
          />
        </div>
        <p className="text-xs text-zinc-400 text-center">
          Display this on another screen or print it on a menu card.
        </p>
      </div>
    </Dialog>
  );
}
