import React from "react";
import { Skeleton } from "./ui/skeleton";
import { Card, CardFooter, CardHeader } from "./ui/card";

export function DishCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between overflow-hidden bg-zinc-900/70 border-zinc-800 shadow-xl">
      <div>
        {/* Top Image Box Skeleton */}
        <Skeleton className="h-48 w-full rounded-none border-b border-zinc-800/80" />

        {/* Card Header Skeleton */}
        <CardHeader className="p-5 pb-2 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-6 w-3/5" />
            <Skeleton className="h-6 w-1/4" />
          </div>
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
          </div>
        </CardHeader>
      </div>

      {/* Card Footer Skeleton */}
      <CardFooter className="p-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-4 w-8 rounded" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function DishDetailSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Back Button Skeleton */}
      <Skeleton className="h-9 w-36 rounded-xl" />

      {/* Main Grid: 3D Viewer left | Info Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 3D Model Viewer Card Skeleton */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        </div>

        {/* Dish Info Card Skeleton */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-6 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-1/4" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
