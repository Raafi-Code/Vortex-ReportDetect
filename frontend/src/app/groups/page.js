"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, RefreshCw, Search, Radio } from "lucide-react";
import {
  getMonitoredGroups,
  getAvailableGroups,
  addMonitoredGroup,
  updateGroup,
  deleteGroup,
} from "@/lib/api";
import { confirmAction, showError } from "@/lib/alerts";
import { useLanguage } from "@/contexts/language-context";

export default function GroupsPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [monitoredGroups, setMonitoredGroups] = useState([]);
  const t = {
    title: isId ? "Groups" : "Groups",
    subtitle: isId
      ? "Kelola grup WhatsApp yang dimonitor"
      : "Manage monitored WhatsApp groups",
    addGroup: isId ? "Tambah Grup" : "Add Group",
    monitoredTitle: isId ? "Grup yang Dimonitor" : "Monitored Groups",
    noGroups: isId ? "Belum ada grup" : "No groups yet",
    noGroupsHint: isId
      ? "Tambahkan grup WhatsApp untuk mulai monitoring"
      : "Add WhatsApp groups to start monitoring",
    groupName: isId ? "Nama Grup" : "Group Name",
    groupJid: isId ? "Group JID" : "Group JID",
    status: isId ? "Status" : "Status",
    addedAt: isId ? "Ditambahkan" : "Added",
    action: isId ? "Aksi" : "Action",
    delete: isId ? "Hapus" : "Delete",
    deleteConfirm: isId
      ? "Hapus grup dari monitoring?"
      : "Remove this group from monitoring?",
    addModalTitle: isId ? "Tambah Grup Monitor" : "Add Monitoring Group",
    addModalDesc: isId
      ? "Pilih grup WhatsApp yang ingin dimonitor"
      : "Choose WhatsApp groups to monitor",
    searchPlaceholder: isId ? "Cari grup..." : "Search groups...",
    waNotConnected: isId
      ? "WhatsApp belum terhubung atau tidak ada grup"
      : "WhatsApp is not connected or no groups found",
    noMatch: isId ? "Tidak ada grup yang cocok" : "No matching groups",
    participants: isId ? "peserta" : "participants",
    monitored: isId ? "Dimonitor" : "Monitored",
    monitor: isId ? "Monitor" : "Monitor",
    close: isId ? "Tutup" : "Close",
    addFailed: isId ? "Gagal menambahkan grup" : "Failed to add group",
    locale: isId ? "id-ID" : "en-US",
  };

  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState("");

  async function fetchData() {
    setLoading(true);
    try {
      const [monitored, available] = await Promise.all([
        getMonitoredGroups(),
        getAvailableGroups(),
      ]);
      setMonitoredGroups(monitored.data || []);
      setAvailableGroups(available.data || []);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (group) => {
    try {
      await addMonitoredGroup(group.jid, group.name);
      await fetchData();
      setShowAdd(false);
    } catch (err) {
      console.error("Failed to add group:", err);
      await showError(err.message, t.addFailed);
    }
  };

  const handleToggle = async (group) => {
    try {
      await updateGroup(group.id, { is_active: !group.is_active });
      setMonitoredGroups((prev) =>
        prev.map((g) =>
          g.id === group.id ? { ...g, is_active: !g.is_active } : g,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle group:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: t.delete,
      text: t.deleteConfirm,
      confirmText: isId ? "Ya, hapus" : "Yes, delete",
      cancelText: isId ? "Batal" : "Cancel",
    });
    if (!confirmed) return;

    try {
      await deleteGroup(id);
      setMonitoredGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error("Failed to delete group:", err);
      await showError(err.message, t.delete);
    }
  };

  const filteredAvailable = availableGroups.filter((g) =>
    g.name.toLowerCase().includes(searchAvailable.toLowerCase()),
  );

  const monitoredJids = new Set(monitoredGroups.map((g) => g.group_jid));

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4 md:space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {t.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{t.subtitle}</p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <button
            className="btn btn-primary btn-sm flex-1 sm:flex-none"
            onClick={() => setShowAdd(true)}
          >
            <Plus size={14} /> {t.addGroup}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
          <Users size={18} /> {t.monitoredTitle} ({monitoredGroups.length})
        </h3>

        {monitoredGroups.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>{t.noGroups}</h3>
            <p>{t.noGroupsHint}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {monitoredGroups.map((group) => (
                <article
                  key={group.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-3"
                >
                  <p className="font-semibold">{group.group_name}</p>
                  <p className="mt-1 break-all font-mono text-xs text-[var(--text-muted)]">
                    {group.group_jid}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={group.is_active}
                        onChange={() => handleToggle(group)}
                      />
                      <span className="toggle-slider" />
                    </label>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(group.id)}
                      title={t.delete}
                    >
                      <Trash2 size={14} /> {t.delete}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="table-container hidden md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t.groupName}</th>
                    <th>{t.groupJid}</th>
                    <th>{t.status}</th>
                    <th>{t.addedAt}</th>
                    <th>{t.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {monitoredGroups.map((group) => (
                    <tr key={group.id}>
                      <td style={{ fontWeight: "600" }}>{group.group_name}</td>
                      <td
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontFamily: "monospace",
                        }}
                      >
                        {group.group_jid}
                      </td>
                      <td>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={group.is_active}
                            onChange={() => handleToggle(group)}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </td>
                      <td
                        style={{ fontSize: "13px", color: "var(--text-muted)" }}
                      >
                        {new Date(group.created_at).toLocaleDateString(
                          t.locale,
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(group.id)}
                          title={t.delete}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Add Group Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.addModalTitle}</h3>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "16px",
              }}
            >
              {t.addModalDesc}
            </p>

            <div className="input-group" style={{ marginBottom: "16px" }}>
              <input
                type="text"
                className="input"
                placeholder={t.searchPlaceholder}
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled
              >
                <Search size={14} />
              </button>
            </div>

            <div style={{ maxHeight: "320px", overflow: "auto" }}>
              {filteredAvailable.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--text-muted)",
                    fontSize: "13px",
                  }}
                >
                  {availableGroups.length === 0 ? t.waNotConnected : t.noMatch}
                </div>
              ) : (
                filteredAvailable.map((group) => {
                  const isMonitored = monitoredJids.has(group.jid);
                  return (
                    <div
                      key={group.jid}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderBottom: "1px solid var(--border)",
                        opacity: isMonitored ? 0.5 : 1,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "14px" }}>
                          {group.name}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {group.participants} {t.participants}
                        </div>
                      </div>
                      {isMonitored ? (
                        <span className="tag tag-emerald">
                          <Radio size={12} /> {t.monitored}
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAdd(group)}
                        >
                          <Plus size={14} /> {t.monitor}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowAdd(false)}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
