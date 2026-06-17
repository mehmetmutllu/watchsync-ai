"use client";

import { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-midnight">
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

        {/* Main content area */}
        <div
          className={`
            flex flex-col min-h-screen
            transition-all duration-200 ease-in-out
            ${sidebarCollapsed ? "md:ml-sidebar-collapsed" : "md:ml-sidebar"}
          `}
        >
          {/* Simple Top Bar */}
          <header className="sticky top-0 z-30 h-16 glass-strong border-b border-border-subtle flex items-center justify-between px-6">
            <button
              onClick={toggleSidebar}
              className="md:hidden text-secondary-text hover:text-primary-text"
              aria-label="Menüyü aç/kapat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="text-sm text-secondary-text">
              Admin Panel
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-content mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
