'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ModuleAlerts, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { CYCLE_CREATION_STORAGE_KEY, getMonitoringSheetLabel } from '@/lib/cycle-utils';
import { listPatientCycles } from '@/lib/services/cycles';
import { listIui } from '@/lib/services/iui';

type CycleStatus = 'Active' | 'Completed';

interface SummaryRow {
  id: string;
  source: 'ART' | 'IUI';
  category: string;
  typeLabel: string;
  protocol: string;
  startDate: Date | null;
  status: CycleStatus;
  cycleType: string;
  monitoringSheet: string;
  iuiOId: number;
}

const CATEGORIES: Array<{ code: string; label: string; tone: string }> = [
  { code: 'FR', label: 'Fresh', tone: 'bg-[#6345A6]' },
  { code: 'FET', label: 'Frozen Embryo Transfer', tone: 'bg-sky-600' },
  { code: 'FZO', label: 'Frozen Oocyte', tone: 'bg-teal-600' },
  { code: 'THO', label: 'Thaw Oocyte', tone: 'bg-cyan-600' },
  { code: 'ER', label: 'Embryo Recipient', tone: 'bg-rose-500' },
  { code: 'OD', label: 'Oocyte Donor', tone: 'bg-amber-500' },
  { code: 'OR', label: 'Oocyte Recipient', tone: 'bg-orange-600' },
  { code: 'IUI', label: 'IUI', tone: 'bg-emerald-600' },
  { code: 'HSA', label: 'HSA', tone: 'bg-lime-600' },
  { code: 'SQA', label: 'SQA', tone: 'bg-green-700' },
];

const ART_CATEGORY: Record<string, string> = {
  Fresh: 'FR',
  FET: 'FET',
  FrozenOocytes: 'FZO',
  ThawOocytes: 'THO',
  ER: 'ER',
  OD: 'OD',
  OR: 'OR',
  IUI: 'IUI',
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Accepts "03/Sep/2026" (cycle list) as well as ISO strings (IUI list). */
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const text = String(value).trim();
  const smart = text.match(/^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{4})$/);
  if (smart) {
    const month = MONTHS.indexOf(smart[2].toLowerCase());
    if (month >= 0) return new Date(Number(smart[3]), month, Number(smart[1]));
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
}

function cycleDay(row: SummaryRow): string {
  if (row.status !== 'Active' || !row.startDate) return '—';
  const days = Math.floor((Date.now() - row.startDate.getTime()) / 86_400_000) + 1;
  return days > 0 ? String(days) : '—';
}

function iuiCategory(indication: string): string {
  const text = indication.toUpperCase().replace(/\s+/g, '');
  if (text.includes('HSA')) return 'HSA';
  if (text.includes('SQA')) return 'SQA';
  return 'IUI';
}

function toInputDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function CycleSummary() {
  const router = useRouter();
  const { token } = useAuth();
  const { patId, satId, patientName, ready, selectedPatient } = usePatientIds();
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!token || !ready) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    void Promise.allSettled([listPatientCycles(token, patId, satId), listIui(token, patId, satId)])
      .then(([artRes, iuiRes]) => {
        if (cancelled) return;
        const next: SummaryRow[] = [];
        if (artRes.status === 'fulfilled') {
          for (const row of artRes.value) {
            next.push({
              id: row.cycleId,
              source: 'ART',
              category: ART_CATEGORY[row.cycleType] || 'FR',
              typeLabel: row.typeLabel.split(' - ')[0] || row.typeLabel,
              protocol: getMonitoringSheetLabel(row.monitoringSheet) || '—',
              startDate: parseDate(row.cycleDate),
              status: row.postTreatment || row.advice ? 'Completed' : 'Active',
              cycleType: row.cycleType,
              monitoringSheet: row.monitoringSheet,
              iuiOId: 0,
            });
          }
        }
        if (iuiRes.status === 'fulfilled') {
          const seen = new Set<string>();
          for (const row of iuiRes.value) {
            const id = String(row.IUIID || '').trim();
            if (!id || seen.has(id)) continue;
            seen.add(id);
            const indication = String(row.Indication || '').trim();
            next.push({
              id,
              source: 'IUI',
              category: iuiCategory(indication),
              typeLabel: indication || 'IUI',
              protocol: iuiCategory(indication) === 'IUI' ? 'IUI Monitoring Sheet' : '—',
              startDate: parseDate(row.IUIODateOfCreation),
              status: row.IUIOPostTreat || row.IUIOAdvice ? 'Completed' : 'Active',
              cycleType: 'IUI',
              monitoringSheet: 'IUI',
              iuiOId: Number(row.IUIOID ?? 0),
            });
          }
        }
        next.sort((a, b) => (b.startDate?.getTime() ?? 0) - (a.startDate?.getTime() ?? 0));
        setRows(next);
        if (artRes.status === 'rejected' && iuiRes.status === 'rejected') {
          const reason = artRes.reason;
          setError(reason instanceof ApiError ? reason.message : 'Failed to load cycles.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, ready, patId, satId]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.category, (map.get(row.category) || 0) + 1);
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (category !== 'All' && row.category !== category) return false;
      if (status !== 'All' && row.status !== status) return false;
      if (needle && !`${row.id} ${row.typeLabel}`.toLowerCase().includes(needle)) return false;
      const day = row.startDate ? toInputDate(row.startDate) : '';
      if (fromDate && (!day || day < fromDate)) return false;
      if (toDate && (!day || day > toDate)) return false;
      return true;
    });
  }, [rows, search, category, status, fromDate, toDate]);

  useEffect(() => setPage(1), [search, category, status, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  function openCycle(row: SummaryRow) {
    if (row.source === 'IUI') {
      router.push(`/iui/${encodeURIComponent(row.id)}?iuiOId=${row.iuiOId}`);
      return;
    }
    sessionStorage.setItem(
      CYCLE_CREATION_STORAGE_KEY,
      JSON.stringify({
        patientId: patId,
        satelliteId: satId,
        cycleId: row.id,
        cycleType: row.cycleType,
        treatmentType: ['FET', 'FrozenOocytes', 'ThawOocytes'].includes(row.cycleType) ? 'Frozen' : 'Fresh',
        startDate: '',
        lmp: '',
        expectedOpuDate: '',
        consultantId: 0,
        protocol: '',
        monitoringSheet: row.monitoringSheet,
        notes: '',
      })
    );
    router.push(`/cycle/entry?cycleId=${encodeURIComponent(row.id)}`);
  }

  const inputCls = 'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#6345A6] focus:outline-none focus:ring-2 focus:ring-[#6345A6]/10';

  return (
    <PatientRequired>
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Patient ID', value: selectedPatient?.uhid || String(patId), accent: true },
            { label: 'Patient Name', value: patientName },
            { label: 'Age / Sex', value: `${selectedPatient?.age || '—'} Y / ${(selectedPatient?.gender || '—').slice(0, 1)}` },
            { label: 'Primary Phone', value: selectedPatient?.mobile || selectedPatient?.phone || '—' },
            { label: 'Aadhar No.', value: selectedPatient?.aadhar || '—' },
            { label: 'Partner', value: selectedPatient?.partner || '—' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
              <div className={`text-sm font-bold ${item.accent ? 'text-[#123E73]' : 'text-slate-800'}`}>{item.value || '—'}</div>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="bg-[#123E73] px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
            Patient Cycle Management
          </div>
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory('All')}
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  category === 'All' ? 'border-[#123E73] bg-[#123E73] text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Cycles <span className="ml-1 opacity-80">{rows.length}</span>
              </button>
              {CATEGORIES.map((cat) => {
                const count = counts.get(cat.code) || 0;
                const active = category === cat.code;
                return (
                  <button
                    key={cat.code}
                    type="button"
                    onClick={() => setCategory(active ? 'All' : cat.code)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      active ? 'border-[#6345A6] bg-purple-50 text-[#6345A6]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    } ${count === 0 ? 'opacity-50' : ''}`}
                  >
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-black text-white ${cat.tone}`}>{cat.code}</span>
                    {cat.label}
                    <span className="font-bold">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
              <label className="text-[11px] font-semibold text-slate-500">
                Search
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Cycle ID / Type"
                  className={`${inputCls} mt-1`}
                />
              </label>
              <label className="text-[11px] font-semibold text-slate-500">
                Cycle Status
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} mt-1`}>
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-500">
                Cycle Type
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} mt-1`}>
                  <option value="All">All</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.code}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-slate-500">
                From Date
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={`${inputCls} mt-1`} />
              </label>
              <label className="text-[11px] font-semibold text-slate-500">
                To Date
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={`${inputCls} mt-1`} />
              </label>
              <div className="flex items-end">
                <Link
                  href="/cycle/creation"
                  className="flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  + New Cycle
                </Link>
              </div>
            </div>
          </div>
        </section>

        <ModuleAlerts error={error} />

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="bg-[#123E73] px-4 py-2 text-xs font-black uppercase tracking-wide text-white">Cycle List</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Cycle ID</th>
                  <th className="px-4 py-2.5">Patient ID</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Cycle Type</th>
                  <th className="px-4 py-2.5">Protocol</th>
                  <th className="px-4 py-2.5">Cycle Day</th>
                  <th className="px-4 py-2.5">Start Date</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                      Loading cycles…
                    </td>
                  </tr>
                )}
                {!loading && visible.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-slate-500">
                      {rows.length ? 'No cycles match the filters.' : 'No cycles recorded for this patient yet.'}
                    </td>
                  </tr>
                )}
                {!loading &&
                  visible.map((row) => {
                    const cat = CATEGORIES.find((item) => item.code === row.category);
                    return (
                      <tr key={`${row.source}-${row.id}`} className="border-t border-slate-100 hover:bg-slate-50/70">
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => openCycle(row)}
                            className="font-mono font-bold text-[#1A56A8] hover:underline"
                          >
                            {row.id}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{selectedPatient?.uhid || patId}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-black text-white ${cat?.tone || 'bg-slate-500'}`}>
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">{row.typeLabel}</td>
                        <td className="px-4 py-2.5 text-slate-700">{row.protocol}</td>
                        <td className="px-4 py-2.5 text-slate-700">{cycleDay(row)}</td>
                        <td className="px-4 py-2.5 text-slate-700">{formatDate(row.startDate)}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${
                              row.status === 'Active'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-sky-200 bg-sky-50 text-sky-700'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openCycle(row)}
                              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-purple-300 hover:text-[#6345A6]"
                            >
                              Open
                            </button>
                            <Link
                              href={row.source === 'IUI' ? '/reports/andrology/iui' : '/reports/art-cycle'}
                              className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-purple-300 hover:text-[#6345A6]"
                            >
                              Summary
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            <span>
              Showing {filtered.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, filtered.length)} of{' '}
              {filtered.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
              >
                ‹
              </button>
              <span className="rounded bg-[#123E73] px-2.5 py-1 font-bold text-white">{page}</span>
              <span>/ {pageCount}</span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </section>
        <p className="text-[11px] text-slate-400">
          Status shows Completed once a post-treatment or advice outcome is saved for the cycle; Cycle Day counts from the start date for active cycles.
        </p>
      </div>
    </PatientRequired>
  );
}
