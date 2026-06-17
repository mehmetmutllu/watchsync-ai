"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Sparkles,
  BarChart3,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("BottomNav");

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/inventory", label: t("inventory"), icon: Package },
    { href: "/dashboard/ai-studio", label: t("ai_studio"), icon: Sparkles },
    { href: "/dashboard/market-scanner", label: t("market"), icon: BarChart3 },
    { href: "/dashboard/settings", label: t("settings"), icon: Settings },
  ];

  return (
    <nav
      aria-label={t("mobile_nav")}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border-subtle"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`
                flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg
                transition-colors duration-150
                ${
                  isActive
                    ? "text-accent-blue"
                    : "text-secondary-text active:text-primary-text"
                }
              `}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-accent-blue" : ""}`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent-blue" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
