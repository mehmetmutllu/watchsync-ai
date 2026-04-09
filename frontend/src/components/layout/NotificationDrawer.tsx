'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Bell, CheckCheck, AlertCircle, CheckCircle, Clock, Info, Check } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import type { NotificationType } from '@/types';

const TYPE_CONFIG: Record<NotificationType, { icon: typeof CheckCircle; color: string; bg: string }> = {
  success: { icon: CheckCircle, color: 'text-semantic-success', bg: 'bg-semantic-success/10' },
  error:   { icon: AlertCircle, color: 'text-semantic-error', bg: 'bg-semantic-error/10' },
  info:    { icon: Info, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
  warning: { icon: Clock, color: 'text-semantic-warning', bg: 'bg-semantic-warning/10' },
};

export default function NotificationDrawer() {
  const { notifications, unreadCount, isDrawerOpen, isLoading, closeDrawer, markAllRead, markRead } =
    useNotificationStore();
  const drawerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeDrawer();
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDrawerOpen, closeDrawer]);

  // ESC tuşu
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };

    if (isDrawerOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => document.removeEventListener('keydown', handleEsc);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} sa önce`;
    return `${days} gün önce`;
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-label="Bildirimler"
        aria-modal="true"
        className="fixed top-0 right-0 z-50 h-full w-96 max-w-[90vw] bg-surface border-l border-border-subtle shadow-2xl flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-primary-text" strokeWidth={1.5} />
            <h2 className="text-lg font-semibold text-primary-text">Bildirimler</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-semantic-error text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-secondary-text hover:text-primary-text rounded-md hover:bg-surface-elevated transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tümünü oku
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="p-1.5 rounded-md text-secondary-text hover:text-primary-text hover:bg-surface-elevated transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-elevated" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-surface-elevated rounded w-3/4" />
                    <div className="h-3 bg-surface-elevated rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center px-6">
              <Bell className="w-10 h-10 text-disabled-text mb-3" strokeWidth={1} />
              <p className="text-secondary-text text-sm">Henüz bildirim yok</p>
              <p className="text-disabled-text text-xs mt-1">
                Senkronizasyon olayları burada görünecek
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={`px-5 py-4 hover:bg-surface-elevated/50 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-accent-blue/5' : ''
                    }`}
                    onClick={() => {
                      if (notification.watch_id) {
                        router.push(`/dashboard/inventory?watch=${notification.watch_id}`);
                        closeDrawer();
                      }
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${notification.read ? 'text-secondary-text' : 'text-primary-text'}`}>
                            {notification.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markRead(notification.id);
                                }}
                                className="p-0.5 rounded text-disabled-text hover:text-accent-blue transition-colors"
                                title="Okundu işaretle"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-accent-blue mt-0.5" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-secondary-text mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-disabled-text mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
