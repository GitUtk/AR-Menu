"use client";

import React, { useState } from "react";
import { Dish } from "@/lib/dishes";
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Box, ArrowRight } from "lucide-react";

interface DishCardProps {
  dish: Dish;
  onSelect: (dish: Dish) => void;
}

export function DishCard({ dish, onSelect }: DishCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Card
      onClick={() => onSelect(dish)}
      className="group cursor-pointer flex flex-col justify-between overflow-hidden bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1"
    >
      <div>
        {/* Card Top Food Image Box */}
        <div className="relative h-48 w-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 flex items-center justify-center border-b border-zinc-800/80 overflow-hidden">
          {dish.poster && !imgError ? (
            <img
              src={dish.poster}
              alt={dish.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="relative z-10 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 group-hover:scale-110 transition-all duration-300 shadow-xl">
              <Box className="h-10 w-10 text-white" />
            </div>
          )}
        </div>

        {/* Card Header */}
        <CardHeader className="p-5 pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg font-bold text-white group-hover:text-zinc-200 transition-colors">
              {dish.name}
            </CardTitle>
            <span className="text-base font-bold text-white font-mono">
              {dish.price}
            </span>
          </div>
          <CardDescription className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {dish.description}
          </CardDescription>
        </CardHeader>
      </div>

      {/* Card Footer */}
      <CardFooter className="p-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>{dish.prepTime}</span>
          <span>·</span>
          <span>{dish.calories}</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-zinc-200 group-hover:translate-x-0.5 transition-transform">
          <span>View 3D</span>
          <ArrowRight className="h-3.5 w-3.5 text-zinc-400" />
        </div>
      </CardFooter>
    </Card>
  );
}
