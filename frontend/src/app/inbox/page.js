"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Mail,
  MailOpen,
  Image as ImageIcon,
  Search,
  CheckCheck,
  Clock,
  User,
  Users,
  Hash,
  Forward,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Inbox as InboxIcon,
} from "lucide-react";
import Image from "next/image";
import { getMessages, markAsRead, markAllRead, deleteMessage } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { confirmAction, showError } from "@/lib/alerts";
import { useLanguage } from "@/contexts/language-context";

export default function InboxPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [messages, setMessages] = useState([]);
  const t = {
    title: isId ? "Inbox" : "Inbox",
    subtitle: isId
      ? "Pesan masuk yang cocok dengan keyword filter"
      : "Incoming messages matching keyword filters",
    markAllRead: isId ? "Tandai Semua Dibaca" : "Mark All Read",
    searchPlaceholder: isId ? "Cari pesan..." : "Search messages...",
    emptyUnread: isId ? "Tidak ada pesan belum dibaca" : "No unread messages",
    emptyRead: isId ? "Tidak ada pesan sudah dibaca" : "No read messages",
    emptyAll: isId ? "Inbox Kosong" : "Inbox is Empty",
    emptyHintUnread: isId
      ? "Semua pesan sudah dibaca"
      : "All messages are read",
    emptyHintDefault: isId
      ? "Belum ada pesan yang cocok dengan keyword"
      : "No messages matched the keyword",
    unknown: isId ? "Tidak Diketahui" : "Unknown",
    mediaNoCaption: isId ? "(Media tanpa caption)" : "(Media without caption)",
    newTag: isId ? "Baru" : "New",
    back: isId ? "Kembali" : "Back",
    forwarded: isId ? "Sudah Diteruskan" : "Forwarded",
    notForwarded: isId ? "Belum Diteruskan" : "Not Forwarded",
    noText: isId ? "(Tidak ada teks)" : "(No text)",
    deleteMessage: isId ? "Hapus Pesan" : "Delete Message",
    deleteConfirm: isId ? "Hapus pesan ini?" : "Delete this message?",
    selectMessage: isId
      ? "Pilih pesan untuk membaca"
      : "Select a message to read",
    selectHint: isId
      ? "Klik pesan di sebelah kiri untuk melihat detail"
      : "Click a message on the left to view details",
    tabUnread: isId ? "Belum Dibaca" : "Unread",
    tabRead: isId ? "Sudah Dibaca" : "Read",
    tabAll: isId ? "Semua" : "All",
    minAgo: isId ? "menit lalu" : "min ago",
    hourAgo: isId ? "jam lalu" : "h ago",
    locale: isId ? "id-ID" : "en-US",
  };

  const [selectedMsg, setSelectedMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("unread"); // 'unread' | 'read' | 'all'

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (activeTab === "unread") params.is_read = "false";
      if (activeTab === "read") params.is_read = "true";

      const res = await getMessages(params);
      setMessages(res.data || []);
      setPagination(res.pagination || {});
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeTab]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Supabase Realtime subscription for live messages
  useEffect(() => {
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (activeTab === "unread" || activeTab === "all") {
            setMessages((prev) => [payload.new, ...prev]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const handleSelectMessage = async (msg) => {
    setSelectedMsg(msg);
    if (!msg.is_read) {
      try {
        await markAsRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)),
        );
        setSelectedMsg((prev) => ({ ...prev, is_read: true }));
      } catch (err) {
        console.error("Failed to mark as read:", err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
      if (activeTab === "unread") {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: t.deleteMessage,
      text: t.deleteConfirm,
      confirmText: isId ? "Ya, hapus" : "Yes, delete",
      cancelText: isId ? "Batal" : "Cancel",
    });
    if (!confirmed) return;

    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    } catch (err) {
      console.error("Failed to delete:", err);
      await showError(err.message, t.deleteMessage);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffH = diffMs / (1000 * 60 * 60);

    if (diffH < 1)
      return `${Math.max(1, Math.floor(diffMs / 60000))} ${t.minAgo}`;
    if (diffH < 24) return `${Math.floor(diffH)} ${t.hourAgo}`;
    return d.toLocaleDateString(t.locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const tabs = [
    { id: "unread", label: t.tabUnread, icon: Mail },
    { id: "read", label: t.tabRead, icon: MailOpen },
    { id: "all", label: t.tabAll, icon: InboxIcon },
  ];

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
            className="btn btn-secondary btn-sm flex-1 sm:flex-none"
            onClick={handleMarkAllRead}
          >
            <CheckCheck size={14} /> {t.markAllRead}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchMessages}>
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="grid min-h-[68vh] grid-cols-1 md:grid-cols-[340px_minmax(0,1fr)]">
          <section
            className={`${selectedMsg ? "hidden md:block" : "block"} border-r-0 border-[var(--border)] md:border-r`}
          >
            <div className="sticky top-0 z-10 grid grid-cols-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-1 border-b-2 px-2 py-3 text-xs font-semibold ${
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
                        : "border-transparent text-[var(--text-muted)]"
                    }`}
                  >
                    <Icon size={14} /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="border-b border-[var(--border)] p-3">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  className="input"
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="btn btn-secondary btn-sm">
                  <Search size={14} />
                </button>
              </form>
            </div>

            {loading ? (
              <div className="loading-center">
                <div className="spinner" />
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state">
                <InboxIcon size={46} />
                <h3>
                  {activeTab === "unread"
                    ? t.emptyUnread
                    : activeTab === "read"
                      ? t.emptyRead
                      : t.emptyAll}
                </h3>
                <p>
                  {activeTab === "unread"
                    ? t.emptyHintUnread
                    : t.emptyHintDefault}
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-[60vh] overflow-y-auto md:max-h-[calc(100vh-300px)]">
                  {messages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={`w-full border-b border-[var(--border)] px-4 py-3 text-left transition ${
                        selectedMsg?.id === msg.id
                          ? "bg-[var(--accent-dim)]"
                          : "hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {msg.sender_name || t.unknown}
                      </p>
                      <p className="text-xs font-semibold text-[var(--accent)]">
                        {msg.group_name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                        {msg.message_text || t.mediaNoCaption}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {formatTime(msg.created_at)}
                        </span>
                        <div className="flex items-center gap-1">
                          {msg.media_url && (
                            <span className="tag tag-blue text-[10px]">
                              <ImageIcon size={10} />
                            </span>
                          )}
                          {msg.is_forwarded && (
                            <span className="tag tag-emerald text-[10px]">
                              <Forward size={10} />
                            </span>
                          )}
                          {!msg.is_read && (
                            <span className="tag tag-orange text-[10px]">
                              {t.newTag}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="pagination-info">
                      {page} / {pagination.totalPages}
                    </span>
                    <button
                      className="pagination-btn"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <section
            className={`${selectedMsg ? "block" : "hidden md:flex"} min-h-[52vh] p-4 md:p-6`}
          >
            {selectedMsg ? (
              <div className="w-full space-y-4">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm md:hidden"
                  onClick={() => setSelectedMsg(null)}
                >
                  <ChevronLeft size={14} /> {t.back}
                </button>

                <div className="space-y-2 border-b border-[var(--border)] pb-4">
                  <p className="text-xl font-bold">
                    {selectedMsg.sender_name || t.unknown}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="inline-flex items-center gap-1">
                      <User size={12} /> {selectedMsg.sender_jid}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users size={12} /> {selectedMsg.group_name}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Hash size={12} /> {selectedMsg.matched_keyword}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />{" "}
                      {new Date(selectedMsg.created_at).toLocaleString(
                        t.locale,
                        { timeZone: "Asia/Jakarta" },
                      )}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedMsg.is_forwarded ? (
                      <span className="tag tag-emerald">
                        <Forward size={12} /> {t.forwarded}
                      </span>
                    ) : (
                      <span className="tag tag-orange">{t.notForwarded}</span>
                    )}
                    {selectedMsg.media_type && (
                      <span className="tag tag-blue">
                        <ImageIcon size={12} /> {selectedMsg.media_type}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm leading-7 text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                  {selectedMsg.message_text || t.noText}
                </p>

                {selectedMsg.media_url && (
                  <div className="overflow-hidden rounded-xl border border-[var(--border)] max-w-xs">
                    {selectedMsg.media_type === "image" ? (
                      <Image
                        src={selectedMsg.media_url}
                        alt="attachment"
                        width={400}
                        height={300}
                        className="h-auto w-full"
                        unoptimized
                      />
                    ) : (
                      <div className="p-5 text-center">
                        <a
                          href={selectedMsg.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                        >
                          Download {selectedMsg.media_type}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(selectedMsg.id)}
                >
                  <Trash2 size={14} /> {t.deleteMessage}
                </button>
              </div>
            ) : (
              <div className="m-auto text-center text-[var(--text-muted)]">
                <MailOpen size={56} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold">{t.selectMessage}</p>
                <p className="text-sm">{t.selectHint}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
