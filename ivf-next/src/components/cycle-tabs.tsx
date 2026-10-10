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
  getMonitoringSheetLabel,
  isMonitoringSheetAllowed,
  MONITORING_SHEET_OPTIONS,
  monitoringSheetHint,
  parseMonitoringSheet,
  stripMonitoringSheetMarker,
} from '@/lib/cycle-utils';
import { CycleMonitoringChart } from '@/components/cycle-monitoring-chart';
import { resolveMonChartCssColor } from '@/lib/monitoring-sheet';

interface TabProps {
  cycleId: string;
}

// ============================================================================
// 1. CYCLE HISTORY TAB
// ============================================================================

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
    void cycleDetail
      .loadHistory(token, cycleId)
      .then(({ data, masters: m }) => {
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
      })
      .catch(() => {
        setError('Failed to load history.');
        setLoading(false);
      });
  }, [token, cycleId]);

  function calcBmi(height: number, weight: number) {
    const h = height / 100;
    if (h > 0 && weight > 0) return Math.round((weight / (h * h)) * 10) / 10;
    return form.bmi;
  }

  function getBmiBadge(bmi: number) {
    if (!bmi || bmi <= 0) return null;
    if (bmi < 18.5) {
      return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">Underweight</span>;
    }
    if (bmi <= 24.9) {
      return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">Normal BMI</span>;
    }
    if (bmi <= 29.9) {
      return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">Overweight</span>;
    }
    return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">Obese</span>;
  }

  async function save() {
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await cycleDetail.saveHistory(token, cycleId, {
        ...form,
        comments: embedMonitoringSheetMarker(form.comments, form.monitoringSheet),
      });
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save history.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-sm text-slate-500 font-medium">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        <span>Loading patient history…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Patient Measurements & Vitals */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
              🩺
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Patient Vitals & Biometrics</h4>
          </div>
          {getBmiBadge(form.bmi)}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <NumField
            label="Height"
            value={form.height}
            unit="cm"
            step={0.1}
            onChange={(v) => setForm((f) => ({ ...f, height: v, bmi: calcBmi(v, f.weight) }))}
          />
          <NumField
            label="Weight"
            value={form.weight}
            unit="kg"
            step={0.1}
            onChange={(v) => setForm((f) => ({ ...f, weight: v, bmi: calcBmi(f.height, v) }))}
          />
          <NumField
            label="Calculated BMI"
            value={form.bmi}
            readOnly
            unit="kg/m²"
          />
          <SelectField
            label="Known Allergies"
            value={form.allergyId}
            options={masters.allergies}
            onChange={(v) => setForm((f) => ({ ...f, allergyId: v }))}
          />
        </div>
      </section>

      {/* 2. Clinical History & Infertility Evaluation */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
            📋
          </span>
          <h4 className="font-bold text-slate-900 text-sm">Clinical & Infertility History</h4>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextArea
            label="Medical / Surgical History"
            value={form.medSurHistory}
            className="sm:col-span-2 lg:col-span-4"
            placeholder="Record prior laparoscopies, pelvic surgeries, thyroid, hypertension or systemic conditions…"
            onChange={(v) => setForm((f) => ({ ...f, medSurHistory: v }))}
          />

          <NumField label="Gravida (ISG)" value={form.isg} onChange={(v) => setForm((f) => ({ ...f, isg: v }))} />
          <NumField label="Para (ISP)" value={form.isp} onChange={(v) => setForm((f) => ({ ...f, isp: v }))} />
          <NumField label="Abortion (IS Ab)" value={form.isAb} onChange={(v) => setForm((f) => ({ ...f, isAb: v }))} />
          <NumField label="Ectopic (IS Ect)" value={form.isEct} onChange={(v) => setForm((f) => ({ ...f, isEct: v }))} />
          <NumField label="Infertility Duration (Yrs)" value={form.isDuration} unit="yrs" step={0.5} onChange={(v) => setForm((f) => ({ ...f, isDuration: v }))} />

          <DateField label="LMP (Last Menstrual Period)" value={form.hlmp} onChange={(v) => setForm((f) => ({ ...f, hlmp: v }))} />
          <TextField label="HSG / Hysterosalpingography" value={form.hsg} placeholder="e.g. Bilateral tubes patent" onChange={(v) => setForm((f) => ({ ...f, hsg: v }))} />
          <TextField label="Clinical Indication" value={form.indication} placeholder="e.g. Primary Infertility, DOR, PCOS" onChange={(v) => setForm((f) => ({ ...f, indication: v }))} />

          <SelectField
            label="Stimulation Protocol"
            value={form.stimProtId}
            options={masters.stimProtocols}
            onChange={(v) => setForm((f) => ({ ...f, stimProtId: v }))}
          />
          <DateField label="Evaluation Date" value={form.currentDate} onChange={(v) => setForm((f) => ({ ...f, currentDate: v }))} />
        </div>

        {/* Monitoring Sheet Protocol Selector */}
        <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Protocol Monitoring Sheet :</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MONITORING_SHEET_OPTIONS.map((item) => {
              const allowed = isMonitoringSheetAllowed(cycleType, item.value, undefined);
              const selected = form.monitoringSheet === item.value;
              return (
                <label
                  key={item.value}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition cursor-pointer ${
                    selected
                      ? 'border-purple-400 bg-purple-100/70 text-purple-900 font-bold shadow-2xs'
                      : allowed
                      ? 'border-slate-200 bg-white text-slate-700 hover:border-purple-200 hover:bg-purple-50/30'
                      : 'border-slate-100 bg-slate-50/60 text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="historyMonitoringSheet"
                    value={item.value}
                    checked={selected}
                    disabled={!allowed}
                    onChange={() => {
                      if (allowed) setForm((f) => ({ ...f, monitoringSheet: item.value }));
                    }}
                    className="accent-[#6345A6] h-3.5 w-3.5"
                  />
                  <span>{item.label}</span>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500">{monitoringSheetHint(cycleType)}</p>
        </div>

        {/* Attempt Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <NumField label="Total Prior Attempts" value={form.attemptCount} onChange={(v) => setForm((f) => ({ ...f, attemptCount: v }))} />
          <NumField label="Previous Clinic Attempts" value={form.attemptPrev} onChange={(v) => setForm((f) => ({ ...f, attemptPrev: v }))} />
          <NumField label="Elsewhere (EW) Attempts" value={form.attemptEw} onChange={(v) => setForm((f) => ({ ...f, attemptEw: v }))} />
        </div>
      </section>

      {/* 3. Diagnostic Findings */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
            🔍
          </span>
          <h4 className="font-bold text-slate-900 text-sm">Diagnostic Findings & Etiology</h4>
        </div>

        <CheckboxGroup
          label="Infertility Etiology Factors"
          options={['idiopathic', 'if', 'mf', 'dor', 'ovu', 'tf', 'cf', 'endo', 'other'] as const}
          values={form.findings}
          onChange={(findings) => setForm((f) => ({ ...f, findings }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <TextField
            label="Other Findings Detail"
            value={form.otherTxt}
            placeholder="Specify any uncommon genetic or pelvic pathology…"
            onChange={(v) => setForm((f) => ({ ...f, otherTxt: v }))}
          />
          <TextArea
            label="Clinical Comments & Impressions"
            value={form.comments}
            placeholder="Special stimulation instructions, sensitivity to gonadotropins, etc."
            onChange={(v) => setForm((f) => ({ ...f, comments: v }))}
          />
        </div>
      </section>

      {/* 4. Previous Cycle Attempts */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
              📑
            </span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Prior Assisted Reproduction Attempts</h4>
              <p className="text-[11px] text-slate-500">Record past IVF / ICSI cycle parameters and outcomes</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition border border-purple-200/80 cursor-pointer active:scale-95"
            onClick={() => setForm((f) => ({ ...f, historyAttempts: [...f.historyAttempts, defaultAttempt()] }))}
          >
            <span>+ Add Attempt</span>
          </button>
        </div>

        <div className="space-y-3">
          {form.historyAttempts.map((row, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 relative group">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Attempt #{i + 1}
                </span>
                {form.historyAttempts.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        historyAttempts: f.historyAttempts.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition cursor-pointer"
                  >
                    Remove ✕
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <DateField label="Cycle Date" value={row.cycleDate} onChange={(v) => updateAttempt(setForm, i, 'cycleDate', v)} />
                <div className="flex items-center gap-3 pt-6">
                  <CheckField label="IVF" checked={row.ivf} onChange={(v) => updateAttempt(setForm, i, 'ivf', v)} />
                  <CheckField label="ICSI" checked={row.icsi} onChange={(v) => updateAttempt(setForm, i, 'icsi', v)} />
                </div>
                <SelectField label="Stim Protocol" value={row.stimProtId} options={masters.stimProtocols} onChange={(v) => updateAttempt(setForm, i, 'stimProtId', v)} />
                <DateField label="LMP" value={row.lmp} onChange={(v) => updateAttempt(setForm, i, 'lmp', v)} />
                <NumField label="Oocytes Retrieved" value={row.oocytes} onChange={(v) => updateAttempt(setForm, i, 'oocytes', v)} />
                <NumField label="Fertilized" value={row.fertilized} onChange={(v) => updateAttempt(setForm, i, 'fertilized', v)} />
                <NumField label="Peak E2 (pg/mL)" value={row.he2} unit="pg/ml" onChange={(v) => updateAttempt(setForm, i, 'he2', v)} />
                <TextField label="Outcome Remarks" value={row.remark} placeholder="e.g. 2 Grade A transferred" onChange={(v) => updateAttempt(setForm, i, 'remark', v)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <TabAlerts error={error} success={success} />
      <SaveButton saving={saving} label="Save Patient History" onSave={() => void save()} />
    </div>
  );
}

// ============================================================================
// 2. CYCLE SURVIVAL REPORT TAB
// ============================================================================

export function CycleSurvivalTab({ cycleId }: TabProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<CycleSurvival>(defaultSurvival());

  useEffect(() => {
    if (!token) return;
    void cycleDetail
      .loadSurvival(token, cycleId)
      .then((data) => {
        setForm({ ...defaultSurvival(), ...data });
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load survival report.');
        setLoading(false);
      });
  }, [token, cycleId]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await cycleDetail.saveSurvival(token, cycleId, form);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save survival report.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-sm text-slate-500 font-medium">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        <span>Loading survival report…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Semen Analysis Parameters */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
            🔬
          </span>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Semen Analysis & Sperm Survival Metrics</h4>
            <p className="text-[11px] text-slate-500">Evaluation of sperm concentration, motility and morphological characteristics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <NumField
            label="Concentration"
            value={form.conc}
            step={0.01}
            unit="M/ml"
            placeholder="e.g. 60"
            onChange={(v) => setForm((f) => ({ ...f, conc: v }))}
          />
          <NumField
            label="Motility"
            value={form.motility}
            unit="%"
            step={1}
            placeholder="e.g. 50"
            onChange={(v) => setForm((f) => ({ ...f, motility: v }))}
          />
          <NumField
            label="NMPH 1 (Normal Morphology)"
            value={form.nmph1}
            unit="%"
            step={1}
            onChange={(v) => setForm((f) => ({ ...f, nmph1: v }))}
          />
          <NumField
            label="NMPH 2"
            value={form.nmph2}
            unit="%"
            step={1}
            onChange={(v) => setForm((f) => ({ ...f, nmph2: v }))}
          />
          <DateField
            label="Sample Collection Date"
            value={form.date}
            onChange={(v) => setForm((f) => ({ ...f, date: v }))}
          />
          <TextField
            label="Trial Swim-Up Recovery"
            value={form.recovery}
            placeholder="e.g. Good / 85% viable"
            onChange={(v) => setForm((f) => ({ ...f, recovery: v }))}
          />
          <TextField
            label="Anti-Sperm Antibodies"
            value={form.antibodies}
            placeholder="e.g. Negative / Nil"
            onChange={(v) => setForm((f) => ({ ...f, antibodies: v }))}
          />
        </div>
      </section>

      {/* 2. Analysis Diagnosis, Protocol & Source */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
            📊
          </span>
          <h4 className="font-bold text-slate-900 text-sm">Diagnostic Classification & Logistics</h4>
        </div>

        <div className="space-y-4">
          <CheckboxGroup
            label="Semen Analysis Overall Result"
            options={['positive', 'borderline', 'negative'] as const}
            values={form.saResult}
            icon="🩺"
            onChange={(saResult) => setForm((f) => ({ ...f, saResult }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CheckboxGroup
              label="Sperm Origin / Source"
              options={['donor', 'donorCryo', 'husband', 'husbandCryo'] as const}
              values={form.spermSource}
              icon="🧫"
              onChange={(spermSource) => setForm((f) => ({ ...f, spermSource }))}
            />

            <CheckboxGroup
              label="Transfer / Treatment Modality"
              options={['ivf', 'gift', 'zift', 'cryoAll'] as const}
              values={form.transferType}
              icon="🚀"
              onChange={(transferType) => setForm((f) => ({ ...f, transferType }))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100">
            <div className="flex-1 min-w-[240px]">
              <CheckboxGroup
                label="GnRH Agonist Regimen"
                options={['none', 'stopLupron', 'luteal'] as const}
                values={form.gnrh}
                icon="💉"
                onChange={(gnrh) => setForm((f) => ({ ...f, gnrh }))}
              />
            </div>
            <div className="pt-4">
              <CheckField
                label="Therapeutic Dosage Confirmed"
                checked={form.dosage}
                onChange={(v) => setForm((f) => ({ ...f, dosage: v }))}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Consents & Clinical Observations */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
            ✍️
          </span>
          <h4 className="font-bold text-slate-900 text-sm">Procedure Consents & Clinical Notes</h4>
        </div>

        <CheckboxGroup
          label="Informed Patient Consents on File"
          options={['icsi', 'hatching', 'cryo', 'immatures', 'apa'] as const}
          values={form.consent}
          icon="🛡️"
          onChange={(consent) => setForm((f) => ({ ...f, consent }))}
        />

        <TextArea
          label="Embryologist & Andrologist Observations"
          value={form.comments}
          rows={3}
          placeholder="Record notes on post-wash motility, density gradient centrifugation details, incubation timings…"
          onChange={(v) => setForm((f) => ({ ...f, comments: v }))}
        />
      </section>

      <TabAlerts error={error} success={success} />
      <SaveButton saving={saving} label="Save Survival Report" onSave={() => void save()} />
    </div>
  );
}

// ============================================================================
// 3. CYCLE OUTCOME TAB
// ============================================================================

function cleanOutcomeText(val: string | undefined | null): string {
  if (!val) return '';
  const text = String(val).trim();
  if (!text) return '';
  if (!/<[a-z!/][\s\S]*>/i.test(text) && !/&(?:nbsp|amp|lt|gt|quot|#39);/i.test(text)) {
    return text;
  }
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(div|p|h[1-6]|li|tr)[\s>]/gi, '\n$&')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/(div|p|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
    void cycleDetail
      .loadOutcome(token, cycleId)
      .then((data) => {
        setForm({
          ...defaultOutcome(),
          ...data,
          advice: cleanOutcomeText(data.advice),
          postTreatment: cleanOutcomeText(data.postTreatment),
          treatment: cleanOutcomeText(data.treatment),
        });
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load outcome.');
        setLoading(false);
      });
  }, [token, cycleId]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await cycleDetail.saveOutcome(token, cycleId, form);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save outcome.');
    } finally {
      setSaving(false);
    }
  }

  function insertStandardAdvice() {
    const std =
      '1. Bed Rest.\n2. No Sexual Relation\n3. Contact the clinic if:-\n   (i) Bleeding / spotting\n   (ii) Pain in abdomen\n   (iii) Fever\n   (iv) Other complains if any';
    setForm((f) => ({ ...f, advice: std }));
  }

  function cleanAllFields() {
    setForm((f) => ({
      ...f,
      advice: cleanOutcomeText(f.advice),
      postTreatment: cleanOutcomeText(f.postTreatment),
      treatment: cleanOutcomeText(f.treatment),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-sm text-slate-500 font-medium">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        <span>Loading cycle outcome…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Outcome Status & Pregnancy Diagnostics */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
              🎯
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Cycle Clinical Outcome & BHCG Diagnostics</h4>
          </div>
          {form.outcome === 1 && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
              ✓ Positive Pregnancy
            </span>
          )}
          {form.outcome === 2 && (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-300">
              ✕ Negative Outcome
            </span>
          )}
          {form.outcome === 3 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
              ⚡ Biochemical Pregnancy
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SelectField
            label="Clinical Outcome"
            value={form.outcome}
            options={[
              { id: 0, name: 'Select outcome…' },
              { id: 1, name: 'Positive' },
              { id: 2, name: 'Negative' },
              { id: 3, name: 'Biochemical' },
            ]}
            onChange={(v) => setForm((f) => ({ ...f, outcome: v }))}
          />
          <DateField label="Outcome Date" value={form.outcomeDate} onChange={(v) => setForm((f) => ({ ...f, outcomeDate: v }))} />
          <DateField label="BHCG Test Date" value={form.bhcgDate} onChange={(v) => setForm((f) => ({ ...f, bhcgDate: v }))} />
          <NumField
            label="Serum Beta-hCG"
            value={form.value}
            unit="mIU/mL"
            step={0.1}
            placeholder="e.g. 450"
            onChange={(v) => setForm((f) => ({ ...f, value: v }))}
          />
          <NumField
            label="Gestational Sacs Visible"
            value={form.noSacs}
            step={1}
            placeholder="0"
            onChange={(v) => setForm((f) => ({ ...f, noSacs: v }))}
          />
          <NumField
            label="Post-Transfer Day (PT Day)"
            value={form.ptDay}
            step={1}
            placeholder="14"
            onChange={(v) => setForm((f) => ({ ...f, ptDay: v }))}
          />
          <SelectField
            label="Pregnancy Category"
            value={form.pregOpt}
            options={[
              { id: 0, name: 'Select category…' },
              { id: 1, name: 'Clinical Pregnancy' },
              { id: 2, name: 'Ectopic' },
              { id: 3, name: 'Miscarriage' },
            ]}
            onChange={(v) => setForm((f) => ({ ...f, pregOpt: v }))}
          />
          <NumField
            label="Pregnancy Delivery Option"
            value={form.pregDelOpt}
            step={1}
            placeholder="0"
            onChange={(v) => setForm((f) => ({ ...f, pregDelOpt: v }))}
          />
        </div>
      </section>

      {/* 2. Advice & Treatment Regimen */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[#6345A6] text-xs">
              📋
            </span>
            <h4 className="font-bold text-slate-900 text-sm">Post-Procedure Advice & Medication</h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cleanAllFields}
              title="Remove HTML tags, MS Word formatting, and excess spaces"
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
            >
              Clean Text ✨
            </button>
            <button
              type="button"
              onClick={insertStandardAdvice}
              className="text-[11px] font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100/80 px-2.5 py-1 rounded-lg border border-purple-200 transition cursor-pointer"
            >
              Insert Standard Advice ↵
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <TextArea
            label="Patient Instructions & Discharge Advice"
            value={form.advice}
            rows={4}
            placeholder="Prescribed rest, emergency symptoms to watch for, contact clinic instructions…"
            onChange={(v) => setForm((f) => ({ ...f, advice: v }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextArea
              label="Post Treatment Management"
              value={form.postTreatment}
              rows={3}
              placeholder="Post-transfer progesterone luteal support, estrogens, folates…"
              onChange={(v) => setForm((f) => ({ ...f, postTreatment: v }))}
            />
            <TextArea
              label="Prescribed Treatment / Therapy"
              value={form.treatment}
              rows={3}
              placeholder="Dosage schedules, next follow-up ultrasound scan dates…"
              onChange={(v) => setForm((f) => ({ ...f, treatment: v }))}
            />
          </div>
        </div>
      </section>

      <TabAlerts error={error} success={success} />
      <SaveButton saving={saving} label="Save Cycle Outcome" onSave={() => void save()} />
    </div>
  );
}

// ============================================================================
// 4. CYCLE MONITORING TAB (For Retrieval screen integration)
// ============================================================================

function getVisitRowVisual(r: MonitoringRemDay, isFirstAntag: boolean) {
  const isTrigger = Boolean(r.hcg || (r.hcgDose && r.hcgDose > 0));

  if (r.color) {
    const hex = resolveMonChartCssColor(r.color);
    if (hex === '#81c784' || isTrigger) {
      return {
        bgCls: 'bg-[#81c784]/20 hover:bg-[#81c784]/30 border-l-4 border-l-[#81c784]',
        badge: (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-[#81c784]/30 text-[#14532d] border border-[#81c784]">
            🟢 Trigger
          </span>
        ),
      };
    }
    if (hex === '#ef5350') {
      return {
        bgCls: 'bg-[#ef5350]/20 hover:bg-[#ef5350]/30 border-l-4 border-l-[#ef5350]',
        badge: (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-[#ef5350]/30 text-[#7f1d1d] border border-[#ef5350]">
            🔴 OPU
          </span>
        ),
      };
    }
    if (hex === '#ffeb3b') {
      return {
        bgCls: 'bg-[#ffeb3b]/25 hover:bg-[#ffeb3b]/35 border-l-4 border-l-[#ffeb3b]',
        badge: (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-[#ffeb3b]/40 text-[#713f12] border border-[#facc15]">
            🟡 Antagonist
          </span>
        ),
      };
    }
    if (hex === '#f8bbd0') {
      return {
        bgCls: 'bg-[#f8bbd0]/30 hover:bg-[#f8bbd0]/40 border-l-4 border-l-[#f8bbd0]',
        badge: (
          <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-[#f8bbd0]/50 text-[#881337] border border-[#f472b6]">
            🌸 Day 1 (Stim)
          </span>
        ),
      };
    }
  }

  if (isTrigger) {
    return {
      bgCls: 'bg-emerald-50/70 hover:bg-emerald-100/70 border-l-4 border-l-emerald-600',
      badge: (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          🟢 Trigger
        </span>
      ),
    };
  }
  if (isFirstAntag) {
    return {
      bgCls: 'bg-amber-50/70 hover:bg-amber-100/70 border-l-4 border-l-amber-500',
      badge: (
        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
          🟡 Antagonist
        </span>
      ),
    };
  }
  return { bgCls: 'hover:bg-slate-50', badge: null };
}

export function CycleMonitoringTab({ cycleId }: TabProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [masters, setMasters] = useState<TabMasters>(emptyTabMasters);
  const [form, setForm] = useState<CycleMonitoring>({ day0: defaultDay0(), remDays: [] });
  const [monitoringSheet, setMonitoringSheet] = useState<string>('Antagonist');

  useEffect(() => {
    if (!token) return;
    void cycleDetail
      .loadMonitoring(token, cycleId)
      .then((res) => {
        if (res.masters) setMasters(res.masters);
        if (res.data) setForm(res.data);
        if (res.monitoringSheet) setMonitoringSheet(res.monitoringSheet);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load monitoring.');
        setLoading(false);
      });
  }, [token, cycleId]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await cycleDetail.saveMonitoring(token, cycleId, form);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save monitoring.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-sm text-slate-500 font-medium">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
        <span>Loading monitoring sheet…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <span className="text-sm font-bold text-slate-800">
            Monitoring Chart · Protocol: <strong>{getMonitoringSheetLabel(monitoringSheet)}</strong>
          </span>
          <span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-900 border border-purple-200">
            {cycleId}
          </span>
        </div>
        <CycleMonitoringChart option={monitoringSheet} cycleId={cycleId} />
      </div>

      <TabAlerts error={error} success={success} />
      <SaveButton saving={saving} label="Save Monitoring" onSave={() => void save()} />
    </div>
  );
}

// ============================================================================
// UI PRIMITIVES & FORM HELPERS
// ============================================================================

function defaultHistory(): CycleHistory {
  return {
    height: 0,
    weight: 0,
    bmi: 0,
    allergyId: 0,
    medSurHistory: '',
    isg: 0,
    isp: 0,
    isAb: 0,
    isEct: 0,
    isDuration: 0,
    findings: {
      idiopathic: false,
      if: false,
      mf: false,
      dor: false,
      ovu: false,
      tf: false,
      cf: false,
      endo: false,
      other: false,
    },
    endoOpt: 0,
    otherTxt: '',
    indication: '',
    hlmp: '',
    hsg: '',
    stimProtId: 0,
    attemptCount: 0,
    attemptPrev: 0,
    attemptEw: 0,
    currentDate: new Date().toISOString().split('T')[0],
    comments: '',
    monitoringSheet: '',
    historyAttempts: [defaultAttempt()],
  };
}

function defaultAttempt(): CycleHistoryAttempt {
  return {
    cycleDate: '',
    ivf: false,
    icsi: false,
    stimProtId: 0,
    lmp: '',
    stimDetails: '',
    he2: 0,
    prgs: 0,
    lh: 0,
    hcg: '',
    ovum: '',
    oocytes: 0,
    fertilized: 0,
    remark: '',
  };
}

function defaultSurvival(): CycleSurvival {
  return {
    conc: 0,
    motility: 0,
    nmph1: 0,
    nmph2: 0,
    date: new Date().toISOString().split('T')[0],
    recovery: '',
    antibodies: '',
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
  return {
    date: '',
    fshDrug1: 0,
    fshDrug1Dose: 0,
    fshDrug2: 0,
    fshDrug2Dose: 0,
    hmgDrug1: 0,
    hmgDrug1Dose: 0,
    hmgDrug2: 0,
    hmgDrug2Dose: 0,
    cloDrug1: 0,
    cloDrug1Dose: 0,
    antaDrug1: 0,
    antaDrug1Dose: 0,
    othDrug1: 0,
    othDrug1Dose: 0,
    gnrha: 0,
    e2: 0,
    lh: 0,
    fsh: 0,
    tsh: 0,
    prol: 0,
    prog: 0,
    remarks: '',
    ultrasound: '',
    endometrium: '',
  };
}

function defaultOutcome(): CycleOutcome {
  return {
    outcomeDate: new Date().toISOString().split('T')[0],
    bhcgDate: '',
    value: 0,
    noSacs: 0,
    ptDay: 0,
    outcome: 0,
    pregOpt: 0,
    pregDelOpt: 0,
    postTreatment: '',
    advice:
      '1. Bed Rest.\n2. No Sexual Relation\n3. Contact the clinic if:-\n   (i) Bleeding / spotting\n   (ii) Pain in abdomen\n   (iii) Fever\n   (iv) Other complains if any',
    treatment: '',
  };
}

function updateAttempt(
  setForm: Dispatch<SetStateAction<CycleHistory>>,
  index: number,
  key: keyof CycleHistoryAttempt,
  value: string | number | boolean
) {
  setForm((f) => ({
    ...f,
    historyAttempts: f.historyAttempts.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
  }));
}

function formatLabel(key: string): string {
  const map: Record<string, string> = {
    idiopathic: 'Idiopathic',
    if: 'Isolated Female (IF)',
    mf: 'Male Factor (MF)',
    dor: 'Diminished Ovarian Reserve (DOR)',
    ovu: 'Ovulatory Dysfunction (Ovu)',
    tf: 'Tubal Factor (TF)',
    cf: 'Cervical Factor (CF)',
    endo: 'Endometriosis (Endo)',
    other: 'Other Etiology',
    donor: 'Donor',
    donorCryo: 'Donor Cryo',
    husband: 'Husband',
    husbandCryo: 'Husband Cryo',
    ivf: 'IVF',
    gift: 'GIFT',
    zift: 'ZIFT',
    cryoAll: 'Cryo All',
    icsi: 'ICSI',
    hatching: 'Assisted Hatching',
    cryo: 'Cryopreservation',
    immatures: 'Immature Oocytes',
    apa: 'APA',
    stopLupron: 'Stop Lupron',
    luteal: 'Luteal',
    none: 'None',
    positive: 'Positive',
    borderline: 'Borderline',
    negative: 'Negative',
  };
  return map[key] || key;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block text-xs font-semibold text-slate-700 ${className}`}>
      <span>{label}</span>
      <input
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-2xs transition-all placeholder:text-slate-400 focus:border-[#6345A6] focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-slate-300"
      />
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-xs font-semibold text-slate-700 ${className}`}>
      <span>{label}</span>
      <input
        type="date"
        value={value?.slice(0, 10) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-2xs transition-all focus:border-[#6345A6] focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-slate-300"
      />
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  readOnly,
  step,
  unit,
  placeholder,
}: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  step?: number;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      <span className="flex items-center justify-between">
        <span>{label}</span>
        {unit && <span className="text-[10px] text-slate-400 font-mono font-normal">{unit}</span>}
      </span>
      <div className="relative mt-1">
        <input
          type="number"
          step={step}
          readOnly={readOnly}
          placeholder={placeholder ?? '0'}
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className={`h-9.5 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-2xs transition-all placeholder:text-slate-400 focus:border-[#6345A6] focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-slate-300 ${
            readOnly ? 'bg-slate-100/70 text-slate-600 font-medium cursor-not-allowed border-slate-200/80' : ''
          }`}
        />
        {unit && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
            {unit}
          </span>
        )}
      </div>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  className = '',
  rows = 2,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className={`block text-xs font-semibold text-slate-700 ${className}`}>
      <span>{label}</span>
      <textarea
        value={value ?? ''}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-2xs transition-all placeholder:text-slate-400 focus:border-[#6345A6] focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-slate-300 resize-y"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string;
  value: number;
  options: { id: number; name: string }[];
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <label className={`block text-xs font-semibold text-slate-700 ${className}`}>
      <span>{label}</span>
      <div className="relative mt-1">
        <select
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9.5 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-800 shadow-2xs transition-all focus:border-[#6345A6] focus:ring-2 focus:ring-purple-200 focus:outline-none hover:border-slate-300 cursor-pointer"
        >
          <option value={0}>Select option…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
          ▼
        </span>
      </div>
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-[#6345A6] focus:ring-purple-400 accent-[#6345A6] cursor-pointer"
      />
      <span>{label}</span>
    </label>
  );
}

function CheckboxGroup<T extends string>({
  label,
  options,
  values,
  onChange,
  icon = '🏷️',
}: {
  label: string;
  options: readonly T[];
  values: Record<T, boolean>;
  onChange: (v: Record<T, boolean>) => void;
  icon?: string;
}) {
  return (
    <div className="space-y-2">
      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((key) => {
          const active = Boolean(values[key]);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ ...values, [key]: !active })}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all shadow-2xs border cursor-pointer active:scale-95 ${
                active
                  ? 'bg-purple-100/90 text-purple-900 border-purple-300 ring-1 ring-purple-400/50 font-bold shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded text-[9px] font-bold ${
                  active ? 'bg-[#6345A6] text-white' : 'border border-slate-300 text-transparent'
                }`}
              >
                ✓
              </span>
              <span>{formatLabel(key)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TabAlerts({ error, success }: { error: string; success: string }) {
  if (!error && !success) return null;
  return (
    <div className="pt-2 animate-fadeIn">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 shadow-2xs">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 shadow-2xs">
          <span>✓</span>
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}

function SaveButton({
  saving,
  label,
  onSave,
}: {
  saving: boolean;
  label: string;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-end pt-3 border-t border-slate-100">
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6345A6] to-[#51368c] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:shadow-md hover:from-[#563a94] hover:to-[#432c75] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {saving ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Saving…</span>
          </>
        ) : (
          <>
            <span>💾</span>
            <span>{label}</span>
          </>
        )}
      </button>
    </div>
  );
}
