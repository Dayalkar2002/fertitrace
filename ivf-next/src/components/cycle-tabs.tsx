'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useAuth } from '@/contexts/auth-context';
import * as cycleDetail from '@/lib/services/cycle-detail';
import type {
  CycleHistory,
  CycleHistoryAttempt,
  CycleMonitoring,
  CycleOutcome,
  CycleSurvival,
  MonitoringRemDay,
  TabMasters,
} from '@/lib/types/cycle-detail';
import { emptyTabMasters } from '@/lib/types/cycle-detail';
import {
  CYCLE_CREATION_STORAGE_KEY,
  embedMonitoringSheetMarker,
  isMonitoringSheetAllowed,
  MONITORING_SHEET_OPTIONS,
  monitoringSheetHint,
  parseMonitoringSheet,
  stripMonitoringSheetMarker,
} from '@/lib/cycle-utils';

interface TabProps {
  cycleId: string;
}

export function CycleHistoryTab({ cycleId }: TabProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [masters, setMasters] = useState<TabMasters>(emptyTabMasters);
  const [form, setForm] = useState<CycleHistory>(defaultHistory());
  const [cycleType, setCycleType] = useState('Fresh');

  useEffect(() => {
    if (!token) return;
    void cycleDetail.loadHistory(token, cycleId).then(({ data, masters: m }) => {
      if (m) setMasters(m);
      const merged: CycleHistory = {
        ...defaultHistory(),
        ...data,
        comments: stripMonitoringSheetMarker(data.comments || ''),
        historyAttempts: data.historyAttempts?.length ? data.historyAttempts : [defaultAttempt()],
      };
      if (!merged.monitoringSheet) {
        merged.monitoringSheet = parseMonitoringSheet(data.comments || '');
      }
      if (!merged.monitoringSheet && typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem(CYCLE_CREATION_STORAGE_KEY);
          if (stored) {
            const created = JSON.parse(stored) as { monitoringSheet?: string; cycleType?: string };
            if (created.monitoringSheet) merged.monitoringSheet = created.monitoringSheet;
            if (created.cycleType) setCycleType(created.cycleType);
          }
        } catch {
          /* ignore */
        }
      } else if (typeof window !== 'undefined') {
        try {
          const stored = sessionStorage.getItem(CYCLE_CREATION_STORAGE_KEY);
          if (stored) {
            const created = JSON.parse(stored) as { cycleType?: string };
            if (created.cycleType) setCycleType(created.cycleType);
          }
        } catch {
          /* ignore */
        }
      }
      setForm(merged);
      setLoading(false);
    }).catch(() => { setError('Failed to load history.'); setLoading(false); });
  }, [token, cycleId]);

  function calcBmi(height: number, weight: number) {
    const h = height / 100;
    if (h > 0 && weight > 0) return Math.round((weight / (h * h)) * 10) / 10;
    return form.bmi;
  }

  async function save() {
    if (!token) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await cycleDetail.saveHistory(token, cycleId, {
        ...form,
        comments: embedMonitoringSheetMarker(form.comments, form.monitoringSheet),
      });
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save history.');
    } finally { setSaving(false); }
  }

  if (loading) return <p className="tab-loading">Loading history…</p>;

  return (
    <div className="tab-form space-y-6">
      <section className="tab-section rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 font-bold text-slate-800">Patient History</h3>
        <div className="field-grid grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <NumField label="Height (cm)" value={form.height} onChange={(v) => setForm((f) => ({ ...f, height: v, bmi: calcBmi(v, f.weight) }))} />
          <NumField label="Weight (kg)" value={form.weight} onChange={(v) => setForm((f) => ({ ...f, weight: v, bmi: calcBmi(f.height, v) }))} />
          <NumField label="BMI" value={form.bmi} readOnly />
          <SelectField label="Allergy" value={form.allergyId} options={masters.allergies} onChange={(v) => setForm((f) => ({ ...f, allergyId: v }))} />
          <TextArea label="Med / Surgical History" value={form.medSurHistory} className="sm:col-span-2" onChange={(v) => setForm((f) => ({ ...f, medSurHistory: v }))} />
          <NumField label="ISG" value={form.isg} onChange={(v) => setForm((f) => ({ ...f, isg: v }))} />
          <NumField label="ISP" value={form.isp} onChange={(v) => setForm((f) => ({ ...f, isp: v }))} />
          <NumField label="IS Ab" value={form.isAb} onChange={(v) => setForm((f) => ({ ...f, isAb: v }))} />
          <NumField label="IS Ect" value={form.isEct} onChange={(v) => setForm((f) => ({ ...f, isEct: v }))} />
          <NumField label="IS Duration" value={form.isDuration} onChange={(v) => setForm((f) => ({ ...f, isDuration: v }))} />
          <DateField label="LMP" value={form.hlmp} onChange={(v) => setForm((f) => ({ ...f, hlmp: v }))} />
          <TextField label="HSG" value={form.hsg} onChange={(v) => setForm((f) => ({ ...f, hsg: v }))} />
          <TextField label="Indication" value={form.indication} onChange={(v) => setForm((f) => ({ ...f, indication: v }))} />
          <SelectField label="Stim Protocol" value={form.stimProtId} options={masters.stimProtocols} onChange={(v) => setForm((f) => ({ ...f, stimProtId: v }))} />
          <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Monitoring Sheet :</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {MONITORING_SHEET_OPTIONS.map((item) => {
                const allowed = isMonitoringSheetAllowed(cycleType, item.value, undefined);
                return (
                  <label
                    key={item.value}
                    className={`flex items-center gap-2 text-sm ${allowed ? 'text-slate-700' : 'cursor-not-allowed text-slate-400'}`}
                  >
                    <input
                      type="radio"
                      name="historyMonitoringSheet"
                      value={item.value}
                      checked={form.monitoringSheet === item.value}
                      disabled={!allowed}
                      onChange={() => {
                        if (allowed) setForm((f) => ({ ...f, monitoringSheet: item.value }));
                      }}
                      className="accent-[#6345A6] disabled:cursor-not-allowed"
                    />
                    {item.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">{monitoringSheetHint(cycleType)}</p>
          </div>
          <NumField label="Attempts" value={form.attemptCount} onChange={(v) => setForm((f) => ({ ...f, attemptCount: v }))} />
          <NumField label="Prev Attempts" value={form.attemptPrev} onChange={(v) => setForm((f) => ({ ...f, attemptPrev: v }))} />
          <NumField label="EW Attempts" value={form.attemptEw} onChange={(v) => setForm((f) => ({ ...f, attemptEw: v }))} />
          <DateField label="Current Date" value={form.currentDate} onChange={(v) => setForm((f) => ({ ...f, currentDate: v }))} />
        </div>
        <CheckboxGroup label="Findings" options={['idiopathic', 'if', 'mf', 'dor', 'ovu', 'tf', 'cf', 'endo', 'other'] as const} values={form.findings} onChange={(findings) => setForm((f) => ({ ...f, findings }))} />
        <TextField label="Other Findings" value={form.otherTxt} onChange={(v) => setForm((f) => ({ ...f, otherTxt: v }))} />
        <TextArea label="Comments" value={form.comments} onChange={(v) => setForm((f) => ({ ...f, comments: v }))} />
      </section>

      <section className="tab-section rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 font-bold text-slate-800">Previous Cycle Attempts</h3>
        {form.historyAttempts.map((row, i) => (
          <div key={i} className="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <DateField label="Cycle Date" value={row.cycleDate} onChange={(v) => updateAttempt(setForm, i, 'cycleDate', v)} />
            <CheckField label="IVF" checked={row.ivf} onChange={(v) => updateAttempt(setForm, i, 'ivf', v)} />
            <CheckField label="ICSI" checked={row.icsi} onChange={(v) => updateAttempt(setForm, i, 'icsi', v)} />
            <SelectField label="Stim Protocol" value={row.stimProtId} options={masters.stimProtocols} onChange={(v) => updateAttempt(setForm, i, 'stimProtId', v)} />
            <DateField label="LMP" value={row.lmp} onChange={(v) => updateAttempt(setForm, i, 'lmp', v)} />
            <NumField label="Oocytes" value={row.oocytes} onChange={(v) => updateAttempt(setForm, i, 'oocytes', v)} />
            <NumField label="Fertilized" value={row.fertilized} onChange={(v) => updateAttempt(setForm, i, 'fertilized', v)} />
            <NumField label="E2" value={row.he2} onChange={(v) => updateAttempt(setForm, i, 'he2', v)} />
            <TextField label="Remark" value={row.remark} onChange={(v) => updateAttempt(setForm, i, 'remark', v)} />
          </div>
        ))}
        <button type="button" className="text-sm font-semibold text-brand-green" onClick={() => setForm((f) => ({ ...f, historyAttempts: [...f.historyAttempts, defaultAttempt()] }))}>+ Add Attempt</button>
      </section>

      <TabAlerts error={error} success={success} />
      <SaveButton saving={saving} label="Save History" onSave={() => void save()} />
    </div>
  );
}

export function CycleSurvivalTab({ cycleId }: TabProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<CycleSurvival>(defaultSurvival());

  useEffect(() => {
    if (!token) return;
    void cycleDetail.loadSurvival(token, cycleId).then((data) => { setForm({ ...defaultSurvival(), ...data }); setLoading(false); })
      .catch(() => { setError('Failed to load survival report.'); setLoading(false); });
  }, [token, cycleId]);

  async function save() {
    if (!token) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await cycleDetail.saveSurvival(token, cycleId, form);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save survival report.');
    } finally { setSaving(false); }
  }

  if (loading) return <p className="tab-loading">Loading survival report…</p>;

  return (
    <div className="tab-form space-y-4">
      <section className="tab-section rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 font-bold">Semen Analysis</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <NumField label="Conc" value={form.conc} step={0.01} onChange={(v) => setForm((f) => ({ ...f, conc: v }))} />
          <NumField label="Motility %" value={form.motility} onChange={(v) => setForm((f) => ({ ...f, motility: v }))} />
          <NumField label="NMPH 1" value={form.nmph1} onChange={(v) => setForm((f) => ({ ...f, nmph1: v }))} />
          <NumField label="NMPH 2" value={form.nmph2} onChange={(v) => setForm((f) => ({ ...f, nmph2: v }))} />
          <DateField label="Date" value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
          <TextField label="Trial Swim Up" value={form.recovery} onChange={(v) => setForm((f) => ({ ...f, recovery: v }))} />
          <TextField label="Antibodies" value={form.antibodies} onChange={(v) => setForm((f) => ({ ...f, antibodies: v }))} />
        </div>
        <CheckboxGroup label="SA Result" options={['positive', 'borderline', 'negative'] as const} values={form.saResult} onChange={(saResult) => setForm((f) => ({ ...f, saResult }))} />
        <CheckboxGroup label="GnRH" options={['none', 'stopLupron', 'luteal'] as const} values={form.gnrh} onChange={(gnrh) => setForm((f) => ({ ...f, gnrh }))} />
        <CheckField label="Dosage" checked={form.dosage} onChange={(v) => setForm((f) => ({ ...f, dosage: v }))} />
        <CheckboxGroup label="Sperm Source" options={['donor', 'donorCryo', 'husband', 'husbandCryo'] as const} values={form.spermSource} onChange={(spermSource) => setForm((f) => ({ ...f, spermSource }))} />
        <CheckboxGroup label="Transfer Type" options={['ivf', 'gift', 'zift', 'cryoAll'] as const} values={form.transferType} onChange={(transferType) => setForm((f) => ({ ...f, transferType }))} />
        <CheckboxGroup label="Consent" options={['icsi', 'hatching', 'cryo', 'immatures', 'apa'] as const} values={form.consent} onChange={(consent) => setForm((f) => ({ ...f, consent }))} />
        <TextArea label="Comments" value={form.comments} onChange={(v) => setForm((f) => ({ ...f, comments: v }))} />
      </section>
      <TabAlerts error={error} success={success} />
      <SaveButton saving={saving} label="Save Survival Report" onSave={() => void save()} />
    </div>
  );
}

export function CycleMonitoringTab({ cycleId }: TabProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [masters, setMasters] = useState<TabMasters>(emptyTabMasters);
  const [form, setForm] = useState<CycleMonitoring>({ day0: defaultDay0(), remDays: [defaultRemDay(1)] });

  useEffect(() => {
    if (!token) return;
    void cycleDetail.loadMonitoring(token, cycleId).then(({ data, masters: m }) => {
      if (m) setMasters(m);
      setForm({ day0: { ...defaultDay0(), ...data.day0 }, remDays: data.remDays?.length ? data.remDays : [defaultRemDay(1)] });
      setLoading(false);
    }).catch(() => { setError('Failed to load monitoring chart.'); setLoading(false); });
  }, [token, cycleId]);

  async function save() {
    if (!token) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await cycleDetail.saveMonitoring(token, cycleId, form);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save monitoring.');
    } finally { setSaving(false); }
  }

  if (loading) return <p className="tab-loading">Loading monitoring chart…</p>;

  return (
    <div className="tab-form space-y-6">
      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 font-bold">Cycle Day 0 Entry</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DateField label="Day #0 Date" value={form.day0.date} onChange={(v) => setForm((f) => ({ ...f, day0: { ...f.day0, date: v } }))} />
          <SelectField label="FSH Drug #1" value={form.day0.fshDrug1} options={masters.fshDrugs} onChange={(v) => setForm((f) => ({ ...f, day0: { ...f.day0, fshDrug1: v } }))} />
          <NumField label="Dose" value={form.day0.fshDrug1Dose} onChange={(v) => setForm((f) => ({ ...f, day0: { ...f.day0, fshDrug1Dose: v } }))} />
          <SelectField label="HMG Drug #1" value={form.day0.hmgDrug1} options={masters.hmgDrugs} onChange={(v) => setForm((f) => ({ ...f, day0: { ...f.day0, hmgDrug1: v } }))} />
          <NumField label="E2" value={form.day0.e2} onChange={(v) => setForm((f) => ({ ...f, day0: { ...f.day0, e2: v } }))} />
          <NumField label="LH" value={form.day0.lh} onChange={(v) => setForm((f) => ({ ...f, day0: { ...f.day0, lh: v } }))} />
          <TextField label="Endometrium" value={form.day0.endometrium} onChange={(v) => setForm((f) => ({ ...f, day0: { ...f.day0, endometrium: v } }))} />
          <TextArea label="Remarks" value={form.day0.remarks} onChange={(v) => setForm((f) => ({ ...f, day0: { ...f.day0, remarks: v } }))} />
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 font-bold">Remaining Days</h3>
        {form.remDays.map((row, i) => (
          <div key={i} className="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-6">
            <NumField label="Day" value={row.day} onChange={(v) => updateRemDay(setForm, i, 'day', v)} />
            <DateField label="Date" value={row.date} onChange={(v) => updateRemDay(setForm, i, 'date', v)} />
            <NumField label="E2" value={row.e2} onChange={(v) => updateRemDay(setForm, i, 'e2', v)} />
            <NumField label="L Fol" value={row.follicleLeft} onChange={(v) => updateRemDay(setForm, i, 'follicleLeft', v)} />
            <NumField label="R Fol" value={row.follicleRight} onChange={(v) => updateRemDay(setForm, i, 'follicleRight', v)} />
            <CheckField label="HCG" checked={row.hcg} onChange={(v) => updateRemDay(setForm, i, 'hcg', v)} />
          </div>
        ))}
        <button type="button" className="text-sm font-semibold text-brand-green" onClick={() => setForm((f) => ({ ...f, remDays: [...f.remDays, defaultRemDay(f.remDays.length + 1)] }))}>+ Add Day</button>
      </section>
      <TabAlerts error={error} success={success} />
      <SaveButton saving={saving} label="Save Monitoring" onSave={() => void save()} />
    </div>
  );
}

export function CycleOutcomeTab({ cycleId }: TabProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<CycleOutcome>(defaultOutcome());

  useEffect(() => {
    if (!token) return;
    void cycleDetail.loadOutcome(token, cycleId).then((data) => { setForm({ ...defaultOutcome(), ...data }); setLoading(false); })
      .catch(() => { setError('Failed to load outcome.'); setLoading(false); });
  }, [token, cycleId]);

  async function save() {
    if (!token) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await cycleDetail.saveOutcome(token, cycleId, form);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save outcome.');
    } finally { setSaving(false); }
  }

  if (loading) return <p className="tab-loading">Loading outcome…</p>;

  return (
    <div className="tab-form space-y-4">
      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="mb-3 font-bold">Cycle Outcome</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <DateField label="Outcome Date" value={form.outcomeDate} onChange={(v) => setForm((f) => ({ ...f, outcomeDate: v }))} />
          <DateField label="BHCG Date" value={form.bhcgDate} onChange={(v) => setForm((f) => ({ ...f, bhcgDate: v }))} />
          <NumField label="BHCG Value" value={form.value} onChange={(v) => setForm((f) => ({ ...f, value: v }))} />
          <NumField label="No. of Sacs" value={form.noSacs} onChange={(v) => setForm((f) => ({ ...f, noSacs: v }))} />
          <NumField label="PT Day" value={form.ptDay} onChange={(v) => setForm((f) => ({ ...f, ptDay: v }))} />
          <SelectField label="Outcome" value={form.outcome} options={[{ id: 0, name: 'Select' }, { id: 1, name: 'Positive' }, { id: 2, name: 'Negative' }, { id: 3, name: 'Biochemical' }]} onChange={(v) => setForm((f) => ({ ...f, outcome: v }))} />
          <SelectField label="Pregnancy Option" value={form.pregOpt} options={[{ id: 0, name: 'Select' }, { id: 1, name: 'Clinical' }, { id: 2, name: 'Ectopic' }, { id: 3, name: 'Miscarriage' }]} onChange={(v) => setForm((f) => ({ ...f, pregOpt: v }))} />
          <NumField label="Preg Delivery Opt" value={form.pregDelOpt} onChange={(v) => setForm((f) => ({ ...f, pregDelOpt: v }))} />
        </div>
        <TextArea label="Post Treatment" value={form.postTreatment} onChange={(v) => setForm((f) => ({ ...f, postTreatment: v }))} />
        <TextArea label="Advice" value={form.advice} onChange={(v) => setForm((f) => ({ ...f, advice: v }))} />
        <TextArea label="Treatment" value={form.treatment} onChange={(v) => setForm((f) => ({ ...f, treatment: v }))} />
      </section>
      <TabAlerts error={error} success={success} />
      <SaveButton saving={saving} label="Save Outcome" onSave={() => void save()} />
    </div>
  );
}

// --- helpers ---

function defaultHistory(): CycleHistory {
  return {
    height: 0, weight: 0, bmi: 0, allergyId: 0, medSurHistory: '', isg: 0, isp: 0, isAb: 0, isEct: 0, isDuration: 0,
    findings: { idiopathic: false, if: false, mf: false, dor: false, ovu: false, tf: false, cf: false, endo: false, other: false },
    endoOpt: 0, otherTxt: '', indication: '', hlmp: '', hsg: '', stimProtId: 0, attemptCount: 0, attemptPrev: 0, attemptEw: 0,
    currentDate: '', comments: '', monitoringSheet: '', historyAttempts: [defaultAttempt()],
  };
}

function defaultAttempt(): CycleHistoryAttempt {
  return { cycleDate: '', ivf: false, icsi: false, stimProtId: 0, lmp: '', stimDetails: '', he2: 0, prgs: 0, lh: 0, hcg: '', ovum: '', oocytes: 0, fertilized: 0, remark: '' };
}

function defaultSurvival(): CycleSurvival {
  return {
    conc: 0, motility: 0, nmph1: 0, nmph2: 0, date: '', recovery: '', antibodies: '',
    saResult: { positive: false, borderline: false, negative: false },
    gnrh: { none: false, stopLupron: false, luteal: false },
    dosage: false,
    spermSource: { donor: false, donorCryo: false, husband: false, husbandCryo: false },
    transferType: { ivf: false, gift: false, zift: false, cryoAll: false },
    consent: { icsi: false, hatching: false, cryo: false, immatures: false, apa: false },
    comments: '',
  };
}

function defaultDay0() {
  return { date: '', fshDrug1: 0, fshDrug1Dose: 0, fshDrug2: 0, fshDrug2Dose: 0, hmgDrug1: 0, hmgDrug1Dose: 0, hmgDrug2: 0, hmgDrug2Dose: 0, cloDrug1: 0, cloDrug1Dose: 0, antaDrug1: 0, antaDrug1Dose: 0, othDrug1: 0, othDrug1Dose: 0, gnrha: 0, e2: 0, lh: 0, fsh: 0, tsh: 0, prol: 0, prog: 0, remarks: '', ultrasound: '', endometrium: '' };
}

function defaultRemDay(day: number): MonitoringRemDay {
  return { day, date: '', fshDrug1: 0, fshDrug2: 0, hmgDrug1: 0, hmgDrug2: 0, cloDrug1: 0, antaDrug1: 0, othDrug1: 0, e2: 0, lh: 0, fsh: 0, gnrha: 0, follicleLeft: 0, follicleRight: 0, endometrium: '', remarks: '', hcg: false, hcgDose: 0, ultrasound: '' };
}

function defaultOutcome(): CycleOutcome {
  return { outcomeDate: '', bhcgDate: '', value: 0, noSacs: 0, ptDay: 0, outcome: 0, pregOpt: 0, pregDelOpt: 0, postTreatment: '', advice: '', treatment: '' };
}

function updateAttempt(setForm: Dispatch<SetStateAction<CycleHistory>>, index: number, key: keyof CycleHistoryAttempt, value: string | number | boolean) {
  setForm((f) => ({ ...f, historyAttempts: f.historyAttempts.map((row, i) => (i === index ? { ...row, [key]: value } : row)) }));
}

function updateRemDay(setForm: Dispatch<SetStateAction<CycleMonitoring>>, index: number, key: keyof MonitoringRemDay, value: string | number | boolean) {
  setForm((f) => ({ ...f, remDays: f.remDays.map((row, i) => (i === index ? { ...row, [key]: value } : row)) }));
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block text-xs text-slate-600">{label}<input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9 w-full rounded border border-slate-300 px-2 text-sm" /></label>;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="block text-xs text-slate-600">{label}<input type="date" value={value?.slice(0, 10) ?? ''} onChange={(e) => onChange(e.target.value)} className="mt-1 h-9 w-full rounded border border-slate-300 px-2 text-sm" /></label>;
}

function NumField({ label, value, onChange, readOnly, step }: { label: string; value: number; onChange?: (v: number) => void; readOnly?: boolean; step?: number }) {
  return <label className="block text-xs text-slate-600">{label}<input type="number" step={step} readOnly={readOnly} value={value} onChange={(e) => onChange?.(Number(e.target.value))} className="mt-1 h-9 w-full rounded border border-slate-300 px-2 text-sm read-only:bg-slate-100" /></label>;
}

function TextArea({ label, value, onChange, className = '' }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return <label className={`block text-xs text-slate-600 ${className}`}>{label}<textarea value={value} rows={2} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm" /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: number; options: { id: number; name: string }[]; onChange: (v: number) => void }) {
  return <label className="block text-xs text-slate-600">{label}<select value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 h-9 w-full rounded border border-slate-300 px-2 text-sm"><option value={0}>Select</option>{options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></label>;
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}

function CheckboxGroup<T extends string>({ label, options, values, onChange }: { label: string; options: readonly T[]; values: Record<T, boolean>; onChange: (v: Record<T, boolean>) => void }) {
  return (
    <div className="my-3 flex flex-wrap gap-3">
      <span className="w-full text-xs font-semibold text-slate-600">{label}</span>
      {options.map((key) => (
        <label key={key} className="flex items-center gap-1 text-xs capitalize"><input type="checkbox" checked={values[key]} onChange={(e) => onChange({ ...values, [key]: e.target.checked })} />{key}</label>
      ))}
    </div>
  );
}

function TabAlerts({ error, success }: { error: string; success: string }) {
  return (
    <>
      {error && <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}
    </>
  );
}

function SaveButton({ saving, label, onSave }: { saving: boolean; label: string; onSave: () => void }) {
  return <button type="button" disabled={saving} onClick={onSave} className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : label}</button>;
}
