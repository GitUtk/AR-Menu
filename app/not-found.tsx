import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between text-zinc-100">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
          <AlertCircle className="h-10 w-10 text-zinc-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">404 — Page Not Found</h1>
        <p className="text-sm text-zinc-400 max-w-sm mb-6">
          The dish or page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-sm transition-colors shadow-lg"
        >
          Return to Main Menu
        </Link>
      </main>
    </div>
  );
}
