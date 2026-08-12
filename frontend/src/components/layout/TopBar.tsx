"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Menu, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notificationStore";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { GlobalSearch } from "./GlobalSearch";
import NotificationDrawer from "./NotificationDrawer";
import LanguageSwitcher from "./LanguageSwitcher";

interface TopBarProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function TopBar({ onMenuToggle, sidebarCollapsed }: TopBarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const toggleDrawer = useNotificationStore((s) => s.toggleDrawer);
  const router = useRouter();
  const t = useTranslations("TopBar");

  // Bildirimleri periyodik olarak çek (30 saniyede bir)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header
      role="banner"
      aria-label={t("top_bar")}
      className={`
        sticky top-0 z-30 h-16
        glass
        flex items-center justify-between
        px-6
        transition-all duration-200
      `}
    >
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg
            text-secondary-text hover:text-primary-text hover:bg-surface-elevated
            transition-colors duration-150"
          aria-label={t("toggle_menu")}
        >
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* Search */}
        <GlobalSearch />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Language Switcher — her sayfadan erişilebilir */}
        <LanguageSwitcher variant="compact" />

        {/* Notification Bell */}
        <button
          data-tour="notifications"
          onClick={toggleDrawer}
          className="relative flex items-center justify-center w-11 h-11 rounded-lg
            text-secondary-text hover:text-primary-text hover:bg-surface-elevated
            transition-colors duration-150"
          aria-label={t("notifications")}
        >
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-semantic-error text-white text-[10px] font-bold leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Drawer */}
        <NotificationDrawer />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-11 h-11 rounded-lg
            text-secondary-text hover:text-semantic-error hover:bg-surface-elevated
            transition-colors duration-150"
          aria-label={t("logout")}
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
        </button>

        {/* User Avatar */}
        <div
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-accent-blue">
              {initials}
            </span>
          </div>
          <div className="hidden lg:block text-start">
            <p className="text-sm font-medium text-primary-text leading-none">
              {user?.name || t("user_fallback")}
            </p>
            <p className="text-xs text-secondary-text mt-0.5 capitalize">
              {user?.role || "—"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
