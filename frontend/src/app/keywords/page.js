"use client";

import { useEffect, useState } from "react";
import { Hash, Plus, Trash2, RefreshCw, Tag } from "lucide-react";
import {
  getKeywords,
  addKeyword,
  updateKeyword,
  deleteKeyword,
} from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";

export default function KeywordsPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [keywords, setKeywords] = useState([]);
  const t = {
    title: isId ? "Keywords" : "Keywords",
    subtitle: isId
      ? "Kelola keyword filter untuk mendeteksi pesan"
      : "Manage filter keywords to detect messages",
    addTitle: isId ? "Tambah Keyword Baru" : "Add New Keyword",
    inputPlaceholder: isId
      ? "Ketik keyword baru... (contoh: laporan, urgent, penting)"
      : "Type new keyword... (example: report, urgent, important)",
    adding: isId ? "Menambahkan..." : "Adding...",
    add: isId ? "Tambah" : "Add",
    listTitle: isId ? "Daftar Keyword" : "Keyword List",
    noKeyword: isId ? "Belum ada keyword" : "No keywords yet",
    noKeywordHint: isId
      ? "Tambahkan keyword untuk mulai memfilter pesan"
      : "Add keywords to start filtering messages",
    addedAt: isId ? "Ditambahkan" : "Added",
    status: isId ? "Status" : "Status",
    action: isId ? "Aksi" : "Action",
    delete: isId ? "Hapus" : "Delete",
    deleteConfirm: isId ? "Hapus keyword ini?" : "Delete this keyword?",
    addFailed: isId ? "Gagal menambahkan keyword" : "Failed to add keyword",
    activeFrom: isId ? "aktif dari" : "active of",
    locale: isId ? "id-ID" : "en-US",
  };

  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState("");
  const [adding, setAdding] = useState(false);

  async function fetchKeywords() {
    setLoading(true);
    try {
      const res = await getKeywords();
      setKeywords(res.data || []);
    } catch (err) {
      console.error("Failed to fetch keywords:", err);
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
      setNewKeyword("");
    } catch (err) {
      console.error("Failed to add keyword:", err);
      alert(`${t.addFailed}: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (kw) => {
    try {
      await updateKeyword(kw.id, { is_active: !kw.is_active });
      setKeywords((prev) =>
        prev.map((k) =>
          k.id === kw.id ? { ...k, is_active: !k.is_active } : k,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle keyword:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await deleteKeyword(id);
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("Failed to delete keyword:", err);
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
    <div className="animate-fade-in space-y-4 md:space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {t.title}
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {t.subtitle} ({activeCount} {t.activeFrom} {keywords.length})
        </p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
          <Plus size={18} /> {t.addTitle}
        </h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            className="input"
            placeholder={t.inputPlaceholder}
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary justify-center sm:w-auto"
            disabled={adding || !newKeyword.trim()}
          >
            {adding ? t.adding : t.add}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-base font-bold">
            <Tag size={18} /> {t.listTitle}
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchKeywords}>
            <RefreshCw size={14} />
          </button>
        </div>

        {keywords.length === 0 ? (
          <div className="empty-state">
            <Hash size={48} />
            <h3>{t.noKeyword}</h3>
            <p>{t.noKeywordHint}</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {keywords
                .filter((k) => k.is_active)
                .map((kw) => (
                  <span
                    key={kw.id}
                    className="tag tag-emerald text-xs sm:text-sm"
                  >
                    #{kw.keyword}
                  </span>
                ))}
              {keywords
                .filter((k) => !k.is_active)
                .map((kw) => (
                  <span
                    key={kw.id}
                    className="tag text-xs text-[var(--text-muted)] line-through sm:text-sm"
                    style={{ background: "var(--bg-tertiary)" }}
                  >
                    #{kw.keyword}
                  </span>
                ))}
            </div>

            <div className="space-y-3 md:hidden">
              {keywords.map((kw) => (
                <article
                  key={kw.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-3"
                >
                  <p className="text-sm font-semibold">#{kw.keyword}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t.addedAt}:{" "}
                    {new Date(kw.created_at).toLocaleDateString(t.locale)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={kw.is_active}
                        onChange={() => handleToggle(kw)}
                      />
                      <span className="toggle-slider" />
                    </label>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(kw.id)}
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
                    <th>Keyword</th>
                    <th>{t.status}</th>
                    <th>{t.addedAt}</th>
                    <th>{t.action}</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((kw) => (
                    <tr key={kw.id}>
                      <td>
                        <span style={{ fontWeight: "600", fontSize: "14px" }}>
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
                      <td
                        style={{ fontSize: "13px", color: "var(--text-muted)" }}
                      >
                        {new Date(kw.created_at).toLocaleDateString(t.locale)}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(kw.id)}
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
    </div>
  );
}
