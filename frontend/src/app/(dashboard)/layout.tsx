"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import AuthGuard from "@/components/auth/AuthGuard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-midnight">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

        {/* Main content area */}
        <div
          className={`
            flex flex-col min-h-screen
            transition-all duration-200 ease-in-out
            ${sidebarCollapsed ? "md:ml-sidebar-collapsed" : "md:ml-sidebar"}
          `}
        >
          <TopBar
            onMenuToggle={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
          />

          <main id="main-content" role="main" aria-label="Sayfa içeriği" className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-content mx-auto animate-fade-in">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
