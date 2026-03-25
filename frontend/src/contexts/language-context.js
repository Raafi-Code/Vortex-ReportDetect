"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const dictionaries = {
  id: {
    languageName: "Indonesia",
    navbar: {
      menu: "Menu",
      toggleMenu: "Buka atau tutup menu",
      collapseSidebar: "Minimize sidebar",
      expandSidebar: "Perbesar sidebar",
      collapseShort: "Minimize",
      expandShort: "Perbesar",
      switchLanguage: "Ganti bahasa",
      toggleTheme: "Ganti tema",
      themeDark: "Gelap",
      themeLight: "Terang",
    },
    sidebar: {
      appName: "Vortex - ReportDetect",
      appSubtitle: "Report Monitoring",
      sections: {
        overview: "RINGKASAN",
        manage: "KELOLA",
        system: "SISTEM",
      },
      nav: {
        dashboard: "Dashboard",
        inbox: "Inbox",
        reports: "Laporan",
        groups: "Groups",
        keywords: "Keywords",
        forwarding: "Forwarding",
        settings: "Settings",
      },
      status: {
        open: "Terhubung",
        connecting: "Menghubungkan...",
        disconnected: "Terputus",
        unknown: "Tidak diketahui",
      },
      actions: {
        logout: "Logout",
        signingOut: "Keluar...",
        closeNavigation: "Tutup navigasi",
        collapseSidebar: "Minimize sidebar",
        expandSidebar: "Perbesar sidebar",
      },
      languageButton: "EN",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Ringkasan aktivitas Vortex - ReportDetect",
      stats: {
        totalMessages: "Total Pesan",
        unreadMessages: "Belum Dibaca",
        forwardedMessages: "Telah Diteruskan",
        todayMessages: "Pesan Hari Ini",
      },
      info: {
        activeGroups: "Grup Aktif",
        activeKeywords: "Keyword Aktif",
        mediaMessages: "Pesan + Media",
        systemInfo: "Informasi Sistem",
        mediaRetention: "Retensi Media",
        cleanup: "Cleanup",
        dailyCleanup: "Setiap hari 00:00 WIB",
        days30: "30 hari",
      },
      filter: "Filter:",
      periods: {
        week: "Minggu",
        month: "Bulan",
        year: "Tahun",
        custom: "Kustom",
      },
    },
    footer: {
      copyright: "© 2026 BLH BMS",
      developedBy: "Developed by",
    },
  },
  en: {
    languageName: "English",
    navbar: {
      menu: "Menu",
      toggleMenu: "Open or close menu",
      collapseSidebar: "Minimize sidebar",
      expandSidebar: "Expand sidebar",
      collapseShort: "Minimize",
      expandShort: "Expand",
      switchLanguage: "Switch language",
      toggleTheme: "Toggle theme",
      themeDark: "Dark",
      themeLight: "Light",
    },
    sidebar: {
      appName: "Vortex - ReportDetect",
      appSubtitle: "Report Monitoring",
      sections: {
        overview: "OVERVIEW",
        manage: "MANAGE",
        system: "SYSTEM",
      },
      nav: {
        dashboard: "Dashboard",
        inbox: "Inbox",
        reports: "Reports",
        groups: "Groups",
        keywords: "Keywords",
        forwarding: "Forwarding",
        settings: "Settings",
      },
      status: {
        open: "Connected",
        connecting: "Connecting...",
        disconnected: "Disconnected",
        unknown: "Unknown",
      },
      actions: {
        logout: "Logout",
        signingOut: "Signing out...",
        closeNavigation: "Close navigation",
        collapseSidebar: "Minimize sidebar",
        expandSidebar: "Expand sidebar",
      },
      languageButton: "EN",
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Vortex - ReportDetect activity summary",
      stats: {
        totalMessages: "Total Messages",
        unreadMessages: "Unread",
        forwardedMessages: "Forwarded",
        todayMessages: "Today Messages",
      },
      info: {
        activeGroups: "Active Groups",
        activeKeywords: "Active Keywords",
        mediaMessages: "Messages + Media",
        systemInfo: "System Information",
        mediaRetention: "Media Retention",
        cleanup: "Cleanup",
        dailyCleanup: "Every day at 00:00 WIB",
        days30: "30 days",
      },
      filter: "Filter:",
      periods: {
        week: "Week",
        month: "Month",
        year: "Year",
        custom: "Custom",
      },
    },
    footer: {
      copyright: "© 2026 BLH BMS",
      developedBy: "Developed by",
    },
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("id");

  useEffect(() => {
    const saved = window.localStorage.getItem("ui-language");
    if (saved === "id" || saved === "en") {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("ui-language", language);
  }, [language]);

  const value = useMemo(() => {
    const toggleLanguage = () =>
      setLanguage((prev) => (prev === "id" ? "en" : "id"));

    return {
      language,
      setLanguage,
      toggleLanguage,
      text: dictionaries[language] || dictionaries.id,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
