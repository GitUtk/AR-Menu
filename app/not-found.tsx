import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between text-zinc-100">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
          <AlertCircle className="h-10 w-10 text-amber-400" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">404 — Page Not Found</h1>
        <p className="text-sm text-zinc-400 max-w-sm mb-6">
          The dish or page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold">
            Return to Main Menu
          </Button>
        </Link>
      </main>
      <Footer />
    </div>
  );
}
