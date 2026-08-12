"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import api from "@/lib/api";
import { Check, ShieldAlert, CreditCard, Sparkles, AlertCircle, ArrowUpRight, Loader2, Calendar } from "lucide-react";
import { useToastStore, toast } from "@/stores/toastStore";

interface PlanTier {
  name: string;
  price_eur: number;
  watch_limit: number;
  features: string[];
}

interface SubscriptionData {
  subscription: {
    plan_type: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    has_stripe_customer: boolean;
  };
  plans: Record<string, PlanTier>;
  commission_rules: {
    default_rate_percent: number;
    max_cap_eur: number;
    direct_link_percent: number;
  };
}

export default function BillingPage() {
  const t = useTranslations("Billing");
  const tc = useTranslations("Common");
  const format = useFormatter();
  const eur = (v: number) =>
    format.number(v, { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSubscriptionData = async () => {
    try {
      const res = await api.get("/subscriptions/current");
      setData(res.data);
    } catch {
      toast.error(tc("error"), t("load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleCheckout = async (planKey: string) => {
    setActionLoading(`checkout_${planKey}`);
    try {
      const res = await api.post("/subscriptions/checkout-session", { plan: planKey });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(tc("error"), err.response?.data?.message || t("checkout_error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm(t("cancel_confirm"))) {
      return;
    }
    setActionLoading("cancel");
    try {
      const res = await api.post("/subscriptions/cancel");
      toast.info(tc("info"), res.data.message || t("cancel_received"));
      await fetchSubscriptionData();
    } catch (err: any) {
      toast.error(tc("error"), err.response?.data?.message || t("cancel_error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    setActionLoading("resume");
    try {
      const res = await api.post("/subscriptions/resume");
      toast.success(tc("success"), res.data.message || t("resume_success"));
      await fetchSubscriptionData();
    } catch (err: any) {
      toast.error(tc("error"), err.response?.data?.message || t("resume_error"));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePortal = async () => {
    setActionLoading("portal");
    try {
      const res = await api.post("/subscriptions/portal");
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(tc("error"), err.response?.data?.message || t("portal_error"));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-accent-blue" />
      </div>
    );
  }

  const sub = data?.subscription;
  const plans = data?.plans;
  const currentPlanKey = sub?.plan_type || "starter";
  const isCanceledAtPeriodEnd = sub?.cancel_at_period_end;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-text">{t("title")}</h1>
        <p className="mt-1 text-sm text-secondary-text">
          {t("subtitle")}
        </p>
      </div>

      {/* Current Subscription Status Card */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-secondary-text uppercase tracking-wider">{t("current_plan")}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-blue/15 text-accent-blue uppercase tracking-wide">
                {t("plan_badge", { plan: currentPlanKey.toUpperCase() })}
              </span>
              {isCanceledAtPeriodEnd ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {t("ends_at_period_end")}
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
                  {t("status_active")}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-primary-text">
              {t("plan_line", {
                name: plans?.[currentPlanKey]?.name || "Starter",
                price: eur(plans?.[currentPlanKey]?.price_eur ?? 79),
              })}
            </h2>
            {sub?.current_period_end && (
              <p className="text-sm text-secondary-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-disabled-text" />
                {t("period_end", { date: format.dateTime(new Date(sub.current_period_end), "short") })}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {sub?.has_stripe_customer && (
              <button
                onClick={handlePortal}
                disabled={actionLoading === "portal"}
                className="px-4 py-2.5 rounded-lg border border-border-subtle hover:bg-surface-elevated text-sm font-medium text-primary-text flex items-center gap-2 transition-colors"
              >
                {actionLoading === "portal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 text-accent-blue" />}
                {t("manage_billing")}
              </button>
            )}

            {isCanceledAtPeriodEnd ? (
              <button
                onClick={handleResume}
                disabled={actionLoading === "resume"}
                className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                {actionLoading === "resume" ? <Loader2 className="w-4 h-4 animate-spin" /> : t("resume")}
              </button>
            ) : (
              <button
                onClick={handleCancel}
                disabled={actionLoading === "cancel"}
                className="px-4 py-2.5 rounded-lg border border-semantic-error/30 text-semantic-error hover:bg-semantic-error/10 text-sm font-medium flex items-center gap-2 transition-colors"
              >
                {actionLoading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : t("cancel")}
              </button>
            )}
          </div>
        </div>

        {/* Cancellation Notice Banner */}
        {isCanceledAtPeriodEnd && (
          <div className="mt-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-amber-300">{t("cancel_banner_title")}</strong>
              {t("cancel_banner_body", {
                date: sub?.current_period_end
                  ? format.dateTime(new Date(sub.current_period_end), "short")
                  : t("period_end_fallback"),
              })}
            </div>
          </div>
        )}
      </div>

      {/* Plan Tier Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-primary-text flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> {t("plans_heading")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(plans || {}).map(([key, plan]) => {
            const isCurrent = key === currentPlanKey;
            const isPro = key === "pro";

            return (
              <div
                key={key}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all border ${
                  isPro
                    ? "border-amber-500/50 bg-surface-elevated shadow-xl shadow-amber-500/5"
                    : "border-border-subtle bg-surface"
                }`}
              >
                {isPro && (
                  <span className="absolute -top-3 end-6 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-black uppercase tracking-wider">
                    {t("most_popular")}
                  </span>
                )}

                <div>
                  <h4 className="text-lg font-bold text-primary-text">{plan.name}</h4>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-primary-text">{eur(plan.price_eur)}</span>
                    <span className="text-sm text-secondary-text">{t("per_month")}</span>
                  </div>
                  <p className="mt-2 text-xs text-secondary-text">
                    {plan.watch_limit === 5000
                      ? t("watch_limit_unlimited")
                      : t("watch_limit", { count: plan.watch_limit })}
                  </p>

                  <ul className="mt-6 space-y-3 border-t border-border-subtle pt-6 text-sm text-secondary-text">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-border-subtle">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full h-11 rounded-xl bg-surface-elevated text-secondary-text font-semibold text-sm cursor-default border border-border-subtle"
                    >
                      {t("current_package")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckout(key)}
                      disabled={actionLoading === `checkout_${key}`}
                      className={`w-full h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        isPro
                          ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                          : "bg-accent-blue text-white hover:bg-accent-blue-hover shadow-lg shadow-accent-blue/20"
                      }`}
                    >
                      {actionLoading === `checkout_${key}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          {t("choose_plan")} <ArrowUpRight className="w-4 h-4 rtl-flip" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commission Rules & Court-Proof Disclosure Card */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-6 space-y-4">
        <h3 className="text-base font-bold text-primary-text flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-accent-blue" />
          {t("commission_heading")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle">
            <span className="text-xs text-secondary-text font-mono">{t("commission_marketplace")}</span>
            <p className="text-lg font-bold text-primary-text mt-1">
              {format.number((data?.commission_rules?.default_rate_percent ?? 3) / 100, { style: "percent", maximumFractionDigits: 1 })}
            </p>
            <p className="text-xs text-disabled-text mt-1">{t("commission_marketplace_desc")}</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated border border-amber-500/20">
            <span className="text-xs text-amber-400 font-mono font-semibold">{t("commission_cap")}</span>
            <p className="text-lg font-bold text-amber-300 mt-1">
              {t("commission_cap_value", { amount: eur(data?.commission_rules?.max_cap_eur ?? 150) })}
            </p>
            <p className="text-xs text-amber-200/70 mt-1">{t("commission_cap_desc")}</p>
          </div>

          <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle">
            <span className="text-xs text-secondary-text font-mono">{t("commission_direct")}</span>
            <p className="text-lg font-bold text-primary-text mt-1">
              {format.number((data?.commission_rules?.direct_link_percent ?? 1.5) / 100, { style: "percent", maximumFractionDigits: 1 })}
            </p>
            <p className="text-xs text-disabled-text mt-1">{t("commission_direct_desc")}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-4 text-xs text-secondary-text">
          <p>
            {t("legal_before")}{" "}
            <Link href="/agb" className="text-accent-blue hover:underline font-semibold">
              {tc("terms_link")}
            </Link>{" "}
            {t("legal_after")}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/agb" className="hover:underline text-primary-text">{tc("terms_link")}</Link>
            <span>•</span>
            <Link href="/impressum" className="hover:underline text-primary-text">{tc("imprint_link")}</Link>
            <span>•</span>
            <Link href="/datenschutz" className="hover:underline text-primary-text">{tc("privacy_link")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
