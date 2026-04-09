"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Watch,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/market-scanner", label: "Market Scanner", icon: BarChart3 },
  { href: "/dashboard/crm", label: "CRM", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

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
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <Watch className="w-5 h-5 text-accent-blue" strokeWidth={1.5} />
            </div>
            <span
              className={`
                text-lg font-bold tracking-tight text-primary-text whitespace-nowrap
                transition-all duration-200
                ${collapsed ? "opacity-0 w-0" : "opacity-100 w-auto"}
              `}
            >
              WatchSync
              <span className="text-accent-blue"> AI</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-150
                  ${
                    isActive
                      ? "bg-accent-blue/10 text-accent-blue border-l-2 border-accent-blue"
                      : "text-secondary-text hover:bg-surface-elevated hover:text-primary-text"
                  }
                `}
              >
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

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-border-subtle">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
              text-secondary-text hover:text-primary-text hover:bg-surface-elevated
              transition-all duration-150"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
