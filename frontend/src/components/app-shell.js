"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import TopNavbar from "@/components/top-navbar";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAuthPage = useMemo(
    () =>
      pathname === "/login" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password",
    [pathname],
  );

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const saved = window.localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  if (isAuthPage) {
    return (
      <div className="auth-shell">
        <main className="main-content auth-main">
          <div className="main-body">{children}</div>
          <Footer />
        </main>
      </div>
    );
  }

  return (
    <div
      className={`app-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
      />

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="main-content animate-fade-in">
        <TopNavbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onToggleMobileMenu={() => setSidebarOpen((prev) => !prev)}
        />
        <div className="main-body">{children}</div>
        <Footer />
      </main>
    </div>
  );
}
