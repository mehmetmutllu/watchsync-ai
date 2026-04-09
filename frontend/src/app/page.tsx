import Link from "next/link";
import {
  Watch,
  Cpu,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Cpu,
    title: "AI-Powered Image Processing",
    description:
      "Automatically remove backgrounds, enhance quality, and generate studio-grade product photos using SAM 2 segmentation.",
  },
  {
    icon: Globe,
    title: "Multi-Platform Sync",
    description:
      "Seamlessly list and sync inventory across eBay, Chrono24, and Shopify with one click. Real-time stock updates.",
  },
  {
    icon: Zap,
    title: "Real-Time Inventory",
    description:
      "Prevent double-selling with Redis-based mutex locks. Instant inventory state propagation across all channels.",
  },
  {
    icon: Shield,
    title: "Race Condition Protection",
    description:
      "Enterprise-grade concurrent access control ensures only one transaction processes per SKU at any given moment.",
  },
  {
    icon: TrendingUp,
    title: "Market Intelligence",
    description:
      "AI-driven price monitoring across Chrono24 and Watchfinder. Spot arbitrage opportunities before competitors.",
  },
  {
    icon: Watch,
    title: "AI Description Generator",
    description:
      "Generate SEO-optimized, multi-language listing descriptions using fine-tuned LLMs with watch-specific knowledge.",
  },
];

const stats = [
  { value: "50K+", label: "Watches Managed" },
  { value: "98.2%", label: "Sync Accuracy" },
  { value: "<200ms", label: "API Response" },
  { value: "3", label: "Platforms" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-midnight text-primary-text overflow-hidden">
      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-blue/20 flex items-center justify-center">
            <Watch className="w-5 h-5 text-accent-blue" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            WatchSync<span className="text-accent-blue"> AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="#features"
            className="text-sm text-secondary-text hover:text-primary-text transition-colors duration-150 hidden sm:block"
          >
            Features
          </Link>
          <Link
            href="/register"
            className="text-sm text-secondary-text hover:text-primary-text transition-colors duration-150 hidden sm:block"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center h-9 px-4 rounded-lg bg-accent-blue text-white text-sm font-medium
              hover:bg-accent-blue-hover transition-colors duration-150"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-28 lg:pb-36 px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent-blue/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-gold/5 blur-[100px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-blue/10 border border-accent-blue/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-blue animate-pulse-soft" />
            <span className="text-xs font-medium text-accent-blue">
              AI-Powered Inventory Platform
            </span>
          </div>

          <h1 className="text-display sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            Manage Your Luxury Watch
            <br />
            <span className="bg-gradient-to-r from-accent-blue to-accent-gold bg-clip-text text-transparent">
              Inventory with AI
            </span>
          </h1>

          <p className="mt-6 text-lg lg:text-xl text-secondary-text max-w-2xl mx-auto leading-relaxed">
            The all-in-one B2B platform for luxury watch dealers. Sync
            inventory across eBay, Chrono24 & Shopify. AI-enhanced photos.
            Market intelligence. Zero double-sells.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-accent-blue text-white font-semibold
                hover:bg-accent-blue-hover shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40
                transition-all duration-150"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-surface border border-border-subtle
                text-primary-text font-semibold hover:bg-surface-elevated hover:border-border-strong
                transition-all duration-150"
            >
              Watch Demo
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-6 mt-12 text-xs text-disabled-text">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-semantic-success" strokeWidth={2} />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-semantic-success" strokeWidth={2} />
              14-day free trial
            </span>
            <span className="inline-flex items-center gap-1.5 hidden sm:inline-flex">
              <CheckCircle className="w-3.5 h-3.5 text-semantic-success" strokeWidth={2} />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border-subtle bg-surface/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-border-subtle">
          {stats.map((stat) => (
            <div key={stat.label} className="py-8 px-6 text-center">
              <p className="text-2xl lg:text-3xl font-bold font-mono text-accent-blue">
                {stat.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-secondary-text">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
            Everything You Need to{" "}
            <span className="text-accent-blue">Scale</span>
          </h2>
          <p className="mt-4 text-secondary-text max-w-2xl mx-auto">
            From AI-enhanced product photos to real-time market intelligence,
            WatchSync AI gives you an unfair advantage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl p-8
                  hover:border-border-strong hover:bg-surface-elevated/50
                  transition-all duration-200
                  shadow-[var(--shadow-card)]"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-blue/10 flex items-center justify-center mb-5
                  group-hover:bg-accent-blue/20 transition-colors duration-200">
                  <Icon
                    className="w-5 h-5 text-accent-blue"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="text-lg font-semibold text-primary-text mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-secondary-text leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 lg:px-12">
        <div className="relative max-w-4xl mx-auto rounded-2xl bg-gradient-to-br from-accent-blue/10 via-surface to-accent-gold/5 border border-border-subtle p-12 lg:p-16 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-accent-blue/10 blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Transform Your Business?
            </h2>
            <p className="text-secondary-text max-w-xl mx-auto mb-8">
              Join luxury watch dealers who already manage their inventory
              with AI. Start streamlining your workflow today.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-accent-blue text-white font-semibold
                hover:bg-accent-blue-hover shadow-lg shadow-accent-blue/25
                transition-all duration-150"
            >
              Get Started for Free
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Watch className="w-4 h-4 text-accent-blue" strokeWidth={1.5} />
            <span className="text-sm font-semibold">
              WatchSync<span className="text-accent-blue"> AI</span>
            </span>
          </div>
          <p className="text-xs text-disabled-text">
            © 2026 WatchSync AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
