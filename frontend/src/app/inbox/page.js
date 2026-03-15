'use client';

import { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';
import { getMessages, markAsRead, markAllRead, deleteMessage } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function InboxPage() {
  const [messages, setMessages] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('unread'); // 'unread' | 'read' | 'all'

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 50 };
      if (search) params.search = search;
      if (activeTab === 'unread') params.is_read = 'false';
      if (activeTab === 'read') params.is_read = 'true';

      const res = await getMessages(params);
      setMessages(res.data || []);
      setPagination(res.pagination || {});
    } catch (err) {
      console.error('Failed to fetch messages:', err);
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
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (activeTab === 'unread' || activeTab === 'all') {
            setMessages((prev) => [payload.new, ...prev]);
          }
        }
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
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );
        setSelectedMsg((prev) => ({ ...prev, is_read: true }));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
      if (activeTab === 'unread') {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus pesan ini?')) return;
    try {
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffH = diffMs / (1000 * 60 * 60);

    if (diffH < 1) return `${Math.max(1, Math.floor(diffMs / 60000))} menit lalu`;
    if (diffH < 24) return `${Math.floor(diffH)} jam lalu`;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const tabs = [
    { id: 'unread', label: 'Belum Dibaca', icon: Mail },
    { id: 'read', label: 'Sudah Dibaca', icon: MailOpen },
    { id: 'all', label: 'Semua', icon: InboxIcon },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Inbox</h2>
          <p>Pesan masuk yang cocok dengan keyword filter</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleMarkAllRead}>
            <CheckCheck size={14} /> Tandai Semua Dibaca
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchMessages}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="inbox-layout">
          {/* Left Panel - Message List */}
          <div className="inbox-list">
            {/* Tabs */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              position: 'sticky',
              top: 0,
              background: 'var(--bg-secondary)',
              zIndex: 11,
            }}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '12px 8px',
                      border: 'none',
                      background: activeTab === tab.id ? 'var(--accent-dim)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: '600',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="inbox-header">
              <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
                <div className="input-group">
                  <input
                    type="text"
                    className="input"
                    placeholder="Cari pesan..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    <Search size={14} />
                  </button>
                </div>
              </form>
            </div>

            {loading ? (
              <div className="loading-center">
                <div className="spinner" />
              </div>
            ) : messages.length === 0 ? (
              <div className="empty-state">
                <InboxIcon size={48} />
                <h3>
                  {activeTab === 'unread' ? 'Tidak ada pesan belum dibaca' :
                   activeTab === 'read' ? 'Tidak ada pesan sudah dibaca' :
                   'Inbox Kosong'}
                </h3>
                <p>
                  {activeTab === 'unread' ? 'Semua pesan sudah dibaca 👏' :
                   'Belum ada pesan yang cocok dengan keyword'}
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`inbox-item ${selectedMsg?.id === msg.id ? 'active' : ''} ${!msg.is_read ? 'unread' : ''}`}
                    onClick={() => handleSelectMessage(msg)}
                  >
                    <div className="inbox-sender">{msg.sender_name || 'Unknown'}</div>
                    <div className="inbox-group">{msg.group_name}</div>
                    <div className="inbox-preview">
                      {msg.message_text || '(Media tanpa caption)'}
                    </div>
                    <div className="inbox-meta">
                      <span className="inbox-time">{formatTime(msg.created_at)}</span>
                      <div className="inbox-icons">
                        {msg.media_url && (
                          <span className="tag tag-blue" style={{ padding: '2px 6px', fontSize: '10px' }}>
                            <ImageIcon size={10} />
                          </span>
                        )}
                        {msg.is_forwarded && (
                          <span className="tag tag-emerald" style={{ padding: '2px 6px', fontSize: '10px' }}>
                            <Forward size={10} />
                          </span>
                        )}
                        <span className="tag tag-purple" style={{ padding: '2px 6px', fontSize: '10px' }}>
                          #{msg.matched_keyword}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
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
          </div>

          {/* Right Panel - Message Detail */}
          <div className={`inbox-detail ${selectedMsg ? 'mobile-show' : ''}`}>
            {selectedMsg ? (
              <div className="animate-fade-in">
                <div className="inbox-detail-header">
                  <div className="inbox-detail-sender">{selectedMsg.sender_name || 'Unknown'}</div>
                  <div className="inbox-detail-meta">
                    <span>
                      <User size={14} />
                      {selectedMsg.sender_jid}
                    </span>
                    <span>
                      <Users size={14} />
                      {selectedMsg.group_name}
                    </span>
                    <span>
                      <Hash size={14} />
                      {selectedMsg.matched_keyword}
                    </span>
                    <span>
                      <Clock size={14} />
                      {new Date(selectedMsg.created_at).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                      })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    {selectedMsg.is_forwarded ? (
                      <span className="tag tag-emerald">
                        <Forward size={12} /> Sudah Diteruskan
                      </span>
                    ) : (
                      <span className="tag tag-orange">Belum Diteruskan</span>
                    )}
                    {selectedMsg.media_type && (
                      <span className="tag tag-blue">
                        <ImageIcon size={12} /> {selectedMsg.media_type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="inbox-detail-body">
                  {selectedMsg.message_text || '(Tidak ada teks)'}
                </div>

                {selectedMsg.media_url && (
                  <div className="inbox-detail-image">
                    {selectedMsg.media_type === 'image' ? (
                      <img
                        src={selectedMsg.media_url}
                        alt="attachment"
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center' }}>
                        <a
                          href={selectedMsg.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                        >
                          📎 Download {selectedMsg.media_type}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ marginTop: '24px' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(selectedMsg.id)}
                  >
                    <Trash2 size={14} /> Hapus Pesan
                  </button>
                </div>
              </div>
            ) : (
              <div className="inbox-empty">
                <MailOpen size={64} />
                <h3>Pilih pesan untuk membaca</h3>
                <p style={{ fontSize: '13px' }}>
                  Klik pesan di sebelah kiri untuk melihat detail
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
