'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import {
  SatelliteMasterDetail,
  SatelliteMasterRow,
  getSatellite,
  listMasterSatellites,
  saveSatellite,
} from '@/lib/services/masters';

const emptyForm = (): SatelliteMasterDetail & { satId: number } => ({
  satId: 0,
  name: '',
  shortName: '',
  address1: '',
  address2: '',
  city: '',
  drOne: '',
  drOneDeg: '',
  drTwo: '',
  drTwoDeg: '',
  phone: '',
  mobile: '',
  fax: '',
  email: '',
});

const inputCls = 'mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm';
const labelCls = 'text-xs font-medium text-slate-600';

function formatError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Request failed.';
}

export function SatelliteMasterForm() {
  const { token } = useAuth();
  const [form, setForm] = useState(emptyForm());
  const [rows, setRows] = useState<SatelliteMasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setRows(await listMasterSatellites(token));
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const res = await saveSatellite(token, form);
      setRows(res.data);
      if (!form.satId) setForm(emptyForm());
    } catch (err) {
      setError(formatError(err));
    } finally {
      setSaving(false);
    }
  }

  async function selectRow(row: SatelliteMasterRow) {
    if (!token) return;
    setError('');
    try {
      const s = await getSatellite(token, row.id);
      setForm({
        satId: s.id ?? s.satId ?? 0,
        name: s.name,
        shortName: s.shortName,
        address1: s.address1,
        address2: s.address2,
        city: s.city,
        drOne: s.drOne,
        drOneDeg: s.drOneDeg,
        drTwo: s.drTwo,
        drTwoDeg: s.drTwoDeg,
        phone: s.phone,
        mobile: s.mobile,
        fax: s.fax,
        email: s.email,
      });
    } catch (err) {
      setError(formatError(err));
    }
  }

  return (
    <div className="master-page rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Satellite Master</h1>
        {loading && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">Loading…</span>}
      </div>

      {error && <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(
          [
            ['name', 'Name'],
            ['shortName', 'Short Name'],
            ['city', 'City'],
            ['phone', 'Phone'],
            ['mobile', 'Mobile'],
            ['fax', 'Fax'],
            ['email', 'Email'],
            ['drOne', 'Doctor One'],
            ['drOneDeg', 'Doctor One Degree'],
            ['drTwo', 'Doctor Two'],
            ['drTwoDeg', 'Doctor Two Degree'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className={labelCls}>
            {label}
            <input value={form[key]} onChange={(e) => updateField(key, e.target.value)} className={inputCls} />
          </label>
        ))}
        <label className={`${labelCls} md:col-span-2`}>
          Address 1
          <input value={form.address1} onChange={(e) => updateField('address1', e.target.value)} className={inputCls} />
        </label>
        <label className={labelCls}>
          Address 2
          <input value={form.address2} onChange={(e) => updateField('address2', e.target.value)} className={inputCls} />
        </label>
        <div className="flex gap-2 md:col-span-2 xl:col-span-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving…' : form.satId ? 'Update' : 'Submit'}
          </button>
          <button type="button" onClick={() => setForm(emptyForm())} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600">
            Cancel
          </button>
        </div>
      </form>

      <div className="overflow-x-auto touch-scroll rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Select</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Short Name</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <button type="button" onClick={() => void selectRow(row)} className="text-brand-primary hover:underline">
                    Select
                  </button>
                </td>
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.shortName}</td>
                <td className="px-3 py-2">{row.city}</td>
                <td className="px-3 py-2">{row.phone}</td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  No satellites found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
