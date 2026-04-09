"use client";

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Clock,
} from "lucide-react";

export default function MarketScannerPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-text">
          Market Scanner
        </h1>
        <p className="mt-1 text-sm text-secondary-text">
          Track price trends and competitor pricing across platforms.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            placeholder="Search by brand, model, or reference number..."
            disabled
            className="w-full pl-10 pr-4 py-2.5 bg-surface/50 border border-border-subtle rounded-lg
              text-sm text-primary-text placeholder:text-disabled-text
              focus:outline-none focus:border-accent-blue
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2.5 bg-surface/50 border border-border-subtle rounded-lg
            text-sm text-secondary-text disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Price Trend Chart Placeholder */}
      <div className="bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <TrendingUp
              className="w-4 h-4 text-accent-blue"
              strokeWidth={1.5}
            />
            <h2 className="text-lg font-semibold text-primary-text">
              Price Trends
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {["7D", "1M", "3M", "6M", "1Y"].map((period) => (
              <button
                key={period}
                disabled
                className="px-3 py-1 text-xs font-medium rounded-md
                  text-disabled-text bg-surface-elevated/50
                  disabled:cursor-not-allowed
                  first:bg-accent-blue/10 first:text-accent-blue"
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="px-6 py-12 flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative w-full max-w-lg">
            {/* Fake Chart Lines */}
            <svg
              viewBox="0 0 400 200"
              className="w-full h-auto text-border-subtle"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              {/* Grid lines */}
              <line x1="0" y1="50" x2="400" y2="50" opacity="0.3" />
              <line x1="0" y1="100" x2="400" y2="100" opacity="0.3" />
              <line x1="0" y1="150" x2="400" y2="150" opacity="0.3" />

              {/* Trend line placeholder */}
              <path
                d="M 0 150 Q 50 140, 80 120 T 160 100 T 240 110 T 320 80 T 400 60"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.3"
                strokeDasharray="8 4"
              />
              <path
                d="M 0 160 Q 50 155, 80 140 T 160 130 T 240 135 T 320 115 T 400 90"
                stroke="#f59e0b"
                strokeWidth="2"
                opacity="0.3"
                strokeDasharray="8 4"
              />
            </svg>
          </div>
          <div className="mt-6 flex items-center gap-2 text-disabled-text">
            <Clock className="w-4 h-4" />
            <p className="text-sm">
              Price trend charts will be available in Week 8 with real market
              data.
            </p>
          </div>
        </div>
      </div>

      {/* Competitor Price Table Placeholder */}
      <div className="bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <BarChart3
              className="w-4 h-4 text-accent-gold"
              strokeWidth={1.5}
            />
            <h2 className="text-lg font-semibold text-primary-text">
              Competitor Pricing
            </h2>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle">
                {[
                  "Platform",
                  "Listing",
                  "Price",
                  "Trend",
                  "Last Updated",
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-text"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {/* Placeholder rows */}
              {[
                {
                  platform: "Chrono24",
                  listing: "Rolex Submariner 126610LN",
                  price: "€14,250",
                  trend: "up",
                  updated: "2 hours ago",
                },
                {
                  platform: "eBay",
                  listing: "Rolex Submariner 126610LN",
                  price: "€13,800",
                  trend: "down",
                  updated: "4 hours ago",
                },
                {
                  platform: "Watchfinder",
                  listing: "Rolex Submariner 126610LN",
                  price: "€14,500",
                  trend: "stable",
                  updated: "1 day ago",
                },
                {
                  platform: "Chrono24",
                  listing: "Omega Speedmaster 310.30.42",
                  price: "€6,950",
                  trend: "up",
                  updated: "3 hours ago",
                },
                {
                  platform: "eBay",
                  listing: "Omega Speedmaster 310.30.42",
                  price: "€6,400",
                  trend: "down",
                  updated: "6 hours ago",
                },
              ].map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-surface-elevated/50 transition-colors duration-150 opacity-50"
                >
                  <td className="px-6 py-4 text-sm text-primary-text">
                    {row.platform}
                  </td>
                  <td className="px-6 py-4 text-sm text-primary-text font-medium">
                    {row.listing}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-primary-text">
                    {row.price}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        row.trend === "up"
                          ? "bg-semantic-success/10 text-semantic-success"
                          : row.trend === "down"
                            ? "bg-semantic-error/10 text-semantic-error"
                            : "bg-border-subtle text-secondary-text"
                      }`}
                    >
                      {row.trend === "up" && (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      {row.trend === "down" && (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {row.trend === "stable" && <Minus className="w-3 h-3" />}
                      {row.trend}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-disabled-text">
                    {row.updated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Placeholder notice */}
        <div className="px-6 py-4 border-t border-border-subtle">
          <div className="flex items-center gap-2 text-disabled-text">
            <Clock className="w-4 h-4" />
            <p className="text-xs">
              Sample data shown. Live competitor pricing will be available in
              Week 8 with web scraping integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
