"use client";

import { useEffect, useState } from "react";
import {
  Forward,
  Plus,
  Trash2,
  RefreshCw,
  ArrowRight,
  Users,
  User,
} from "lucide-react";
import {
  getForwardingRules,
  addForwardingRule,
  updateForwardingRule,
  deleteForwardingRule,
  getMonitoredGroups,
  getAvailableGroups,
  getConfig,
  setConfig,
} from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";

export default function ForwardingPage() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [rules, setRules] = useState([]);
  const t = {
    title: isId ? "Forwarding" : "Forwarding",
    subtitle: isId
      ? "Atur aturan penerusan pesan ke grup/kontak tujuan"
      : "Configure message forwarding rules to target groups/contacts",
    addRule: isId ? "Tambah Rule" : "Add Rule",
    autoForward: isId ? "Auto Forward" : "Auto Forward",
    autoForwardOn: isId
      ? "Pesan yang cocok akan diteruskan otomatis ke target"
      : "Matched messages will be forwarded automatically",
    autoForwardOff: isId
      ? "Auto-forward nonaktif. Pesan hanya disimpan ke database."
      : "Auto-forward is disabled. Messages are only stored in database.",
    rulesTitle: isId ? "Forwarding Rules" : "Forwarding Rules",
    noRule: isId ? "Belum ada rule" : "No rules yet",
    noRuleHint: isId
      ? "Buat forwarding rule untuk meneruskan pesan otomatis"
      : "Create forwarding rules for automatic forwarding",
    delete: isId ? "Hapus" : "Delete",
    deleteConfirm: isId
      ? "Hapus forwarding rule ini?"
      : "Delete this forwarding rule?",
    addModalTitle: isId ? "Tambah Forwarding Rule" : "Add Forwarding Rule",
    sourceGroup: isId
      ? "Grup Sumber (yang dimonitor)"
      : "Source Group (monitored)",
    chooseSource: isId
      ? "-- Pilih Grup Sumber --"
      : "-- Select Source Group --",
    targetType: isId ? "Tipe Target" : "Target Type",
    group: isId ? "Grup" : "Group",
    contact: isId ? "Kontak" : "Contact",
    targetGroup: isId ? "Grup Tujuan" : "Target Group",
    chooseTargetGroup: isId
      ? "-- Pilih Grup Tujuan --"
      : "-- Select Target Group --",
    targetPhone: isId ? "Nomor WhatsApp Tujuan" : "Target WhatsApp Number",
    targetPhoneHint: isId
      ? "Masukkan dengan kode negara tanpa + (contoh: 6281234567890)"
      : "Use country code without + (example: 6281234567890)",
    cancel: isId ? "Batal" : "Cancel",
    add: isId ? "Tambah Rule" : "Add Rule",
    allFieldsRequired: isId
      ? "Semua field harus diisi"
      : "All fields are required",
    addFailed: isId ? "Gagal menambahkan rule" : "Failed to add rule",
    participants: isId ? "peserta" : "participants",
  };

  const [groups, setGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [autoForward, setAutoForward] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({
    source_group_jid: "",
    target_jid: "",
    target_name: "",
    target_type: "group",
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
      setAutoForward(configRes.data?.auto_forward_enabled === "true");
    } catch (err) {
      console.error("Failed to fetch data:", err);
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
      await setConfig("auto_forward_enabled", String(newValue));
    } catch (err) {
      setAutoForward(!newValue); // Revert on failure
      console.error("Failed to toggle auto-forward:", err);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (
      !newRule.source_group_jid ||
      !newRule.target_jid ||
      !newRule.target_name
    ) {
      alert(t.allFieldsRequired);
      return;
    }
    try {
      const res = await addForwardingRule(newRule);
      setRules((prev) => [res.data, ...prev]);
      setShowAdd(false);
      setNewRule({
        source_group_jid: "",
        target_jid: "",
        target_name: "",
        target_type: "group",
      });
    } catch (err) {
      console.error("Failed to add rule:", err);
      alert(`${t.addFailed}: ${err.message}`);
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      await updateForwardingRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) =>
        prev.map((r) =>
          r.id === rule.id ? { ...r, is_active: !r.is_active } : r,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle rule:", err);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await deleteForwardingRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  const getGroupName = (jid) => {
    const group = [...groups, ...availableGroups].find(
      (g) => g.group_jid === jid || g.jid === jid,
    );
    return group?.group_name || group?.name || jid;
  };

  const handleSelectTarget = (group) => {
    setNewRule((prev) => ({
      ...prev,
      target_jid: group.jid || group.group_jid,
      target_name: group.name || group.group_name,
      target_type: "group",
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
            <Plus size={14} /> {t.addRule}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold">{t.autoForward}</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {autoForward ? t.autoForwardOn : t.autoForwardOff}
            </p>
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
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
          <Forward size={18} /> {t.rulesTitle} ({rules.length})
        </h3>

        {rules.length === 0 ? (
          <div className="empty-state">
            <Forward size={48} />
            <h3>{t.noRule}</h3>
            <p>{t.noRuleHint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <article
                key={rule.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-3"
                style={{ opacity: rule.is_active ? 1 : 0.55 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tag tag-blue text-xs">
                      <Users size={12} /> {getGroupName(rule.source_group_jid)}
                    </span>
                    <ArrowRight size={14} className="text-[var(--accent)]" />
                    <span className="tag tag-emerald text-xs">
                      {rule.target_type === "group" ? (
                        <Users size={12} />
                      ) : (
                        <User size={12} />
                      )}
                      {rule.target_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={rule.is_active}
                        onChange={() => handleToggleRule(rule)}
                      />
                      <span className="toggle-slider" />
                    </label>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 size={14} /> {t.delete}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Add Rule Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t.addModalTitle}</h3>
            <form onSubmit={handleAddRule} className="space-y-4">
              {/* Source Group */}
              <div>
                <label className="form-label">{t.sourceGroup}</label>
                <select
                  className="select"
                  value={newRule.source_group_jid}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      source_group_jid: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">{t.chooseSource}</option>
                  {groups
                    .filter((g) => g.is_active)
                    .map((g) => (
                      <option key={g.id} value={g.group_jid}>
                        {g.group_name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Target Type */}
              <div>
                <label className="form-label">{t.targetType}</label>
                <select
                  className="select"
                  value={newRule.target_type}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      target_type: e.target.value,
                    }))
                  }
                >
                  <option value="group">{t.group}</option>
                  <option value="contact">{t.contact}</option>
                </select>
              </div>

              {/* Target Selection */}
              {newRule.target_type === "group" ? (
                <div>
                  <label className="form-label">{t.targetGroup}</label>
                  <select
                    className="select"
                    value={newRule.target_jid}
                    onChange={(e) => {
                      const group = availableGroups.find(
                        (g) => g.jid === e.target.value,
                      );
                      if (group) handleSelectTarget(group);
                    }}
                    required
                  >
                    <option value="">{t.chooseTargetGroup}</option>
                    {availableGroups.map((g) => (
                      <option key={g.jid} value={g.jid}>
                        {g.name} ({g.participants} {t.participants})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="form-label">{t.targetPhone}</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="6281234567890"
                    value={newRule.target_jid.replace("@s.whatsapp.net", "")}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, "");
                      setNewRule((prev) => ({
                        ...prev,
                        target_jid: num + "@s.whatsapp.net",
                        target_name: num,
                      }));
                    }}
                    required
                  />
                  <div
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {t.targetPhoneHint}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdd(false)}
                >
                  {t.cancel}
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={14} /> {t.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
