"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  CheckCircle2,
  AlertTriangle,
  Wifi,
} from "lucide-react";
import {
  getMarketPrices,
  getCompetitorListings,
  scanMarket,
  getWatchChartsTrend,
  getPriceAlerts,
  createPriceAlert,
  deletePriceAlert,
  testEbayConnection,
  type PriceStats,
  type CompetitorListing,
  type PriceAlert,
  type WatchChartsTrend,
  type CreatePriceAlertParams,
  type EbayTestResult,
} from "@/lib/market-api";

type Period = "7d" | "30d" | "90d" | "6m" | "1y" | "3y";
type WatchChartsPeriod = "6m" | "1y" | "3y";

export default function MarketScannerPage() {
  const t = useTranslations("MarketScanner");

  const [searchRef, setSearchRef] = useState("");
  const [activeRef, setActiveRef] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [priceStats, setPriceStats] = useState<PriceStats | null>(null);
  const [listings, setListings] = useState<CompetitorListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eBay API status
  const [ebayStatus, setEbayStatus] = useState<EbayTestResult | null>(null);
  const [ebayStatusLoading, setEbayStatusLoading] = useState(false);

  // Price alerts state
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertPrice, setAlertPrice] = useState("");
  const [alertDirection, setAlertDirection] = useState<"below" | "above">("below");

  // WatchCharts trend state
  const [wcTrend, setWcTrend] = useState<WatchChartsTrend | null>(null);
  const [wcPeriod, setWcPeriod] = useState<WatchChartsPeriod>("1y");
  const [wcLoading, setWcLoading] = useState(false);

  // Check eBay API status on mount
  const checkEbayStatus = useCallback(async () => {
    setEbayStatusLoading(true);
    try {
      const result = await testEbayConnection();
      setEbayStatus(result);
    } catch {
      setEbayStatus({ status: 'connection_error', message: t('connection_error'), environment: 'unknown' });
    } finally {
      setEbayStatusLoading(false);
    }
  }, [t]);

  useEffect(() => {
    checkEbayStatus();
  }, [checkEbayStatus]);

  const fetchWcTrend = useCallback(async (ref: string, p: WatchChartsPeriod) => {
    setWcLoading(true);
    try {
      const trend = await getWatchChartsTrend(ref, p);
      setWcTrend(trend);
    } catch {
      setWcTrend(null);
    } finally {
      setWcLoading(false);
    }
  }, []);

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

      // Also fetch WatchCharts trend (non-blocking)
      fetchWcTrend(reference.trim(), wcPeriod);
    } catch {
      setError(t("error_loading"));
    } finally {
      setIsLoading(false);
    }
  }, [searchRef, period, fetchWcTrend, wcPeriod, t]);

  const handleScan = async () => {
    if (!activeRef) return;
    setIsScanning(true);
    try {
      await scanMarket(activeRef);
      await handleSearch(activeRef);
    } catch {
      setError(t("error_scanning"));
    } finally {
      setIsScanning(false);
    }
  };

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    if (activeRef) handleSearch(activeRef, p);
  };

  const handleWcPeriodChange = (p: WatchChartsPeriod) => {
    setWcPeriod(p);
    if (activeRef) fetchWcTrend(activeRef, p);
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
      setError(t("error_create_alert"));
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await deletePriceAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError(t("error_delete_alert"));
    }
  };

  const formatPrice = (price: number | null, currency = "EUR") => {
    if (price === null) return "\u2014";
    return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(price);
  };

  const TrendBadge = ({ trend }: { trend: string }) => {
    const config = {
      up: { icon: ArrowUpRight, cls: "bg-semantic-success/10 text-semantic-success", label: t("trend_up") },
      down: { icon: ArrowDownRight, cls: "bg-semantic-error/10 text-semantic-error", label: t("trend_down") },
      stable: { icon: Minus, cls: "bg-border-subtle text-secondary-text", label: t("trend_stable") },
      unknown: { icon: Minus, cls: "bg-border-subtle text-secondary-text", label: t("trend_unknown") },
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
        <h1 className="text-3xl font-bold text-primary-text">{t("title")}</h1>
        <p className="mt-1 text-sm text-secondary-text">
          {t("desc")}
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={t("search_placeholder")}
            className="w-full ps-10 pe-4 py-2.5 bg-surface border border-border-subtle rounded-lg text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent-blue transition-colors"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={isLoading || !searchRef.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {t("search_btn")}
        </button>
      </div>

      {/* eBay API Status Banner */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="w-4 h-4 text-secondary-text" />
            <span className="text-sm font-medium text-primary-text">{t("data_sources")}</span>
          </div>
          <button
            onClick={checkEbayStatus}
            disabled={ebayStatusLoading}
            className="text-xs text-secondary-text hover:text-primary-text transition-colors"
          >
            {ebayStatusLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("refresh")}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          {/* eBay */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated text-xs">
            {ebayStatusLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-secondary-text" />
            ) : ebayStatus?.status === 'ok' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success" />
            ) : ebayStatus?.status === 'not_configured' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-semantic-warning" />
            ) : (
              // Kullanıcı henüz arama yapmadan kırmızı "hata" alarmı vermek yerine
              // veri kaynağının hazır olmadığını nötr tonda bildir.
              <AlertTriangle className="w-3.5 h-3.5 text-secondary-text" />
            )}
            <span className="text-primary-text font-medium">{t("ebay_browse_api")}</span>
            <span className="text-secondary-text">
              {ebayStatus?.status === 'ok'
                ? `(${ebayStatus.environment})`
                : ebayStatus?.status === 'not_configured'
                  ? t("not_configured")
                  : ebayStatus?.status === 'auth_failed'
                    ? t("auth_failed")
                    : ebayStatus ? t("connection_error") : ''}
            </span>
          </div>
          {/* Show total results if available */}
          {ebayStatus?.status === 'ok' && ebayStatus.total_results !== undefined && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-semantic-success/10 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-semantic-success" />
              <span className="text-primary-text">
                {t("test_results", { ref: ebayStatus.test_reference ?? "", count: ebayStatus.total_results })}
              </span>
            </div>
          )}
          {/* Sample items */}
          {ebayStatus?.status === 'ok' && ebayStatus.sample_items && ebayStatus.sample_items.length > 0 && !activeRef && (
            <div className="w-full mt-2 p-3 rounded-lg bg-surface-elevated/50 space-y-1.5">
              <p className="text-xs text-secondary-text font-medium">{t("sample_results", { ref: ebayStatus.test_reference ?? "" })}:</p>
              {ebayStatus.sample_items.slice(0, 3).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-primary-text truncate max-w-xs">{item.title}</span>
                  <span className="font-mono text-secondary-text shrink-0 ms-2">{item.price}</span>
                </div>
              ))}
            </div>
          )}
        </div>
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
              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("avg_price")}</p>
              <p className="mt-2 text-2xl font-bold text-primary-text">{formatPrice(priceStats.avg_price)}</p>
              <TrendBadge trend={priceStats.trend} />
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("min_price")}</p>
              <p className="mt-2 text-2xl font-bold text-semantic-success">{formatPrice(priceStats.min_price)}</p>
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("max_price")}</p>
              <p className="mt-2 text-2xl font-bold text-semantic-error">{formatPrice(priceStats.max_price)}</p>
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-xs text-secondary-text font-medium uppercase tracking-wider">{t("total_listings")}</p>
              <p className="mt-2 text-2xl font-bold text-primary-text">{priceStats.count}</p>
            </div>
          </div>

          {/* WatchCharts Fair Market Value */}
          {wcTrend && wcTrend.fair_market_value > 0 && (
            <div className="glass rounded-xl p-5 border border-accent-gold/30 bg-accent-gold/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary-text font-medium uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-accent-gold" />
                    {t("fair_market_value")}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-primary-text">
                    {formatPrice(wcTrend.fair_market_value, wcTrend.currency)}
                  </p>
                  <p className="mt-1 text-sm text-secondary-text">
                    {t("fair_market_desc", { price: formatPrice(wcTrend.fair_market_value, wcTrend.currency) })}
                  </p>
                </div>
                <div className="text-end">
                  <TrendBadge trend={wcTrend.trend} />
                  {wcTrend.price_change_pct !== 0 && (
                    <p className={`mt-1 text-sm font-medium ${wcTrend.price_change_pct > 0 ? "text-semantic-success" : "text-semantic-error"}`}>
                      {wcTrend.price_change_pct > 0 ? "+" : ""}
                      {wcTrend.price_change_pct.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Price Trend Chart */}
          <div className="glass rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-blue" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-primary-text">{t("price_trend")}</h2>
              </div>
              <div className="flex items-center gap-2">
                {(["7d", "30d", "90d", "6m", "1y", "3y"] as Period[]).map((p) => (
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
                  className="ms-2 p-1.5 rounded-md text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
                  title={t("start_new_scan")}
                  aria-label={t("start_new_scan")}
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
                            className="h-full bg-accent-blue/60 rounded flex items-center justify-end pe-2"
                            style={{ width: `${width}%` }}
                          >
                            <span className="text-xs text-white font-medium whitespace-nowrap">
                              {formatPrice(point.avg_price)}
                            </span>
                          </div>
                        </div>
                        <span className="w-8 text-xs text-secondary-text text-end">{point.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-secondary-text py-8">
                  {t("no_data_period")}
                </p>
              )}
            </div>
          </div>

          {/* WatchCharts Trend Graph */}
          <div className="glass rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent-gold" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-primary-text">{t("watchcharts_trend")}</h2>
                <span className="text-xs text-secondary-text bg-accent-gold/10 px-2 py-0.5 rounded-full">{t("premium_badge")}</span>
              </div>
              <div className="flex items-center gap-2">
                {(["6m", "1y", "3y"] as WatchChartsPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleWcPeriodChange(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      wcPeriod === p
                        ? "bg-accent-gold/10 text-accent-gold"
                        : "text-secondary-text hover:text-primary-text hover:bg-surface-elevated"
                    }`}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 py-6">
              {wcLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-accent-gold" />
                  <span className="ms-2 text-sm text-secondary-text">{t("watchcharts_loading")}</span>
                </div>
              ) : wcTrend && wcTrend.data_points.length > 0 ? (
                <div className="space-y-3">
                  {wcTrend.data_points.slice(-14).map((point) => {
                    const maxVal = Math.max(...wcTrend.data_points.map((dp) => dp.price), 1);
                    const width = ((point.price / maxVal) * 100).toFixed(1);
                    return (
                      <div key={point.date} className="flex items-center gap-3">
                        <span className="w-20 text-xs text-secondary-text font-mono shrink-0">{point.date.slice(0, 7)}</span>
                        <div className="flex-1 h-6 bg-surface-elevated rounded overflow-hidden">
                          <div
                            className="h-full bg-accent-gold/60 rounded flex items-center justify-end pe-2"
                            style={{ width: `${width}%` }}
                          >
                            <span className="text-xs text-white font-medium whitespace-nowrap">
                              {formatPrice(point.price, wcTrend.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-secondary-text text-end mt-2">
                    {t("source_updated", { date: new Date(wcTrend.updated_at).toLocaleDateString() })}
                  </p>
                </div>
              ) : (
                <p className="text-center text-sm text-secondary-text py-8">
                  {t("watchcharts_no_data")}
                </p>
              )}
            </div>
          </div>

          {/* Competitor Listings Table */}
          <div className="glass rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-gold" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-primary-text">{t("competitor_listings")}</h2>
              </div>
              <span className="text-xs text-secondary-text">{t("listings_count", { count: listings.length })}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border-subtle">
                    {[t("th_platform"), t("th_price"), t("th_condition"), t("th_seller"), t("th_country"), t("th_date"), ""].map((h, i) => (
                      <th key={i} className="px-6 py-3 text-start text-xs font-medium uppercase tracking-wider text-secondary-text">
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
                        {new Date(listing.updated_at).toLocaleDateString()}
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
                        {t("no_listings_found")}
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
                <h2 className="text-lg font-semibold text-primary-text">{t("price_alerts")}</h2>
              </div>
              <button
                onClick={() => setShowAlertForm(!showAlertForm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("add_alert")}
              </button>
            </div>

            {/* Alert Form */}
            {showAlertForm && (
              <div className="px-6 py-4 border-b border-border-subtle bg-surface-elevated/30">
                <div className="flex flex-col sm:flex-row items-end gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-xs text-secondary-text mb-1">{t("target_price")}</label>
                    <input
                      type="number"
                      value={alertPrice}
                      onChange={(e) => setAlertPrice(e.target.value)}
                      placeholder="12000"
                      className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-secondary-text mb-1">{t("direction")}</label>
                    <select
                      value={alertDirection}
                      onChange={(e) => setAlertDirection(e.target.value as "below" | "above")}
                      className="px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-primary-text focus:outline-none focus:border-accent-blue"
                    >
                      <option value="below">{t("below")}</option>
                      <option value="above">{t("above")}</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateAlert}
                    disabled={!alertPrice}
                    className="px-4 py-2 bg-accent-blue text-white text-sm font-medium rounded-lg hover:bg-accent-blue-hover transition-colors disabled:opacity-50"
                  >
                    {t("create")}
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
                            {alert.direction === "below" 
                              ? t("alert_below", { price: formatPrice(alert.target_price) })
                              : t("alert_above", { price: formatPrice(alert.target_price) })}
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
                  {t("no_alerts")}
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
          <h3 className="text-lg font-semibold text-primary-text">{t("empty_state_title")}</h3>
          <p className="mt-2 text-sm text-secondary-text max-w-md">
            {t("empty_state_desc")}
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
