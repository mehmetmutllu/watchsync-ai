"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Watch,
  BarChart3,
  MessageSquare,
  FileText,
  Settings,
  UserCog,
} from "lucide-react";
import { useAdminAuthStore } from "@/stores/adminAuth";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/managers", label: "Yöneticiler", icon: UserCog, permission: "admin.users.view" },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
  { href: "/admin/watches", label: "Saat Doğrulama", icon: Watch },
  { href: "/admin/reports", label: "Raporlar", icon: BarChart3 },
  { href: "/admin/feedbacks", label: "Geri Bildirimler", icon: MessageSquare },
  { href: "/admin/contracts", label: "Sözleşmeler", icon: FileText },
  { href: "/admin/settings", label: "Sistem Ayarları", icon: Settings, permission: "admin.settings.manage" },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { logout, adminRole, hasPermission } = useAdminAuthStore();

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          !collapsed ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onToggle}
      />

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Admin menü"
        className={`
          fixed top-0 left-0 z-50 h-full
          glass-strong
          flex flex-col
          transition-all duration-200 ease-in-out
          ${collapsed ? "w-sidebar-collapsed" : "w-sidebar"}
          max-md:${collapsed ? "-translate-x-full" : "translate-x-0"}
        `}
      >
        {/* Logo Area */}
        <div className="flex items-center h-16 px-5 border-b border-border-subtle">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-semantic-error/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-semantic-error" strokeWidth={1.5} />
            </div>
            <span
              className={`
                text-lg font-bold tracking-tight text-primary-text whitespace-nowrap
                transition-all duration-200
                ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
              `}
            >
              Admin
              <span className="text-semantic-error"> Panel</span>
            </span>
          </div>
        </div>

        {/* Role badge */}
        {!collapsed && adminRole && (
          <div className="px-5 py-2 border-b border-border-subtle">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-blue/10 text-accent-blue">
              <Shield className="w-3 h-3" />
              {adminRole.name}
            </span>
          </div>
        )}

        {/* Navigation */}
        <nav aria-label="Admin navigasyon" className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive =
              item.href === "/admin/dashboard"
                ? pathname === "/admin/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-150
                  ${
                    isActive
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "text-secondary-text hover:bg-surface-elevated hover:text-primary-text"
                  }
                `}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-accent-blue"
                  />
                )}
                <Icon
                  className={`flex-shrink-0 w-5 h-5 transition-colors duration-150 ${
                    isActive
                      ? "text-accent-blue"
                      : "text-secondary-text group-hover:text-primary-text"
                  }`}
                  strokeWidth={1.5}
                />
                <span
                  className={`
                    text-sm font-medium whitespace-nowrap
                    transition-all duration-200
                    ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}
                  `}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed state */}
                {collapsed && hoveredItem === item.href && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-surface-elevated text-primary-text text-sm font-medium shadow-[var(--shadow-elevated)] whitespace-nowrap z-50 animate-fade-in">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout + Collapse */}
        <div className="p-3 border-t border-border-subtle space-y-1">
          <button
            onClick={() => {
              logout();
              window.location.href = "/admin/login";
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-secondary-text hover:text-semantic-error hover:bg-semantic-error/10
              transition-all duration-150"
          >
            <LogOut className="flex-shrink-0 w-5 h-5" strokeWidth={1.5} />
            <span
              className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              }`}
            >
              Çıkış Yap
            </span>
          </button>

          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-secondary-text hover:text-primary-text hover:bg-surface-elevated
              transition-all duration-150"
            aria-label={collapsed ? "Genişlet" : "Daralt"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-medium">Daralt</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
