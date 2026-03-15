'use client';

import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Loader2,
  QrCode,
  Trash2,
  RefreshCw,
  Database,
  HardDrive,
  Clock,
  Power,
} from 'lucide-react';
import { getStatus, disconnectWA, triggerCleanup, getConfig, setConfig } from '@/lib/api';

export default function SettingsPage() {
  const [status, setStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);
  const [config, setConfigState] = useState({});
  const [loading, setLoading] = useState(true);
  const [cleaningUp, setCleaningUp] = useState(false);

  async function fetchData() {
    try {
      const [statusRes, configRes] = await Promise.all([
        getStatus(),
        getConfig(),
      ]);
      setStatus(statusRes.data?.status || 'disconnected');
      setQrCode(statusRes.data?.qrCode || null);
      setConfigState(configRes.data || {});
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // Poll for status updates (especially for QR code)
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async () => {
    if (!confirm('Apakah Anda yakin ingin memutus koneksi WhatsApp?')) return;
    try {
      await disconnectWA();
      setStatus('disconnected');
      setQrCode(null);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      alert('Gagal memutus koneksi: ' + err.message);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Jalankan cleanup media sekarang? File media > 30 hari akan dihapus.')) return;
    setCleaningUp(true);
    try {
      await triggerCleanup();
      alert('Cleanup selesai!');
    } catch (err) {
      console.error('Cleanup failed:', err);
      alert('Cleanup gagal: ' + err.message);
    } finally {
      setCleaningUp(false);
    }
  };

  const handleUpdateConfig = async (key, value) => {
    try {
      await setConfig(key, value);
      setConfigState((prev) => ({ ...prev, [key]: value }));
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };

  const statusConfig = {
    open: {
      icon: <Wifi size={24} />,
      label: 'Terhubung',
      color: 'var(--accent)',
      tagClass: 'tag-emerald',
    },
    connecting: {
      icon: <Loader2 size={24} className="animate-spin" />,
      label: 'Menghubungkan...',
      color: 'var(--accent-orange)',
      tagClass: 'tag-orange',
    },
    disconnected: {
      icon: <WifiOff size={24} />,
      label: 'Terputus',
      color: 'var(--accent-red)',
      tagClass: 'tag-red',
    },
  };

  const currentStatus = statusConfig[status] || statusConfig.disconnected;

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2>Settings</h2>
        <p>Pengaturan koneksi WhatsApp dan sistem</p>
      </div>

      {/* Connection Status */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <QrCode size={18} /> Status Koneksi WhatsApp
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentStatus.color,
              background: status === 'open' ? 'var(--accent-dim)' : status === 'connecting' ? 'var(--accent-orange-dim)' : 'var(--accent-red-dim)',
            }}
          >
            {currentStatus.icon}
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '18px' }}>{currentStatus.label}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {status === 'open'
                ? 'WhatsApp terhubung dan siap menerima pesan'
                : status === 'connecting'
                ? 'Menunggu scan QR Code...'
                : 'Silakan hubungkan WhatsApp terlebih dahulu'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className={`tag ${currentStatus.tagClass}`}>{currentStatus.label}</span>
          </div>
        </div>

        {/* QR Code Display */}
        {qrCode && status !== 'open' && (
          <div className="qr-container" style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            marginBottom: '16px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Scan QR Code dengan WhatsApp
            </div>
            <img
              src={qrCode}
              alt="WhatsApp QR Code"
              style={{ width: '280px', height: '280px', borderRadius: 'var(--radius-md)' }}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '350px' }}>
              Buka WhatsApp → Menu → Perangkat Tertaut → Tautkan Perangkat → Scan QR di atas
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} /> Refresh Status
          </button>
          {status === 'open' && (
            <button className="btn btn-danger btn-sm" onClick={handleDisconnect}>
              <Power size={14} /> Putus Koneksi
            </button>
          )}
        </div>
      </div>

      {/* Media Cleanup */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={18} /> Media Storage
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            padding: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Clock size={16} style={{ color: 'var(--accent-orange)' }} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Retensi Media</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>
              {config.media_retention_days || '30'} hari
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Media lebih lama otomatis dihapus
            </div>
          </div>
          <div style={{
            padding: '16px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={16} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontSize: '13px', fontWeight: '600' }}>Jadwal Cleanup</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800' }}>00:00</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Cron berjalan setiap hari WIB
            </div>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={handleCleanup}
          disabled={cleaningUp}
        >
          {cleaningUp ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Membersihkan...
            </>
          ) : (
            <>
              <Trash2 size={14} /> Jalankan Cleanup Sekarang
            </>
          )}
        </button>
      </div>

      {/* API Info */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SettingsIcon size={18} /> Informasi API
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Backend URL</span>
            <code style={{
              fontSize: '12px',
              color: 'var(--accent)',
              background: 'var(--accent-dim)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
            }}>
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
            </code>
          </div>
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '600' }}>Supabase URL</span>
            <code style={{
              fontSize: '12px',
              color: 'var(--accent-blue)',
              background: 'var(--accent-blue-dim)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
            }}>
              {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
