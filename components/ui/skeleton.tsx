import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-zinc-800/60 bg-gradient-to-r from-zinc-900/80 via-zinc-800/60 to-zinc-900/80 border border-zinc-800/40",
        className
      )}
      {...props}
    />
  );
}
