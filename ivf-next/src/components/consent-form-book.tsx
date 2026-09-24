'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import {
  downloadConsentBook,
  fetchConsentCatalog,
  fetchConsentPatientContext,
  type ConsentCatalog,
  type ConsentPatientContext,
} from '@/lib/services/consent';

export function ConsentFormBook() {
  const { token } = useAuth();
  const { selectedPatient } = usePatient();
  const [moduleName, setModuleName] = useState<'IVF' | 'IUI'>('IVF');
  const [catalog, setCatalog] = useState<ConsentCatalog>({ categories: [], presets: [] });
  const [context, setContext] = useState<ConsentPatientContext | null>(null);
  const [presetId, setPresetId] = useState('');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [recent, setRecent] = useState<Array<{ name: string; when: string; forms: number }>>([]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await fetchConsentCatalog(token, moduleName);
        setCatalog(data);
        setOpen(Object.fromEntries(data.categories.map((category) => [category.title, true])));
        setChecked({});
        setPresetId('');
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Could not load consent forms.');
      }
    })();
  }, [token, moduleName]);

  useEffect(() => {
    if (!token || !selectedPatient?.id || !selectedPatient.satelliteId) {
      setContext(null);
      return;
    }
    (async () => {
      try {
        setContext(await fetchConsentPatientContext(token, selectedPatient.id, selectedPatient.satelliteId));
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'Could not load patient details.');
      }
    })();
  }, [token, selectedPatient?.id, selectedPatient?.satelliteId]);

  const allPaths = useMemo(
    () => catalog.categories.flatMap((category) => category.forms.map((form) => form.relativePath)),
    [catalog]
  );
  const selectedPaths = allPaths.filter((item) => checked[item]);
  const allSelected = allPaths.length > 0 && selectedPaths.length === allPaths.length;

  function applyPreset(id: string) {
    setPresetId(id);
    const preset = catalog.presets.find((item) => item.id === id);
    if (!preset) return;
    const next: Record<string, boolean> = {};
    preset.paths.forEach((item) => {
      next[item] = true;
    });
    setChecked(next);
  }

  async function generate() {
    if (!token || !selectedPatient?.id || !selectedPatient.satelliteId) {
      setMessage('Select a patient from the top bar before generating.');
      return;
    }
    if (selectedPaths.length === 0) {
      setMessage('Tick at least one consent form.');
      return;
    }
    setGenerating(true);
    setMessage(null);
    try {
      await downloadConsentBook(token, {
        patId: selectedPatient.id,
        satId: selectedPatient.satelliteId,
        paths: selectedPaths,
        patientName: selectedPatient.name,
      });
      setRecent((items) => [
        {
          name: `${selectedPatient.name} - Consent Book`,
          when: new Date().toLocaleString('en-GB', { hour12: true }),
          forms: selectedPaths.length,
        },
        ...items,
      ].slice(0, 6));
      setMessage(`Downloaded ${selectedPaths.length} Word form(s) as PDF.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not build the consent book.');
    } finally {
      setGenerating(false);
    }
  }

  const patient = context?.patient;
  const clinic = context?.clinic;
  const address = [patient?.address, patient?.city].filter(Boolean).join(', ');

  return (
    <div className="space-y-4">
      <h1 className="text-center font-display text-2xl font-bold text-slate-900">Consent Form Book</h1>
      {message && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{message}</div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">Patient details (auto filled)</h2>
          {!patient ? (
            <p className="mt-6 rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm text-amber-900">
              Use Change Patient in the top bar. The active patient fills this panel.
            </p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Detail label="Name of female / wife / woman" value={patient.name} />
              <Detail label="Name of male / husband / man" value={patient.partner} />
              <Detail label="Aadhaar (female / wife)" value={patient.aadhar} />
              <Detail label="Aadhaar (male / husband)" value={patient.maleAadhar} />
              <Detail label="Residence address" value={address} wide />
              <Detail label="Mobile number" value={patient.mobile} />
              <Detail label="Registration no." value={patient.registrationNo} />
              <Detail label="UHID / Patient ID" value={patient.uhid} />
              <Detail label="Patient age" value={patient.age != null ? `${patient.age} Years` : ''} />
              <Detail label="Date of birth" value={patient.dob} />
              <Detail label="Date" value={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <Detail label="Cycle no." value={context?.cycles[0]?.id} />
              <Detail label="Email" value={patient.email} />
              <Detail label="Diagnosis" value={patient.diagnosis} />
              <Detail label="Consultant 1" value={clinic?.consultant1} extra={clinic?.consultant1Reg ? `Reg. no. ${clinic.consultant1Reg}` : ''} />
              <Detail label="Consultant 2" value={clinic?.consultant2} extra={clinic?.consultant2Reg ? `Reg. no. ${clinic.consultant2Reg}` : ''} />
              <Detail label="Consultant 3 (ref by)" value={patient.referredBy} extra={clinic?.consultantReg ? `Reg. no. ${clinic.consultantReg}` : ''} />
              <Detail label="Consultant address" value={clinic?.consultantAddress} wide />
              <Detail label="ART registration of clinic no." value={clinic?.artRegNo} />
              <Detail label="PCPNDT registration of clinic no." value={clinic?.pcpndtRegNo} />
              <Detail label="Type of facility" value={clinic?.facilityType} />
              <Detail label="Name and address of clinic" value={[clinic?.name, clinic?.address].filter(Boolean).join(', ')} wide />
              <Detail label="Witness name" value={clinic?.witnessName} />
              <Detail label="Witness address" value={clinic?.witnessAddress} />
            </dl>
          )}
        </section>

        <div className="space-y-4">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">Pre-set case category consent forms</h2>
            <label className="mt-3 block text-xs font-semibold text-slate-500">Category</label>
            <select
              value={presetId}
              onChange={(event) => applyPreset(event.target.value)}
              disabled={moduleName !== 'IVF'}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="">Select case type to auto-tick forms</option>
              {catalog.presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.id}. {preset.title}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-400">Chooses ART / ICMR / PCPNDT / thaw sheets for that case. You can still tick or untick forms after.</p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Select consent forms</h2>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {
                    if (allSelected) setChecked({});
                    else setChecked(Object.fromEntries(allPaths.map((item) => [item, true])));
                  }}
                />
                Select all
              </label>
            </div>
            <div className="mt-3 flex gap-2">
              {(['IVF', 'IUI'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setModuleName(item)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                    moduleName === item ? 'bg-[#6d4cc4] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item} Module
                </button>
              ))}
            </div>
            <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {catalog.categories.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">No Word forms were found for this module.</p>
              ) : (
                catalog.categories.map((category) => (
                  <div key={category.title} className="rounded-2xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setOpen((state) => ({ ...state, [category.title]: !state[category.title] }))}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-slate-800"
                    >
                      <span>{category.title}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{category.forms.length} forms</span>
                    </button>
                    {open[category.title] && (
                      <div className="space-y-1 px-3 pb-3">
                        {category.forms.map((form) => (
                          <label key={form.relativePath} className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-sm hover:bg-slate-50">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={!!checked[form.relativePath]}
                              onChange={() => setChecked((state) => ({ ...state, [form.relativePath]: !state[form.relativePath] }))}
                            />
                            <span>{form.displayName}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">PDF actions</h2>
          <p className="mt-1 text-xs text-slate-400">The original Word form is filled, then LibreOffice converts that same file to PDF.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="rounded-xl bg-[#6d4cc4] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {generating ? 'Filling Word forms…' : 'Generate & Download PDF'}
            </button>
            <button
              type="button"
              onClick={() => {
                setChecked({});
                setPresetId('');
                setMessage(null);
              }}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
            >
              Clear
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Count label="Total forms selected" value={selectedPaths.length} />
            <Count label="Estimated pages" value={selectedPaths.length} />
          </div>
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">Recently generated books (this session)</h2>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Generated PDFs appear here after you create a PDF book.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {recent.map((item) => (
                <li key={`${item.when}-${item.name}`} className="rounded-xl bg-slate-50 px-3 py-2">
                  <div className="font-semibold text-slate-800">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.forms} forms · {item.when}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Detail({ label, value, extra, wide }: { label: string; value?: string | null; extra?: string; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : undefined}>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="font-semibold text-slate-800">{value || '—'}</dd>
      {extra ? <dd className="text-xs text-slate-500">{extra}</dd> : null}
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
      <div className="text-2xl font-bold text-[#6d4cc4]">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
