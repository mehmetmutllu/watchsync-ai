import { Watch } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-midnight flex">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-gold/5" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-accent-blue/5 blur-[120px]" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <Watch className="w-6 h-6 text-accent-blue" strokeWidth={1.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              WatchSync<span className="text-accent-blue"> AI</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Manage Your Luxury Watch{" "}
            <span className="bg-gradient-to-r from-accent-blue to-accent-gold bg-clip-text text-transparent">
              Inventory with AI
            </span>
          </h1>
          <p className="mt-4 text-secondary-text leading-relaxed">
            Sync inventory across eBay, Chrono24 & Shopify. AI-enhanced photos.
            Market intelligence. Zero double-sells.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-disabled-text">
          <span>© 2026 WatchSync AI</span>
          <span>·</span>
          <span>Privacy</span>
          <span>·</span>
          <span>Terms</span>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
