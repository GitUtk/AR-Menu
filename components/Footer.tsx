import React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-center sm:justify-between flex-wrap gap-3 text-xs text-zinc-400">
        <span className="font-medium text-zinc-500">
          &copy; {new Date().getFullYear()} AR Menu. All rights reserved.
        </span>
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <span>Made With</span>
          <span className="text-red-500 animate-pulse">❤️</span>
          <span>by</span>
          <span className="font-bold text-white tracking-wide">Team Sentinel</span>
        </div>
      </div>
    </footer>
  );
}
