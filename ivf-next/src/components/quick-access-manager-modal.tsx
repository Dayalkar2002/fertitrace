'use client';

import { useState, useEffect } from 'react';
import { NavIcon } from '@/components/nav-icons';
import {
  QuickAccessItem,
  fetchQuickAccess,
  saveQuickAccess,
  resetQuickAccess,
} from '@/lib/services/quick-access';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
  loginName?: string;
  token?: string;
  onUpdated: (items: QuickAccessItem[]) => void;
}

export function QuickAccessManagerModal({
  isOpen,
  onClose,
  userId = 0,
  loginName = 'admin',
  token,
  onUpdated,
}: Props) {
  const [catalog, setCatalog] = useState<QuickAccessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchQuickAccess(token, { userId, loginName, includeCatalog: true })
      .then((res) => {
        if (res.catalog) {
          // Sort with active items first, by orderIndex
          const sorted = [...res.catalog].sort((a, b) => {
            if (a.isActive && !b.isActive) return -1;
            if (!a.isActive && b.isActive) return 1;
            return (a.orderIndex || 0) - (b.orderIndex || 0);
          });
          setCatalog(sorted);
        }
      })
      .catch((err) => {
        console.error('Failed to load catalog:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, userId, loginName, token]);

  if (!isOpen) return null;

  const handleToggleActive = (moduleKey: string) => {
    setCatalog((prev) =>
      prev.map((item) =>
        item.moduleKey === moduleKey
          ? { ...item, isActive: !item.isActive, isPinned: !item.isActive ? item.isPinned : false }
          : item
      )
    );
  };

  const handleTogglePin = (moduleKey: string) => {
    setCatalog((prev) =>
      prev.map((item) =>
        item.moduleKey === moduleKey
          ? { ...item, isPinned: !item.isPinned, isActive: true }
          : item
      )
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= catalog.length) return;

    const newCatalog = [...catalog];
    const temp = newCatalog[index];
    newCatalog[index] = newCatalog[targetIndex];
    newCatalog[targetIndex] = temp;

    // Recalculate order indices
    const updated = newCatalog.map((item, idx) => ({
      ...item,
      orderIndex: idx + 1,
    }));
    setCatalog(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const activeItems = catalog
        .filter((c) => c.isActive)
        .map((c, idx) => ({
          moduleKey: c.moduleKey,
          isPinned: c.isPinned,
          isActive: true,
          orderIndex: idx + 1,
        }));

      const res = await saveQuickAccess(token, {
        userId,
        loginName,
        modules: activeItems,
      });

      setStatusMsg('Quick access updated successfully!');
      onUpdated(res.items);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      console.error('Failed to save quick access:', err);
      setStatusMsg(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset your quick access modules to system defaults?')) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await resetQuickAccess(token, userId, loginName);
      setStatusMsg('Reset to default modules!');
      onUpdated(res.items);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      console.error('Reset error:', err);
      setStatusMsg(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredCatalog = catalog.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      item.moduleKey.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = catalog.filter((c) => c.isActive).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex h-[90vh] max-h-[720px] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-[#6345A6] shadow-2xs">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Customize Quick Access Modules
              </h2>
              <p className="text-xs text-slate-500">
                Personalize modules for user:{' '}
                <span className="font-bold text-[#6345A6]">{loginName}</span>{' '}
                ({activeCount} active modules)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-6 py-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search available modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-[#6345A6] focus:outline-hidden shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving || loading}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-2xs disabled:opacity-50"
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Module List Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2.5">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#6345A6] border-t-transparent" />
              <span className="text-xs font-bold">Loading modules from database...</span>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400">
              <span className="text-sm font-semibold">No modules match your search</span>
            </div>
          ) : (
            filteredCatalog.map((item, idx) => {
              const themeStyles = {
                purple: 'bg-purple-100 text-[#6345A6] border-purple-200',
                blue: 'bg-blue-100 text-blue-600 border-blue-200',
                teal: 'bg-teal-100 text-teal-600 border-teal-200',
                emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
                pink: 'bg-pink-100 text-pink-600 border-pink-200',
                sky: 'bg-sky-100 text-sky-600 border-sky-200',
                amber: 'bg-amber-100 text-amber-700 border-amber-200',
                rose: 'bg-rose-100 text-rose-600 border-rose-200',
                indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
              }[item.colorTheme || 'purple'] || 'bg-purple-100 text-[#6345A6] border-purple-200';

              return (
                <div
                  key={item.moduleKey}
                  className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
                    item.isActive
                      ? 'border-purple-200 bg-white shadow-xs'
                      : 'border-slate-200/70 bg-slate-50/60 opacity-60 hover:opacity-85'
                  }`}
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border ${themeStyles} shadow-2xs`}
                    >
                      <NavIcon name={item.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                        {item.badgeText && (
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-slate-600">
                            {item.badgeText}
                          </span>
                        )}
                        {item.isPinned && (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                            ★ Pinned
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        {item.description || item.route}
                      </span>
                    </div>
                  </div>

                  {/* Right: Controls (Pin, Move, Toggle) */}
                  <div className="flex items-center gap-2">
                    {/* Move Up/Down (only for active items) */}
                    {item.isActive && (
                      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          title="Move up"
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition text-xs font-black"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === catalog.length - 1}
                          title="Move down"
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 transition text-xs font-black"
                        >
                          ▼
                        </button>
                      </div>
                    )}

                    {/* Pin Toggle */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(item.moduleKey)}
                      title={item.isPinned ? 'Unpin' : 'Pin to favorites'}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl border text-sm transition ${
                        item.isPinned
                          ? 'border-amber-300 bg-amber-50 text-amber-600 shadow-2xs'
                          : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                      }`}
                    >
                      ★
                    </button>

                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.moduleKey)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        item.isActive ? 'bg-[#6345A6]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          item.isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-3xl">
          <div>
            {statusMsg && (
              <span className="text-xs font-bold text-[#6345A6] animate-pulse">
                {statusMsg}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#6345A6] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#52388c] transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
