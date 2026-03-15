'use client';

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Forward,
  Users,
  Hash,
  Mail,
  Image as ImageIcon,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { getMessageStats } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await getMessageStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Pesan',
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      color: 'emerald',
    },
    {
      label: 'Belum Dibaca',
      value: stats?.unreadMessages || 0,
      icon: Mail,
      color: 'blue',
    },
    {
      label: 'Telah Diteruskan',
      value: stats?.forwardedMessages || 0,
      icon: Forward,
      color: 'purple',
    },
    {
      label: 'Pesan Hari Ini',
      value: stats?.todayMessages || 0,
      icon: TrendingUp,
      color: 'orange',
    },
  ];

  const infoCards = [
    {
      label: 'Grup Aktif',
      value: stats?.activeGroups || 0,
      icon: Users,
      color: 'emerald',
    },
    {
      label: 'Keyword Aktif',
      value: stats?.activeKeywords || 0,
      icon: Hash,
      color: 'blue',
    },
    {
      label: 'Pesan + Media',
      value: stats?.mediaMessages || 0,
      icon: ImageIcon,
      color: 'purple',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Ringkasan aktivitas WhatsApp Report Detect</p>
      </div>

      {/* Main Stats */}
      <div className="card-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`card stat-card ${card.color}`}>
              <div className={`stat-icon ${card.color}`}>
                <Icon size={22} />
              </div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {infoCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`card stat-card ${card.color}`}>
              <div className={`stat-icon ${card.color}`}>
                <Icon size={20} />
              </div>
              <div className="stat-value" style={{ fontSize: '24px' }}>
                {card.value}
              </div>
              <div className="stat-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Info */}
      <div className="card" style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Clock size={18} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>Informasi Sistem</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Retensi Media:</span> 30 hari
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Cleanup:</span> Setiap hari 00:00 WIB
          </div>
        </div>
      </div>
    </div>
  );
}
