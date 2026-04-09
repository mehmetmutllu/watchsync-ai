"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import type { RecentActivity } from "@/types";

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle2,
    dot: "bg-semantic-success",
    badge: "bg-semantic-success/10 text-semantic-success",
    label: "Synced ✓",
  },
  failed: {
    icon: XCircle,
    dot: "bg-semantic-error",
    badge: "bg-semantic-error/10 text-semantic-error",
    label: "Error ✗",
  },
  pending: {
    icon: Clock,
    dot: "bg-semantic-warning",
    badge: "bg-semantic-warning/10 text-semantic-warning",
    label: "Pending ⏳",
  },
} as const;

const POLL_INTERVAL = 10_000; // 10 saniye

export default function ActivityFeed() {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [newIds, setNewIds] = useState<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestTimestampRef = useRef<string | null>(null);

  const fetchActivities = useCallback(async (since?: string) => {
    try {
      const params: Record<string, string> = { limit: "20" };
      if (since) params.since = since;

      const { data } = await api.get("/dashboard/activities", { params });
      return data.activities as RecentActivity[];
    } catch {
      return [];
    }
  }, []);

  // İlk yükleme
  useEffect(() => {
    const loadInitial = async () => {
      const data = await fetchActivities();
      setActivities(data);
      if (data.length > 0 && data[0].timestamp) {
        latestTimestampRef.current = data[0].timestamp;
      }
      setLoading(false);
    };

    loadInitial();
  }, [fetchActivities]);

  // Polling — pause when tab is hidden
  useEffect(() => {
    const poll = async () => {
      if (document.hidden) return;

      setPolling(true);
      const newActivities = await fetchActivities(
        latestTimestampRef.current ?? undefined
      );

      if (newActivities.length > 0) {
        const freshIds = new Set(newActivities.map((a) => a.id));
        setNewIds(freshIds);

        setActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const unique = newActivities.filter((a) => !existingIds.has(a.id));
          const merged = [...unique, ...prev].slice(0, 50);
          return merged;
        });

        if (newActivities[0].timestamp) {
          latestTimestampRef.current = newActivities[0].timestamp;
        }

        // Animasyon sonrası new flag'i kaldır
        setTimeout(() => setNewIds(new Set()), 1500);
      }

      setPolling(false);
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchActivities]);

  if (loading) {
    return (
      <div className="bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl shadow-[var(--shadow-card)]">
        <div className="px-6 py-4 border-b border-border-subtle">
          <div className="h-5 w-32 bg-surface-elevated rounded animate-pulse" />
        </div>
        <div className="divide-y divide-border-subtle">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-2 h-2 rounded-full bg-surface-elevated animate-pulse" />
              <div className="flex-1 h-4 bg-surface-elevated rounded animate-pulse" />
              <div className="w-16 h-5 bg-surface-elevated rounded-full animate-pulse" />
              <div className="w-20 h-3 bg-surface-elevated rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface/50 backdrop-blur-sm border border-border-subtle rounded-xl shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-blue" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-primary-text">
            Activity Feed
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {polling && (
            <RefreshCw className="w-3.5 h-3.5 text-secondary-text animate-spin" />
          )}
          <span className="text-xs text-disabled-text">Live</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-semantic-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-semantic-success" />
          </span>
        </div>
      </div>

      {/* Activity List */}
      {activities.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Activity
            className="w-10 h-10 text-disabled-text mx-auto mb-3"
            strokeWidth={1}
          />
          <p className="text-sm text-secondary-text">
            Henüz bir aktivite yok. Envanter ekleyip platformlara senkronize
            etmeye başlayın.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle max-h-[400px] overflow-y-auto">
          {activities.map((activity) => {
            const config = STATUS_CONFIG[activity.status];
            const isNew = newIds.has(activity.id);

            return (
              <div
                key={activity.id}
                className={`
                  flex items-center gap-4 px-6 py-3.5
                  hover:bg-surface-elevated/50 transition-all duration-300
                  ${isNew ? "animate-slide-up bg-accent-blue/5" : ""}
                `}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`}
                />
                <p className="flex-1 text-sm text-primary-text truncate">
                  {activity.message}
                </p>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${config.badge}`}
                >
                  {config.label}
                </span>
                <span className="text-xs text-disabled-text whitespace-nowrap min-w-[70px] text-right">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
