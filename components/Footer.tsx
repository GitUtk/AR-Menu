import React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-end gap-3 text-xs text-zinc-400">
        <span className="font-medium text-zinc-400 text-xs">GitHub Contributors:</span>

        {/* GitUtk GitHub Avatar Profile */}
        <a
          href="https://github.com/GitUtk"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center justify-center"
          title="GitUtk on GitHub"
          aria-label="GitUtk GitHub Profile"
        >
          <img
            src="https://avatars.githubusercontent.com/u/84007458?v=4"
            alt="GitUtk GitHub Profile"
            className="h-8 w-8 rounded-full border-2 border-zinc-800 object-cover shadow-md group-hover:scale-110 group-hover:border-zinc-500 transition-all duration-200"
          />
        </a>

        {/* tejeetvkumar GitHub Avatar Profile */}
        <a
          href="https://github.com/tejeetvkumar"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative inline-flex items-center justify-center"
          title="tejeetvkumar on GitHub"
          aria-label="tejeetvkumar GitHub Profile"
        >
          <img
            src="https://avatars.githubusercontent.com/u/235899628?v=4"
            alt="tejeetvkumar GitHub Profile"
            className="h-8 w-8 rounded-full border-2 border-zinc-800 object-cover shadow-md group-hover:scale-110 group-hover:border-zinc-500 transition-all duration-200"
          />
        </a>
      </div>
    </footer>
  );
}
