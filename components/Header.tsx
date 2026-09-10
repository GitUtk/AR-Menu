"use client";

import React from "react";
import { Utensils } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  onHomeClick?: () => void;
}

export function Header({ onHomeClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={onHomeClick}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center font-black text-xs text-white shadow-md group-hover:border-zinc-500 transition-colors">
            AR
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              AR Restaurant <span className="text-zinc-400 font-normal">Menu</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-medium">3D & WebXR Experience</span>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onHomeClick}
            className="gap-2 text-xs border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800"
          >
            <Utensils className="h-3.5 w-3.5 text-zinc-400" />
            <span>Menu</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
