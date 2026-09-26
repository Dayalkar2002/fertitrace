'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  emptyMonitoringChart,
  getMonitoringSheetLayout,
  IUI_STOP_REASONS,
  type MonitoringChartValues,
} from '@/lib/monitoring-sheet';
import { getMonitoringSheetLabel } from '@/lib/cycle-utils';

const STORAGE_PREFIX = 'fertitrace.monitoringChart';

interface CycleMonitoringChartProps {
  option: string;
  cycleId?: string;
}

export function CycleMonitoringChart({ option, cycleId }: CycleMonitoringChartProps) {
  const layout = useMemo(() => getMonitoringSheetLayout(option), [option]);
  const storageKey = `${STORAGE_PREFIX}.${cycleId || 'draft'}.${option || 'none'}`;
  const [values, setValues] = useState<MonitoringChartValues>({});

  useEffect(() => {
    if (!layout) {
      setValues({});
      return;
    }
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        setValues(JSON.parse(raw) as MonitoringChartValues);
        return;
      }
    } catch {
      /* ignore */
    }
    setValues(emptyMonitoringChart(layout));
  }, [layout, storageKey]);

  useEffect(() => {
    if (!layout || !Object.keys(values).length) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      /* ignore */
    }
  }, [layout, storageKey, values]);

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
    <section className="rounded-2xl border border-indigo-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
            {getMonitoringSheetLabel(option)}
          </p>
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">{layout.title}</h3>
          <p className="mt-1 text-xs text-slate-500">{layout.hint}</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-left text-xs">
          <thead>
            {hasGroups && (
              <tr className="bg-indigo-50/70">
                {headerGroups.map((group, index) => (
                  <th
                    key={`${group.label}-${index}`}
                    colSpan={group.span}
                    className={`px-2 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-wide text-indigo-700 ${
                      group.label ? 'border-x border-b border-indigo-200' : ''
                    }`}
                  >
                    {group.label}
                  </th>
                ))}
              </tr>
            )}
            <tr className="bg-slate-50">
              {layout.orientation === 'day-rows' ? null : (
                <th className="sticky left-0 z-10 min-w-[10rem] border-b border-r border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600">
                  Parameter
                </th>
              )}
              {layout.columns.map((col) => (
                <th
                  key={col.key}
                  className="min-w-[7.5rem] border-b border-slate-200 px-2 py-2 text-center font-bold text-slate-700"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {layout.orientation === 'day-rows'
              ? dayRowKeys.map((rowKey) => (
                  <tr key={rowKey} className="odd:bg-white even:bg-slate-50/60">
                    {layout.columns.map((col) => (
                      <td key={col.key} className="border-b border-slate-100 px-1.5 py-1">
                        <input
                          type={col.key === 'date' ? 'date' : 'text'}
                          readOnly={col.key === 'day'}
                          value={values[rowKey]?.[col.key] ?? ''}
                          onChange={(e) => updateCell(rowKey, col.key, e.target.value)}
                          className="h-8 w-full min-w-[6.5rem] rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800 read-only:bg-slate-50"
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : layout.rows.map((row) => (
                  <tr key={row.key} className="odd:bg-white even:bg-slate-50/60">
                    <th className="sticky left-0 z-10 border-r border-slate-200 bg-inherit px-3 py-1.5 text-left font-semibold text-slate-700">
                      {row.label}
                    </th>
                    {layout.columns.map((col) => (
                      <td key={col.key} className="border-b border-slate-100 px-1.5 py-1">
                        <input
                          type={row.kind === 'date' ? 'date' : row.kind === 'number' ? 'number' : 'text'}
                          value={values[row.key]?.[col.key] ?? ''}
                          onChange={(e) => updateCell(row.key, col.key, e.target.value)}
                          className="h-8 w-full min-w-[6.5rem] rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-800"
                        />
                      </td>
                    ))}
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
