"use client";

import { useState, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2,
  RefreshCw,
  Bell,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  getMarketPrices,
  getCompetitorListings,
  scanMarket,
  getPriceAlerts,
  createPriceAlert,
  deletePriceAlert,
  type PriceStats,
  type CompetitorListing,
  type PriceAlert,
  type CreatePriceAlertParams,
} from "@/lib/market-api";

type Period = "7d" | "30d" | "90d" | "6m" | "1y";

export default function MarketScannerPage() {
  const [searchRef, setSearchRef] = useState("");
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [listings, setListings] = useState<CompetitorListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Price alerts state
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState<"below" | "above">("below");

  const handleSearch = useCallback(async (ref?: string, p?: Period) => {
    const reference = ref ?? searchRef;
    const selectedPeriod = p ?? period;
    if (!reference.trim()) return;

    setIsLoading(true);
    setError(null);
    setActiveRef(reference.trim());

    try {
      const [stats, competitorListings, userAlerts] = await Promise.all([
        getMarketPrices(reference.trim(), selectedPeriod),
        getCompetitorListings(reference.trim()),
        getPriceAlerts().catch(() => []),
      ]);

      setPriceStats(stats);
      setListings(competitorListings);
      setAlerts(Array.isArray(userAlerts) ? userAlerts.filter((a: PriceAlert) => a.reference_number === reference.trim()) : []);
    } catch {
      setError("Pazar verileri yüklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  }, [searchRef, period]);

  const handleScan = async () => {
    if (!activeRef) return;
    setIsScanning(true);
    try {
      await scanMarket(activeRef);
      await handleSearch(activeRef);
    } catch {
      setError("Pazar taraması başarısız oldu.");
    } finally {
      setIsScanning(false);
    }
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (activeRef) handleSearch(activeRef, p);
  };

  const handleCreateAlert = async () => {
    if (!activeRef || !alertPrice) return;
    try {
      const params: CreatePriceAlertParams = {
        reference_number: activeRef,
        target_price: parseFloat(alertPrice),
        direction: alertDirection,
      };
      const alert = await createPriceAlert(params);
      setAlerts((prev) => [...prev, alert]);
      setShowAlertForm(false);
      setAlertPrice("");
    } catch {
      setError("Fiyat uyarısı oluşturulamadı.");
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await deletePriceAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Fiyat uyarısı silinemedi.");
    }
  };

  const formatPrice = (price: number | null, currency = "EUR") => {
    if (price === null) return "\u2014";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(price);
  };

  const TrendBadge = ({ trend }: { trend: string }) => {
    const config = {
      up: { icon: ArrowUpRight, cls: "bg-semantic-success/10 text-semantic-success", label: "Yükseliş" },
      down: { icon: ArrowDownRight, cls: "bg-semantic-error/10 text-semantic-error", label: "Düşüş" },
      stable: { icon: Minus, cls: "bg-border-subtle text-secondary-text", label: "Sabit" },
      unknown: { icon: Minus, cls: "bg-border-subtle text-secondary-text", label: "Bilinmiyor" },
    }[trend] ?? { icon: Minus, cls: "bg-border-subtle text-secondary-text", label: trend };

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.cls}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-text">Market Scanner</h1>
        <p className="mt-1 text-sm text-secondary-text">
          Referans numarasına göre fiyat trendlerini ve rakip fiyatlarını takip edin.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Referans numarası girin (ör. 126610LN, 310.30.42.50.01.001)"
            className="w-full pl-10 pr-4 py-2.5 bg-surface-base border border-border-subtle rounded-lg text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={isLoading || !searchRef.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Ara
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-semantic-error/10 border border-semantic-error/20 text-semantic-error text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {activeRef && priceStats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">Ortalama Fiyat</p>
              <p className="mt-2 text-2xl font-bold text-primary-text">{formatPrice(priceStats.avg_price)}</p>
              <TrendBadge trend={priceStats.trend} />
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">En Düşük</p>
              <p className="mt-2 text-2xl font-bold text-semantic-success">{formatPrice(priceStats.min_price)}</p>
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">En Yüksek</p>
              <p className="mt-2 text-2xl font-bold text-semantic-error">{formatPrice(priceStats.max_price)}</p>
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">Toplam İlan</p>
              <p className="mt-2 text-2xl font-bold text-primary-text">{priceStats.count}</p>
            </div>
          </div>

          {/* Price Trend Chart */}
          <div className="glass rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-blue" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-primary-text">Fiyat Trendi</h2>
              </div>
              <div className="flex items-center gap-2">
                {(["7d", "30d", "90d", "6m", "1y"] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handlePeriodChange(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      period === p
                        ? "bg-accent-blue/10 text-accent-blue"
                        : "text-secondary-text hover:text-primary-text hover:bg-surface-elevated"
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="ml-2 p-1.5 rounded-md text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
                  title="Yeni tarama başlat"
                >
                  <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Simple bar chart from time_series */}
            <div className="px-6 py-6">
              {priceStats.time_series.length > 0 ? (
                <div className="space-y-3">
                  {priceStats.time_series.slice(-14).map((point) => {
                    const maxVal = priceStats.max_price || 1;
                    const width = ((point.avg_price / maxVal) * 100).toFixed(1);
                    return (
                      <div key={point.date} className="flex items-center gap-3">
                        <span className="w-20 text-xs text-secondary-text font-mono shrink-0">{point.date.slice(5)}</span>
                        <div className="flex-1 h-6 bg-surface-elevated rounded overflow-hidden">
                          <div
                            className="h-full bg-accent-blue/60 rounded flex items-center justify-end pr-2"
                            style={{ width: `${width}%` }}
                          >
                            <span className="text-xs text-white font-medium whitespace-nowrap">
                              {formatPrice(point.avg_price)}
                            </span>
                          </div>
                        </div>
                        <span className="w-8 text-xs text-secondary-text text-right">{point.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-secondary-text py-8">
                  Bu dönem için fiyat verisi bulunamadı. Yeni tarama yapın.
                </p>
              )}
            </div>
          </div>

          {/* Competitor Listings Table */}
          <div className="glass rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-gold" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-primary-text">Rakip İlanları</h2>
              </div>
              <span className="text-xs text-secondary-text">{listings.length} ilan</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {["Platform", "Fiyat", "Durum", "Satıcı", "Ülke", "Tarih", ""].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-text">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {listings.map((listing, i) => (
                    <tr key={i} className="hover:bg-surface-elevated/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-primary-text capitalize">{listing.platform}</td>
                      <td className="px-6 py-3 text-sm font-mono font-medium text-primary-text">
                        {formatPrice(listing.price, listing.currency)}
                      </td>
                      <td className="px-6 py-3 text-xs text-secondary-text capitalize">{listing.condition || "\u2014"}</td>
                      <td className="px-6 py-3 text-sm text-primary-text">{listing.seller_name || "\u2014"}</td>
                      <td className="px-6 py-3 text-sm text-secondary-text">{listing.seller_country || "\u2014"}</td>
                      <td className="px-6 py-3 text-xs text-secondary-text">
                        {new Date(listing.updated_at).toLocaleDateString("tr-TR")}
                      </td>
                      <td className="px-6 py-3">
                        {listing.source_url && (
                          <a
                            href={listing.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent-blue hover:text-accent-blue-hover"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {listings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-secondary-text">
                        Rakip ilanı bulunamadı. Yenile butonuyla tarama başlatın.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Alerts */}
          <div className="glass rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent-blue" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-primary-text">Fiyat Uyarıları</h2>
              </div>
              <button
                onClick={() => setShowAlertForm(!showAlertForm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Uyarı Ekle
              </button>
            </div>

            {/* Alert Form */}
            {showAlertForm && (
              <div className="px-6 py-4 border-b border-border-subtle bg-surface-elevated/30">
                <div className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-secondary-text mb-1">Hedef Fiyat (EUR)</label>
                    <input
                      type="number"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      placeholder="12000"
                      className="w-full px-3 py-2 bg-surface-base border border-border-subtle rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-text mb-1">Yön</label>
                    <select
                      value={alertDirection}
                      onChange={(e) => setAlertDirection(e.target.value as "below" | "above")}
                      className="px-3 py-2 bg-surface-base border border-border-subtle rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue"
                    >
                      <option value="below">Altına düşünce</option>
                      <option value="above">Üstüne çıkınca</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateAlert}
                    disabled={!alertPrice}
                    className="px-4 py-2 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors disabled:opacity-50"
                  >
                    Oluştur
                  </button>
                </div>
              </div>
            )}

            {/* Alerts List */}
            <div className="px-6 py-4">
              {alerts.length > 0 ? (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/50">
                      <div className="flex items-center gap-3">
                        <Bell className={`w-4 h-4 ${alert.is_active ? "text-accent-blue" : "text-secondary-text"}`} />
                        <div>
                          <p className="text-sm text-primary-text">
                            Fiyat{" "}
                            <span className="font-medium">{formatPrice(alert.target_price)}</span>{" "}
                            {alert.direction === "below" ? "altına düşünce" : "üstüne çıkınca"} bildir
                          </p>
                          <p className="text-xs text-secondary-text">{alert.reference_number}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-1.5 rounded text-secondary-text hover:text-semantic-error hover:bg-semantic-error/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary-text text-center py-4">
                  Bu referans için fiyat uyarısı yok.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state when no search has been done */}
      {!activeRef && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-accent-blue" />
          </div>
          <h3 className="text-lg font-semibold text-primary-text">Pazar Tarayıcı</h3>
          <p className="mt-2 text-sm text-secondary-text max-w-md">
            Bir saat referans numarası girerek Chrono24 ve Watchfinder fiyat verilerini görüntüleyin, trendleri analiz edin ve fiyat uyarıları oluşturun.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {["126610LN", "310.30.42.50.01.001", "5711/1A-010"].map((ref) => (
              <button
                key={ref}
                onClick={() => { setSearchRef(ref); handleSearch(ref); }}
                className="px-3 py-1.5 text-xs font-mono text-accent-blue bg-accent-blue/10 rounded-full hover:bg-accent-blue/20 transition-colors"
              >
                {ref}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
