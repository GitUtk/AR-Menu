import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "white";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
        {
          "border-zinc-700 bg-zinc-800/90 text-zinc-200 shadow-sm":
            variant === "default",
          "border-zinc-800 bg-zinc-900 text-zinc-400":
            variant === "secondary",
          "border-zinc-700 text-zinc-300 bg-transparent":
            variant === "outline",
          "border-white/20 bg-white text-zinc-950 font-bold shadow-md":
            variant === "white",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
