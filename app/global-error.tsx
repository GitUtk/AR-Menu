"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl space-y-4">
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-xs text-zinc-400">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
