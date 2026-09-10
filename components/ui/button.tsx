import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "icon" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          {
            // Primary (White background, high contrast dark text)
            "bg-white text-zinc-950 hover:bg-zinc-200 shadow-md shadow-white/5 font-semibold":
              variant === "default",
            // Secondary (Dark grey background, grey border)
            "bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700":
              variant === "secondary",
            // Outline
            "border border-zinc-800 bg-transparent text-zinc-100 hover:bg-zinc-900 hover:border-zinc-700":
              variant === "outline",
            // Ghost
            "bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-white":
              variant === "ghost",
            // Icon
            "bg-zinc-900/80 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:text-white rounded-full p-2.5":
              variant === "icon",
            // Destructive
            "bg-red-900/60 border border-red-800 text-red-100 hover:bg-red-900":
              variant === "destructive",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-12 rounded-xl px-6 text-base font-semibold": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
