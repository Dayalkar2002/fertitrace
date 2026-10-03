'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ModuleAlerts, ModuleCard, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import {
  CycleDateOption,
  asBool,
  formatCycleDate,
  ivfApi,
  icsiApi,
} from '@/lib/services/clinical-modules';
import { fetchCycleSemenAnalysis } from '@/lib/services/semen-analysis';
import {
  fetchSelfFrozenOocytes,
  submitSelfOocyteThaw,
  type SelfFrozenOocyte,
} from '@/lib/services/self-oocyte';
import type { LookupItem } from '@/lib/types/master';

const inputCls = 'mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500';
const labelCls = 'text-xs font-medium text-slate-600';
const checkCls = 'flex items-center gap-2 text-sm text-slate-700';

export type InseminationModule = 'ivf' | 'icsi';

type ClinicalForm = Record<string, string | number | boolean>;

const defaultForm = (): ClinicalForm => ({
  cycId: '',
  cycleDate: '',
  recordId: '',
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

function applyRecordData(form: ClinicalForm, data: Record<string, unknown>, module: InseminationModule): ClinicalForm {
  if (module === 'ivf') {
    return {
      ...form,
      recordId: String(data.IVFID || ''),
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

  // ICSI
  return {
    ...form,
    recordId: String(data.ICSIID || ''),
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
    mediaBrand: Number(data.ICSIMediaBrand || 0),
    mediaSeries: Number(data.ICSIMediaSeries || 0),
    incubatorUsed: Number(data.ICSIIncubatorUsed || 0),
    gas: Number(data.ICSIGas || 0),
    semenType1: Number(data.ICSISType1 || 0),
    semenType2: Number(data.ICSISType2 || 0),
    semenType3: 0,
    semenType4: 0,
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
  disabled,
  onChange,
}: {
  label: string;
  name: string;
  form: ClinicalForm;
  setForm: React.Dispatch<React.SetStateAction<ClinicalForm>>;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className={labelCls}>
      {label}
      <input
        type="number"
        step="any"
        disabled={disabled}
        value={Number(form[name] ?? 0)}
        onChange={(e) => {
          setForm((f) => ({ ...f, [name]: Number(e.target.value) }));
          onChange?.();
        }}
        className={`${inputCls} ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
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
  form: ClinicalForm;
  setForm: React.Dispatch<React.SetStateAction<ClinicalForm>>;
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

export function InseminationEntryForm({ initialModule = 'ivf' }: { initialModule?: InseminationModule }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramModule = searchParams.get('module') as InseminationModule | null;
  const paramCycId = searchParams.get('cycId') || '';

  const [activeModule, setActiveModule] = useState<InseminationModule>(paramModule || initialModule);
  const isIvf = activeModule === 'ivf';

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

  // ICSI thaw records
  const [frozenOocytes, setFrozenOocytes] = useState<SelfFrozenOocyte[]>([]);
  const [thawingIndex, setThawingIndex] = useState<number | null>(null);

  const activeApi = useMemo(() => (isIvf ? ivfApi : icsiApi), [isIvf]);

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
        activeApi.getCycleDates(token, patId, satId),
        activeApi.getLookups<{
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

      // If cycle is passed in URL query param, automatically load it
      if (paramCycId && dates.some((c) => String(c.cycId) === paramCycId)) {
        setTimeout(() => {
          void loadCycle(paramCycId, dates);
        }, 100);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to load ${activeModule.toUpperCase()} module.`);
    } finally {
      setLoading(false);
    }
  }, [token, ready, patId, satId, ageBlocked, activeApi, activeModule, paramCycId]);

  useEffect(() => {
    void init();
  }, [init]);

  async function loadCycle(cycId: string, availableDates = cycleDates) {
    if (!token || !cycId) {
      setShowForm(false);
      setForm((f) => ({ ...f, cycId: '' }));
      return;
    }
    const selected = availableDates.find((c) => String(c.cycId) === cycId);
    if (!selected) return;

    setCycleLoading(true);
    setError('');
    const cycleDate = formatCycleDate(selected.cycleDate);
    setForm((f) => ({ ...f, cycId, cycleDate: selected.cycleDate }));

    try {
      const [monitoring, record, semenRes] = await Promise.all([
        activeApi.getMonitoring(token, patId, satId, String(selected.cycId), cycleDate).catch(() => null),
        activeApi.loadRecord(token, patId, satId, String(selected.cycId), cycleDate).catch(() => ({
          data: null,
          exists: false,
        })),
        fetchCycleSemenAnalysis(token, String(selected.cycId), patId).catch(() => ({ analysis: null, history: [] })),
      ]);

      let next: ClinicalForm = { ...defaultForm(), cycId, cycleDate: selected.cycleDate };
      if (monitoring) {
        next = {
          ...next,
          fshDrug1: Number(monitoring.MCCDFSHDrug1 || 0),
          fshDrug2: Number(monitoring.MCCDFSHDrug2 || 0),
          hmgDrug1: Number(monitoring.MCCDHMGDrug1 || 0),
          hmgDrug2: Number(monitoring.MCCDHMGDrgu2 || 0),
        };
      }
      if (record.exists && record.data) {
        next = applyRecordData(next, record.data, activeModule);
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
        if (isIvf && sc > 0 && pm > 0 && oocyteCount > 0) {
          vol = Number((oocyteCount / (sc * (pm / 100))).toFixed(3));
        }
        next.semenType1 = sc;
        next.semenType2 = pm;
        next.semenType3 = isIvf ? vol : 0;
        next.semenType4 = isIvf ? oocyteCount : 0;
      }

      // Load self frozen oocytes for ICSI thaw check
      if (!isIvf) {
        try {
          const eggs = await fetchSelfFrozenOocytes(token, patId, satId);
          setFrozenOocytes(eggs);
        } catch {
          setFrozenOocytes([]);
        }
      }

      setForm(next);
      setShowForm(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load cycle data.');
    } finally {
      setCycleLoading(false);
    }
  }

  function switchModule(target: InseminationModule) {
    if (target === activeModule) return;
    setActiveModule(target);
    const newQs = new URLSearchParams(searchParams.toString());
    newQs.set('module', target);
    router.replace(`?${newQs.toString()}`);
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
        if (isIvf) {
          recalculateInsemination(sc, pm, oocyteCount);
        } else {
          setForm((f) => ({ ...f, semenType1: sc, semenType2: pm, semenType3: 0, semenType4: 0 }));
        }
      }
    } catch (e) {
      console.error('Failed to auto-fill semen data:', e);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !form.cycId) return;
    if (patientAge > 50) {
      setError(`${activeModule.toUpperCase()} is not allowed for patients with age greater than 50.`);
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    const { cycId, cycleDate, recordId, ...rest } = form;
    try {
      const payload: Record<string, unknown> = {
        mode: isUpdate ? 'update' : 'insert',
        patId,
        satId,
        cycId,
        cycleDate,
        ...(isIvf ? { ivfId: recordId } : { icsiId: recordId }),
        ...rest,
      };

      const res = await activeApi.save(token, payload);
      setSuccess(res.message);
      setIsUpdate(true);
      const saved = res.data as { ivfId?: string; icsiId?: string };
      const newId = isIvf ? saved?.ivfId : saved?.icsiId;
      if (newId) setForm((f) => ({ ...f, recordId: newId }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to save ${activeModule.toUpperCase()} record.`);
    } finally {
      setSaving(false);
    }
  }

  async function handleThawOocyte(egg: SelfFrozenOocyte, index: number) {
    if (!token) return;
    setThawingIndex(index);
    try {
      await submitSelfOocyteThaw(token, {
        patId,
        satId,
        thawCycleId: String(form.cycId),
        thawProcDoneBy: 'Embryologist',
        oocyteThawStatuses: [
          {
            oocyteId: egg.oocyteId,
            survived: true,
          },
        ],
      });
      setFrozenOocytes((prev) => prev.filter((_, i) => i !== index));
      setSuccess(`Oocyte #${egg.oocyteId} thawed successfully for ICSI.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thaw submission failed');
    } finally {
      setThawingIndex(null);
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
      <ModuleCard title={`${activeModule.toUpperCase()} Clinical Module`}>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 font-medium">
          ⚠️ {activeModule.toUpperCase()} procedures are not permitted for patients over 50 years of age.
        </div>
      </ModuleCard>
    );
  }

  return (
    <PatientRequired>
      <div className="module-card rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isIvf ? 'Conventional IVF' : 'ICSI Insemination & Fertilization'}
            </h1>
            <p className="text-xs text-slate-500">
              Unified Insemination Module · Seamlessly switch between Conventional IVF and ICSI
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => switchModule('ivf')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                isIvf
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🔬</span>
              <span>Conventional IVF</span>
            </button>
            <button
              type="button"
              onClick={() => switchModule('icsi')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                !isIvf
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>⚡</span>
              <span>ICSI Entry</span>
            </button>
          </div>
        </div>

        <ModuleAlerts error={error} success={success} />

        {/* Cycle Selection Bar */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Cycle:
              </label>
              <select
                value={form.cycId ? String(form.cycId) : ''}
                onChange={(e) => void loadCycle(e.target.value)}
                disabled={loading || cycleLoading}
                className="h-10 min-w-56 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-2xs focus:border-purple-500 focus:outline-none"
              >
                <option value="">Select Cycle Date</option>
                {cycleDates.map((c) => (
                  <option key={`${c.cycId}-${c.cycleDate}`} value={String(c.cycId)}>
                    {c.label || `${c.cycId} — ${c.cycleDate.slice(0, 10)}`}
                  </option>
                ))}
              </select>
            </div>

            {form.recordId && (
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  {isIvf ? 'IVF ID' : 'ICSI ID'}: {form.recordId}
                </span>
                <span className="rounded-lg bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                  Mode: {isUpdate ? 'Update' : 'New'}
                </span>
              </div>
            )}
          </div>
        </div>

        {cycleLoading && (
          <div className="py-12 text-center text-sm text-slate-500">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            Loading cycle clinical records...
          </div>
        )}

        {!cycleLoading && showForm && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stimulation Protocol */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-xs font-black">1</span>
                Stimulation Protocol & Gonadotropins
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <label className={checkCls}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.gnrhFollicular)}
                    onChange={(e) => setForm((f) => ({ ...f, gnrhFollicular: e.target.checked }))}
                    className="rounded border-slate-300 text-purple-600"
                  />
                  GnRH Follicular
                </label>
                <label className={checkCls}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.gnrhLuteal)}
                    onChange={(e) => setForm((f) => ({ ...f, gnrhLuteal: e.target.checked }))}
                    className="rounded border-slate-300 text-purple-600"
                  />
                  GnRH Luteal
                </label>
                <label className={checkCls}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.gnrhStopL)}
                    onChange={(e) => setForm((f) => ({ ...f, gnrhStopL: e.target.checked }))}
                    className="rounded border-slate-300 text-purple-600"
                  />
                  GnRH Stop L
                </label>
                <label className={checkCls}>
                  <input
                    type="checkbox"
                    checked={Boolean(form.gnrhNone)}
                    onChange={(e) => setForm((f) => ({ ...f, gnrhNone: e.target.checked }))}
                    className="rounded border-slate-300 text-purple-600"
                  />
                  None
                </label>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <NumField label="FSH Drug 1" name="fshDrug1" form={form} setForm={setForm} />
                <NumField label="FSH Drug 2" name="fshDrug2" form={form} setForm={setForm} />
                <NumField label="HMG Drug 1" name="hmgDrug1" form={form} setForm={setForm} />
                <NumField label="HMG Drug 2" name="hmgDrug2" form={form} setForm={setForm} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <NumField label="E2 Pattern 1" name="e2Pattern1" form={form} setForm={setForm} />
                <NumField label="E2 Pattern 2" name="e2Pattern2" form={form} setForm={setForm} />
                <NumField label="E2 Pattern 3" name="e2Pattern3" form={form} setForm={setForm} />
                <NumField label="E2 Pattern 4" name="e2Pattern4" form={form} setForm={setForm} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <NumField label="Days of Stimulation" name="daysStimulation" form={form} setForm={setForm} />
                <NumField label="Interval to hCG (hrs)" name="intervalToHcg" form={form} setForm={setForm} />
                <NumField label="From hCG (hrs)" name="intervalFromHcgHrs" form={form} setForm={setForm} />
                <NumField label="From hCG (mins)" name="intervalFromHcgMin" form={form} setForm={setForm} />
              </div>
            </div>

            {/* Insemination & Semen Parameters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-xs font-black">2</span>
                  {isIvf ? 'Insemination Volume & Semen Parameters' : 'ICSI Sperm Preparation Parameters'}
                </h3>
                <button
                  type="button"
                  onClick={() => void handleAutoFillSemen()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition"
                  title="Auto-fill post-wash semen concentration and progressive motility from cycle analysis"
                >
                  <span>🔄</span>
                  <span>Auto-fill from Semen Analysis</span>
                </button>
              </div>

              {isIvf && (
                <div className="mb-4 flex flex-wrap items-center gap-6 rounded-xl border border-purple-100 bg-purple-50/50 p-3 text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Hours Exposure to Sperm:</span>
                    <input
                      type="number"
                      step="any"
                      value={Number(form.inseminationHours || 0)}
                      onChange={(e) => setForm((f) => ({ ...f, inseminationHours: Number(e.target.value) }))}
                      className="h-8 w-20 rounded-lg border border-purple-200 bg-white px-2 text-center text-xs font-bold text-purple-950 focus:border-purple-500 focus:outline-none"
                    />
                    <span>hrs</span>
                  </div>
                  <div className="text-slate-500">
                    Target: <strong className="text-purple-900">1 × 10⁶</strong> progressively motile sperm per oocyte
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <label className={labelCls}>
                  Concentration C (× 10⁶/mL)
                  <input
                    type="number"
                    step="any"
                    value={Number(form.semenType1 ?? 0)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (isIvf) {
                        recalculateInsemination(val, Number(form.semenType2 || 0), Number(form.semenType4 || 0));
                      } else {
                        setForm((f) => ({ ...f, semenType1: val }));
                      }
                    }}
                    className={inputCls}
                  />
                </label>

                <label className={labelCls}>
                  Progressive Motility PM (%)
                  <input
                    type="number"
                    step="any"
                    value={Number(form.semenType2 ?? 0)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (isIvf) {
                        recalculateInsemination(Number(form.semenType1 || 0), val, Number(form.semenType4 || 0));
                      } else {
                        setForm((f) => ({ ...f, semenType2: val }));
                      }
                    }}
                    className={inputCls}
                  />
                </label>

                {isIvf ? (
                  <>
                    <label className={labelCls}>
                      No. of Oocytes (N)
                      <input
                        type="number"
                        step="any"
                        value={Number(form.semenType4 ?? 0)}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          recalculateInsemination(Number(form.semenType1 || 0), Number(form.semenType2 || 0), val);
                        }}
                        className={inputCls}
                      />
                    </label>

                    <label className={labelCls}>
                      Insem. Volume (mL)
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          value={Number(form.semenType3 ?? 0)}
                          onChange={(e) => setForm((f) => ({ ...f, semenType3: Number(e.target.value) }))}
                          className={`${inputCls} bg-purple-50/50 font-bold text-purple-900 border-purple-200`}
                          title={`${Math.round(Number(form.semenType3 || 0) * 1000)} µL (${Number(form.semenType3 || 0)} mL)`}
                        />
                        {Number(form.semenType3 || 0) > 0 && (
                          <span className="absolute right-2 top-2.5 text-2xs font-semibold text-purple-600 bg-white px-1 rounded">
                            {Math.round(Number(form.semenType3 || 0) * 1000)} µL
                          </span>
                        )}
                      </div>
                    </label>
                  </>
                ) : (
                  <>
                    <label className={labelCls}>
                      No. of Oocytes
                      <input
                        type="text"
                        disabled
                        value="NA"
                        className={`${inputCls} bg-slate-100 text-slate-500 font-bold text-center cursor-not-allowed`}
                      />
                    </label>

                    <label className={labelCls}>
                      Insem. Volume (mL)
                      <input
                        type="text"
                        disabled
                        value="NA"
                        className={`${inputCls} bg-slate-100 text-slate-500 font-bold text-center cursor-not-allowed`}
                      />
                    </label>
                  </>
                )}
              </div>

              {isIvf && (
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className={checkCls}>
                    <input
                      type="checkbox"
                      checked={Boolean(form.concStandard)}
                      onChange={(e) => setForm((f) => ({ ...f, concStandard: e.target.checked }))}
                      className="rounded border-slate-300 text-purple-600"
                    />
                    Standard Conc
                  </label>
                  <label className={checkCls}>
                    <input
                      type="checkbox"
                      checked={Boolean(form.concHigh)}
                      onChange={(e) => setForm((f) => ({ ...f, concHigh: e.target.checked }))}
                      className="rounded border-slate-300 text-purple-600"
                    />
                    High Conc
                  </label>
                  <label className={checkCls}>
                    <input
                      type="checkbox"
                      checked={Boolean(form.spAssHatch)}
                      onChange={(e) => setForm((f) => ({ ...f, spAssHatch: e.target.checked }))}
                      className="rounded border-slate-300 text-purple-600"
                    />
                    Assisted Hatching
                  </label>
                  <label className={checkCls}>
                    <input
                      type="checkbox"
                      checked={Boolean(form.spEmbryoBiopsy)}
                      onChange={(e) => setForm((f) => ({ ...f, spEmbryoBiopsy: e.target.checked }))}
                      className="rounded border-slate-300 text-purple-600"
                    />
                    Embryo Biopsy
                  </label>
                </div>
              )}
            </div>

            {/* ICSI Self-Frozen Oocyte Thaw Section */}
            {!isIvf && frozenOocytes.length > 0 && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-2xs">
                <h3 className="mb-3 text-sm font-bold text-blue-900 flex items-center gap-2">
                  <span>🧊</span>
                  Self-Frozen Oocytes Available for Thawing & ICSI ({frozenOocytes.length})
                </h3>
                <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-blue-50 text-blue-900">
                      <tr>
                        <th className="p-2.5">Oocyte #</th>
                        <th className="p-2.5">Freeze Date</th>
                        <th className="p-2.5">Location</th>
                        <th className="p-2.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {frozenOocytes.map((egg, idx) => (
                        <tr key={egg.oocyteId} className="hover:bg-slate-50">
                          <td className="p-2.5 font-semibold text-slate-800">
                            {egg.source} (#{egg.oocyteId})
                          </td>
                          <td className="p-2.5 text-slate-600">{egg.dateOfCreation?.slice(0, 10) || '—'}</td>
                          <td className="p-2.5 text-slate-600">
                            {egg.location || 'Assigned'}
                          </td>
                          <td className="p-2.5">
                            <button
                              type="button"
                              disabled={thawingIndex === idx}
                              onClick={() => void handleThawOocyte(egg, idx)}
                              className="rounded-lg bg-blue-600 px-2.5 py-1 text-2xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {thawingIndex === idx ? 'Thawing...' : 'Thaw for ICSI'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Operators & Media Environment */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-xs font-black">3</span>
                Personnel & Culture Environment
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <LookupSelect label="Retrieval Person" name="retPerId" form={form} setForm={setForm} options={doctors} />
                <LookupSelect label="Transfer Person" name="transPerId" form={form} setForm={setForm} options={doctors} />
                <LookupSelect label="Lab Operator" name="labOptId" form={form} setForm={setForm} options={labOptions} />
                <LookupSelect label="Media Brand" name="mediaBrand" form={form} setForm={setForm} options={mediaBrand} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                <LookupSelect label="Media Series" name="mediaSeries" form={form} setForm={setForm} options={mediaSeries} />
                <LookupSelect label="Incubator Used" name="incubatorUsed" form={form} setForm={setForm} options={incubator} />
                <LookupSelect label="Gas Mixture" name="gas" form={form} setForm={setForm} options={gas} />
              </div>
            </div>

            {/* Oocyte Fertilization Breakdown Grid */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-xs font-black">4</span>
                  Oocyte Maturity & Fertilization Outcome
                </h3>
                <span className="rounded-xl bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                  {balanceText}
                </span>
              </div>

              {/* Metaphase II Row */}
              <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mb-2 font-bold text-xs text-purple-900 uppercase tracking-wide">
                  Metaphase II (MII)
                </div>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-6 lg:grid-cols-9">
                  <NumField label="Total MII" name="oiMetaII" form={form} setForm={setForm} />
                  <NumField label="0 pb" name="fMetaII0pb" form={form} setForm={setForm} />
                  <NumField label="0 PN" name="fMetaII0PN" form={form} setForm={setForm} />
                  <NumField label="1 PN" name="fMetaII1PN" form={form} setForm={setForm} />
                  <NumField label="2 PN" name="fMetaII2PN" form={form} setForm={setForm} />
                  <NumField label="3 PN" name="fMetaII3PN" form={form} setForm={setForm} />
                  <NumField label="Stuck" name="fMetaIIStuck" form={form} setForm={setForm} />
                  <NumField label="Cleaved" name="fMetaIICleaved" form={form} setForm={setForm} />
                  {isIvf && (
                    <NumField label="Allocated" name="riMetaIIAllocated" form={form} setForm={setForm} />
                  )}
                </div>
              </div>

              {/* Metaphase I Row */}
              <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mb-2 font-bold text-xs text-indigo-900 uppercase tracking-wide">
                  Metaphase I (MI)
                </div>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-6 lg:grid-cols-9">
                  <NumField label="Total MI" name="oiMetaI" form={form} setForm={setForm} />
                  <NumField label="0 pb" name="fMetaI0pb" form={form} setForm={setForm} />
                  <NumField label="0 PN" name="fMetaI0PN" form={form} setForm={setForm} />
                  <NumField label="1 PN" name="fMetaI1PN" form={form} setForm={setForm} />
                  <NumField label="2 PN" name="fMetaI2PN" form={form} setForm={setForm} />
                  <NumField label="3 PN" name="fMetaI3PN" form={form} setForm={setForm} />
                  <NumField label="Stuck" name="fMetaIStuck" form={form} setForm={setForm} />
                  <NumField label="Cleaved" name="fMetaICleaved" form={form} setForm={setForm} />
                  {isIvf && (
                    <NumField label="Allocated" name="riMetaIAllocated" form={form} setForm={setForm} />
                  )}
                </div>
              </div>

              {/* GV Row */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="mb-2 font-bold text-xs text-amber-900 uppercase tracking-wide">
                  Germinal Vesicle (GV) & Degenerate
                </div>
                <div className="grid grid-cols-3 gap-3 md:grid-cols-6 lg:grid-cols-9">
                  <NumField label="Total GV" name="oiGV" form={form} setForm={setForm} />
                  <NumField label="Degenerate" name="oiDeg" form={form} setForm={setForm} />
                  <NumField label="0 pb" name="fGV0pb" form={form} setForm={setForm} />
                  <NumField label="0 PN" name="fGV0PN" form={form} setForm={setForm} />
                  <NumField label="1 PN" name="fGV1PN" form={form} setForm={setForm} />
                  <NumField label="2 PN" name="fGV2PN" form={form} setForm={setForm} />
                  <NumField label="3 PN" name="fGV3PN" form={form} setForm={setForm} />
                  <NumField label="Stuck" name="fGVStuck" form={form} setForm={setForm} />
                  <NumField label="Cleaved" name="fGVCleaved" form={form} setForm={setForm} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={cancel}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`rounded-xl px-6 py-2 text-sm font-semibold text-white shadow-sm transition ${
                  isIvf
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } disabled:opacity-50`}
              >
                {saving ? 'Saving...' : isUpdate ? `Update ${activeModule.toUpperCase()}` : `Submit ${activeModule.toUpperCase()}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </PatientRequired>
  );
}

export function IvfEntryForm() {
  return <InseminationEntryForm initialModule="ivf" />;
}

export function IcsiEntryForm() {
  return <InseminationEntryForm initialModule="icsi" />;
}

export default InseminationEntryForm;
