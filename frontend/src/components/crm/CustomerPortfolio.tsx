"use client";

import React, { useState, useMemo } from "react";
import { Customer } from "@/lib/crm-api";
import api from "@/lib/api";
import { Plus, Trash2, Watch, TrendingUp, TrendingDown, Clock, Euro } from "lucide-react";
import { useTranslations } from "next-intl";

interface CustomerPortfolioProps {
  customer: Customer;
  onUpdate: (updatedCustomer: Customer) => void;
}

export function CustomerPortfolio({ customer, onUpdate }: CustomerPortfolioProps) {
  const t = useTranslations("CRM");
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newWatch, setNewWatch] = useState({
    brand: "",
    model: "",
    purchase_price: "",
    purchase_date: "",
    current_value: "",
  });

  const ownedWatches = customer.metadata?.owned_watches || [];

  const metrics = useMemo(() => {
    if (!Array.isArray(ownedWatches) || ownedWatches.length === 0) return { totalValue: 0, totalProfit: 0, profitPercentage: 0 };
    
    let totalValue = 0;
    let totalPurchase = 0;

    ownedWatches.forEach(w => {
      totalValue += Number(w.current_value) || 0;
      totalPurchase += Number(w.purchase_price) || 0;
    });

    const totalProfit = totalValue - totalPurchase;
    const profitPercentage = totalPurchase > 0 ? (totalProfit / totalPurchase) * 100 : 0;

    return { totalValue, totalProfit, profitPercentage };
  }, [ownedWatches]);

  const handleAddWatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedMetadata = { ...customer.metadata };
      const currentWatches = Array.isArray(updatedMetadata.owned_watches) ? updatedMetadata.owned_watches : [];
      
      // Calculate a dummy 8% yield if current_value is not provided
      const purchasePrice = Number(newWatch.purchase_price);
      let currentValue = Number(newWatch.current_value);
      if (!currentValue && purchasePrice > 0) {
        currentValue = purchasePrice * 1.08;
      }

      const watchEntry = {
        id: crypto.randomUUID(),
        brand: newWatch.brand,
        model: newWatch.model,
        purchase_price: purchasePrice,
        purchase_date: newWatch.purchase_date,
        current_value: currentValue,
      };

      updatedMetadata.owned_watches = [...currentWatches, watchEntry];

      const { data } = await api.put(`/customers/${customer.id}`, { metadata: updatedMetadata });
      onUpdate(data.data);
      
      setIsAdding(false);
      setNewWatch({ brand: "", model: "", purchase_price: "", purchase_date: "", current_value: "" });
    } catch (error) {
      console.error("Failed to add watch to portfolio", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWatch = async (watchId: string) => {
    if (!confirm("Uhr aus Portfolio entfernen?")) return;
    
    try {
      const updatedMetadata = { ...customer.metadata };
      if (!Array.isArray(updatedMetadata.owned_watches)) return;

      updatedMetadata.owned_watches = updatedMetadata.owned_watches.filter(w => w.id !== watchId);

      const { data } = await api.put(`/customers/${customer.id}`, { metadata: updatedMetadata });
      onUpdate(data.data);
    } catch (error) {
      console.error("Failed to delete watch from portfolio", error);
    }
  };

  // Helper for checking if service is due (5 years after purchase date)
  const isServiceDue = (purchaseDate: string) => {
    if (!purchaseDate) return false;
    const pDate = new Date(purchaseDate);
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    return pDate <= fiveYearsAgo;
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border-subtle p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent-blue/10 rounded-lg text-accent-blue">
              <Watch className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-secondary-text uppercase tracking-wider">Uhren im Portfolio</h3>
          </div>
          <p className="text-2xl font-bold text-primary-text">{Array.isArray(ownedWatches) ? ownedWatches.length : 0}</p>
        </div>

        <div className="bg-surface border border-border-subtle p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <Euro className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-secondary-text uppercase tracking-wider">Gesamtwert</h3>
          </div>
          <p className="text-2xl font-bold text-primary-text">
            {metrics.totalValue.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
          </p>
        </div>

        <div className="bg-surface border border-border-subtle p-4 rounded-xl shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${metrics.totalProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
              {metrics.totalProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
            <h3 className="text-sm font-semibold text-secondary-text uppercase tracking-wider">Rendite (Est.)</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl font-bold ${metrics.totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {metrics.totalProfit > 0 ? '+' : ''}{metrics.totalProfit.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
            </p>
            <span className={`text-sm font-medium ${metrics.totalProfit >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
              ({metrics.profitPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-border-subtle pb-3">
        <h3 className="text-lg font-bold text-primary-text">Portfolio Uhren</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-blue text-white rounded-lg text-sm font-semibold hover:bg-accent-blue/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Uhr hinzufügen
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddWatch} className="bg-background border border-border-subtle p-5 rounded-xl animate-fade-in shadow-sm space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-secondary-text mb-1 uppercase">Marke</label>
              <input required value={newWatch.brand} onChange={e => setNewWatch({ ...newWatch, brand: e.target.value })} className="w-full px-3 py-2 text-sm bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-accent-blue" placeholder="Rolex" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-secondary-text mb-1 uppercase">Modell</label>
              <input required value={newWatch.model} onChange={e => setNewWatch({ ...newWatch, model: e.target.value })} className="w-full px-3 py-2 text-sm bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-accent-blue" placeholder="Submariner" />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-secondary-text mb-1 uppercase">Kaufpreis (€)</label>
              <input required type="number" step="0.01" value={newWatch.purchase_price} onChange={e => setNewWatch({ ...newWatch, purchase_price: e.target.value })} className="w-full px-3 py-2 text-sm bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-accent-blue" />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-secondary-text mb-1 uppercase">Schätzwert (€)</label>
              <input type="number" step="0.01" placeholder="Optional" value={newWatch.current_value} onChange={e => setNewWatch({ ...newWatch, current_value: e.target.value })} className="w-full px-3 py-2 text-sm bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-accent-blue" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-semibold text-secondary-text mb-1 uppercase">Kaufdatum</label>
              <input required type="date" value={newWatch.purchase_date} onChange={e => setNewWatch({ ...newWatch, purchase_date: e.target.value })} className="w-full px-3 py-2 text-sm bg-surface border border-border-subtle rounded-lg focus:outline-none focus:border-accent-blue" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border-subtle">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-semibold border border-border-subtle rounded-lg hover:bg-surface">Abbrechen</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 disabled:opacity-50">Speichern</button>
          </div>
        </form>
      )}

      {Array.isArray(ownedWatches) && ownedWatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ownedWatches.map((watch) => {
            const isDue = isServiceDue(watch.purchase_date);
            const profit = (watch.current_value || 0) - watch.purchase_price;
            const isPositive = profit >= 0;

            return (
              <div key={watch.id} className="bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-3 group shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-primary-text">{watch.brand}</h4>
                    <p className="text-sm text-secondary-text">{watch.model}</p>
                  </div>
                  <button onClick={() => handleDeleteWatch(watch.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-secondary-text hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isDue && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5" /> Service-Intervall erreicht (5 Jahre)
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border-subtle">
                  <div>
                    <span className="text-xs text-secondary-text uppercase block">Kaufpreis</span>
                    <span className="font-medium text-primary-text text-sm">{Number(watch.purchase_price).toLocaleString("de-DE")} €</span>
                    <span className="text-[10px] text-secondary-text block mt-0.5">{new Date(watch.purchase_date).toLocaleDateString("de-DE")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-secondary-text uppercase block">Aktueller Wert</span>
                    <span className="font-semibold text-primary-text text-sm">{Number(watch.current_value).toLocaleString("de-DE")} €</span>
                    <span className={`text-xs font-medium flex items-center justify-end gap-1 mt-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{profit.toLocaleString("de-DE")} €
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-secondary-text bg-background/30 rounded-xl border border-dashed border-border-subtle">
          <Watch className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">Noch keine Uhren im Portfolio.</p>
        </div>
      )}
    </div>
  );
}
