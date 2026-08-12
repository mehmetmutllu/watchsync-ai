"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import AuthGuard from "@/components/auth/AuthGuard";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PageTransition from "@/components/ui/PageTransition";
import OnboardingTour from "@/components/ui/OnboardingTour";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Masaüstü daraltma ve mobil drawer ayrı durumlar: aynı state'i paylaşırlarsa
  // mobilde varsayılan "açık" olur ve içeriği tamamen kapatır (blocker).
  const t = useTranslations("Common");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-transparent">
        <Sidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onToggle={toggleSidebar}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main content area */}
        <div
          className={`
            flex flex-col min-h-screen
            transition-all duration-200 ease-in-out
            ${sidebarCollapsed ? "md:ms-sidebar-collapsed" : "md:ms-sidebar"}
          `}
        >
          <TopBar
            onMenuToggle={() => setMobileOpen((prev) => !prev)}
            sidebarCollapsed={sidebarCollapsed}
          />

          <main id="main-content" role="main" aria-label={t("page_content")} className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
            <div className="max-w-content mx-auto">
              <ErrorBoundary>
                <PageTransition>{children}</PageTransition>
              </ErrorBoundary>
            </div>
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <BottomNav />
      </div>
      <OnboardingTour />
    </AuthGuard>
  );
}
