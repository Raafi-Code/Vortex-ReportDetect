'use client';

import { useEffect, useState } from 'react';
import {
  Hash,
  Plus,
  Trash2,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { getKeywords, addKeyword, updateKeyword, deleteKeyword } from '@/lib/api';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding] = useState(false);

  async function fetchKeywords() {
    setLoading(true);
    try {
      const res = await getKeywords();
      setKeywords(res.data || []);
    } catch (err) {
      console.error('Failed to fetch keywords:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKeywords();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    setAdding(true);
    try {
      const res = await addKeyword(newKeyword.trim());
      setKeywords((prev) => [res.data, ...prev]);
      setNewKeyword('');
    } catch (err) {
      console.error('Failed to add keyword:', err);
      alert('Gagal menambahkan keyword: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (kw) => {
    try {
      await updateKeyword(kw.id, { is_active: !kw.is_active });
      setKeywords((prev) =>
        prev.map((k) =>
          k.id === kw.id ? { ...k, is_active: !k.is_active } : k
        )
      );
    } catch (err) {
      console.error('Failed to toggle keyword:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus keyword ini?')) return;
    try {
      await deleteKeyword(id);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error('Failed to delete keyword:', err);
    }
  };

  const activeCount = keywords.filter((k) => k.is_active).length;

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
        <h2>Keywords</h2>
        <p>Kelola keyword filter untuk mendeteksi pesan ({activeCount} aktif dari {keywords.length})</p>
      </div>

      {/* Add Keyword */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Tambah Keyword Baru
        </h3>
        <form onSubmit={handleAdd}>
          <div className="input-group">
            <input
              type="text"
              className="input"
              placeholder="Ketik keyword baru... (contoh: laporan, urgent, penting)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={adding || !newKeyword.trim()}
            >
              {adding ? 'Menambahkan...' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>

      {/* Keywords List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} /> Daftar Keyword
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchKeywords}>
            <RefreshCw size={14} />
          </button>
        </div>

        {keywords.length === 0 ? (
          <div className="empty-state">
            <Hash size={48} />
            <h3>Belum ada keyword</h3>
            <p>Tambahkan keyword untuk mulai memfilter pesan</p>
          </div>
        ) : (
          <>
            {/* Tag Cloud */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {keywords.filter((k) => k.is_active).map((kw) => (
                <span key={kw.id} className="tag tag-emerald" style={{ fontSize: '13px', padding: '6px 14px' }}>
                  #{kw.keyword}
                </span>
              ))}
              {keywords.filter((k) => !k.is_active).map((kw) => (
                <span key={kw.id} className="tag" style={{ fontSize: '13px', padding: '6px 14px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  #{kw.keyword}
                </span>
              ))}
            </div>

            {/* Table */}
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Status</th>
                    <th>Ditambahkan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw) => (
                    <tr key={kw.id}>
                      <td>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>
                          #{kw.keyword}
                        </span>
                      </td>
                      <td>
                        <label className="toggle">
                          <input
                            type="checkbox"
                            checked={kw.is_active}
                            onChange={() => handleToggle(kw)}
                          />
                          <span className="toggle-slider" />
                        </label>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(kw.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(kw.id)}
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
          </>
        )}
      </div>
    </div>
  );
}
