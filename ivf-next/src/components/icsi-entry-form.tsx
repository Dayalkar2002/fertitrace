'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ModuleAlerts, ModuleCard, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import {
  CycleDateOption,
  asBool,
  formatCycleDate,
  icsiApi,
} from '@/lib/services/clinical-modules';
import { fetchCycleSemenAnalysis } from '@/lib/services/semen-analysis';
import {
  fetchSelfFrozenOocytes,
  submitSelfOocyteThaw,
  type SelfFrozenOocyte,
} from '@/lib/services/self-oocyte';
import type { LookupItem } from '@/lib/types/master';

const inputCls = 'mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm';
const labelCls = 'text-xs font-medium text-slate-600';
const checkCls = 'flex items-center gap-2 text-sm text-slate-700';

type IcsiForm = Record<string, string | number | boolean>;

const defaultForm = (): IcsiForm => ({
  cycId: '',
  cycleDate: '',
  icsiId: '',
  gnrhFollicular: true,
  gnrhLuteal: false,
  gnrhStopL: false,
  gnrhNone: false,
  fshDrug1: 0,
  fshDrug2: 0,
  hmgDrug1: 0,
  hmgDrug2: 0,
  otherCycle: true,
  otherCycleVal: 0,
  naturalCycle: true,
  e2Pattern1: 0,
  e2Pattern2: 0,
  e2Pattern3: 0,
  e2Pattern4: 0,
  daysStimulation: 0,
  intervalToHcg: 0,
  intervalFromHcgHrs: 0,
  intervalFromHcgMin: 0,
  retPerId: 0,
  transPerId: 0,
  labOptId: 0,
  mediaBrand: 0,
  mediaSeries: 0,
  incubatorUsed: 0,
  gas: 0,
  semenType1: 0,
  semenType2: 0,
  semenType3: 0,
  semenType4: 0,
  oiMetaII: 0,
  oiMetaI: 0,
  oiGV: 0,
  oiDeg: 0,
  fMetaII0pb: 0,
  fMetaII0PN: 0,
  fMetaII1PN: 0,
  fMetaII2PN: 0,
  fMetaII3PN: 0,
  fMetaIIStuck: 0,
  fMetaIICont: false,
  fMetaIICleaved: 0,
  fMetaI0pb: 0,
  fMetaI0PN: 0,
  fMetaI1PN: 0,
  fMetaI2PN: 0,
  fMetaI3PN: 0,
  fMetaIStuck: 0,
  fMetaICont: false,
  fMetaICleaved: 0,
  fGV0pb: 0,
  fGV0PN: 0,
  fGV1PN: 0,
  fGV2PN: 0,
  fGV3PN: 0,
  fGVStuck: 0,
  fGVCont: false,
  fGVCleaved: 0,
});

function applyIcsiRecord(form: IcsiForm, data: Record<string, unknown>): IcsiForm {
  return {
    ...form,
    icsiId: String(data.ICSIID || ''),
    gnrhFollicular: asBool(data.ICSISGnRN),
    gnrhLuteal: asBool(data.ICSISLuteal),
    gnrhStopL: asBool(data.ICSISStopL),
    gnrhNone: asBool(data.ICSISNone),
    fshDrug1: Number(data.MCCDFSHDrug1 || 0),
    fshDrug2: Number(data.MCCDFSHDrug2 || 0),
    hmgDrug1: Number(data.MCCDHMGDrug1 || 0),
    hmgDrug2: Number(data.MCCDHMGDrgu2 || 0),
    otherCycle: asBool(data.ICSISOther),
    otherCycleVal: Number(data.ICSISOtherVal || 0),
    naturalCycle: asBool(data.ICSISNaturalCycle),
    e2Pattern1: Number(data.ICSISE2Pattern1 || 0),
    e2Pattern2: Number(data.ICSISE2Pattern2 || 0),
    e2Pattern3: Number(data.ICSISE2Pattern3 || 0),
    e2Pattern4: Number(data.ICSISE2Pattern4 || 0),
    daysStimulation: Number(data.ICSISNODStimulation || 0),
    intervalToHcg: Number(data.ICSISIntervalToHCG || 0),
    intervalFromHcgHrs: Number(data.ICSISIntervalFromHCGHrs || 0),
    intervalFromHcgMin: Number(data.ICSISIntervalFromHCGMin || 0),
    retPerId: Number(data.ICSIPRetPerID || 0),
    transPerId: Number(data.ICSIPTransPerID || 0),
    labOptId: Number(data.LabOptID || 0),
    mediaBrand: Number(data.MediaBrand || 0),
    mediaSeries: Number(data.MediaSeries || 0),
    incubatorUsed: Number(data.IncubatorUsed || 0),
    gas: Number(data.Gas || 0),
    semenType1: Number(data.ICSISType1 || 0),
    semenType2: Number(data.ICSISType2 || 0),
    semenType3: Number(data.ICSISType3 || 0),
    semenType4: Number(data.ICSISType4 || 0),
    oiMetaII: Number(data.ICSIOIMetaII || 0),
    oiMetaI: Number(data.ICSIOIMetaI || 0),
    oiGV: Number(data.ICSIOIGV || 0),
    oiDeg: Number(data.ICSIOIDEG || 0),
    fMetaII0pb: Number(data.ICSIFMetaII0pb || 0),
    fMetaII0PN: Number(data.ICSIFMetaII0PN || 0),
    fMetaII1PN: Number(data.ICSIFMetaII1PN || 0),
    fMetaII2PN: Number(data.ICSIFMetaII2PN || 0),
    fMetaII3PN: Number(data.ICSIFMetaII3PN || 0),
    fMetaIIStuck: Number(data.ICSIFMetaIIStuck || 0),
    fMetaIICont: asBool(data.ICSIFMetaIICont),
    fMetaIICleaved: Number(data.ICSIFMetaIICleaved || 0),
    fMetaI0pb: Number(data.ICSIFMetaI0pb || 0),
    fMetaI0PN: Number(data.ICSIFMetaI0PN || 0),
    fMetaI1PN: Number(data.ICSIFMetaI1PN || 0),
    fMetaI2PN: Number(data.ICSIFMetaI2PN || 0),
    fMetaI3PN: Number(data.ICSIFMetaI3PN || 0),
    fMetaIStuck: Number(data.ICSIFMetaIStuck || 0),
    fMetaICont: asBool(data.ICSIFMetaICont),
    fMetaICleaved: Number(data.ICSIFMetaICleaved || 0),
    fGV0pb: Number(data.ICSIFGV0pb || 0),
    fGV0PN: Number(data.ICSIFGV0PN || 0),
    fGV1PN: Number(data.ICSIFGV1PN || 0),
    fGV2PN: Number(data.ICSIFGV2PN || 0),
    fGV3PN: Number(data.ICSIFGV3PN || 0),
    fGVStuck: Number(data.ICSIFGVStuck || 0),
    fGVCont: asBool(data.ICSIFGVCont),
    fGVCleaved: Number(data.ICSIFGVCleaved || 0),
  };
}

function NumField({
  label,
  name,
  form,
  setForm,
}: {
  label: string;
  name: string;
  form: IcsiForm;
  setForm: React.Dispatch<React.SetStateAction<IcsiForm>>;
}) {
  return (
    <label className={labelCls}>
      {label}
      <input
        type="number"
        value={Number(form[name] ?? 0)}
        onChange={(e) => setForm((f) => ({ ...f, [name]: Number(e.target.value) }))}
        className={inputCls}
      />
    </label>
  );
}

function LookupSelect({
  label,
  name,
  form,
  setForm,
  options,
}: {
  label: string;
  name: string;
  form: IcsiForm;
  setForm: React.Dispatch<React.SetStateAction<IcsiForm>>;
  options: LookupItem[];
}) {
  return (
    <label className={labelCls}>
      {label}
      <select
        value={Number(form[name] ?? 0)}
        onChange={(e) => setForm((f) => ({ ...f, [name]: Number(e.target.value) }))}
        className={inputCls}
      >
        <option value={0}>Select</option>
        {options.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function IcsiEntryForm() {
  const { token } = useAuth();
  const { patId, satId, ready } = usePatientIds();

  const [form, setForm] = useState(defaultForm);
  const [cycleDates, setCycleDates] = useState<CycleDateOption[]>([]);
  const [doctors, setDoctors] = useState<LookupItem[]>([]);
  const [labOptions, setLabOptions] = useState<LookupItem[]>([]);
  const [mediaBrand, setMediaBrand] = useState<LookupItem[]>([]);
  const [mediaSeries, setMediaSeries] = useState<LookupItem[]>([]);
  const [incubator, setIncubator] = useState<LookupItem[]>([]);
  const [gas, setGas] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [frozenOocytes, setFrozenOocytes] = useState<SelfFrozenOocyte[]>([]);
  const [thawLoading, setThawLoading] = useState(false);

  const balanceText = useMemo(() => {
    const v = form;
    const metaII =
      Number(v.fMetaII0pb) + Number(v.fMetaII0PN) + Number(v.fMetaII1PN) + Number(v.fMetaII2PN) + Number(v.fMetaII3PN) - Number(v.oiMetaII);
    const metaI =
      Number(v.fMetaI0pb) + Number(v.fMetaI0PN) + Number(v.fMetaI1PN) + Number(v.fMetaI2PN) + Number(v.fMetaI3PN) - Number(v.oiMetaI);
    const gv = Number(v.fGV0pb) + Number(v.fGV0PN) + Number(v.fGV1PN) + Number(v.fGV2PN) + Number(v.fGV3PN) - Number(v.oiGV);
    return `Metaphase II: ${metaII} | Metaphase I: ${metaI} | GV: ${gv}`;
  }, [form]);

  const init = useCallback(async () => {
    if (!token || !ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [dates, lookups] = await Promise.all([
        icsiApi.getCycleDates(token, patId, satId),
        icsiApi.getLookups<{
          doctors: LookupItem[];
          labOptions: LookupItem[];
          mediaBrand: LookupItem[];
          mediaSeries: LookupItem[];
          incubator: LookupItem[];
          gas: LookupItem[];
        }>(token).catch(() => ({
          doctors: [],
          labOptions: [],
          mediaBrand: [],
          mediaSeries: [],
          incubator: [],
          gas: [],
        })),
      ]);
      setCycleDates(dates);
      setDoctors(lookups.doctors || []);
      setLabOptions(lookups.labOptions || []);
      setMediaBrand(lookups.mediaBrand || []);
      setMediaSeries(lookups.mediaSeries || []);
      setIncubator(lookups.incubator || []);
      setGas(lookups.gas || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load ICSI module.');
    } finally {
      setLoading(false);
    }
  }, [token, ready, patId, satId]);

  useEffect(() => {
    void init();
  }, [init]);

  async function onCycleChange(cycId: string) {
    if (!token || !cycId) {
      setShowForm(false);
      setForm((f) => ({ ...f, cycId: '' }));
      return;
    }
    const selected = cycleDates.find((c) => String(c.cycId) === cycId);
    if (!selected) return;

    setCycleLoading(true);
    setError('');
    const cycleDate = formatCycleDate(selected.cycleDate);
    setForm((f) => ({ ...f, cycId, cycleDate: selected.cycleDate }));

    try {
      const [monitoring, record, semenRes] = await Promise.all([
        icsiApi.getMonitoring(token, patId, satId, String(selected.cycId), cycleDate).catch(() => null),
        icsiApi.loadRecord(token, patId, satId, String(selected.cycId), cycleDate).catch(() => ({
          data: null,
          exists: false,
        })),
        fetchCycleSemenAnalysis(token, String(selected.cycId), patId).catch(() => ({ analysis: null, history: [] })),
      ]);

      let next: IcsiForm = { ...defaultForm(), cycId, cycleDate: selected.cycleDate };
      if (monitoring) {
        next = {
          ...next,
          fshDrug1: Number(monitoring.MCCDFSHDrug1 || 0),
          fshDrug2: Number(monitoring.MCCDFSHDrug2 || 0),
          hmgDrug1: Number(monitoring.MCCDHMGDrug1 || 0),
          hmgDrug2: Number(monitoring.MCCDHMGDrug2 || 0),
        };
      }
      if (record.exists && record.data) {
        next = applyIcsiRecord(next, record.data);
        setIsUpdate(true);
      } else {
        setIsUpdate(false);
      }

      // Auto-fill Semen Survival / Post-Processing analysis if not already set
      if ((!next.semenType1 || Number(next.semenType1) === 0) && semenRes?.analysis) {
        const a = semenRes.analysis;
        const sc = Number(a.afterSperms || a.beforeSperms || 0);
        const pm = Number(a.afterProgMotility || a.beforeProgMotility || 0);
        next.semenType1 = sc;
        next.semenType2 = pm;
      }

      setForm(next);
      setShowForm(true);

      // Check if patient has self-frozen oocytes in storage
      void fetchSelfFrozenOocytes(token, patId, satId)
        .then((list) => setFrozenOocytes(list))
        .catch(() => setFrozenOocytes([]));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load cycle data.');
    } finally {
      setCycleLoading(false);
    }
  }

  async function handleAutoFillSemen() {
    if (!token || !form.cycId) return;
    try {
      const semenRes = await fetchCycleSemenAnalysis(token, String(form.cycId), patId);
      if (semenRes.analysis) {
        const a = semenRes.analysis;
        const sc = Number(a.afterSperms || a.beforeSperms || 0);
        const pm = Number(a.afterProgMotility || a.beforeProgMotility || 0);
        setForm((f) => ({
          ...f,
          semenType1: sc,
          semenType2: pm,
        }));
      }
    } catch {
      // ignore
    }
  }

  async function handleThawOocytes() {
    if (!token || !form.cycId || !frozenOocytes.length) return;
    setThawLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await submitSelfOocyteThaw(token, {
        patId,
        satId,
        thawCycleId: String(form.cycId),
        thawProcDoneBy: 'Embryologist',
        oocyteThawStatuses: frozenOocytes.map((o) => ({ oocyteId: o.oocyteId, survived: true })),
      });
      setSuccess(
        `Thawed ${res.data.totalThawed} oocytes: ${res.data.survivedMII} Metaphase II survived and populated into ICSI!`
      );
      setForm((f) => ({
        ...f,
        oiMetaII: res.data.survivedMII,
        oiMetaI: res.data.survivedMI,
        oiGV: res.data.survivedGV,
      }));
      const updated = await fetchSelfFrozenOocytes(token, patId, satId);
      setFrozenOocytes(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to thaw oocytes.');
    } finally {
      setThawLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !form.cycId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const { cycId, cycleDate, icsiId, ...rest } = form;
    try {
      const res = await icsiApi.save(token, {
        mode: isUpdate ? 'update' : 'insert',
        patId,
        satId,
        cycId,
        cycleDate,
        icsiId,
        ...rest,
      });
      setSuccess(res.message);
      setIsUpdate(true);
      const saved = res.data as { icsiId?: string };
      if (saved?.icsiId) setForm((f) => ({ ...f, icsiId: saved.icsiId! }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save ICSI record.');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setShowForm(false);
    setForm(defaultForm());
    setIsUpdate(false);
    setSuccess('');
    setError('');
  }

  return (
    <PatientRequired>
      <ModuleCard title="ICSI Entry Module">
        <ModuleAlerts error={error} success={success} />
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {cycleLoading && showForm && <p className="text-sm text-slate-500">Loading cycle data…</p>}

        <div className="mb-4 flex flex-wrap items-end gap-4">
          <label className={labelCls}>
            Select Cycle Date
            <select value={String(form.cycId)} onChange={(e) => void onCycleChange(e.target.value)} className={`${inputCls} min-w-[220px]`}>
              <option value="">Select Cycle Date</option>
              {cycleDates.map((item) => (
                <option key={item.cycId} value={item.cycId}>
                  {new Date(item.cycleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </option>
              ))}
            </select>
          </label>
          {form.icsiId && (
            <span className="text-sm text-slate-600">
              ICSI Id: <strong>{String(form.icsiId)}</strong>
            </span>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section>
              <h2 className="mb-3 text-lg font-semibold">Stimulation</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(['gnrhFollicular', 'gnrhLuteal', 'gnrhStopL', 'gnrhNone', 'otherCycle', 'naturalCycle'] as const).map((key) => (
                  <label key={key} className={checkCls}>
                    <input type="checkbox" checked={!!form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </label>
                ))}
                <NumField label="FSH Drug 1" name="fshDrug1" form={form} setForm={setForm} />
                <NumField label="FSH Drug 2" name="fshDrug2" form={form} setForm={setForm} />
                <NumField label="HMG Drug 1" name="hmgDrug1" form={form} setForm={setForm} />
                <NumField label="HMG Drug 2" name="hmgDrug2" form={form} setForm={setForm} />
                <NumField label="Other Value" name="otherCycleVal" form={form} setForm={setForm} />
                <NumField label="Days Stimulation" name="daysStimulation" form={form} setForm={setForm} />
                <NumField label="Interval to HCG" name="intervalToHcg" form={form} setForm={setForm} />
                <NumField label="Interval HCG (Hrs)" name="intervalFromHcgHrs" form={form} setForm={setForm} />
                <NumField label="Interval HCG (Min)" name="intervalFromHcgMin" form={form} setForm={setForm} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Personnel &amp; Lab</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <LookupSelect label="Retrieval" name="retPerId" form={form} setForm={setForm} options={doctors} />
                <LookupSelect label="Transfer" name="transPerId" form={form} setForm={setForm} options={doctors} />
                <LookupSelect label="Lab Op." name="labOptId" form={form} setForm={setForm} options={labOptions} />
                <LookupSelect label="Media Brand" name="mediaBrand" form={form} setForm={setForm} options={mediaBrand} />
                <LookupSelect label="Media Series" name="mediaSeries" form={form} setForm={setForm} options={mediaSeries} />
                <LookupSelect label="Incubator" name="incubatorUsed" form={form} setForm={setForm} options={incubator} />
                <LookupSelect label="Gas" name="gas" form={form} setForm={setForm} options={gas} />
              </div>
            </section>

            <section className="rounded-xl border border-blue-200/80 bg-blue-50/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>🧪</span>
                    <span>Semen Parameters</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Semen survival analysis parameters (Insemination Volume is Not Applicable for ICSI)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillSemen}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#6345A6] hover:bg-purple-100 transition shadow-2xs"
                >
                  <span>✨</span>
                  <span>Auto-fill from Survival Analysis</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
                <div>
                  <label className={labelCls}>
                    Sperm Conc. (SC × 10⁶/mL)
                    <input
                      type="number"
                      step="any"
                      value={Number(form.semenType1 ?? 0)}
                      onChange={(e) => setForm((f) => ({ ...f, semenType1: Number(e.target.value) }))}
                      className={inputCls}
                    />
                  </label>
                </div>
                <div>
                  <label className={labelCls}>
                    Progressive Motility (PM %)
                    <input
                      type="number"
                      step="any"
                      value={Number(form.semenType2 ?? 0)}
                      onChange={(e) => setForm((f) => ({ ...f, semenType2: Number(e.target.value) }))}
                      className={inputCls}
                    />
                  </label>
                </div>
                <div>
                  <label className={labelCls}>
                    Insem. Vol
                    <input
                      type="text"
                      readOnly
                      disabled
                      value="NA"
                      className={`${inputCls} bg-slate-100 font-semibold text-slate-400 cursor-not-allowed`}
                    />
                  </label>
                </div>
                <div>
                  <label className={labelCls}>
                    No. of Oocytes
                    <input
                      type="text"
                      readOnly
                      disabled
                      value="NA"
                      className={`${inputCls} bg-slate-100 font-semibold text-slate-400 cursor-not-allowed`}
                    />
                  </label>
                </div>
              </div>
            </section>

            {frozenOocytes.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/70 p-4">
                <div>
                  <h3 className="text-sm font-bold text-sky-950 flex items-center gap-2">
                    <span>❄️</span>
                    <span>Self-Frozen Oocytes in Cryo Storage</span>
                  </h3>
                  <p className="text-xs text-sky-800 mt-0.5">
                    Patient has <strong>{frozenOocytes.length}</strong> frozen oocytes available from cycle{' '}
                    <strong>{frozenOocytes[0].cycleId}</strong> (Location: {frozenOocytes[0].location}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleThawOocytes}
                  disabled={thawLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-sky-700 transition disabled:opacity-50"
                >
                  <span>⚡</span>
                  <span>{thawLoading ? 'Thawing…' : 'Thaw & Load into ICSI'}</span>
                </button>
              </div>
            )}

            <section>
              <h2 className="mb-3 text-lg font-semibold">Oocytes &amp; Fertilization</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <NumField label="Metaphase II" name="oiMetaII" form={form} setForm={setForm} />
                <NumField label="Metaphase I" name="oiMetaI" form={form} setForm={setForm} />
                <NumField label="GV" name="oiGV" form={form} setForm={setForm} />
                <NumField label="DEG/Empty" name="oiDeg" form={form} setForm={setForm} />
              </div>
              <p className="mt-2 text-sm font-medium text-brand-primary">{balanceText}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
                <NumField label="Meta II 2PN" name="fMetaII2PN" form={form} setForm={setForm} />
                <NumField label="Meta II Cleaved" name="fMetaIICleaved" form={form} setForm={setForm} />
                <NumField label="Meta I 2PN" name="fMetaI2PN" form={form} setForm={setForm} />
                <NumField label="GV 2PN" name="fGV2PN" form={form} setForm={setForm} />
                <NumField label="GV Cleaved" name="fGVCleaved" form={form} setForm={setForm} />
              </div>
            </section>

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? 'Saving…' : isUpdate ? 'Update' : 'Submit'}
              </button>
              <button type="button" onClick={cancel} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600">
                Cancel
              </button>
            </div>
          </form>
        )}
      </ModuleCard>
    </PatientRequired>
  );
}
