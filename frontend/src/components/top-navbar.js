"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Languages,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/theme-toggle";
import { useLanguage } from "@/contexts/language-context";

export default function TopNavbar({
  sidebarCollapsed,
  onToggleCollapse,
  onToggleMobileMenu,
  showSidebarControls = true,
  showMobileMenu = true,
  showLogout = true,
}) {
  const router = useRouter();
  const { text, language, setLanguage } = useLanguage();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="top-navbar">
      <div className="top-navbar-left">
        <span className="top-navbar-brand">{text.sidebar.appName}</span>

        {showMobileMenu && (
          <button
            type="button"
            className="btn btn-secondary btn-sm top-navbar-mobile-menu"
            onClick={onToggleMobileMenu}
            aria-label={text.navbar.toggleMenu}
            title={text.navbar.toggleMenu}
          >
            <Menu size={15} />
            <span>{text.navbar.menu}</span>
          </button>
        )}

        {showSidebarControls && (
          <button
            type="button"
            className="btn btn-secondary btn-sm top-navbar-collapse"
            onClick={onToggleCollapse}
            aria-label={
              sidebarCollapsed
                ? text.navbar.expandSidebar
                : text.navbar.collapseSidebar
            }
            title={
              sidebarCollapsed
                ? text.navbar.expandSidebar
                : text.navbar.collapseSidebar
            }
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={15} />
            ) : (
              <PanelLeftClose size={15} />
            )}
            <span>
              {sidebarCollapsed
                ? text.navbar.expandShort
                : text.navbar.collapseShort}
            </span>
          </button>
        )}
      </div>

      <div className="top-navbar-right">
        <ThemeToggle />

        <div
          className="language-switch"
          role="group"
          aria-label={text.navbar.switchLanguage}
          title={text.navbar.switchLanguage}
        >
          <Languages size={13} className="language-switch-icon" />
          <button
            type="button"
            className={`language-switch-btn ${language === "id" ? "active" : ""}`}
            onClick={() => setLanguage("id")}
            aria-pressed={language === "id"}
          >
            ID
          </button>
          <button
            type="button"
            className={`language-switch-btn ${language === "en" ? "active" : ""}`}
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
          >
            EN
          </button>
        </div>

        {showLogout && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleLogout}
            disabled={signingOut}
          >
            {signingOut ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogOut size={14} />
            )}
            <span>
              {signingOut
                ? text.sidebar.actions.signingOut
                : text.sidebar.actions.logout}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
