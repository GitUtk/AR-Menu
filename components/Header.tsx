"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Utensils, ChefHat } from "lucide-react";
import { Button } from "./ui/button";

interface HeaderProps {
  onHomeClick?: () => void;
}

export function Header({ onHomeClick }: HeaderProps) {
  const router = useRouter();

  const handleHome = () => {
    if (onHomeClick) onHomeClick();
    else router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={handleHome}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="relative h-9 w-9 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center p-0.5 shadow-lg group-hover:border-zinc-500 group-hover:shadow-zinc-500/20 transition-all duration-300">
            <img
              src="/images/logo.png"
              alt="AR Restaurant Emblem"
              className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
            />
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
            onClick={handleHome}
            className="gap-1.5 text-xs border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300"
          >
            <Utensils className="h-3.5 w-3.5 text-zinc-400" />
            <span>Menu</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin")}
            className="gap-1.5 text-xs border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300"
          >
            <ChefHat className="h-3.5 w-3.5 text-zinc-400" />
            <span>Admin</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
