'use client';

import { FormEvent, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import {
  computeCycleType,
  showDonorOocyteDetails,
  showEmbryoRecipientDetails,
  showOocyteRecipientDetails,
  showSemenDonorDetails,
} from '@/lib/cycle-utils';
import { fetchCycleTypes, saveCycleEntry } from '@/lib/services/cycles';
import type { CycleEntry, SourceOption } from '@/lib/types/cycle';

const DEFAULT_OOCYTE_OPTIONS: SourceOption[] = [
  {
    id: 'Fresh',
    label: 'Fresh cycle (FR)',
    description: "Patient's own stimulated cycle (Self Oocyte)",
  },
  {
    id: 'FET',
    label: 'Frozen Thaw Embryo Transfer (FET)',
    description: 'Thawing and transfer of cryopreserved embryos',
  },
  {
    id: 'FrozenOocytes',
    label: 'Frozen Oocyte (FZO)',
    description: "Patient's own retrieved oocytes cryopreserved",
  },
  {
    id: 'ThawOocytes',
    label: 'Thaw Oocyte (THO)',
    description: "Thawing of patient's cryopreserved oocytes",
  },
  {
    id: 'ER',
    label: 'Embryo Recipient (ER)',
    description: 'Patient will receive embryos from a donor couple',
  },
  {
    id: 'OD',
    label: 'Oocyte Donor (OD)',
    description: 'Donor will donate oocytes to recipient',
  },
  {
    id: 'OR',
    label: 'Oocyte Recipient (OR)',
    description: 'Patient will receive oocytes from a donor',
  },
];

const DEFAULT_SEMEN_OPTIONS: SourceOption[] = [
  {
    id: 'husband_fresh',
    label: 'Husband - Fresh Sample',
    description: 'Fresh semen sample from husband/partner',
  },
  {
    id: 'husband_cryo',
    label: 'Husband - Cryopreserved (Frozen)',
    description: 'Frozen semen sample from husband/partner',
  },
  {
    id: 'donor_fresh',
    label: 'Donor - Fresh Sample',
    description: 'Fresh semen sample from donor',
  },
  {
    id: 'donor_cryo',
    label: 'Donor - Cryopreserved (Frozen)',
    description: 'Frozen semen sample from donor',
  },
  {
    id: 'surgical_fresh',
    label: 'Surgical Sperm (PESA / TESA / TESE)',
    description: 'Surgically retrieved sperm - fresh',
  },
  {
    id: 'surgical_frozen',
    label: 'Surgical Sperm - Frozen',
    description: 'Previous frozen surgical sperm sample',
  },
];

const emptyForm = {
  oocyteSource: 'Fresh',
  semenSource: 'husband_fresh',
  cycleDate: new Date().toISOString().split('T')[0],
  donorId: '',
  donorName: '',
  oocyteCount: '',
  recipientCount: '',
  receivedFromDonorId: '',
  receivedDonorName: '',
  receivedOocyteCount: '',
  embryoDonorCoupleId: '',
  donorCoupleName: '',
  embryoBatchNo: '',
  oocyteDonorId: '',
  semenDonorId: '',
  donorSemenId: '',
  cryoStrawNo: '',
  freezingDate: '',
};

export function CycleEntryForm() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { selectedPatient, selectedSatellite } = usePatient();

  const [form, setForm] = useState(emptyForm);
  const [oocyteSources, setOocyteSources] = useState<SourceOption[]>(DEFAULT_OOCYTE_OPTIONS);
  const [semenSources, setSemenSources] = useState<SourceOption[]>(DEFAULT_SEMEN_OPTIONS);
  const [currentCycle, setCurrentCycle] = useState<CycleEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cycleType = computeCycleType(form.oocyteSource, form.semenSource);

  useEffect(() => {
    if (!token) return;
    void fetchCycleTypes(token)
      .then((data) => {
        if (data.oocyteSources?.length) setOocyteSources(data.oocyteSources);
        if (data.semenSources?.length) setSemenSources(data.semenSources);
      })
      .catch(() => {
        // Keep fallback options
      });
  }, [token]);

  function updateField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(andNext = false) {
    if (!selectedPatient) {
      alert('Please select a patient first.');
      return;
    }
    if (!token) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const entry = {
        patientId: selectedPatient.id,
        satelliteId: selectedSatellite?.id || 1,
        oocyteSource: form.oocyteSource,
        semenSource: form.semenSource,
        cycleDate: form.cycleDate || undefined,
        donorOocyteDetails: showDonorOocyteDetails(form.oocyteSource)
          ? {
              donorId: form.donorId,
              donorName: form.donorName,
              oocyteCount: Number(form.oocyteCount) || 0,
              recipientCount: Number(form.recipientCount) || 0,
            }
          : null,
        oocyteRecipientDetails: showOocyteRecipientDetails(form.oocyteSource)
          ? {
              receivedFromDonorId: form.receivedFromDonorId,
              donorName: form.receivedDonorName,
              oocyteCount: Number(form.receivedOocyteCount) || 0,
            }
          : null,
        embryoRecipientDetails: showEmbryoRecipientDetails(form.oocyteSource)
          ? {
              embryoDonorCoupleId: form.embryoDonorCoupleId,
              donorCoupleName: form.donorCoupleName,
              embryoBatchNo: form.embryoBatchNo,
              oocyteDonorId: form.oocyteDonorId,
              semenDonorId: form.semenDonorId,
            }
          : null,
        semenDonorDetails: showSemenDonorDetails(form.semenSource)
          ? {
              donorSemenId: form.donorSemenId,
              cryoStrawNo: form.cryoStrawNo,
              freezingDate: form.freezingDate,
            }
          : null,
      };

      const saved = await saveCycleEntry(token, entry);
      setCurrentCycle(saved);
      setSuccess('Cycle entry saved successfully.');
      if (andNext && saved.cycleId) {
        router.push(`/cycle/retrieval/${saved.cycleId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cycle entry.');
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (currentCycle?.cycleId) {
      router.push(`/cycle/retrieval/${currentCycle.cycleId}`);
    } else {
      alert('Please save the cycle entry first.');
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
  }

  // Display patient details
  const hasPatient = Boolean(selectedPatient);
  const patientName = selectedPatient?.name || 'No Patient Selected';
  const uhid = selectedPatient?.uhid || '—';
  const partnerName = selectedPatient?.partner || '—';
  const ageGender = selectedPatient
    ? `${selectedPatient.age || '—'} Y / ${selectedPatient.gender || 'Female'}`
    : '—';

  return (
    <div className="mx-auto max-w-[1240px] space-y-4 font-sans text-slate-800 selection:bg-purple-500 selection:text-white">
      
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200/80">
        {/* Module Title Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-[#1d4ed8]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1e3a8a]">
            CYCLE ENTRY MODULE
          </h1>
        </div>

        {/* Right Info Badges */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            <span className="font-semibold text-slate-500">Date : </span>
            <span>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            <span className="font-semibold text-slate-500">User : </span>
            <span>{user?.userName || user?.userLoginName || 'Sachin@gmail.com'}</span>
          </div>
        </div>
      </div>

      {/* 2. Patient Context Strip */}
      <div className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-3 text-xs shadow-2xs transition ${
        hasPatient ? 'border-sky-200 bg-[#f0f7ff]' : 'border-amber-200 bg-amber-50/50'
      }`}>
        <div className="flex flex-wrap items-center gap-6">
          {/* Patient Name */}
          <div className="flex items-center gap-2">
            <svg className={`h-4 w-4 ${hasPatient ? 'text-[#1d4ed8]' : 'text-amber-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="font-semibold text-slate-600">Patient Name :</span>
            <span className={`font-bold ${hasPatient ? 'text-slate-900' : 'text-amber-800 italic'}`}>{patientName}</span>
          </div>

          {/* UHID */}
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="13" y2="12" />
            </svg>
            <span className="font-semibold text-slate-600">UHID :</span>
            <span className="font-bold text-slate-900">{uhid}</span>
          </div>

          {/* Partner */}
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="font-semibold text-slate-600">Partner :</span>
            <span className="font-bold text-slate-900">{partnerName}</span>
          </div>

          {/* Age / Gender */}
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span className="font-semibold text-slate-600">Age / Gender :</span>
            <span className="font-bold text-slate-900">{ageGender}</span>
          </div>
        </div>

        {/* Change / Select Patient Action */}
        <button
          type="button"
          onClick={() => router.push('/dashboard?selectPatient=1')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition ${
            hasPatient ? 'bg-[#1d4ed8] hover:bg-[#1e40af]' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          {hasPatient ? 'Change Patient' : 'Select Patient'}
        </button>
      </div>

      {/* No Patient Warning Alert Banner */}
      {!hasPatient && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-xs text-amber-900 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">⚠️</span>
            <div>
              <span className="font-bold">No Patient Selected: </span>
              <span>Please select a patient before saving or proceeding with cycle registration.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard?selectPatient=1')}
            className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 font-bold text-white shadow-xs transition"
          >
            Select Patient
          </button>
        </div>
      )}

      {/* SMART Cryo Stock Summary Bar (Matching SMART legacy header) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-emerald-950 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-600">ET Frozen :</span>
            <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">0</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-600">BT Frozen :</span>
            <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">0</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-600">Total Frozen Oocytes :</span>
            <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">0</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-600">MII Frozen :</span>
            <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">0</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-600">MI Frozen :</span>
            <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">0</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-slate-600">GV Frozen :</span>
            <strong className="rounded bg-white px-2 py-0.5 border border-emerald-300 text-emerald-900">0</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setForm(emptyForm)}
          className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-1 text-xs font-bold text-white shadow-xs transition"
        >
          + Add New
        </button>
      </div>

      {/* 3. Light Yellow Help Alert Banner */}
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#fef08a] bg-[#fffbeb] px-4 py-2.5 text-center text-xs font-medium text-slate-700 shadow-2xs">
        <span className="text-base">💡</span>
        <span>
          Select the appropriate cycle type and semen source below. Based on your selection, the workflow will update accordingly.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 4. Main 2-Column Selection Panel */}
        <div className="grid gap-5 lg:grid-cols-2">
          
          {/* CYCLE TYPE / OOCYTE SOURCE */}
          <div className="flex flex-col rounded-2xl border border-purple-200/80 bg-[#fdfaff] shadow-xs overflow-hidden">
            <div className="flex items-center gap-2.5 bg-[#8b5cf6] px-4 py-2.5 text-white">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#8b5cf6]">
                1
              </div>
              <h2 className="text-sm font-bold tracking-wide">
                CYCLE TYPE / OOCYTE SOURCE &nbsp; ( Select One )
              </h2>
            </div>
            
            <div className="flex-1 p-4 space-y-2.5">
              {oocyteSources.map((opt) => {
                const selected = form.oocyteSource === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      selected
                        ? 'border-purple-400 bg-white shadow-xs ring-1 ring-purple-300'
                        : 'border-slate-200/70 bg-white/70 hover:bg-white hover:border-purple-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="oocyteSource"
                      value={opt.id}
                      checked={selected}
                      onChange={() => updateField('oocyteSource', opt.id)}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                        {getOocyteIcon(opt.id)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{opt.label}</div>
                        <div className="text-xs text-slate-500 font-normal">{opt.description}</div>
                      </div>
                    </div>
                  </label>
                );
              })}

              <div className="pt-2 text-center text-xs font-semibold text-purple-600">
                Note : Select only one option
              </div>
            </div>
          </div>

          {/* SEMEN SOURCE */}
          <div className="flex flex-col rounded-2xl border border-emerald-200/80 bg-[#f7fcf9] shadow-xs overflow-hidden">
            <div className="flex items-center gap-2.5 bg-[#16a34a] px-4 py-2.5 text-white">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#16a34a]">
                2
              </div>
              <h2 className="text-sm font-bold tracking-wide">
                SEMEN SOURCE &nbsp; ( Select One )
              </h2>
            </div>
            
            <div className="flex-1 p-4 space-y-2.5">
              {semenSources.map((opt) => {
                const selected = form.semenSource === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      selected
                        ? 'border-emerald-400 bg-white shadow-xs ring-1 ring-emerald-300'
                        : 'border-slate-200/70 bg-white/70 hover:bg-white hover:border-emerald-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="semenSource"
                      value={opt.id}
                      checked={selected}
                      onChange={() => updateField('semenSource', opt.id)}
                      className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        {getSemenIcon(opt.id)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{opt.label}</div>
                        <div className="text-xs text-slate-500 font-normal">{opt.description}</div>
                      </div>
                    </div>
                  </label>
                );
              })}

              <div className="pt-2 text-center text-xs font-semibold text-emerald-600">
                Note : Select only one option
              </div>
            </div>
          </div>

        </div>

        {/* 5. Conditional Dynamic Form Sections (Fixed Card Boundaries & Overflow) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          {/* DONOR OOCYTE DETAILS */}
          <div
            className={`flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 transition ${
              showDonorOocyteDetails(form.oocyteSource)
                ? 'border-amber-300 bg-[#fffdf5] shadow-xs'
                : 'border-amber-200/60 bg-[#fffcf5]/50 opacity-60'
            }`}
          >
            <div>
              <div className="mb-3 flex items-center justify-between text-amber-800">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className="h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  </svg>
                  <h3 className="truncate text-[11px] font-extrabold uppercase tracking-tight">
                    DONOR OOCYTE DETAILS
                  </h3>
                </div>
                <InfoIcon />
              </div>

              <div className="space-y-2.5">
                <CompactField
                  label="Donor ID"
                  value={form.donorId}
                  onChange={(v) => updateField('donorId', v)}
                  disabled={!showDonorOocyteDetails(form.oocyteSource)}
                />
                <CompactField
                  label="Donor Name"
                  value={form.donorName}
                  onChange={(v) => updateField('donorName', v)}
                  disabled={!showDonorOocyteDetails(form.oocyteSource)}
                />
                <CompactField
                  label="No. of Oocytes"
                  type="number"
                  short
                  value={form.oocyteCount}
                  onChange={(v) => updateField('oocyteCount', v)}
                  disabled={!showDonorOocyteDetails(form.oocyteSource)}
                />
              </div>
            </div>

            <div className="mt-4 border-t border-amber-200/60 pt-2 text-center text-[10px] font-bold text-amber-700">
              This section appears when<br />
              <span className="font-extrabold">Donor Oocyte</span> is selected
            </div>
          </div>

          {/* OOCYTE RECIPIENT DETAILS */}
          <div
            className={`flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 transition ${
              showOocyteRecipientDetails(form.oocyteSource)
                ? 'border-blue-300 bg-[#f5f9ff] shadow-xs'
                : 'border-blue-200/60 bg-[#f8fbff]/50 opacity-60'
            }`}
          >
            <div>
              <div className="mb-3 flex items-center justify-between text-blue-800">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className="h-4 w-4 shrink-0 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
                  </svg>
                  <h3 className="truncate text-[11px] font-extrabold uppercase tracking-tight">
                    OOCYTE RECIPIENT DETAILS
                  </h3>
                </div>
                <InfoIcon />
              </div>

              <div className="space-y-2.5">
                <CompactField
                  label="Received From Donor ID"
                  value={form.receivedFromDonorId}
                  onChange={(v) => updateField('receivedFromDonorId', v)}
                  disabled={!showOocyteRecipientDetails(form.oocyteSource)}
                />
                <CompactField
                  label="Donor Name"
                  value={form.receivedDonorName}
                  onChange={(v) => updateField('receivedDonorName', v)}
                  disabled={!showOocyteRecipientDetails(form.oocyteSource)}
                />
                <CompactField
                  label="No. of Oocytes"
                  type="number"
                  short
                  value={form.receivedOocyteCount}
                  onChange={(v) => updateField('receivedOocyteCount', v)}
                  disabled={!showOocyteRecipientDetails(form.oocyteSource)}
                />
              </div>
            </div>

            <div className="mt-4 border-t border-blue-200/60 pt-2 text-center text-[10px] font-bold text-blue-700">
              This section appears when<br />
              <span className="font-extrabold">Oocyte Recipient</span> is selected
            </div>
          </div>

          {/* EMBRYO RECIPIENT DETAILS */}
          <div
            className={`flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 transition ${
              showEmbryoRecipientDetails(form.oocyteSource)
                ? 'border-pink-300 bg-[#fff5f7] shadow-xs'
                : 'border-pink-200/60 bg-[#fff9fa]/50 opacity-60'
            }`}
          >
            <div>
              <div className="mb-3 flex items-center justify-between text-pink-800">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className="h-4 w-4 shrink-0 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <h3 className="truncate text-[11px] font-extrabold uppercase tracking-tight">
                    EMBRYO RECIPIENT DETAILS
                  </h3>
                </div>
                <InfoIcon />
              </div>

              <div className="space-y-2.5">
                <CompactField
                  label="Embryo Donor Couple ID"
                  value={form.embryoDonorCoupleId}
                  onChange={(v) => updateField('embryoDonorCoupleId', v)}
                  disabled={!showEmbryoRecipientDetails(form.oocyteSource)}
                />
                <CompactField
                  label="Donor Couple Name"
                  value={form.donorCoupleName}
                  onChange={(v) => updateField('donorCoupleName', v)}
                  disabled={!showEmbryoRecipientDetails(form.oocyteSource)}
                />
                <CompactField
                  label="Embryo Batch No."
                  value={form.embryoBatchNo}
                  onChange={(v) => updateField('embryoBatchNo', v)}
                  disabled={!showEmbryoRecipientDetails(form.oocyteSource)}
                />
              </div>
            </div>

            <div className="mt-4 border-t border-pink-200/60 pt-2 text-center text-[10px] font-bold text-pink-700">
              This section appears when<br />
              <span className="font-extrabold">Embryo Recipient</span> is selected
            </div>
          </div>

          {/* SEMEN DONOR / CRYO DETAILS */}
          <div
            className={`flex flex-col justify-between overflow-hidden rounded-2xl border p-3.5 transition ${
              showSemenDonorDetails(form.semenSource)
                ? 'border-amber-300 bg-[#fffdf0] shadow-xs'
                : 'border-amber-200/60 bg-[#fffef5]/50 opacity-60'
            }`}
          >
            <div>
              <div className="mb-3 flex items-center justify-between text-amber-900">
                <div className="flex items-center gap-1.5 min-w-0">
                  <svg className="h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                  <h3 className="truncate text-[11px] font-extrabold uppercase tracking-tight">
                    SEMEN DONOR / CRYO DETAILS
                  </h3>
                </div>
                <InfoIcon />
              </div>

              <div className="space-y-2.5">
                <CompactField
                  label="Donor Semen ID"
                  value={form.donorSemenId}
                  onChange={(v) => updateField('donorSemenId', v)}
                  disabled={!showSemenDonorDetails(form.semenSource)}
                />
                <CompactField
                  label="Cryo Straw No."
                  value={form.cryoStrawNo}
                  onChange={(v) => updateField('cryoStrawNo', v)}
                  disabled={!showSemenDonorDetails(form.semenSource)}
                />
                <CompactField
                  label="Freezing Date"
                  type="date"
                  placeholder="DD-MMM-YYYY"
                  value={form.freezingDate}
                  onChange={(v) => updateField('freezingDate', v)}
                  disabled={!showSemenDonorDetails(form.semenSource)}
                />
              </div>
            </div>

            <div className="mt-4 border-t border-amber-200/60 pt-2 text-center text-[10px] font-bold text-amber-800">
              This section appears when<br />
              <span className="font-extrabold">Donor or Frozen</span> option is selected
            </div>
          </div>

        </div>

        {/* 6. CYCLE SUMMARY Card */}
        <div className="rounded-2xl border border-blue-200 bg-[#f8fafc] p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-center gap-2 text-center">
            <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#1e3a8a]">
              CYCLE SUMMARY &nbsp; ( AUTO GENERATED )
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 px-4">
            {/* Left Source Badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-base">🥚</span>
                <span className="font-bold text-slate-600">Oocyte Source :</span>
                <span className="font-bold text-[#8b5cf6]">
                  {getOptionLabel(oocyteSources, form.oocyteSource)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-base">🧪</span>
                <span className="font-bold text-slate-600">Semen Source :</span>
                <span className="font-bold text-[#16a34a]">
                  {getOptionLabel(semenSources, form.semenSource)}
                </span>
              </div>
            </div>

            {/* Middle Blue Arrow */}
            <div className="hidden sm:flex items-center text-[#3b82f6]">
              <svg className="h-8 w-12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 11h12v-3l6 4-6 4v-3H4v-2z" />
              </svg>
            </div>

            {/* Right Computed Cycle Type */}
            <div className="text-left sm:text-right">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-slate-700">Cycle Type :</span>
                <span className="text-base font-extrabold text-[#1d4ed8]">{cycleType}</span>
              </div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">
                This will be used for reports, billing and statutory records.
              </div>
            </div>
          </div>
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        {/* 7. Action Footer Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {/* SAVE & NEXT */}
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(true)}
            className="flex items-center gap-2 rounded-xl bg-[#16a34a] hover:bg-[#15803d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>SAVE & NEXT</span>
          </button>

          {/* NEXT */}
          <button
            type="button"
            onClick={next}
            className="flex items-center gap-2 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] px-6 py-2.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99]"
          >
            <span>NEXT</span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </button>

          {/* CANCEL */}
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] px-6 py-2.5 text-sm font-bold text-white shadow-md transition active:scale-[0.99]"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>CANCEL</span>
          </button>
        </div>

      </form>
    </div>
  );
}

function getOptionLabel(options: SourceOption[], id: string): string {
  return options.find((o) => o.id === id)?.label || id;
}

function CompactField({
  label,
  value,
  onChange,
  disabled,
  short,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  short?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-1.5 min-w-0">
      <label className="text-[11px] font-semibold text-slate-700 leading-tight shrink min-w-0 truncate">
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`h-7 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800 outline-none transition focus:border-blue-500 disabled:bg-slate-100/80 disabled:text-slate-400 shrink-0 ${
          short ? 'w-16' : 'w-24 sm:w-28'
        }`}
      />
    </div>
  );
}

function InfoIcon() {
  return (
    <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-400/20 text-[10px] font-bold text-slate-500">
      i
    </div>
  );
}

function getOocyteIcon(id: string) {
  switch (id) {
    case 'Fresh':
    case 'self_oocyte':
      return (
        <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
        </svg>
      );
    case 'FET':
      return (
        <svg className="h-5 w-5 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'FrozenOocytes':
      return (
        <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
    case 'ThawOocytes':
      return (
        <svg className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
    case 'OD':
    case 'donor_oocyte':
      return (
        <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case 'OR':
    case 'oocyte_recipient':
      return (
        <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'ER':
    case 'embryo_recipient':
      return (
        <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

function getSemenIcon(id: string) {
  switch (id) {
    case 'husband_fresh':
      return (
        <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
        </svg>
      );
    case 'husband_cryo':
      return (
        <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
        </svg>
      );
    case 'donor_fresh':
      return (
        <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      );
    case 'donor_cryo':
      return (
        <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
        </svg>
      );
    case 'surgical_fresh':
      return (
        <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18" />
          <path d="M13 3l8 8" />
          <circle cx="6" cy="6" r="3" />
        </svg>
      );
    case 'surgical_frozen':
      return (
        <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
        </svg>
      );
    default:
      return (
        <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const styles =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${styles}`}>{message}</div>;
}
