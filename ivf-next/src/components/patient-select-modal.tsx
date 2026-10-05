'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePatient } from '@/contexts/patient-context';
import type { Patient } from '@/lib/types/patient';

function patientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function formatAge(age: number | null | undefined): string {
  if (age === null || age === undefined || Number.isNaN(Number(age))) return '—';
  return `${age}Y`;
}

interface PatientSelectModalProps {
  open: boolean;
  onClose: () => void;
}

export function PatientSelectModal({ open, onClose }: PatientSelectModalProps) {
  const {
    satellites,
    patients,
    loading,
    error,
    selectedSatellite,
    loadSatellites,
    loadPatients,
    selectSatellite,
    selectPatient,
  } = usePatient();

  const [satelliteId, setSatelliteId] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    void loadSatellites();
  }, [open, loadSatellites]);

  useEffect(() => {
    if (!open || satellites.length === 0) return;
    const sat = selectedSatellite ?? satellites[0];
    if (sat) {
      setSatelliteId(String(sat.id));
      selectSatellite(sat);
      void loadPatients(sat.id);
    }
  }, [open, satellites, selectedSatellite, selectSatellite, loadPatients]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p: Patient) => {
      const haystack = [p.name, p.uhid, p.partner, p.aadhar, p.category, String(p.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [patients, search]);

  const listMessage = useMemo(() => {
    if (!satelliteId) return 'Select a satellite clinic to load patients.';
    if (loading) return 'Loading patients…';
    if (!filteredPatients.length) return search ? 'No patients match your search.' : 'No patients found.';
    return `${filteredPatients.length} patient(s) found`;
  }, [satelliteId, loading, filteredPatients.length, search]);

  if (!open) return null;

  function handleSatelliteChange(id: string) {
    setSatelliteId(id);
    setSelectedPatientId(null);
    const sat = satellites.find((s) => s.id === Number(id));
    if (sat) {
      selectSatellite(sat);
      void loadPatients(sat.id);
    } else {
      setSearch('');
    }
  }

  function confirmSelection() {
    const patient =
      filteredPatients.find((p) => p.id === selectedPatientId) ??
      patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;
    selectPatient(patient);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-select-title"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h2 id="patient-select-title" className="text-lg sm:text-xl font-bold text-slate-800">
              Select Patient
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              Choose satellite clinic, then search and select a patient to continue.
            </p>
          </div>
          <button
            type="button"
            className="p-1 text-2xl leading-none text-slate-400 hover:text-slate-600 rounded-lg"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="grid gap-3 sm:gap-4 border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 sm:grid-cols-2">
          <div>
            <label htmlFor="satellite-select" className="mb-1 block text-xs font-semibold text-slate-600">
              Satellite Clinic
            </label>
            <select
              id="satellite-select"
              value={satelliteId}
              onChange={(e) => handleSatelliteChange(e.target.value)}
              className="h-9 sm:h-10 w-full rounded-lg border border-slate-300 px-3 text-xs sm:text-sm"
            >
              <option value="">Select satellite</option>
              {satellites.map((sat) => (
                <option key={sat.id} value={sat.id}>
                  {sat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="patient-search" className="mb-1 block text-xs font-semibold text-slate-600">
              Search by Name / UHID / Aadhaar / Partner
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                ⌕
              </span>
              <input
                id="patient-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to filter patients instantly…"
                autoComplete="off"
                className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs sm:text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="px-4 sm:px-6 py-2 text-xs font-medium text-slate-500">{listMessage}</div>

        <div className="min-h-[200px] sm:min-h-[240px] flex-1 overflow-y-auto px-4 sm:px-6 pb-3" role="listbox" aria-label="Patient list">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-500">
              <div className="spinner mb-3 border-slate-300 border-t-brand-primary" />
              Fetching patient records…
            </div>
          ) : !filteredPatients.length ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-xs sm:text-sm text-slate-500">
              {listMessage}
            </div>
          ) : (
            filteredPatients.map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={selectedPatientId === p.id}
                className={`mb-2 flex w-full items-center gap-3 sm:gap-4 rounded-xl border p-3 text-left transition ${
                  selectedPatientId === p.id
                    ? 'border-brand-primary bg-brand-light ring-2 ring-brand-primary/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedPatientId(p.id)}
                onDoubleClick={() => {
                  setSelectedPatientId(p.id);
                  selectPatient(p);
                  onClose();
                }}
              >
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-xs sm:text-sm font-bold text-brand-green">
                  {patientInitials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <strong className="text-xs sm:text-sm text-slate-800">{p.name}</strong>
                    {p.category && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[9px] sm:text-[10px] font-semibold text-slate-600">
                        {p.category}
                      </span>
                    )}
                    {p.isOocyteDonor && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.2 text-[9px] sm:text-[10px] font-semibold text-amber-700">
                        Oocyte Donor
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] sm:text-xs text-slate-500">
                    <span>UHID: {p.uhid || '—'}</span>
                    <span>Partner: {p.partner || '—'}</span>
                    <span>Age: {formatAge(p.age)}</span>
                  </div>
                  {p.aadhar && <div className="mt-0.5 text-[11px] text-slate-400">Aadhaar: {p.aadhar}</div>}
                </div>
                {selectedPatientId === p.id && (
                  <span className="text-brand-green font-bold text-base shrink-0" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        <footer className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 border-t border-slate-200 px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/50">
          <button
            type="button"
            className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedPatientId}
            className="w-full sm:w-auto rounded-xl bg-brand-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-brand-dark"
            onClick={confirmSelection}
          >
            Continue with Selected Patient
          </button>
        </footer>
      </div>
    </div>
  );
}
