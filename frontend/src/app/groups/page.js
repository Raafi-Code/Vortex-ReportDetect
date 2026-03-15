'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Radio,
  RadioOff,
} from 'lucide-react';
import {
  getMonitoredGroups,
  getAvailableGroups,
  addMonitoredGroup,
  updateGroup,
  deleteGroup,
} from '@/lib/api';

export default function GroupsPage() {
  const [monitoredGroups, setMonitoredGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchAvailable, setSearchAvailable] = useState('');

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
      console.error('Failed to fetch groups:', err);
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
      console.error('Failed to add group:', err);
      alert('Gagal menambahkan grup: ' + err.message);
    }
  };

  const handleToggle = async (group) => {
    try {
      await updateGroup(group.id, { is_active: !group.is_active });
      setMonitoredGroups((prev) =>
        prev.map((g) =>
          g.id === group.id ? { ...g, is_active: !g.is_active } : g
        )
      );
    } catch (err) {
      console.error('Failed to toggle group:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus grup dari monitoring?')) return;
    try {
      await deleteGroup(id);
      setMonitoredGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  const filteredAvailable = availableGroups.filter((g) =>
    g.name.toLowerCase().includes(searchAvailable.toLowerCase())
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
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Groups</h2>
          <p>Kelola grup WhatsApp yang dimonitor</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Tambah Grup
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Monitored Groups */}
      <div className="card">
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} /> Grup yang Dimonitor ({monitoredGroups.length})
        </h3>

        {monitoredGroups.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Belum ada grup</h3>
            <p>Tambahkan grup WhatsApp untuk mulai monitoring</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nama Grup</th>
                  <th>Group JID</th>
                  <th>Status</th>
                  <th>Ditambahkan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {monitoredGroups.map((group) => (
                  <tr key={group.id}>
                    <td style={{ fontWeight: '600' }}>{group.group_name}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
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
                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {new Date(group.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => handleDelete(group.id)}
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Group Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Tambah Grup Monitor</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Pilih grup WhatsApp yang ingin dimonitor
            </p>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <input
                type="text"
                className="input"
                placeholder="Cari grup..."
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
              />
              <Search size={18} style={{ color: 'var(--text-muted)', position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <div style={{ maxHeight: '320px', overflow: 'auto' }}>
              {filteredAvailable.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {availableGroups.length === 0
                    ? 'WhatsApp belum terhubung atau tidak ada grup'
                    : 'Tidak ada grup yang cocok'}
                </div>
              ) : (
                filteredAvailable.map((group) => {
                  const isMonitored = monitoredJids.has(group.jid);
                  return (
                    <div
                      key={group.jid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border)',
                        opacity: isMonitored ? 0.5 : 1,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{group.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {group.participants} peserta
                        </div>
                      </div>
                      {isMonitored ? (
                        <span className="tag tag-emerald">
                          <Radio size={12} /> Dimonitor
                        </span>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAdd(group)}
                        >
                          <Plus size={14} /> Monitor
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
