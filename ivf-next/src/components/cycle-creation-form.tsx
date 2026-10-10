'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { CycleMonitoringChart } from '@/components/cycle-monitoring-chart';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import {
  CYCLE_CREATION_STORAGE_KEY,
  CYCLE_CREATION_TYPES,
  getMonitoringSheetLabel,
  IUI_TREATMENT_OPTIONS,
  isMonitoringSheetAllowed,
  MONITORING_SHEET_OPTIONS,
  monitoringSheetHint,
  requiresMonitoringSheet,
  TREATMENT_TYPES,
} from '@/lib/cycle-utils';
import { fetchCryoStockSummary, listPatientCycles, previewCycleId, saveCycleCreation } from '@/lib/services/cycles';
import { listDoctors, type DoctorMasterRow } from '@/lib/services/masters';
import type { CryoStockSummary, PatientCycleRow } from '@/lib/types/cycle';
import dynamic from 'next/dynamic';

const CycleHistoryTab = dynamic(() => import('@/components/cycle-tabs').then((m) => m.CycleHistoryTab), {
  loading: () => <div className="p-4 text-xs text-slate-500">Loading History…</div>,
  ssr: false,
});
const CycleSurvivalTab = dynamic(() => import('@/components/cycle-tabs').then((m) => m.CycleSurvivalTab), {
  loading: () => <div className="p-4 text-xs text-slate-500">Loading Survival Report…</div>,
  ssr: false,
});
const CycleOutcomeTab = dynamic(() => import('@/components/cycle-tabs').then((m) => m.CycleOutcomeTab), {
  loading: () => <div className="p-4 text-xs text-slate-500">Loading Outcome…</div>,
  ssr: false,
});

const CYCLE_TYPE_CARDS: Record<string, { code: string; title: string; hint: string; tone: string }> = {
  Fresh: { code: 'FR', title: 'Fresh Cycle', hint: 'IVF / ICSI with OPU', tone: 'bg-[#6345A6]' },
  FET: { code: 'FET', title: 'Frozen Embryo Transfer', hint: 'Thaw embryos + ET', tone: 'bg-sky-600' },
  FrozenOocytes: { code: 'FZO', title: 'Frozen Oocyte', hint: 'Oocyte freezing', tone: 'bg-teal-600' },
  ThawOocytes: { code: 'THO', title: 'Thaw Oocyte', hint: 'Thaw frozen oocytes', tone: 'bg-cyan-600' },
  ER: { code: 'ER', title: 'Embryo Recipient', hint: 'Receives donated embryos', tone: 'bg-rose-500' },
  OD: { code: 'OD', title: 'Oocyte Donor', hint: 'Donates oocytes', tone: 'bg-amber-500' },
  OR: { code: 'OR', title: 'Oocyte Recipient', hint: 'Receives donor oocytes', tone: 'bg-orange-600' },
  IUI: { code: 'IUI', title: 'IUI', hint: 'Insemination / HSA / SQA', tone: 'bg-emerald-600' },
};

function parseCycleDateToYMD(dateStr: string): string {
  if (!dateStr || dateStr === '—') return todayInput();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return todayInput();
}
function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function CycleCreationForm() {
  const router = useRouter();
  const { token } = useAuth();
  const { patId, satId, patientName, selectedPatient } = usePatientIds();
  const [cycleId, setCycleId] = useState('');
  const [cycleType, setCycleType] = useState('Fresh');
  const [treatmentType, setTreatmentType] = useState('Fresh');
  const [startDate, setStartDate] = useState(todayInput);
  const [lmp, setLmp] = useState('');
  const [expectedOpuDate, setExpectedOpuDate] = useState('');
  const [consultantId, setConsultantId] = useState(0);
  const [monitoringSheet, setMonitoringSheet] = useState('');
  const [notes, setNotes] = useState('');
  const [doctors, setDoctors] = useState<DoctorMasterRow[]>([]);
  const [savedCycles, setSavedCycles] = useState<PatientCycleRow[]>([]);
  const [cryoStock, setCryoStock] = useState<CryoStockSummary>({
    etFrozen: 0,
    btFrozen: 0,
    totalFrozenOocytes: 0,
    miiFrozen: 0,
    miFrozen: 0,
    gvFrozen: 0,
  });
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeSmartTab, setActiveSmartTab] = useState<'none' | 'history' | 'survival' | 'outcome'>('none');

  // Check if cycle type involves egg retrieval (OPU)
  const isOpuCycle = cycleType === 'Fresh' || cycleType === 'FrozenOocytes' || cycleType === 'OD';

  useEffect(() => {
    if (cycleType === 'IUI') {
      setTreatmentType((current) =>
        IUI_TREATMENT_OPTIONS.some((item) => item.value === current) ? current : 'SingleHusband'
      );
      setMonitoringSheet('IUI');
      return;
    }
    if (cycleType === 'FET' || cycleType === 'FrozenOocytes' || cycleType === 'ThawOocytes') {
      setTreatmentType('Frozen');
    } else if (IUI_TREATMENT_OPTIONS.some((item) => item.value === treatmentType)) {
      setTreatmentType('Fresh');
    }
    setMonitoringSheet((current) => (isMonitoringSheetAllowed(cycleType, current) ? current : ''));
  }, [cycleType]);

  useEffect(() => {
    if (cycleType !== 'IUI') return;
    if (!requiresMonitoringSheet(cycleType, treatmentType)) {
      setMonitoringSheet('');
      return;
    }
    setMonitoringSheet('IUI');
  }, [cycleType, treatmentType]);

  useEffect(() => {
    if (!token) return;
    void listDoctors(token)
      .then(setDoctors)
      .catch(() => setDoctors([]));
  }, [token]);

  useEffect(() => {
    if (!token || !patId) {
      setCycleId('');
      setSavedCycles([]);
      setCryoStock({
        etFrozen: 0,
        btFrozen: 0,
        totalFrozenOocytes: 0,
        miiFrozen: 0,
        miFrozen: 0,
        gvFrozen: 0,
      });
      return;
    }
    let cancelled = false;
    previewCycleId(token, patId, satId)
      .then((id) => {
        if (!cancelled) setCycleId(id);
      })
      .catch(() => {
        if (!cancelled) setCycleId(`C${patId}1`);
      });
    setLoadingCycles(true);
    void listPatientCycles(token, patId, satId)
      .then((rows) => {
        if (!cancelled) setSavedCycles(rows);
      })
      .catch(() => {
        if (!cancelled) setSavedCycles([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCycles(false);
      });
    void fetchCryoStockSummary(token, patId, satId)
      .then((summary) => {
        if (!cancelled && summary) setCryoStock(summary);
      })
      .catch(() => {
        /* keep default */
      });
    return () => {
      cancelled = true;
    };
  }, [token, patId, satId]);

  // Keyboard shortcut: Ctrl+S / Cmd+S to Save & Next
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveAndNext();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  async function saveAndNext() {
    if (!token || !selectedPatient) return;
    if (!startDate) {
      setError('Start date is required.');
      return;
    }
    if (requiresMonitoringSheet(cycleType, treatmentType) && !monitoringSheet) {
      setError('Select a Monitoring Sheet option.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await saveCycleCreation(token, {
        patientId: selectedPatient.id,
        satelliteId: satId,
        cycleId,
        cycleType,
        treatmentType,
        startDate,
        lmp,
        expectedOpuDate,
        consultantId,
        protocol: getMonitoringSheetLabel(monitoringSheet),
        monitoringSheet,
        notes,
      });
      sessionStorage.setItem(CYCLE_CREATION_STORAGE_KEY, JSON.stringify(saved));
      setToastMessage('Cycle created successfully! Proceeding to retrieval…');
      setTimeout(() => {
        router.push(`/cycle/entry?cycleId=${encodeURIComponent(saved.cycleId)}`);
      }, 500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to create cycle.');
    } finally {
      setSaving(false);
    }
  }

  function selectSavedCycle(row: PatientCycleRow, redirect = false) {
    setCycleId(row.cycleId);
    const resolvedType = row.cycleType || 'Fresh';
    setCycleType(resolvedType);
    const treatType =
      resolvedType === 'FET' || resolvedType === 'FrozenOocytes' || resolvedType === 'ThawOocytes'
        ? 'Frozen'
        : 'Fresh';
    setTreatmentType(treatType);
    if (row.cycleDate) {
      setStartDate(parseCycleDateToYMD(row.cycleDate));
    }
    // Select protocol so the monitoring sheet appears below it
    let sheet = row.monitoringSheet;
    if (!sheet) {
      if (resolvedType === 'IUI') sheet = 'IUI';
      else if (resolvedType === 'FET' || resolvedType === 'ThawOocytes' || resolvedType === 'ER') sheet = 'HRT';
      else sheet = 'Antagonist';
    }
    setMonitoringSheet(sheet);
    setNotes(row.advice || row.postTreatment || '');
    try {
      sessionStorage.setItem(
        CYCLE_CREATION_STORAGE_KEY,
        JSON.stringify({
          patientId: selectedPatient?.id || patId,
          satelliteId: satId,
          cycleId: row.cycleId,
          cycleType: resolvedType,
          treatmentType: treatType,
          startDate: row.cycleDate ? parseCycleDateToYMD(row.cycleDate) : startDate,
          monitoringSheet: sheet,
          notes: row.advice || row.postTreatment || '',
        })
      );
    } catch {}

    if (redirect) {
      router.push(`/cycle/entry?cycleId=${encodeURIComponent(row.cycleId)}`);
      return;
    }

    setToastMessage(`Loaded Cycle ${row.cycleId}. Dropping down to Cycle Monitoring Sheet.`);
    setTimeout(() => setToastMessage(null), 3500);

    // Smooth scroll down to the Cycle Monitoring Sheet section
    setTimeout(() => {
      const el = document.getElementById('cycle-monitoring-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  }

  function handleCopyCycleId() {
    if (!cycleId) return;
    navigator.clipboard.writeText(cycleId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  const fieldCls =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-xs transition focus:border-[#6345A6] focus:outline-none focus:ring-2 focus:ring-[#6345A6]/10';
  const labelCls = 'w-40 shrink-0 pt-2 text-sm font-medium text-slate-600';

  return (
    <PatientRequired>
      <div className="mx-auto max-w-6xl space-y-5">
        
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
            <span className="text-xs font-bold text-slate-800">{toastMessage}</span>
          </div>
        )}

        {/* SMART Cryo Stock Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-xs shadow-2xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-emerald-950 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-600">ET Frozen :</span>
              <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">{cryoStock.etFrozen}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-600">BT Frozen :</span>
              <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">{cryoStock.btFrozen}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-600">Total Frozen Oocytes :</span>
              <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">{cryoStock.totalFrozenOocytes}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-600">MII Frozen :</span>
              <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">{cryoStock.miiFrozen}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-600">MI Frozen :</span>
              <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">{cryoStock.miFrozen}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-slate-600">GV Frozen :</span>
              <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">{cryoStock.gvFrozen}</strong>
            </span>
          </div>
        </div>

        {/* 1. Saved Cycles Table Card (Preserved Layout) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Cycle Creation</h1>
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 border border-purple-200">
                  {savedCycles.length} Saved Cycles
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Saved cycles for this patient, same source as SMART Cycle List.</p>
            </div>
            <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/cycle/summary')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-purple-300 hover:text-[#6345A6] transition shadow-xs"
            >
              Cycle Summary
            </button>
            <button
              type="button"
              onClick={() => {
                if (patId && token) {
                  previewCycleId(token, patId, satId)
                    .then(setCycleId)
                    .catch(() => setCycleId(`C${patId}1`));
                }
                setCycleType('Fresh');
                setTreatmentType('Fresh');
                setMonitoringSheet('');
                setNotes('');
                setStartDate(todayInput());
                setExpectedOpuDate('');
                setToastMessage('New cycle draft started. Choose cycle type and protocol below.');
                setTimeout(() => setToastMessage(null), 3000);
                document.getElementById('cycle-creation-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-xs active:scale-[0.99]"
            >
              <span>+</span>
              <span>Add New</span>
            </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Go To</th>
                  <th className="px-3 py-2.5">Cycle Id</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Cycle Date</th>
                  <th className="px-3 py-2.5">Post Treatment</th>
                  <th className="px-3 py-2.5">Advice</th>
                </tr>
              </thead>
              <tbody>
                {loadingCycles && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      Loading saved cycles…
                    </td>
                  </tr>
                )}
                {!loadingCycles && savedCycles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      No saved cycles for this patient yet.
                    </td>
                  </tr>
                )}
                {savedCycles.map((row) => {
                  const isSelected = row.cycleId === cycleId;
                  return (
                    <tr
                      key={row.cycleId}
                      onClick={() => selectSavedCycle(row, false)}
                      className={`border-t border-slate-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-purple-100/60 ring-1 ring-purple-300' : 'hover:bg-purple-50/70'
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectSavedCycle(row, false);
                          }}
                          className={`rounded-md px-3 py-1 text-xs font-semibold transition shadow-2xs inline-flex items-center gap-1 active:scale-95 ${
                            isSelected
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-[#6345A6] hover:bg-[#553890] text-white'
                          }`}
                          title={`Select cycle ${row.cycleId} and view monitoring sheet below`}
                        >
                          <span>{isSelected ? 'Viewing' : 'Select'}</span>
                          <span className="text-[11px]">{isSelected ? '✓' : '↓'}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800 font-mono">
                        {row.cycleId}
                        {isSelected && (
                          <span className="ml-2 rounded-full bg-purple-200 text-purple-900 px-2 py-0.5 text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{row.typeLabel}</td>
                      <td className="px-3 py-2.5 text-slate-600">{row.cycleDate || '—'}</td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600" title={row.postTreatment}>
                        {row.postTreatment || '—'}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600" title={row.advice}>
                        {row.advice || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. New Cycle Form Card (Preserved Layout with Latest Friendly Features) */}
        <div id="cycle-creation-form" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">New cycle</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
                Press ⌘S or Ctrl+S to save
              </span>
            </div>
          </div>

          <div className="space-y-5">
            {/* Patient ID Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>Patient ID</label>
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                <input readOnly value={selectedPatient?.uhid || String(patId)} className={`${fieldCls} max-w-xs bg-slate-50 font-mono`} />
                <input readOnly value={patientName} className={`${fieldCls} max-w-xs bg-slate-50 font-medium`} />
              </div>
            </div>

            {/* Cycle ID (Auto) with 1-Click Copy */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>
                Cycle ID (Auto) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input readOnly value={cycleId || 'Generating…'} className={`${fieldCls} max-w-xs bg-slate-50 font-bold font-mono text-purple-700`} />
                {cycleId && (
                  <button
                    type="button"
                    onClick={handleCopyCycleId}
                    title="Copy Cycle ID"
                    className="flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
                  >
                    <span>{copiedId ? '✓' : '📋'}</span>
                    <span>{copiedId ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cycle Type */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <label className={labelCls}>Cycle Type</label>
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 md:grid-cols-4">
                {CYCLE_CREATION_TYPES.map((item) => {
                  const meta = CYCLE_TYPE_CARDS[item.value];
                  const active = cycleType === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCycleType(item.value)}
                      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? 'border-[#6345A6] bg-purple-50 ring-2 ring-[#6345A6]/20'
                          : 'border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/40'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white ${meta.tone}`}
                      >
                        {meta.code}
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-xs font-bold ${active ? 'text-[#6345A6]' : 'text-slate-800'}`}>
                          {meta.title}
                        </span>
                        <span className="block text-[10px] leading-tight text-slate-500">{meta.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Treatment Type */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <label className={labelCls}>Treatment Type</label>
              <div className="min-w-0 flex-1 space-y-2">
                {(cycleType === 'IUI'
                  ? (['Fresh', 'Frozen'] as const).map((group) => ({
                      group,
                      items: IUI_TREATMENT_OPTIONS.filter((item) => item.group === group),
                    }))
                  : [{ group: '', items: TREATMENT_TYPES }]
                ).map(({ group, items }) => (
                  <div key={group || 'all'} className="flex flex-wrap items-center gap-2">
                    {group && (
                      <span className="w-14 text-[10px] font-bold uppercase tracking-wide text-slate-400">{group}</span>
                    )}
                    {items.map((item) => {
                      const active = treatmentType === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setTreatmentType(item.value)}
                          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-[#6345A6] bg-[#6345A6] text-white shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:text-[#6345A6]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Start Date & LMP with 1-Click Quick Presets */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>
                Start Date <span className="text-rose-500">*</span>
              </label>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${fieldCls} max-w-[220px]`} />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setStartDate(todayInput())}
                      className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-purple-100 hover:text-purple-700 transition"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setStartDate(addDaysToDate(todayInput(), -1))}
                      className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>

                <span className="text-sm font-medium text-slate-600">LMP</span>
                <div className="flex items-center gap-2">
                  <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} className={`${fieldCls} max-w-[180px]`} />
                  <button
                    type="button"
                    onClick={() => setLmp(addDaysToDate(startDate, -14))}
                    title="Set LMP to 14 days before start date"
                    className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition"
                  >
                    -14d
                  </button>
                </div>
              </div>
            </div>

            {/* Expected OPU Date with Auto-Calculation Presets */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>Expected OPU Date</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={expectedOpuDate}
                  onChange={(e) => setExpectedOpuDate(e.target.value)}
                  className={`${fieldCls} max-w-[220px]`}
                />
                {isOpuCycle ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setExpectedOpuDate(addDaysToDate(startDate, 14))}
                      className="rounded bg-purple-50 border border-purple-200 px-2 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition"
                    >
                      +14 Days (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpectedOpuDate(addDaysToDate(startDate, 12))}
                      className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition"
                    >
                      +12 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpectedOpuDate(addDaysToDate(startDate, 16))}
                      className="rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 transition"
                    >
                      +16 Days
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">OPU not required for {cycleType}</span>
                )}
              </div>
            </div>

            {/* Consultant Doctor */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>Consultant</label>
              <select
                value={consultantId}
                onChange={(e) => setConsultantId(Number(e.target.value))}
                className={`${fieldCls} max-w-xs`}
              >
                <option value={0}>Select consultant</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* SMART Application Cycle Entry Module Tabs */}
            <div className="pt-3 pb-2">
              <div className="rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/90 via-slate-50 to-amber-50/40 p-2 sm:p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6345A6] text-white text-xs shadow-2xs font-bold">
                    ⚙️
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-900 block leading-tight">
                      Cycle Entry Module
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Access history, survival analysis, charts and clinical outcomes
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-purple-100/80 shadow-2xs text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveSmartTab(activeSmartTab === 'history' ? 'none' : 'history')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                      activeSmartTab === 'history'
                        ? 'bg-[#6345A6] text-white shadow-xs font-bold ring-2 ring-purple-300/60'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
                    }`}
                  >
                    <span>📋</span>
                    <span>History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSmartTab(activeSmartTab === 'survival' ? 'none' : 'survival')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                      activeSmartTab === 'survival'
                        ? 'bg-[#6345A6] text-white shadow-xs font-bold ring-2 ring-purple-300/60'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
                    }`}
                  >
                    <span>🧬</span>
                    <span>Survival Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById('cycle-monitoring-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-purple-700 hover:bg-purple-50/70 transition cursor-pointer"
                  >
                    <span>📊</span>
                    <span>Monitoring Chart</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const targetId = cycleId || (savedCycles[0]?.cycleId ?? '');
                      if (targetId) {
                        router.push(`/cycle/entry?cycleId=${encodeURIComponent(targetId)}`);
                      } else {
                        router.push('/cycle/entry');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition cursor-pointer font-bold"
                    title="Open Cycle Retrieval"
                  >
                    <span>🧪</span>
                    <span>Retrieval →</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSmartTab(activeSmartTab === 'outcome' ? 'none' : 'outcome')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                      activeSmartTab === 'outcome'
                        ? 'bg-[#6345A6] text-white shadow-xs font-bold ring-2 ring-purple-300/60'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/70'
                    }`}
                  >
                    <span>🎯</span>
                    <span>Outcome</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-purple-100/70 text-purple-900 border border-purple-200/80 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
                  <span className="text-[10px] uppercase tracking-wider text-purple-600 font-sans font-semibold">CycID:</span>
                  <span>{cycleId || '—'}</span>
                </div>
              </div>

              {/* Inline Smart Tab Content Panel */}
              {activeSmartTab !== 'none' && (
                <div className="mt-3 rounded-2xl border border-purple-200/90 bg-white p-4 sm:p-6 shadow-sm transition-all animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-[#6345A6] text-sm font-bold">
                        {activeSmartTab === 'survival' ? '🧬' : activeSmartTab === 'history' ? '📋' : '🎯'}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm capitalize leading-tight">
                          {activeSmartTab === 'survival' ? 'Survival Report & Semen Analysis' : activeSmartTab === 'history' ? 'Patient History & Previous Attempts' : 'Cycle Clinical Outcome'}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Active Cycle ID: <strong className="text-purple-700">{cycleId || '—'}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSmartTab('none')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 rounded-lg px-2.5 py-1 hover:bg-rose-50 transition border border-transparent hover:border-rose-100 cursor-pointer"
                    >
                      <span>✕</span>
                      <span>Close</span>
                    </button>
                  </div>
                  {cycleId ? (
                    <>
                      {activeSmartTab === 'history' && <CycleHistoryTab cycleId={cycleId} />}
                      {activeSmartTab === 'survival' && <CycleSurvivalTab cycleId={cycleId} />}
                      {activeSmartTab === 'outcome' && <CycleOutcomeTab cycleId={cycleId} />}
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-6 text-center text-xs text-amber-800">
                      Please select an existing cycle from the list above or save this draft first to enter {activeSmartTab}.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Protocol */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <label className={`${labelCls} sm:pt-2`}>Protocol</label>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {MONITORING_SHEET_OPTIONS.map((item) => {
                    const isExistingCycle = Boolean(cycleId && cycleId !== 'draft' && savedCycles.some((c) => c.cycleId === cycleId));
                    const currentSaved = savedCycles.find((c) => c.cycleId === cycleId);
                    const filledSheet = currentSaved?.monitoringSheet || monitoringSheet || 'Antagonist';
                    const allowed = isExistingCycle
                      ? item.value === filledSheet
                      : isMonitoringSheetAllowed(cycleType, item.value, treatmentType);
                    const disabled = !allowed;
                    return (
                      <label
                        key={item.value}
                        title={
                          isExistingCycle && disabled
                            ? 'Disabled: Only filled monitoring sheet data is available for this cycle'
                            : undefined
                        }
                        className={`flex items-center gap-2 text-sm font-medium transition ${
                          !disabled ? 'text-slate-700 hover:text-purple-700 cursor-pointer' : 'cursor-not-allowed opacity-40 text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="monitoringSheet"
                          value={item.value}
                          checked={monitoringSheet === item.value}
                          disabled={disabled}
                          onChange={() => {
                            if (!disabled) setMonitoringSheet(item.value);
                          }}
                          className="h-4 w-4 accent-[#6345A6] disabled:cursor-not-allowed"
                        />
                        <span>{item.label}</span>
                        {!disabled && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Valid protocol for this cycle" />
                        )}
                        {isExistingCycle && !disabled && (
                          <span className="ml-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.2">
                            ✓ Filled
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">{monitoringSheetHint(cycleType, treatmentType)}</p>
              </div>
            </div>

            {/* Dedicated Cycle Monitoring Sheet Section */}
            <div
              id="cycle-monitoring-section"
              className="scroll-mt-6 rounded-2xl border-2 border-purple-200 bg-slate-50/60 p-4 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6345A6] text-white text-base shadow-2xs">
                    📊
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Cycle Monitoring Sheet
                      </h3>
                      {cycleId && (
                        <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-800 border border-purple-200">
                          {cycleId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Protocol:{' '}
                      <strong className="text-purple-900">
                        {getMonitoringSheetLabel(monitoringSheet) || 'Select protocol above'}
                      </strong>{' '}
                      · Review stimulation & follicle development, then proceed to retrieval.
                    </p>
                  </div>
                </div>

                {/* Top Next Button */}
                <button
                  type="button"
                  onClick={() => {
                    const targetId = cycleId || (savedCycles[0]?.cycleId ?? '');
                    if (targetId) {
                      router.push(`/cycle/entry?cycleId=${encodeURIComponent(targetId)}`);
                    } else {
                      router.push('/cycle/entry');
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:shadow transition active:scale-95"
                  title="Proceed to Cycle Retrieval Screen"
                >
                  <span>Next: Go to Cycle Retrieval Screen</span>
                  <span className="text-base font-black">→</span>
                </button>
              </div>

              {monitoringSheet ? (
                <CycleMonitoringChart option={monitoringSheet} cycleId={cycleId || 'draft'} />
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                  Select a protocol above or click &quot;Select&quot; on a saved cycle to view its monitoring sheet.
                </div>
              )}

              {/* Bottom Next Button after viewing the monitoring sheet */}
              {monitoringSheet && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-purple-100 pt-3">
                  <p className="text-xs text-slate-500">
                    Finished reviewing monitoring sheet? Proceed directly to cycle retrieval.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = cycleId || (savedCycles[0]?.cycleId ?? '');
                      if (targetId) {
                        router.push(`/cycle/entry?cycleId=${encodeURIComponent(targetId)}`);
                      } else {
                        router.push('/cycle/entry');
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-95"
                  >
                    <span>Next: Go to Cycle Retrieval Screen</span>
                    <span className="text-base font-black">→</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notes with Real-time Character Counter */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <label className={labelCls}>Notes</label>
              <div className="w-full">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Clinical notes, stimulation observations, or special instructions..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-xs focus:border-[#6345A6] focus:outline-none focus:ring-2 focus:ring-[#6345A6]/10"
                />
                <div className="mt-1 text-right text-[11px] text-slate-400">
                  {notes.length} / 500 characters
                </div>
              </div>
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 animate-fadeIn">{error}</p>}

          {/* Form Actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-[0.99]"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-slate-400 font-mono">
                ⌘S / Ctrl+S
              </span>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveAndNext()}
                className="flex items-center gap-2 rounded-lg bg-[#6345A6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#553890] transition active:scale-[0.99] disabled:opacity-60"
              >
                <span>{saving ? 'Saving…' : 'Save & Next →'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PatientRequired>
  );
}
