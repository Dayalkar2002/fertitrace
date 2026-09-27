'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  emptyMonitoringChart,
  getMonitoringSheetLayout,
  IUI_STOP_REASONS,
  MON_SHEET_COLORS,
  resolveMonSheetColumnColor,
  type MonitoringChartValues,
} from '@/lib/monitoring-sheet';
import { getMonitoringSheetLabel } from '@/lib/cycle-utils';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';

const STORAGE_PREFIX = 'fertitrace.monitoringChart';

interface CycleMonitoringChartProps {
  option: string;
  cycleId?: string;
}

export function CycleMonitoringChart({ option, cycleId }: CycleMonitoringChartProps) {
  const layout = useMemo(() => getMonitoringSheetLayout(option), [option]);
  const storageKey = `${STORAGE_PREFIX}.${cycleId || 'draft'}.${option || 'none'}`;
  const [values, setValues] = useState<MonitoringChartValues>({});

  const { token } = useAuth();
  const [dbLoaded, setDbLoaded] = useState(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [savingDb, setSavingDb] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!layout) {
      setValues({});
      return;
    }
    let cancelled = false;

    // 1. Initialise with session storage or empty template
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        setValues(JSON.parse(raw) as MonitoringChartValues);
      } else {
        setValues(emptyMonitoringChart(layout));
      }
    } catch {
      setValues(emptyMonitoringChart(layout));
    }

    // 2. If valid cycle ID, fetch saved DB monitoring chart values
    if (cycleId && cycleId !== 'draft' && token) {
      setLoadingDb(true);
      apiFetch<{ success: boolean; data: { chartValues?: MonitoringChartValues } }>(
        `/cycles/${encodeURIComponent(cycleId)}/monitoring`,
        {},
        token
      )
        .then((res) => {
          if (!cancelled && res?.data?.chartValues) {
            const dbValues = res.data.chartValues;
            setValues((prev) => {
              const merged: MonitoringChartValues = { ...emptyMonitoringChart(layout), ...prev };
              for (const [rKey, cols] of Object.entries(dbValues)) {
                if (!merged[rKey]) merged[rKey] = {};
                for (const [cKey, v] of Object.entries(cols)) {
                  if (v !== '' && v !== null && v !== undefined) {
                    merged[rKey][cKey] = String(v);
                  }
                }
              }
              try {
                sessionStorage.setItem(storageKey, JSON.stringify(merged));
              } catch {}
              return merged;
            });
            setDbLoaded(true);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoadingDb(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [layout, storageKey, cycleId, token]);

  useEffect(() => {
    if (!layout || !Object.keys(values).length) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      /* ignore */
    }
  }, [layout, storageKey, values]);

  async function handleSaveChart() {
    if (!cycleId || cycleId === 'draft' || !token) return;
    setSavingDb(true);
    setToastMessage(null);
    try {
      await apiFetch(
        `/cycles/${encodeURIComponent(cycleId)}/monitoring`,
        {
          method: 'POST',
          body: JSON.stringify({ chartValues: values }),
        },
        token
      );
      setToastMessage('Chart saved successfully to cycle records.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'Failed to save chart.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setSavingDb(false);
    }
  }

  if (!option) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">Monitoring Chart</h3>
        <p className="mt-1 text-sm text-slate-600">
          Choose a protocol on Cycle Creation. Agonist, Antagonist, HRT, Modified Natural, or IUI Monitoring Sheet opens the matching chart there.
        </p>
      </section>
    );
  }

  if (!layout) return null;

  function updateCell(rowKey: string, colKey: string, value: string) {
    setValues((prev) => ({
      ...prev,
      [rowKey]: { ...(prev[rowKey] || {}), [colKey]: value },
    }));
  }

  const dayRowKeys =
    layout.orientation === 'day-rows'
      ? Array.from({ length: layout.dayCount || 7 }, (_, index) => `d${index + 1}`)
      : [];

  const hasGroups = layout.orientation === 'day-rows' && layout.columns.some((col) => col.group);
  const headerGroups: Array<{ label: string; span: number }> = [];
  if (hasGroups) {
    for (const col of layout.columns) {
      const last = headerGroups[headerGroups.length - 1];
      const label = col.group || '';
      if (last && last.label === label && label) last.span += 1;
      else headerGroups.push({ label, span: 1 });
    }
  }

  return (
    <section className="rounded-2xl border border-stone-300 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#a66c18] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              {getMonitoringSheetLabel(option)}
            </span>
            {cycleId && cycleId !== 'draft' && (
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[11px] font-bold border border-emerald-300">
                Cycle: {cycleId}
              </span>
            )}
            {loadingDb && (
              <span className="text-[11px] text-amber-700 italic animate-pulse">Loading saved chart…</span>
            )}
            {dbLoaded && !loadingDb && (
              <span className="text-[11px] text-emerald-700 font-medium">✓ Loaded from records</span>
            )}
          </div>
          <h3 className="mt-1 text-base font-extrabold uppercase tracking-wide text-slate-800">{layout.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{layout.hint}</p>
        </div>

        <div className="flex items-center gap-2">
          {toastMessage && (
            <span className="rounded-lg bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-800 animate-fadeIn">
              {toastMessage}
            </span>
          )}
          {cycleId && cycleId !== 'draft' && token && (
            <button
              type="button"
              disabled={savingDb}
              onClick={() => void handleSaveChart()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#a66c18] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#855512] active:scale-95 disabled:opacity-50"
            >
              <span>{savingDb ? 'Saving…' : '💾 Save Chart'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Clinical Color Key matching legacy smart Cycle.aspx */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-2 text-xs">
        <span className="font-extrabold uppercase tracking-wider text-[10px] text-stone-600 mr-1">
          Clinical Colors:
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-800 shadow-2xs">
          <span className="h-2 w-2 rounded-full border border-slate-400 bg-white" />
          Day 0 (Baseline)
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-[#f8bbd0] px-2 py-0.5 text-[10px] font-bold text-[#881337] shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-[#f472b6]" />
          Day 1 (Stim Start)
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-[#ffeb3b] px-2 py-0.5 text-[10px] font-bold text-[#713f12] shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Antagonist / Day 6
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400 bg-[#81c784] px-2 py-0.5 text-[10px] font-bold text-[#14532d] shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-700" />
          Trigger / HCG
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-rose-600 bg-[#ef5350] px-2 py-0.5 text-[10px] font-bold text-white shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-white" />
          OPU Retrieval
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-[#ce93d8] px-2 py-0.5 text-[10px] font-bold text-[#4a044e] shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-purple-700" />
          Prog. Conversion
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-lime-300 bg-[#d0e4a6] px-2 py-0.5 text-[10px] font-bold text-[#2d4a12] shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-lime-700" />
          Stimulation Days
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-300 shadow-xs">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead>
            {hasGroups && (
              <tr className="bg-[#a66c18] text-white">
                {headerGroups.map((group, index) => (
                  <th
                    key={`${group.label}-${index}`}
                    colSpan={group.span}
                    className={`px-2 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-wide text-white ${
                      group.label ? 'border-x border-b border-[#855512]' : ''
                    }`}
                  >
                    {group.label}
                  </th>
                ))}
              </tr>
            )}
            <tr>
              {layout.orientation === 'day-rows' ? null : (
                <th className="sticky left-0 z-20 min-w-[10.5rem] border-b border-r border-[#855512] bg-[#a66c18] px-3 py-2 text-left font-bold text-white uppercase tracking-wider text-[11px] shadow-sm">
                  Parameter
                </th>
              )}
              {layout.columns.map((col) => {
                const colColor = resolveMonSheetColumnColor(option, col.key, values);
                return (
                  <th
                    key={col.key}
                    style={{ backgroundColor: colColor.bg, color: colColor.text }}
                    className="min-w-[7.5rem] border-b border-r border-black/15 px-2 py-2 text-center font-bold text-xs shadow-2xs transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-extrabold">{col.label}</span>
                      {colColor.name !== 'Sage' && colColor.name !== 'White' && (
                        <span className="text-[9px] font-bold uppercase tracking-tight opacity-85">
                          {colColor.description}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {layout.orientation === 'day-rows'
              ? dayRowKeys.map((rowKey, idx) => {
                  const isDay1 = idx === 0;
                  const remarksText = (values[rowKey]?.remarks || '').toLowerCase();
                  const hasHcg = remarksText.includes('hcg') || remarksText.includes('trigger');
                  const isTerminated = values.meta?.terminated === 'yes';

                  const rowColor = isTerminated
                    ? MON_SHEET_COLORS.blue
                    : hasHcg
                    ? MON_SHEET_COLORS.green
                    : isDay1
                    ? MON_SHEET_COLORS.pink
                    : MON_SHEET_COLORS.sage;

                  return (
                    <tr
                      key={rowKey}
                      style={{ backgroundColor: rowColor.bg }}
                      className="border-b border-black/10 transition-colors"
                    >
                      {layout.columns.map((col) => (
                        <td key={col.key} className="border-r border-black/10 px-1 py-1">
                          <input
                            type={col.key === 'date' ? 'date' : 'text'}
                            readOnly={col.key === 'day'}
                            value={values[rowKey]?.[col.key] ?? ''}
                            onChange={(e) => updateCell(rowKey, col.key, e.target.value)}
                            style={{ color: rowColor.text }}
                            className="h-8 w-full min-w-[6.5rem] rounded-md border border-black/15 bg-white/45 px-2 text-sm font-semibold transition read-only:bg-white/60 read-only:font-bold hover:bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a66c18]"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })
              : layout.rows.map((row) => (
                  <tr key={row.key} className="border-b border-slate-200">
                    <th className="sticky left-0 z-10 border-r border-[#855512]/40 bg-[#a66c18] px-3 py-1.5 text-left font-semibold text-white text-xs whitespace-nowrap shadow-xs">
                      {row.label}
                    </th>
                    {layout.columns.map((col) => {
                      const colColor = resolveMonSheetColumnColor(option, col.key, values);
                      return (
                        <td
                          key={col.key}
                          style={{ backgroundColor: colColor.bg }}
                          className="border-b border-r border-black/10 px-1 py-1 transition-colors"
                        >
                          <input
                            type={row.kind === 'date' ? 'date' : row.kind === 'number' ? 'number' : 'text'}
                            value={values[row.key]?.[col.key] ?? ''}
                            onChange={(e) => updateCell(row.key, col.key, e.target.value)}
                            style={{ color: colColor.text }}
                            className="h-8 w-full min-w-[6.5rem] rounded-md border border-black/15 bg-white/45 px-2 text-sm font-semibold transition placeholder:text-slate-400 hover:bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#a66c18]"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {layout.option === 'IUI' && (
        <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={values.meta?.terminated === 'yes'}
              onChange={(e) => updateCell('meta', 'terminated', e.target.checked ? 'yes' : '')}
              className="h-4 w-4 accent-[#6345A6]"
            />
            Terminated
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Reason
            <select
              value={values.meta?.reason ?? ''}
              onChange={(e) => updateCell('meta', 'reason', e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
            >
              <option value="">Select</option>
              {IUI_STOP_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            Note
            <input
              value={values.meta?.note ?? ''}
              onChange={(e) => updateCell('meta', 'note', e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
            />
          </label>
        </div>
      )}
    </section>
  );
}
