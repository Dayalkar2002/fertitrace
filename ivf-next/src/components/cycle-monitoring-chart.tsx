'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  emptyMonitoringChart,
  getMonitoringSheetLayout,
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
          Choose Agonist, Antagonist, HRT or Modified Natural on Cycle Creation. The matching chart opens here on retrieval.
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
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 min-w-[10rem] border-b border-r border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-600">
                Parameter
              </th>
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
            {layout.rows.map((row) => (
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
    </section>
  );
}
