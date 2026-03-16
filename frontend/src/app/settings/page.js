"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import Image from "next/image";
import { getStatus, disconnectWA, triggerCleanup, getConfig } from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";

export default function SettingsPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [status, setStatus] = useState("disconnected");
  const t = {
    title: isId ? "Settings" : "Settings",
    subtitle: isId
      ? "Pengaturan koneksi WhatsApp dan sistem"
      : "WhatsApp connection and system settings",
    connTitle: isId ? "Status Koneksi WhatsApp" : "WhatsApp Connection Status",
    connected: isId ? "Terhubung" : "Connected",
    connecting: isId ? "Menghubungkan..." : "Connecting...",
    disconnected: isId ? "Terputus" : "Disconnected",
    connReady: isId
      ? "WhatsApp terhubung dan siap menerima pesan"
      : "WhatsApp is connected and ready to receive messages",
    connWaiting: isId ? "Menunggu scan QR Code..." : "Waiting for QR scan...",
    connNeedLink: isId
      ? "Silakan hubungkan WhatsApp terlebih dahulu"
      : "Please connect WhatsApp first",
    qrInstructionTitle: isId
      ? "Scan QR Code dengan WhatsApp"
      : "Scan QR Code with WhatsApp",
    qrInstructionBody: isId
      ? "Buka WhatsApp -> Menu -> Perangkat Tertaut -> Tautkan Perangkat -> Scan QR di atas"
      : "Open WhatsApp -> Menu -> Linked Devices -> Link a Device -> Scan the QR above",
    refreshStatus: isId ? "Refresh Status" : "Refresh Status",
    disconnect: isId ? "Putus Koneksi" : "Disconnect",
    disconnectConfirm: isId
      ? "Apakah Anda yakin ingin memutus koneksi WhatsApp?"
      : "Are you sure you want to disconnect WhatsApp?",
    disconnectFailed: isId ? "Gagal memutus koneksi" : "Failed to disconnect",
    storageTitle: isId ? "Media Storage" : "Media Storage",
    retention: isId ? "Retensi Media" : "Media Retention",
    retentionHint: isId
      ? "Media lebih lama otomatis dihapus"
      : "Older media files are deleted automatically",
    day: isId ? "hari" : "days",
    cleanupSchedule: isId ? "Jadwal Cleanup" : "Cleanup Schedule",
    cleanupHint: isId
      ? "Cron berjalan setiap hari WIB"
      : "Cron runs daily (WIB)",
    cleanupRun: isId ? "Jalankan Cleanup Sekarang" : "Run Cleanup Now",
    cleaning: isId ? "Membersihkan..." : "Cleaning...",
    cleanupDone: isId ? "Cleanup selesai!" : "Cleanup completed!",
    cleanupFailed: isId ? "Cleanup gagal" : "Cleanup failed",
    cleanupConfirm: isId
      ? "Jalankan cleanup media sekarang? File media > 30 hari akan dihapus."
      : "Run media cleanup now? Media files older than 30 days will be deleted.",
    apiInfo: isId ? "Informasi API" : "API Information",
    backendUrl: isId ? "Backend URL" : "Backend URL",
    supabaseUrl: isId ? "Supabase URL" : "Supabase URL",
  };

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
      setStatus(statusRes.data?.status || "disconnected");
      setQrCode(statusRes.data?.qrCode || null);
      setConfigState(configRes.data || {});
    } catch (err) {
      console.error("Failed to fetch settings:", err);
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
    if (!confirm(t.disconnectConfirm)) return;
    try {
      await disconnectWA();
      setStatus("disconnected");
      setQrCode(null);
    } catch (err) {
      console.error("Failed to disconnect:", err);
      alert(`${t.disconnectFailed}: ${err.message}`);
    }
  };

  const handleCleanup = async () => {
    if (!confirm(t.cleanupConfirm)) return;
    setCleaningUp(true);
    try {
      await triggerCleanup();
      alert(t.cleanupDone);
    } catch (err) {
      console.error("Cleanup failed:", err);
      alert(`${t.cleanupFailed}: ${err.message}`);
    } finally {
      setCleaningUp(false);
    }
  };

  const statusConfig = {
    open: {
      icon: <Wifi size={24} />,
      label: t.connected,
      color: "var(--accent)",
      tagClass: "tag-emerald",
    },
    connecting: {
      icon: <Loader2 size={24} className="animate-spin" />,
      label: t.connecting,
      color: "var(--accent-orange)",
      tagClass: "tag-orange",
    },
    disconnected: {
      icon: <WifiOff size={24} />,
      label: t.disconnected,
      color: "var(--accent-red)",
      tagClass: "tag-red",
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
    <div className="animate-fade-in space-y-4 md:space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {t.title}
        </h2>
        <p className="text-sm text-[var(--text-muted)]">{t.subtitle}</p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
          <QrCode size={18} /> {t.connTitle}
        </h3>

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-3 sm:flex-row sm:items-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              color: currentStatus.color,
              background:
                status === "open"
                  ? "var(--accent-dim)"
                  : status === "connecting"
                    ? "var(--accent-orange-dim)"
                    : "var(--accent-red-dim)",
            }}
          >
            {currentStatus.icon}
          </div>
          <div className="flex-1">
            <p className="text-base font-bold">{currentStatus.label}</p>
            <p className="text-sm text-[var(--text-muted)]">
              {status === "open"
                ? t.connReady
                : status === "connecting"
                  ? t.connWaiting
                  : t.connNeedLink}
            </p>
          </div>
          <span className={`tag ${currentStatus.tagClass}`}>
            {currentStatus.label}
          </span>
        </div>

        {qrCode && status !== "open" && (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-4 text-center">
            <p className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
              {t.qrInstructionTitle}
            </p>
            <div className="mx-auto mb-3 max-w-[280px] overflow-hidden rounded-lg border border-[var(--border)]">
              <Image
                src={qrCode}
                alt="WhatsApp QR Code"
                width={280}
                height={280}
                className="h-auto w-full"
                unoptimized
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {t.qrInstructionBody}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="btn btn-secondary btn-sm justify-center"
            onClick={fetchData}
          >
            <RefreshCw size={14} /> {t.refreshStatus}
          </button>
          {status === "open" && (
            <button
              className="btn btn-danger btn-sm justify-center"
              onClick={handleDisconnect}
            >
              <Power size={14} /> {t.disconnect}
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
          <HardDrive size={18} /> {t.storageTitle}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Clock size={16} className="text-[var(--accent-orange)]" />{" "}
              {t.retention}
            </p>
            <p className="text-2xl font-extrabold">
              {config.media_retention_days || "30"} {t.day}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {t.retentionHint}
            </p>
          </article>
          <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Database size={16} className="text-[var(--accent-blue)]" />{" "}
              {t.cleanupSchedule}
            </p>
            <p className="text-2xl font-extrabold">00:00</p>
            <p className="text-xs text-[var(--text-muted)]">{t.cleanupHint}</p>
          </article>
        </div>
        <button
          className="btn btn-secondary btn-sm mt-4 justify-center"
          onClick={handleCleanup}
          disabled={cleaningUp}
        >
          {cleaningUp ? (
            <>
              <Loader2 size={14} className="animate-spin" /> {t.cleaning}
            </>
          ) : (
            <>
              <Trash2 size={14} /> {t.cleanupRun}
            </>
          )}
        </button>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
          <SettingsIcon size={18} /> {t.apiInfo}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
            <p className="mb-1 text-[var(--text-muted)]">{t.backendUrl}</p>
            <code className="break-all text-xs text-[var(--accent)]">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}
            </code>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-3">
            <p className="mb-1 text-[var(--text-muted)]">{t.supabaseUrl}</p>
            <code className="break-all text-xs text-[var(--accent-blue)]">
              {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not configured"}
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
