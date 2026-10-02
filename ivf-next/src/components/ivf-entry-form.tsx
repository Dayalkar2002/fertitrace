'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ModuleAlerts, ModuleCard, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import {
  CycleDateOption,
  asBool,
  formatCycleDate,
  ivfApi,
} from '@/lib/services/clinical-modules';
import { fetchCycleSemenAnalysis } from '@/lib/services/semen-analysis';
import type { LookupItem } from '@/lib/types/master';

const inputCls = 'mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm';
const labelCls = 'text-xs font-medium text-slate-600';
const checkCls = 'flex items-center gap-2 text-sm text-slate-700';

type IvfForm = Record<string, string | number | boolean>;

const defaultForm = (): IvfForm => ({
  cycId: '',
  cycleDate: '',
  ivfId: '',
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
  inseminationHours: 0,
  concStandard: true,
  concHigh: false,
  concIcsi: false,
  spAssHatch: true,
  spEmbryoBiopsy: false,
  spImsi: false,
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
  riMetaIIAllocated: 0,
  riMetaIIRescued: 0,
  fMetaI0pb: 0,
  fMetaI0PN: 0,
  fMetaI1PN: 0,
  fMetaI2PN: 0,
  fMetaI3PN: 0,
  fMetaIStuck: 0,
  fMetaICont: false,
  fMetaICleaved: 0,
  riMetaIAllocated: 0,
  riMetaIRescued: 0,
  fGV0pb: 0,
  fGV0PN: 0,
  fGV1PN: 0,
  fGV2PN: 0,
  fGV3PN: 0,
  fGVStuck: 0,
  fGVCont: false,
  fGVCleaved: 0,
  riGVAllocated: 0,
  riGVRescued: 0,
});

function applyIvfRecord(form: IvfForm, data: Record<string, unknown>): IvfForm {
  return {
    ...form,
    ivfId: String(data.IVFID || ''),
    gnrhFollicular: asBool(data.IVFSGnRN),
    gnrhLuteal: asBool(data.IVFSLuteal),
    gnrhStopL: asBool(data.IVFSStopL),
    gnrhNone: asBool(data.IVFSNone),
    fshDrug1: Number(data.MCCDFSHDrug1 || 0),
    fshDrug2: Number(data.MCCDFSHDrug2 || 0),
    hmgDrug1: Number(data.MCCDHMGDrug1 || 0),
    hmgDrug2: Number(data.MCCDHMGDrgu2 || 0),
    otherCycle: asBool(data.IVFSOther),
    otherCycleVal: Number(data.IVFSOtherVal || 0),
    naturalCycle: asBool(data.IVFSNaturalCycle),
    e2Pattern1: Number(data.IVFSE2Pattern1 || 0),
    e2Pattern2: Number(data.IVFSE2Pattern2 || 0),
    e2Pattern3: Number(data.IVFSE2Pattern3 || 0),
    e2Pattern4: Number(data.IVFSE2Pattern4 || 0),
    daysStimulation: Number(data.IVFSNODStimulation || 0),
    intervalToHcg: Number(data.IVFSIntervalToHCG || 0),
    intervalFromHcgHrs: Number(data.IVFSIntervalFromHCGHrs || 0),
    intervalFromHcgMin: Number(data.IVFSIntervalFromHCGMin || 0),
    inseminationHours: Number(data.IVFPInsemination || 0),
    concStandard: asBool(data.IVFPConcStandard),
    concHigh: asBool(data.IVFPHigh),
    concIcsi: asBool(data.IVFPICSI),
    spAssHatch: asBool(data.IVFPSpAssHatch),
    spEmbryoBiopsy: asBool(data.IVFPSpEBiopsy),
    spImsi: asBool(data.IVFPSpCTrans),
    retPerId: Number(data.IVFPRetPerID || 0),
    transPerId: Number(data.IVFPTransPerID || 0),
    labOptId: Number(data.LabOptID || 0),
    mediaBrand: Number(data.IVFMediaBrand || 0),
    mediaSeries: Number(data.IVFMediaSeries || 0),
    incubatorUsed: Number(data.IVFIncubatorUsed || 0),
    gas: Number(data.IVFGas || 0),
    semenType1: Number(data.IVFSType1 || 0),
    semenType2: Number(data.IVFSType2 || 0),
    semenType3: Number(data.IVFSType3 || 0),
    semenType4: Number(data.IVFSType4 || 0),
    oiMetaII: Number(data.IVFOIMetaII || 0),
    oiMetaI: Number(data.IVFOIMetaI || 0),
    oiGV: Number(data.IVFOIGV || 0),
    oiDeg: Number(data.IVFOIDEG || 0),
    fMetaII0pb: Number(data.IVFFMetaII0pb || 0),
    fMetaII0PN: Number(data.IVFFMetaII0PN || 0),
    fMetaII1PN: Number(data.IVFFMetaII1PN || 0),
    fMetaII2PN: Number(data.IVFFMetaII2PN || 0),
    fMetaII3PN: Number(data.IVFFMetaII3PN || 0),
    fMetaIIStuck: Number(data.IVFFMetaIIStuck || 0),
    fMetaIICont: asBool(data.IVFFMetaIICont),
    fMetaIICleaved: Number(data.IVFFMetaIICleaved || 0),
    riMetaIIAllocated: Number(data.IVFRIMetaIIAllocated || 0),
    riMetaIIRescued: Number(data.IVFRIMetaIIRescued || 0),
    fMetaI0pb: Number(data.IVFFMetaI0pb || 0),
    fMetaI0PN: Number(data.IVFFMetaI0PN || 0),
    fMetaI1PN: Number(data.IVFFMetaI1PN || 0),
    fMetaI2PN: Number(data.IVFFMetaI2PN || 0),
    fMetaI3PN: Number(data.IVFFMetaI3PN || 0),
    fMetaIStuck: Number(data.IVFFMetaIStuck || 0),
    fMetaICont: asBool(data.IVFFMetaICont),
    fMetaICleaved: Number(data.IVFFMetaICleaved || 0),
    riMetaIAllocated: Number(data.IVFRIMetaIAllocated || 0),
    riMetaIRescued: Number(data.IVFRIMetaIRescued || 0),
    fGV0pb: Number(data.IVFFGV0pb || 0),
    fGV0PN: Number(data.IVFFGV0PN || 0),
    fGV1PN: Number(data.IVFFGV1PN || 0),
    fGV2PN: Number(data.IVFFGV2PN || 0),
    fGV3PN: Number(data.IVFFGV3PN || 0),
    fGVStuck: Number(data.IVFFGVStuck || 0),
    fGVCont: asBool(data.IVFFGVCont),
    fGVCleaved: Number(data.IVFFGVCleaved || 0),
    riGVAllocated: Number(data.IVFRIGVAllocated || 0),
    riGVRescued: Number(data.IVFRIGVRescued || 0),
  };
}

function NumField({
  label,
  name,
  form,
  setForm,
  onChange,
}: {
  label: string;
  name: string;
  form: IvfForm;
  setForm: React.Dispatch<React.SetStateAction<IvfForm>>;
  onChange?: () => void;
}) {
  return (
    <label className={labelCls}>
      {label}
      <input
        type="number"
        value={Number(form[name] ?? 0)}
        onChange={(e) => {
          setForm((f) => ({ ...f, [name]: Number(e.target.value) }));
          onChange?.();
        }}
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
  form: IvfForm;
  setForm: React.Dispatch<React.SetStateAction<IvfForm>>;
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

export function IvfEntryForm() {
  const { token } = useAuth();
  const { patId, satId, patientAge, ready } = usePatientIds();
  const ageBlocked = patientAge > 50;

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
    if (!token || !ready || ageBlocked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [dates, lookups] = await Promise.all([
        ivfApi.getCycleDates(token, patId, satId),
        ivfApi.getLookups<{
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
      setError(err instanceof ApiError ? err.message : 'Failed to load IVF module.');
    } finally {
      setLoading(false);
    }
  }, [token, ready, patId, satId, ageBlocked]);

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
        ivfApi.getMonitoring(token, patId, satId, String(selected.cycId), cycleDate).catch(() => null),
        ivfApi.loadRecord(token, patId, satId, String(selected.cycId), cycleDate).catch(() => ({
          data: null,
          exists: false,
        })),
        fetchCycleSemenAnalysis(token, String(selected.cycId), patId).catch(() => ({ analysis: null, history: [] })),
      ]);

      let next: IvfForm = { ...defaultForm(), cycId, cycleDate: selected.cycleDate };
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
        next = applyIvfRecord(next, record.data);
        setIsUpdate(true);
      } else {
        setIsUpdate(false);
      }

      // Auto-fill Semen Survival / Post-Processing analysis if not already set
      if ((!next.semenType1 || Number(next.semenType1) === 0) && semenRes?.analysis) {
        const a = semenRes.analysis;
        const sc = Number(a.afterSperms || a.beforeSperms || 0);
        const pm = Number(a.afterProgMotility || a.beforeProgMotility || 0);
        const oocyteCount = Number(next.semenType4 || 0) || (Number(next.oiMetaII || 0) + Number(next.oiMetaI || 0) + Number(next.oiGV || 0)) || 5;
        let vol = 0;
        if (sc > 0 && pm > 0 && oocyteCount > 0) {
          vol = Number((oocyteCount / (sc * (pm / 100))).toFixed(3));
        }
        next.semenType1 = sc;
        next.semenType2 = pm;
        next.semenType3 = vol;
        next.semenType4 = oocyteCount;
      }

      setForm(next);
      setShowForm(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load cycle data.');
    } finally {
      setCycleLoading(false);
    }
  }

  function recalculateInsemination(scVal: number, pmVal: number, nVal: number) {
    let vol = 0;
    if (scVal > 0 && pmVal > 0 && nVal > 0) {
      vol = Number((nVal / (scVal * (pmVal / 100))).toFixed(3));
    }
    setForm((f) => ({
      ...f,
      semenType1: scVal,
      semenType2: pmVal,
      semenType4: nVal,
      semenType3: vol,
    }));
  }

  async function handleAutoFillSemen() {
    if (!token || !form.cycId) return;
    try {
      const semenRes = await fetchCycleSemenAnalysis(token, String(form.cycId), patId);
      if (semenRes.analysis) {
        const a = semenRes.analysis;
        const sc = Number(a.afterSperms || a.beforeSperms || 0);
        const pm = Number(a.afterProgMotility || a.beforeProgMotility || 0);
        const oocyteCount = Number(form.semenType4 || 0) || (Number(form.oiMetaII || 0) + Number(form.oiMetaI || 0) + Number(form.oiGV || 0)) || 5;
        recalculateInsemination(sc, pm, oocyteCount);
      }
    } catch (e) {
      console.error('Failed to auto-fill semen data:', e);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !form.cycId) return;
    if (patientAge > 50) {
      setError('IVF is not allowed for patients with age greater than 50.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    const { cycId, cycleDate, ivfId, ...rest } = form;
    try {
      const res = await ivfApi.save(token, {
        mode: isUpdate ? 'update' : 'insert',
        patId,
        satId,
        cycId,
        cycleDate,
        ivfId,
        ...rest,
      });
      setSuccess(res.message);
      setIsUpdate(true);
      const saved = res.data as { ivfId?: string };
      if (saved?.ivfId) setForm((f) => ({ ...f, ivfId: saved.ivfId! }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save IVF record.');
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

  if (ageBlocked) {
    return (
      <PatientRequired>
        <ModuleCard title="IVF Entry Module">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            IVF is not allowed for patients with age greater than 50.
          </p>
        </ModuleCard>
      </PatientRequired>
    );
  }

  return (
    <PatientRequired>
      <ModuleCard title="IVF Entry Module">
        <ModuleAlerts error={error} success={success} />
        {loading && <p className="text-sm text-slate-500">Loading…</p>}
        {cycleLoading && showForm && <p className="text-sm text-slate-500">Loading cycle data…</p>}

        <div className="mb-4 flex flex-wrap items-end gap-4">
          <label className={labelCls}>
            Select Cycle Date
            <select
              value={String(form.cycId)}
              onChange={(e) => void onCycleChange(e.target.value)}
              className={`${inputCls} min-w-[220px]`}
            >
              <option value="">Select Cycle Date</option>
              {cycleDates.map((item) => (
                <option key={item.cycId} value={item.cycId}>
                  {new Date(item.cycleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </option>
              ))}
            </select>
          </label>
          {form.ivfId && (
            <span className="text-sm text-slate-600">
              IVF Id: <strong>{String(form.ivfId)}</strong>
            </span>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <section>
              <h2 className="mb-3 text-lg font-semibold">Stimulation For Donor</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {(['gnrhFollicular', 'gnrhLuteal', 'gnrhStopL', 'gnrhNone', 'otherCycle', 'naturalCycle'] as const).map((key) => (
                  <label key={key} className={checkCls}>
                    <input
                      type="checkbox"
                      checked={!!form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                    />
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </label>
                ))}
                <NumField label="FSH Drug 1" name="fshDrug1" form={form} setForm={setForm} />
                <NumField label="FSH Drug 2" name="fshDrug2" form={form} setForm={setForm} />
                <NumField label="HMG Drug 1" name="hmgDrug1" form={form} setForm={setForm} />
                <NumField label="HMG Drug 2" name="hmgDrug2" form={form} setForm={setForm} />
                <NumField label="Other Value" name="otherCycleVal" form={form} setForm={setForm} />
                <NumField label="E2 Pattern 1" name="e2Pattern1" form={form} setForm={setForm} />
                <NumField label="E2 Pattern 2" name="e2Pattern2" form={form} setForm={setForm} />
                <NumField label="E2 Pattern 3" name="e2Pattern3" form={form} setForm={setForm} />
                <NumField label="E2 Pattern 4" name="e2Pattern4" form={form} setForm={setForm} />
                <NumField label="Days Stimulation" name="daysStimulation" form={form} setForm={setForm} />
                <NumField label="Interval to HCG" name="intervalToHcg" form={form} setForm={setForm} />
                <NumField label="Interval HCG (Hrs)" name="intervalFromHcgHrs" form={form} setForm={setForm} />
                <NumField label="Interval HCG (Min)" name="intervalFromHcgMin" form={form} setForm={setForm} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Procedure</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <NumField label="Insemination (hrs)" name="inseminationHours" form={form} setForm={setForm} />
                {(['concStandard', 'concHigh', 'concIcsi', 'spAssHatch', 'spEmbryoBiopsy', 'spImsi'] as const).map((key) => (
                  <label key={key} className={checkCls}>
                    <input type="checkbox" checked={!!form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </label>
                ))}
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
                    <span>Semen Parameters &amp; Insemination Volume Calculation</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Target: 1 × 10⁶ progressively motile sperm per oocyte · Formula: Insem. Vol (mL) = N ÷ [C × (PM/100)]
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
                      onChange={(e) =>
                        recalculateInsemination(
                          Number(e.target.value),
                          Number(form.semenType2 ?? 0),
                          Number(form.semenType4 ?? 0)
                        )
                      }
                      className={inputCls}
                      placeholder="e.g. 40"
                    />
                  </label>
                </div>

                <div>
                  <label className={labelCls}>
                    Prog. Motility (PM %)
                    <input
                      type="number"
                      step="any"
                      value={Number(form.semenType2 ?? 0)}
                      onChange={(e) =>
                        recalculateInsemination(
                          Number(form.semenType1 ?? 0),
                          Number(e.target.value),
                          Number(form.semenType4 ?? 0)
                        )
                      }
                      className={inputCls}
                      placeholder="e.g. 90"
                    />
                  </label>
                </div>

                <div>
                  <label className={labelCls}>
                    No. of Oocytes (N)
                    <input
                      type="number"
                      value={Number(form.semenType4 ?? 0)}
                      onChange={(e) =>
                        recalculateInsemination(
                          Number(form.semenType1 ?? 0),
                          Number(form.semenType2 ?? 0),
                          Number(e.target.value)
                        )
                      }
                      className={inputCls}
                      placeholder="e.g. 5"
                    />
                  </label>
                </div>

                <div>
                  <label className={labelCls}>
                    Insem. Vol (mL / µL)
                    <div className="mt-1 flex h-9 items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-brand-primary">
                      <span>{Number(form.semenType3 ?? 0).toFixed(3)} mL</span>
                      <span className="text-xs font-semibold text-slate-500">
                        ({Math.round(Number(form.semenType3 ?? 0) * 1000)} µL)
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Oocytes Identified</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <NumField label="Metaphase II" name="oiMetaII" form={form} setForm={setForm} />
                <NumField label="Metaphase I" name="oiMetaI" form={form} setForm={setForm} />
                <NumField label="GV" name="oiGV" form={form} setForm={setForm} />
                <NumField label="DEG/Empty" name="oiDeg" form={form} setForm={setForm} />
              </div>
              <p className="mt-2 text-sm font-medium text-brand-primary">{balanceText}</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Fertilization – Metaphase II</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {['fMetaII0pb', 'fMetaII0PN', 'fMetaII1PN', 'fMetaII2PN', 'fMetaII3PN', 'fMetaIIStuck', 'fMetaIICleaved', 'riMetaIIAllocated', 'riMetaIIRescued'].map(
                  (name) => (
                    <NumField key={name} label={name.replace('fMetaII', '').replace('riMetaII', 'RI ')} name={name} form={form} setForm={setForm} />
                  )
                )}
                <label className={checkCls}>
                  <input type="checkbox" checked={!!form.fMetaIICont} onChange={(e) => setForm((f) => ({ ...f, fMetaIICont: e.target.checked }))} />
                  Cont.
                </label>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-semibold">Fertilization – Metaphase I / GV</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <NumField label="Meta I 2PN" name="fMetaI2PN" form={form} setForm={setForm} />
                <NumField label="Meta I Cleaved" name="fMetaICleaved" form={form} setForm={setForm} />
                <NumField label="GV 2PN" name="fGV2PN" form={form} setForm={setForm} />
                <NumField label="GV Cleaved" name="fGVCleaved" form={form} setForm={setForm} />
                <NumField label="RI Meta I Alloc" name="riMetaIAllocated" form={form} setForm={setForm} />
                <NumField label="RI GV Alloc" name="riGVAllocated" form={form} setForm={setForm} />
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
