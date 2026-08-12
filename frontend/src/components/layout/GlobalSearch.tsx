"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, Clock, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { watchesApi } from "@/lib/watches-api";
import { getCustomers } from "@/lib/crm-api";
import type { Watch } from "@/types";
import type { Customer } from "@/lib/crm-api";
import Image from "next/image";

export function GlobalSearch() {
  const t = useTranslations("TopBar");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [watchResults, setWatchResults] = useState<Watch[]>([]);
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setWatchResults([]);
      setCustomerResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [watchesRes, customersRes] = await Promise.all([
          watchesApi.list({ search: query, per_page: 5 }),
          getCustomers({ search: query, limit: 5 })
        ]);
        setWatchResults(watchesRes.data || []);
        // API might return { data: Customer[] } or Customer[] depending on pagination
        const customersData = customersRes.data || customersRes;
        setCustomerResults(Array.isArray(customersData) ? customersData : []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const showDropdown = isFocused && query.length >= 2;

  const handleSelectWatch = (id: number) => {
    setQuery("");
    setIsFocused(false);
    router.push(`/dashboard/inventory/${id}`);
  };

  const handleSelectCustomer = (id: number) => {
    setQuery("");
    setIsFocused(false);
    // There is no dedicated customer page yet? CRM detail is a modal in the CRM page.
    // Wait, the detail modal in CRM page is opened by a URL query maybe? 
    // Usually it's better to navigate to /dashboard/crm?customer=id
    router.push(`/dashboard/crm?customer=${id}`);
  };

  return (
    <div className="relative hidden sm:block" ref={wrapperRef}>
      <Search
        className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text"
        strokeWidth={1.5}
      />
      <input
        type="search"
        role="searchbox"
        aria-label={t("search_aria")}
        placeholder={t("search_placeholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        className="w-64 lg:w-80 h-9 ps-10 pe-4 rounded-lg
          bg-black/20 text-sm text-primary-text placeholder-disabled-text
          border border-white/10
          focus:border-accent-blue focus:shadow-[var(--shadow-focus)]
          transition-all duration-150
          outline-none"
      />

      {showDropdown && (
        <div className="absolute top-full mt-2 w-full lg:w-96 glass-strong border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-secondary-text">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : watchResults.length === 0 && customerResults.length === 0 ? (
            <div className="p-4 text-sm text-secondary-text text-center">
              Keine Ergebnisse gefunden.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {watchResults.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-secondary-text uppercase tracking-wider bg-white/5">
                    Uhren & SKUs
                  </div>
                  {watchResults.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleSelectWatch(w.id)}
                      className="w-full text-start px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      {w.thumbnail_url || w.primary_image_url ? (
                        <Image src={(w.thumbnail_url || w.primary_image_url) as string} alt={w.model} width={32} height={32} className="rounded object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-black/20 border border-white/10 flex items-center justify-center text-secondary-text">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary-text truncate">{w.brand} {w.model}</div>
                        <div className="text-xs text-secondary-text truncate">{w.reference_number || 'Keine Ref'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {customerResults.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-semibold text-secondary-text uppercase tracking-wider bg-white/5">
                    Kunden
                  </div>
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectCustomer(c.id)}
                      className="w-full text-start px-3 py-2 hover:bg-white/5 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center text-accent-blue font-medium text-xs">
                        {c.first_name[0]}{c.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary-text truncate">{c.first_name} {c.last_name}</div>
                        <div className="text-xs text-secondary-text truncate">{c.company || c.email || c.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
