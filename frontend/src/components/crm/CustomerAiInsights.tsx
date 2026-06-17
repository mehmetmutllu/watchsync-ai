"use client";

import React, { useState, useEffect } from "react";
import { Customer } from "@/lib/crm-api";
import api from "@/lib/api";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CustomerAiInsightsProps {
  customer: Customer;
  language?: string;
}

export function CustomerAiInsights({ customer, language = "de" }: CustomerAiInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSentiment = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      // You could cache this in customer metadata to avoid repeated calls, 
      // but for now we fetch it live or provide an explicit refresh button.
      const { data } = await api.post(`/customers/${customer.id}/sentiment`, { language });
      setSentiment(data.data.sentiment);
    } catch (err: any) {
      setError(err.response?.data?.message || "Fehler bei der KI-Analyse.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch once when component mounts
  useEffect(() => {
    fetchSentiment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-fuchsia-500/10 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group shadow-lg">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 opacity-70" />
      
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-primary-text flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          KI-Stimmungsanalyse
        </h3>
        <button 
          onClick={() => fetchSentiment(true)} 
          disabled={loading}
          className="p-1.5 rounded-lg bg-surface hover:bg-background border border-border-subtle transition-all disabled:opacity-50"
          title="Neu analysieren"
        >
          <RefreshCw className={`w-4 h-4 text-secondary-text ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="min-h-[80px] flex items-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center w-full py-4 space-y-2">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-secondary-text animate-pulse">KI analysiert Notizen...</p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-red-400 text-sm py-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : sentiment ? (
          <p className="text-sm text-primary-text leading-relaxed font-medium">
            {sentiment}
          </p>
        ) : (
          <p className="text-sm text-secondary-text italic py-2">
            Konnte keine Insights generieren. Fügen Sie Notizen hinzu, um die Analyse zu verbessern.
          </p>
        )}
      </div>
    </div>
  );
}
