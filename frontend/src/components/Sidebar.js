'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { getStatus } from '@/lib/api';

const navItems = [
  { label: 'OVERVIEW', type: 'section' },
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox, showBadge: true },
  { label: 'MANAGE', type: 'section' },
  { href: '/groups', label: 'Groups', icon: Users },
  { href: '/keywords', label: 'Keywords', icon: Hash },
  { href: '/forwarding', label: 'Forwarding', icon: Forward },
  { label: 'SYSTEM', type: 'section' },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [status, setStatus] = useState('disconnected');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await getStatus();
        setStatus(res.data?.status || 'disconnected');
      } catch {
        setStatus('disconnected');
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

  const statusText = {
    open: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">📡</div>
          <div className="sidebar-logo-text">
            <h1>ReportDetect</h1>
            <span>WhatsApp Monitor</span>
          </div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.type === 'section') {
            return (
              <div key={i} className="nav-section-label">
                {item.label}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {item.label}
              {item.showBadge && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="connection-status">
          <span className={`status-dot ${status === 'open' ? 'connected' : status === 'connecting' ? 'connecting' : ''}`} />
          {statusIcon[status]}
          <span>{statusText[status] || 'Unknown'}</span>
        </div>
      </div>
    </aside>
  );
}
