'use client';

import { useEffect, useState } from 'react';
import {
  Forward,
  Plus,
  Trash2,
  RefreshCw,
  ArrowRight,
  Users,
  User,
} from 'lucide-react';
import {
  getForwardingRules,
  addForwardingRule,
  updateForwardingRule,
  deleteForwardingRule,
  getMonitoredGroups,
  getAvailableGroups,
  getConfig,
  setConfig,
} from '@/lib/api';

export default function ForwardingPage() {
  const [rules, setRules] = useState([]);
  const [groups, setGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [autoForward, setAutoForward] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({
    source_group_jid: '',
    target_jid: '',
    target_name: '',
    target_type: 'group',
  });

  async function fetchData() {
    setLoading(true);
    try {
      const [rulesRes, groupsRes, availableRes, configRes] = await Promise.all([
        getForwardingRules(),
        getMonitoredGroups(),
        getAvailableGroups(),
        getConfig(),
      ]);
      setRules(rulesRes.data || []);
      setGroups(groupsRes.data || []);
      setAvailableGroups(availableRes.data || []);
      setAutoForward(configRes.data?.auto_forward_enabled === 'true');
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAutoForward = async () => {
    const newValue = !autoForward;
    setAutoForward(newValue);
    try {
      await setConfig('auto_forward_enabled', String(newValue));
    } catch (err) {
      setAutoForward(!newValue); // Revert on failure
      console.error('Failed to toggle auto-forward:', err);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newRule.source_group_jid || !newRule.target_jid || !newRule.target_name) {
      alert('Semua field harus diisi');
      return;
    }
    try {
      const res = await addForwardingRule(newRule);
      setRules((prev) => [res.data, ...prev]);
      setShowAdd(false);
      setNewRule({ source_group_jid: '', target_jid: '', target_name: '', target_type: 'group' });
    } catch (err) {
      console.error('Failed to add rule:', err);
      alert('Gagal menambahkan rule: ' + err.message);
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      await updateForwardingRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) =>
        prev.map((r) =>
          r.id === rule.id ? { ...r, is_active: !r.is_active } : r
        )
      );
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!confirm('Hapus forwarding rule ini?')) return;
    try {
      await deleteForwardingRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const getGroupName = (jid) => {
    const group = [...groups, ...availableGroups].find(
      (g) => g.group_jid === jid || g.jid === jid
    );
    return group?.group_name || group?.name || jid;
  };

  const handleSelectTarget = (group) => {
    setNewRule((prev) => ({
      ...prev,
      target_jid: group.jid || group.group_jid,
      target_name: group.name || group.group_name,
      target_type: 'group',
    }));
  };

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
          <h2>Forwarding</h2>
          <p>Atur aturan penerusan pesan ke grup/kontak tujuan</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Tambah Rule
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Auto Forward Toggle */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
              Auto Forward
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {autoForward
                ? 'Pesan yang cocok akan diteruskan otomatis ke target'
                : 'Auto-forward nonaktif. Pesan hanya disimpan ke database.'}
            </div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoForward}
              onChange={handleToggleAutoForward}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      {/* Forwarding Rules */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Forward size={18} /> Forwarding Rules ({rules.length})
        </h3>

        {rules.length === 0 ? (
          <div className="empty-state">
            <Forward size={48} />
            <h3>Belum ada rule</h3>
            <p>Buat forwarding rule untuk meneruskan pesan otomatis</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rules.map((rule) => (
              <div
                key={rule.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  opacity: rule.is_active ? 1 : 0.5,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span className="tag tag-blue" style={{ fontSize: '12px' }}>
                      <Users size={12} /> {getGroupName(rule.source_group_jid)}
                    </span>
                    <ArrowRight size={16} style={{ color: 'var(--accent)' }} />
                    <span className="tag tag-emerald" style={{ fontSize: '12px' }}>
                      {rule.target_type === 'group' ? <Users size={12} /> : <User size={12} />}
                      {rule.target_name}
                    </span>
                  </div>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={rule.is_active}
                    onChange={() => handleToggleRule(rule)}
                  />
                  <span className="toggle-slider" />
                </label>
                <button
                  className="btn btn-danger btn-sm btn-icon"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Rule Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <h3>Tambah Forwarding Rule</h3>
            <form onSubmit={handleAddRule}>
              {/* Source Group */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Grup Sumber (yang dimonitor)</label>
                <select
                  className="select"
                  value={newRule.source_group_jid}
                  onChange={(e) =>
                    setNewRule((prev) => ({ ...prev, source_group_jid: e.target.value }))
                  }
                  required
                >
                  <option value="">-- Pilih Grup Sumber --</option>
                  {groups.filter((g) => g.is_active).map((g) => (
                    <option key={g.id} value={g.group_jid}>
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Type */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Tipe Target</label>
                <select
                  className="select"
                  value={newRule.target_type}
                  onChange={(e) =>
                    setNewRule((prev) => ({ ...prev, target_type: e.target.value }))
                  }
                >
                  <option value="group">Grup</option>
                  <option value="contact">Kontak</option>
                </select>
              </div>

              {/* Target Selection */}
              {newRule.target_type === 'group' ? (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Grup Tujuan</label>
                  <select
                    className="select"
                    value={newRule.target_jid}
                    onChange={(e) => {
                      const group = availableGroups.find((g) => g.jid === e.target.value);
                      if (group) handleSelectTarget(group);
                    }}
                    required
                  >
                    <option value="">-- Pilih Grup Tujuan --</option>
                    {availableGroups.map((g) => (
                      <option key={g.jid} value={g.jid}>
                        {g.name} ({g.participants} peserta)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Nomor WhatsApp Tujuan</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="6281234567890"
                    value={newRule.target_jid.replace('@s.whatsapp.net', '')}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, '');
                      setNewRule((prev) => ({
                        ...prev,
                        target_jid: num + '@s.whatsapp.net',
                        target_name: num,
                      }));
                    }}
                    required
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Masukkan dengan kode negara tanpa + (contoh: 6281234567890)
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={14} /> Tambah Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
