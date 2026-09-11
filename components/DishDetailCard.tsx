"use client";

import React from "react";
import { Dish } from "@/lib/dishes";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Box, RotateCcw, Maximize2, Flame, Clock, IndianRupee, UtensilsCrossed } from "lucide-react";

interface DishDetailCardProps {
  dish: Dish;
  onLaunchAR: () => void;
  onOrder?: () => void;
  onResetCamera: () => void;
  onToggleFullscreen: () => void;
}

export function DishDetailCard({
  dish,
  onLaunchAR,
  onOrder,
  onResetCamera,
  onToggleFullscreen,
}: DishDetailCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-zinc-800 text-zinc-200 border-zinc-700">
            {dish.badge}
          </Badge>
          {dish.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          {dish.name}
        </h1>
      </div>

      {/* Description */}
      <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
        {dish.description}
      </p>

      {/* Meta Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 sm:p-4 flex flex-col items-start justify-center">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-1">
            <IndianRupee className="h-3.5 w-3.5 text-zinc-400" />
            <span>Price</span>
          </div>
          <span className="text-base sm:text-xl font-bold text-white">
            {dish.price}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 sm:p-4 flex flex-col items-start justify-center">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-1">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>Prep Time</span>
          </div>
          <span className="text-base sm:text-xl font-bold text-white">
            {dish.prepTime}
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3 sm:p-4 flex flex-col items-start justify-center">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium mb-1">
            <Flame className="h-3.5 w-3.5 text-zinc-400" />
            <span>Calories</span>
          </div>
          <span className="text-base sm:text-xl font-bold text-white">
            {dish.calories}
          </span>
        </div>
      </div>

      {/* Primary & Secondary Actions */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {onOrder && (
            <Button
              size="lg"
              onClick={onOrder}
              className="w-full gap-2 bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-base py-6 shadow-xl"
            >
              <UtensilsCrossed className="h-5 w-5 text-zinc-950" />
              <span>Order Now</span>
            </Button>
          )}

          <Button
            size="lg"
            onClick={onLaunchAR}
            className="w-full gap-2 bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 text-base font-bold py-6 shadow-xl"
          >
            <Box className="h-5 w-5 text-white" />
            <span>View in AR</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={onResetCamera}
            className="gap-2 text-xs border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200"
          >
            <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
            Reset Camera
          </Button>

          <Button
            variant="secondary"
            onClick={onToggleFullscreen}
            className="gap-2 text-xs border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200"
          >
            <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
            Fullscreen
          </Button>
        </div>
      </div>
    </div>
  );
}
