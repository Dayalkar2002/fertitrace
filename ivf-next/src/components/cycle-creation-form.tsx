'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import {
  CYCLE_CREATION_STORAGE_KEY,
  CYCLE_CREATION_TYPES,
  getMonitoringSheetLabel,
  isMonitoringSheetAllowed,
  MONITORING_SHEET_OPTIONS,
  monitoringSheetHint,
  TREATMENT_TYPES,
} from '@/lib/cycle-utils';
import { listPatientCycles, previewCycleId, saveCycleCreation } from '@/lib/services/cycles';
import { listDoctors, type DoctorMasterRow } from '@/lib/services/masters';
import type { PatientCycleRow } from '@/lib/types/cycle';

function todayInput() {
  return new Date().toISOString().slice(0, 10);
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
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cycleType === 'FET' || cycleType === 'FrozenOocytes' || cycleType === 'ThawOocytes') {
      setTreatmentType('Frozen');
    }
    setMonitoringSheet((current) => (isMonitoringSheetAllowed(cycleType, current) ? current : ''));
  }, [cycleType]);

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
    return () => {
      cancelled = true;
    };
  }, [token, patId, satId]);

  async function saveAndNext() {
    if (!token || !selectedPatient) return;
    if (!startDate) {
      setError('Start date is required.');
      return;
    }
    if (!monitoringSheet) {
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
      router.push(`/cycle/entry?cycleId=${encodeURIComponent(saved.cycleId)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Failed to create cycle.');
    } finally {
      setSaving(false);
    }
  }

  function openSavedCycle(row: PatientCycleRow) {
    if (!selectedPatient) return;
    sessionStorage.setItem(
      CYCLE_CREATION_STORAGE_KEY,
      JSON.stringify({
        patientId: selectedPatient.id,
        satelliteId: satId,
        cycleId: row.cycleId,
        cycleType: row.cycleType,
        treatmentType:
          row.cycleType === 'FET' || row.cycleType === 'FrozenOocytes' || row.cycleType === 'ThawOocytes'
            ? 'Frozen'
            : 'Fresh',
        startDate: '',
        lmp: '',
        expectedOpuDate: '',
        consultantId: 0,
        protocol: '',
        monitoringSheet: row.monitoringSheet,
        notes: '',
      })
    );
    router.push(`/cycle/entry?cycleId=${encodeURIComponent(row.cycleId)}`);
  }

  const fieldCls =
    'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-[#6345A6] focus:outline-none focus:ring-1 focus:ring-[#6345A6]';
  const labelCls = 'w-40 shrink-0 pt-2 text-sm font-medium text-slate-600';

  return (
    <PatientRequired>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Cycle Creation</h1>
              <p className="mt-1 text-sm text-slate-500">Saved cycles for this patient, same source as SMART Cycle List.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCycleType('Fresh');
                setTreatmentType('Fresh');
                setMonitoringSheet('');
                setNotes('');
                setStartDate(todayInput());
                document.getElementById('cycle-creation-form')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + Add New
            </button>
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
                {savedCycles.map((row) => (
                  <tr key={row.cycleId} className="border-t border-slate-100 hover:bg-slate-50/80">
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => openSavedCycle(row)}
                        className="rounded-md bg-[#6345A6] px-3 py-1 text-xs font-semibold text-white hover:bg-[#553890]"
                      >
                        Select
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-slate-800">{row.cycleId}</td>
                    <td className="px-3 py-2.5 text-slate-700">{row.typeLabel}</td>
                    <td className="px-3 py-2.5 text-slate-600">{row.cycleDate || '—'}</td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600" title={row.postTreatment}>
                      {row.postTreatment || '—'}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600" title={row.advice}>
                      {row.advice || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="cycle-creation-form" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-6 text-lg font-bold text-slate-900">New cycle</h2>
          <div className="space-y-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>Patient ID</label>
              <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                <input readOnly value={selectedPatient?.uhid || String(patId)} className={`${fieldCls} max-w-xs bg-slate-50`} />
                <input readOnly value={patientName} className={`${fieldCls} max-w-xs bg-slate-50`} />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>
                Cycle ID (Auto) <span className="text-rose-500">*</span>
              </label>
              <input readOnly value={cycleId || 'Generating…'} className={`${fieldCls} max-w-xs bg-slate-50 font-semibold`} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>Cycle Type</label>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
                <select value={cycleType} onChange={(e) => setCycleType(e.target.value)} className={`${fieldCls} max-w-[260px]`}>
                  {CYCLE_CREATION_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <span className="text-sm font-medium text-slate-600">Treatment Type</span>
                <select
                  value={treatmentType}
                  onChange={(e) => setTreatmentType(e.target.value)}
                  className={`${fieldCls} max-w-[180px]`}
                >
                  {TREATMENT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>
                Start Date <span className="text-rose-500">*</span>
              </label>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`${fieldCls} max-w-[220px]`} />
                <span className="text-sm font-medium text-slate-600">LMP</span>
                <input type="date" value={lmp} onChange={(e) => setLmp(e.target.value)} className={`${fieldCls} max-w-[180px]`} />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className={labelCls}>Expected OPU Date</label>
              <input
                type="date"
                value={expectedOpuDate}
                onChange={(e) => setExpectedOpuDate(e.target.value)}
                className={`${fieldCls} max-w-[220px]`}
              />
            </div>

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

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <label className={`${labelCls} sm:pt-2`}>Protocol</label>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {MONITORING_SHEET_OPTIONS.map((item) => {
                    const allowed = isMonitoringSheetAllowed(cycleType, item.value);
                    return (
                      <label
                        key={item.value}
                        className={`flex items-center gap-2 text-sm font-medium ${
                          allowed ? 'text-slate-700' : 'cursor-not-allowed text-slate-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="monitoringSheet"
                          value={item.value}
                          checked={monitoringSheet === item.value}
                          disabled={!allowed}
                          onChange={() => {
                            if (allowed) setMonitoringSheet(item.value);
                          }}
                          className="h-4 w-4 accent-[#6345A6] disabled:cursor-not-allowed"
                        />
                        {item.label}
                      </label>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500">{monitoringSheetHint(cycleType)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <label className={labelCls}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-[#6345A6] focus:outline-none focus:ring-1 focus:ring-[#6345A6]"
              />
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveAndNext()}
              className="rounded-lg bg-[#6345A6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#553890] disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save & Next →'}
            </button>
          </div>
        </div>
      </div>
    </PatientRequired>
  );
}
