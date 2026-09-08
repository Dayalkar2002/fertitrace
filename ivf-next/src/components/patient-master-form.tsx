'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import {
  deleteMasterPatient,
  fetchPatientLookups,
  getMasterPatient,
  listMasterPatients,
  saveMasterPatient,
} from '@/lib/services/masters';
import type { LookupItem, PatientMasterDetail, PatientMasterRow } from '@/lib/types/master';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): PatientMasterDetail & { patId: number } => ({
  patId: 0,
  refNo: '',
  dateOfCreation: today(),
  name: '',
  category: '',
  age: 0,
  dob: today(),
  address: '',
  city: '',
  phone: '',
  mobile: '',
  email: '',
  docId: 0,
  diagId: 0,
  husbandName: '',
  husbandAge: 0,
  husbandDob: today(),
  satId: 0,
  refId: 0,
  panCard: '',
  aadhar: '',
  husbandPan: '',
  husbandAadhar: '',
  husbandEmail: '',
  husbandPhone: '',
  photo: '',
  maritalStatus: 'Married',
  nationality: 'Indian',
  passport: '',
  husbandPassport: '',
  artClinicReg: '',
  pcpndtClinicReg: '',
});

function toInputDate(value: string | null | undefined): string {
  if (!value) return today();
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  if (!name) return 'P';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PatientMasterForm() {
  const { token } = useAuth();
  const [form, setForm] = useState(emptyForm());
  const [satellites, setSatellites] = useState<LookupItem[]>([]);
  const [doctors, setDoctors] = useState<LookupItem[]>([]);
  const [diagnosis, setDiagnosis] = useState<LookupItem[]>([]);
  const [refBy, setRefBy] = useState<LookupItem[]>([]);
  const [rows, setRows] = useState<PatientMasterRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<PatientMasterDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form');

  const isUnmarried = form.maritalStatus === 'Unmarried';
  const partnerNameLabel = isUnmarried ? 'Father Name' : 'Husband Name';
  const partnerAgeLabel = isUnmarried ? 'Father Age' : 'Husband Age';
  const partnerDobLabel = isUnmarried ? 'Father Birth Date' : 'Husband Birth Date';

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [lookups, list] = await Promise.all([
        fetchPatientLookups(token),
        listMasterPatients(token),
      ]);
      setSatellites(lookups.satellites);
      setDoctors(lookups.doctors);
      setDiagnosis(lookups.diagnosis);
      setRefBy(lookups.refBy);
      setRows(list);
    } catch (err) {
      setError(formatLoadError(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'maritalStatus' && value === 'Unmarried') {
        next.phone = '';
        next.husbandPan = '';
        next.husbandAadhar = '';
        next.husbandEmail = '';
      }
      return next;
    });
  }

  function patchForm(detail: PatientMasterDetail) {
    setForm({
      patId: detail.id ?? detail.patId ?? 0,
      refNo: detail.refNo,
      dateOfCreation: toInputDate(detail.dateOfCreation),
      name: detail.name,
      category: detail.category,
      age: detail.age,
      dob: toInputDate(detail.dob),
      address: detail.address,
      city: detail.city,
      phone: detail.phone,
      mobile: detail.mobile,
      email: detail.email,
      docId: detail.docId,
      diagId: detail.diagId,
      husbandName: detail.husbandName,
      husbandAge: detail.husbandAge,
      husbandDob: toInputDate(detail.husbandDob),
      satId: detail.satId,
      refId: detail.refId,
      panCard: detail.panCard,
      aadhar: detail.aadhar,
      husbandPan: detail.husbandPan,
      husbandAadhar: detail.husbandAadhar,
      husbandEmail: detail.husbandEmail,
      husbandPhone: detail.husbandPhone ?? '',
      photo: detail.photo,
      maritalStatus: detail.maritalStatus || 'Married',
      nationality: detail.nationality || 'Indian',
      passport: detail.passport || '',
      husbandPassport: detail.husbandPassport || '',
      artClinicReg: detail.artClinicReg || '',
      pcpndtClinicReg: detail.pcpndtClinicReg || '',
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await saveMasterPatient(token, form);
      setRows(res.data);
      setSuccess(res.message);
      if (!form.patId) setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function selectRow(row: PatientMasterRow) {
    if (!token) return;
    try {
      const detail = await getMasterPatient(token, row.id);
      patchForm(detail);
      setActiveTab('form');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient.');
    }
  }

  async function openRowPopup(row: PatientMasterRow) {
    if (!token) return;
    setShowDetailModal(true);
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const detail = await getMasterPatient(token, row.id);
      setSelectedDetail(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient details.');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function deleteRow(row: PatientMasterRow) {
    if (!token || !confirm(`Delete patient "${row.name}"?`)) return;
    try {
      await deleteMasterPatient(token, row.id);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setForm(emptyForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  function lookupName(list: LookupItem[], id: number) {
    return list.find((item) => item.id === id)?.name ?? '—';
  }

  const filteredRows = rows.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.husbandName && r.husbandName.toLowerCase().includes(q)) ||
      (r.category && r.category.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 font-sans text-slate-800 selection:bg-purple-500 selection:text-white">
      
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-[#6345A6] shadow-xs">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Patient Management
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              Register, manage, and track patient demographic and clinical records
            </p>
          </div>
        </div>

        {/* View Switcher Tabs & New Button */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                activeTab === 'form'
                  ? 'bg-white text-[#6345A6] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {form.patId ? '✏️ Edit Patient' : '➕ Registration Form'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`rounded-lg px-3.5 py-1.5 transition ${
                activeTab === 'list'
                  ? 'bg-white text-[#6345A6] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 Patient List ({rows.length})
            </button>
          </div>

          {form.patId > 0 && (
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm());
                setActiveTab('form');
              }}
              className="rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-[#6345A6] hover:bg-purple-100 transition"
            >
              + New Patient
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 shadow-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-medium text-emerald-700 shadow-xs">
          {success}
        </div>
      )}

      {/* 2. REGISTRATION FORM TAB */}
      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Section A: Patient Basic Details */}
          <SectionCard
            title="1. Personal Information"
            icon="👤"
            accent="border-purple-200/80 bg-purple-50/20"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              <Field label="Full Name *" value={form.name} onChange={(v) => updateField('name', v)} placeholder="e.g. Lubna Babulal Saf" />
              <Field label="Ref No" value={form.refNo} onChange={(v) => updateField('refNo', v)} placeholder="REF-2025-001" />
              <Field label="Category" value={form.category} onChange={(v) => updateField('category', v)} readOnly title="Updated automatically from cycles" placeholder="Self OPU + ICSI" />
              
              <label className="block text-xs font-semibold text-slate-700">
                Marital Status
                <select
                  value={form.maritalStatus}
                  onChange={(e) => updateField('maritalStatus', e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-[#6345A6] focus:ring-2 focus:ring-[#6345A6]/15"
                >
                  <option value="Married">Married</option>
                  <option value="Unmarried">Unmarried</option>
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Nationality
                <select
                  value={form.nationality || 'Indian'}
                  onChange={(e) => updateField('nationality', e.target.value)}
                  className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-[#6345A6] focus:ring-2 focus:ring-[#6345A6]/15"
                >
                  <option value="Indian">Indian</option>
                  <option value="NRI">NRI</option>
                  <option value="Foreign National">Foreign National</option>
                </select>
              </label>

              <Field label="Registration Date" type="date" value={form.dateOfCreation ?? ''} onChange={(v) => updateField('dateOfCreation', v)} />
              <Field label="Birth Date" type="date" value={form.dob ?? ''} onChange={(v) => updateField('dob', v)} />
              <Field label="Age" type="number" value={String(form.age)} onChange={(v) => updateField('age', Number(v))} />
            </div>
          </SectionCard>

          {/* Section B: Contact & Identity Details */}
          <SectionCard
            title="2. Contact & Identity"
            icon="📍"
            accent="border-sky-200/80 bg-sky-50/20"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              <div className="sm:col-span-2 md:col-span-3 xl:col-span-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Address
                  <textarea
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    rows={2}
                    placeholder="Enter street address, landmark, area"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-[#6345A6] focus:ring-2 focus:ring-[#6345A6]/15"
                  />
                </label>
              </div>

              <Field label="City" value={form.city} onChange={(v) => updateField('city', v)} placeholder="e.g. Mumbai" />
              <Field label="Mobile *" value={form.mobile} onChange={(v) => updateField('mobile', v)} placeholder="+91 98765 43210" />
              <Field label="Phone" value={form.phone} onChange={(v) => updateField('phone', v)} placeholder="Landline optional" />
              <Field label="Email" value={form.email} onChange={(v) => updateField('email', v)} placeholder="patient@example.com" />
              <Field label="Patient PAN" value={form.panCard} onChange={(v) => updateField('panCard', v)} placeholder="ABCDE1234F" />
              <Field label="Patient Aadhar" value={form.aadhar} onChange={(v) => updateField('aadhar', v)} placeholder="1234 5678 9012" />
              <Field label="Patient Passport" value={form.passport || ''} onChange={(v) => updateField('passport', v)} placeholder="Passport No." />
            </div>
          </SectionCard>

          {/* Section C: Clinic & Doctor Assignment */}
          <SectionCard
            title="3. Clinic & Clinical Assignment"
            icon="🩺"
            accent="border-emerald-200/80 bg-emerald-50/20"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              <SelectField label="Satellite Center" value={form.satId} options={satellites} onChange={(v) => updateField('satId', v)} />
              <SelectField label="Consulting Doctor" value={form.docId} options={doctors} onChange={(v) => updateField('docId', v)} />
              <SelectField label="Diagnosis" value={form.diagId} options={diagnosis} onChange={(v) => updateField('diagId', v)} />
              <SelectField label="Referred By" value={form.refId} options={refBy} onChange={(v) => updateField('refId', v)} />
              <Field label="ART Clinic Reg No" value={form.artClinicReg || ''} onChange={(v) => updateField('artClinicReg', v)} placeholder="ART-CLINIC-XXXX" />
              <Field label="PCPNDT Clinic Reg No" value={form.pcpndtClinicReg || ''} onChange={(v) => updateField('pcpndtClinicReg', v)} placeholder="PCPNDT-XXXX" />
            </div>
          </SectionCard>

          {/* Section D: Partner / Spouse Details */}
          <SectionCard
            title={`4. ${isUnmarried ? 'Father' : 'Spouse / Partner'} Details`}
            icon="👨‍👩‍👧"
            accent="border-amber-200/80 bg-amber-50/20"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              <Field label={partnerNameLabel} value={form.husbandName} onChange={(v) => updateField('husbandName', v)} placeholder="e.g. Ferozing Saf" />
              <Field label={partnerAgeLabel} type="number" value={String(form.husbandAge)} onChange={(v) => updateField('husbandAge', Number(v))} />
              <Field label={partnerDobLabel} type="date" value={form.husbandDob ?? ''} onChange={(v) => updateField('husbandDob', v)} />
              <Field label="Partner Mobile" value={form.husbandPhone ?? ''} onChange={(v) => updateField('husbandPhone', v)} placeholder="+91 98765 00000" />
              
              {!isUnmarried && (
                <>
                  <Field label="Husband PAN" value={form.husbandPan} onChange={(v) => updateField('husbandPan', v)} />
                  <Field label="Husband Aadhar" value={form.husbandAadhar} onChange={(v) => updateField('husbandAadhar', v)} />
                  <Field label="Husband Passport" value={form.husbandPassport || ''} onChange={(v) => updateField('husbandPassport', v)} placeholder="Passport No." />
                  <Field label="Husband Email" value={form.husbandEmail} onChange={(v) => updateField('husbandEmail', v)} />
                </>
              )}
            </div>
          </SectionCard>

          {/* Form Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6345A6] to-[#7c3aed] hover:from-[#5b3da0] hover:to-[#6d28d9] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/20 transition active:scale-[0.99] disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
              </svg>
              <span>{saving ? 'Saving...' : form.patId ? 'Update Patient' : 'Save Patient Record'}</span>
            </button>

            <button
              type="button"
              onClick={() => setForm(emptyForm())}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Clear Form
            </button>
          </div>

        </form>
      )}

      {/* 3. PATIENT LIST TAB */}
      {(activeTab === 'list' || activeTab === 'form') && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registered Patients List
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Click any row to view full details in a modal or click Edit to load into the registration form.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search patient name, UHID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#6345A6] focus:bg-white focus:ring-2 focus:ring-[#6345A6]/10"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Spouse / Partner</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Registered Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    className="group cursor-pointer transition hover:bg-purple-50/30"
                    onClick={() => void openRowPopup(row)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-xs text-[#6345A6]">
                          {getInitials(row.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#6345A6] transition-colors">
                            {row.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            ID: #{row.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-[#6345A6] border border-purple-200/60">
                        {row.category || 'Standard Patient'}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">
                      {row.husbandName || '—'}
                    </td>

                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                      {row.address || '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {formatDate(row.dateOfCreation)}
                    </td>

                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void selectRow(row)}
                          className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-[#6345A6] hover:bg-purple-100 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteRow(row)}
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!filteredRows.length && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-500 font-medium">
                      No patients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PATIENT DETAILS MODAL POPUP */}
      {showDetailModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-[#6345A6] font-bold text-sm">
                  {selectedDetail ? getInitials(selectedDetail.name) : 'P'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedDetail?.name || 'Patient Details'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    UHID: {selectedDetail?.refNo || selectedDetail?.id || '—'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <p className="py-6 text-center text-xs text-slate-500">Loading patient details…</p>
            ) : selectedDetail ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem label="Full Name" value={selectedDetail.name} />
                  <DetailItem label="Ref No" value={selectedDetail.refNo} />
                  <DetailItem label="Category" value={selectedDetail.category} />
                  <DetailItem label="Nationality" value={selectedDetail.nationality || 'Indian'} />
                  <DetailItem label="Marital Status" value={selectedDetail.maritalStatus || 'Married'} />
                  <DetailItem label="Registered Date" value={formatDate(selectedDetail.dateOfCreation)} />
                  <DetailItem label="Birth Date" value={formatDate(selectedDetail.dob)} />
                  <DetailItem label="Age" value={String(selectedDetail.age ?? '—')} />
                  <DetailItem label="City" value={selectedDetail.city} />
                  <DetailItem label="Mobile" value={selectedDetail.mobile} />
                  <DetailItem label="Phone" value={selectedDetail.phone} />
                  <DetailItem label="Email" value={selectedDetail.email} />
                  <DetailItem label="Patient PAN" value={selectedDetail.panCard} />
                  <DetailItem label="Patient Aadhar" value={selectedDetail.aadhar} />
                  <DetailItem label="Patient Passport" value={selectedDetail.passport} />
                  <DetailItem label="Satellite" value={lookupName(satellites, selectedDetail.satId)} />
                  <DetailItem label="Doctor" value={lookupName(doctors, selectedDetail.docId)} />
                  <DetailItem label="Diagnosis" value={lookupName(diagnosis, selectedDetail.diagId)} />
                  <DetailItem label="Referred By" value={lookupName(refBy, selectedDetail.refId)} />
                  <DetailItem label={partnerNameLabel} value={selectedDetail.husbandName} />
                  <DetailItem label={partnerAgeLabel} value={String(selectedDetail.husbandAge ?? '—')} />
                  <DetailItem label={partnerDobLabel} value={formatDate(selectedDetail.husbandDob)} />
                  {selectedDetail.maritalStatus !== 'Unmarried' && (
                    <>
                      <DetailItem label="Husband PAN" value={selectedDetail.husbandPan} />
                      <DetailItem label="Husband Aadhar" value={selectedDetail.husbandAadhar} />
                      <DetailItem label="Husband Passport" value={selectedDetail.husbandPassport} />
                      <DetailItem label="Husband Email" value={selectedDetail.husbandEmail} />
                    </>
                  )}
                  <DetailItem label="Address" value={selectedDetail.address} className="sm:col-span-2 lg:col-span-3" />
                </div>

                <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    className="rounded-xl bg-gradient-to-r from-[#6345A6] to-[#7c3aed] px-5 py-2 text-xs font-bold text-white shadow-sm hover:from-[#5b3da0] hover:to-[#6d28d9] transition"
                    onClick={() => {
                      patchForm(selectedDetail);
                      setShowDetailModal(false);
                      setActiveTab('form');
                      setSuccess('Patient loaded into form for editing.');
                    }}
                  >
                    ✏️ Load into Form to Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}

function SectionCard({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 shadow-2xs ${accent}`}>
      <div className="mb-3 flex items-center gap-2 font-bold text-xs text-slate-800 uppercase tracking-wide">
        <span className="text-base">{icon}</span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  readOnly,
  title,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  readOnly?: boolean;
  title?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        title={title}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-[#6345A6] focus:ring-2 focus:ring-[#6345A6]/15 read-only:bg-slate-100/80 read-only:text-slate-500"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: LookupItem[];
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-[#6345A6] focus:ring-2 focus:ring-[#6345A6]/15"
      >
        <option value={0}>Select…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetailItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 ${className}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-xs font-semibold text-slate-900 mt-0.5">{value || '—'}</div>
    </div>
  );
}

function formatLoadError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404) return 'Master API not found. Please verify your connection.';
    if (err.status === 503) return err.message;
    if (err.status === 401) return 'Session expired. Please log in again.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Failed to load patient master.';
}
