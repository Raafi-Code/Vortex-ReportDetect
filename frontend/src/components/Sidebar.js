"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Hash,
  Forward,
  Settings,
  Wifi,
  WifiOff,
  Loader2,
  X,
} from "lucide-react";
import { getStatus } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";

const navItems = [
  { key: "overview", type: "section" },
  { href: "/", key: "dashboard", icon: LayoutDashboard },
  { href: "/inbox", key: "inbox", icon: Inbox, showBadge: true },
  { key: "manage", type: "section" },
  { href: "/groups", key: "groups", icon: Users },
  { href: "/keywords", key: "keywords", icon: Hash },
  { href: "/forwarding", key: "forwarding", icon: Forward },
  { key: "system", type: "section" },
  { href: "/settings", key: "settings", icon: Settings },
];

export default function Sidebar({
  isOpen = false,
  onClose = () => {},
  collapsed = false,
}) {
  const pathname = usePathname();
  const { text } = useLanguage();
  const [status, setStatus] = useState("disconnected");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await getStatus();
        setStatus(res.data?.status || "disconnected");
      } catch {
        setStatus("disconnected");
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusIcon = {
    open: <Wifi size={14} />,
    connecting: <Loader2 size={14} className="animate-spin" />,
    disconnected: <WifiOff size={14} />,
  };

  const statusText = text.sidebar.status;

  return (
    <aside
      className={`sidebar ${isOpen ? "open" : ""} ${collapsed ? "collapsed" : ""}`}
    >
      <div className="sidebar-header">
        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label={text.sidebar.actions.closeNavigation}
        >
          <X size={16} />
        </button>
        <Link href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Image
              src="/bnitabbar.png"
              alt="ATM Report"
              width={32}
              height={32}
              className="sidebar-logo-image"
              priority
            />
          </div>
          <div className="sidebar-logo-text">
            <h1>{text.sidebar.appName}</h1>
            <span>{text.sidebar.appSubtitle}</span>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.type === "section") {
            return (
              <div key={i} className="nav-section-label">
                {text.sidebar.sections[item.key]}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = pathname === item.href;
          const itemLabel = text.sidebar.nav[item.key];

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`nav-link ${isActive ? "active" : ""}`}
              title={itemLabel}
            >
              <Icon size={18} />
              <span className="nav-link-label">{itemLabel}</span>
              {item.showBadge && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="connection-status">
          <span
            className={`status-dot ${status === "open" ? "connected" : status === "connecting" ? "connecting" : ""}`}
          />
          {statusIcon[status]}
          <span className="connection-status-text">
            {statusText[status] || statusText.unknown}
          </span>
        </div>
      </div>
    </aside>
  );
}
