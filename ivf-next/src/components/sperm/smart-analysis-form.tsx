'use client';

import { useEffect, useState } from 'react';
import { listCommonMaster } from '@/lib/services/masters';
import type { CommonMasterRow } from '@/lib/types/master';
import { SMART_MASTER_CATS, type SmartAnalysisValues } from '@/lib/sperm-analysis';

type MasterMap = Record<keyof typeof SMART_MASTER_CATS, CommonMasterRow[]>;

const EMPTY_MASTERS: MasterMap = {
  labOperator: [],
  method: [],
  appearance: [],
  colour: [],
  viscosity: [],
  liquefaction: [],
  fructose: [],
  spermId: [],
  collProblem: [],
  linearity: [],
  contamination: [],
};

function MasterSelect({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: CommonMasterRow[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[10px] text-slate-600">
      <span className="mb-0.5 block font-semibold">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full rounded border border-slate-300 bg-white px-1.5 text-xs disabled:bg-slate-100"
      >
        <option value="">Select</option>
        {options.map((row) => (
          <option key={row.id} value={row.name}>
            {row.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  unit,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  unit?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-[10px] text-slate-600">
      <span className="mb-0.5 block font-semibold">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-full rounded border border-slate-300 px-1.5 text-xs disabled:bg-slate-100"
        />
        {unit && <span className="shrink-0 text-[10px] text-slate-500">{unit}</span>}
      </div>
    </label>
  );
}

function resolvedMasterValue(value: string, options: CommonMasterRow[]) {
  if (!value) return '';
  if (options.some((row) => row.name === value)) return value;
  const needle = value.toLowerCase();
  return options.find((row) => row.name.toLowerCase().includes(needle))?.name || value;
}

export function SmartAnalysisForm({
  values,
  onChange,
  token,
  patientName,
  lockedBefore,
  afterMode,
  showCycleAfterGrades,
  showWhereToUse,
  whereToUse,
  onWhereToUse,
  showValidTill,
  idOptions,
  idLoading,
  showIdSelect,
  showSemenType,
  spermIdLocked,
  semenTypeLocked,
}: {
  values: SmartAnalysisValues;
  onChange: (next: SmartAnalysisValues) => void;
  token?: string | null;
  patientName: string;
  lockedBefore?: boolean;
  afterMode: 'enabled' | 'disabled' | 'na' | 'survival24';
  showCycleAfterGrades?: boolean;
  showWhereToUse?: 'IUI' | 'CYCLE';
  whereToUse?: string | null;
  onWhereToUse?: (v: string) => void;
  showValidTill?: boolean;
  idOptions?: Array<string | { id: string; label: string }>;
  idLoading?: boolean;
  showIdSelect?: boolean;
  showSemenType?: boolean;
  spermIdLocked?: boolean;
  semenTypeLocked?: boolean;
}) {
  const [masters, setMasters] = useState<MasterMap>(EMPTY_MASTERS);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void Promise.all(
      (Object.entries(SMART_MASTER_CATS) as [keyof typeof SMART_MASTER_CATS, number][]).map(
        async ([key, catId]): Promise<[keyof typeof SMART_MASTER_CATS, CommonMasterRow[]]> => {
          try {
            return [key, await listCommonMaster(token, catId)];
          } catch {
            return [key, []];
          }
        }
      )
    ).then((pairs) => {
      if (cancelled) return;
      const next = { ...EMPTY_MASTERS };
      for (const [key, rows] of pairs) next[key] = rows;
      setMasters(next);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function patch(partial: Partial<SmartAnalysisValues>) {
    onChange({ ...values, ...partial });
  }

  const beforeLocked = Boolean(lockedBefore);
  const afterHidden = afterMode === 'disabled' || afterMode === 'na';
  const showSurvival = afterMode === 'survival24' || afterMode === 'enabled';

  const useIdSelect = showIdSelect ?? idOptions !== undefined;
  const idChoices = (idOptions || []).map((opt) =>
    typeof opt === 'string' ? { id: opt, label: opt } : opt
  );
  const spermIdValue = resolvedMasterValue(values.spermId, masters.spermId);

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <label className="block text-[10px] text-slate-600">
          <span className="mb-0.5 block font-semibold">Name :</span>
          <input readOnly value={patientName} className="h-7 w-full rounded border border-slate-200 bg-slate-50 px-1.5 text-xs" />
        </label>
        <MasterSelect
          label="Sperm ID :"
          value={spermIdValue}
          options={masters.spermId}
          disabled={spermIdLocked}
          onChange={(v) => patch({ spermId: v, idLocation: '' })}
        />
        {showSemenType !== false && (
          <label className="block text-[10px] text-slate-600">
            <span className="mb-0.5 block font-semibold">Type :</span>
            <select
              value={values.semenType}
              disabled={semenTypeLocked}
              onChange={(e) =>
                patch({ semenType: e.target.value === 'Frozen' ? 'Frozen' : 'Fresh', idLocation: '' })
              }
              className="h-7 w-full rounded border border-slate-300 bg-white px-1.5 text-xs disabled:bg-slate-100"
            >
              <option value="Fresh">Fresh</option>
              <option value="Frozen">Frozen</option>
            </select>
          </label>
        )}
        <label className="block text-[10px] text-slate-600">
          <span className="mb-0.5 block font-semibold">Id :</span>
          {useIdSelect ? (
            <select
              value={values.idLocation}
              onChange={(e) => patch({ idLocation: e.target.value })}
              className="h-7 w-full rounded border border-slate-300 px-1.5 text-xs"
            >
              <option value="">
                {idLoading ? 'Loading IDs…' : idChoices.length ? 'Select' : 'No frozen IDs'}
              </option>
              {idChoices.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={values.idLocation}
              disabled
              placeholder="Select"
              className="h-7 w-full rounded border border-slate-200 bg-slate-100 px-1.5 text-xs text-slate-400"
            />
          )}
        </label>
        <label className="block text-[10px] text-slate-600">
          <span className="mb-0.5 block font-semibold">Indication :</span>
          <input
            type="text"
            value={values.indication}
            onChange={(e) => patch({ indication: e.target.value })}
            className="h-7 w-full rounded border border-slate-300 px-1.5 text-xs"
          />
        </label>
        <TextField label="Abstinence :" value={values.abstinence} unit="Days" onChange={(v) => patch({ abstinence: v })} />
        <TextField label="Date :" value={values.date} onChange={(v) => patch({ date: v })} />
        <MasterSelect label="Coll.Problem :" value={values.collProblem} options={masters.collProblem} onChange={(v) => patch({ collProblem: v })} />
        <MasterSelect label="Lab Operator :" value={values.labOperator} options={masters.labOperator} onChange={(v) => patch({ labOperator: v })} />
        {showValidTill && (
          <TextField label="Valid Till :" value={values.validTill} onChange={(v) => patch({ validTill: v })} />
        )}
        <MasterSelect label="Contamination :" value={values.contamination} options={masters.contamination} onChange={(v) => patch({ contamination: v })} />
        <MasterSelect label="Method :" value={values.method} options={masters.method} onChange={(v) => patch({ method: v })} />
      </div>

      {showWhereToUse === 'CYCLE' && (
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[10px] font-semibold text-slate-600">Where to Use :</span>
          {['ICSI', 'IVF'].map((item) => (
            <label key={item} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={whereToUse === item}
                onChange={() => onWhereToUse?.(item)}
              />
              {item}
            </label>
          ))}
        </div>
      )}

      <div>
        <h4 className="mb-2 text-[11px] font-bold uppercase text-slate-800">Basic Details</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <MasterSelect label="Appearance :" value={values.appearance} options={masters.appearance} disabled={beforeLocked} onChange={(v) => patch({ appearance: v })} />
          <MasterSelect label="Colour :" value={values.colour} options={masters.colour} disabled={beforeLocked} onChange={(v) => patch({ colour: v })} />
          <MasterSelect label="Viscosity :" value={values.viscosity} options={masters.viscosity} disabled={beforeLocked} onChange={(v) => patch({ viscosity: v })} />
          <label className="block text-[10px] text-slate-600">
            <span className="mb-0.5 block font-semibold">Normomorphs :</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={values.normomorphs1}
                disabled={beforeLocked}
                onChange={(e) => patch({ normomorphs1: e.target.value })}
                className="h-7 w-12 rounded border border-slate-300 px-1 text-center text-xs disabled:bg-slate-100"
              />
              <span>/</span>
              <input
                type="text"
                value={values.normomorphs2}
                disabled={beforeLocked}
                onChange={(e) => patch({ normomorphs2: e.target.value })}
                className="h-7 w-12 rounded border border-slate-300 px-1 text-center text-xs disabled:bg-slate-100"
              />
              <span>%</span>
            </div>
          </label>
          <MasterSelect label="Liquefaction :" value={values.liquefaction} options={masters.liquefaction} disabled={beforeLocked} onChange={(v) => patch({ liquefaction: v })} />
          <TextField label="Time of Lique. :" value={values.timeOfLiq} unit="Min" disabled={beforeLocked} onChange={(v) => patch({ timeOfLiq: v })} />
          <TextField label="Agglutination :" value={values.agglutination} disabled={beforeLocked} onChange={(v) => patch({ agglutination: v })} />
          <TextField label="Antibodies :" value={values.antibodies} disabled={beforeLocked} onChange={(v) => patch({ antibodies: v })} />
          <MasterSelect label="Fructose :" value={values.fructose} options={masters.fructose} disabled={beforeLocked} onChange={(v) => patch({ fructose: v })} />
          <MasterSelect label="Linearity :" value={values.linearity} options={masters.linearity} disabled={beforeLocked} onChange={(v) => patch({ linearity: v })} />
          <TextField label="Velocity :" value={values.velocity} unit="r/Sec" disabled={beforeLocked} onChange={(v) => patch({ velocity: v })} />
          <TextField label="pH :" value={values.ph} disabled={beforeLocked} onChange={(v) => patch({ ph: v })} />
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-[11px] font-bold uppercase text-slate-800">Befor Processing</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          <TextField label="Vol :" value={values.beforeVol} unit="ml." disabled={beforeLocked} onChange={(v) => patch({ beforeVol: v })} />
          <TextField label="Total Sperms :" value={values.beforeSperms} unit="M/ml" disabled={beforeLocked} onChange={(v) => patch({ beforeSperms: v })} />
          <TextField label="Total Motility :" value={values.beforeMotility} unit="%" disabled={beforeLocked} onChange={(v) => patch({ beforeMotility: v })} />
          <TextField label="Prog.Motility :" value={values.beforeProgMotility} unit="%" disabled={beforeLocked} onChange={(v) => patch({ beforeProgMotility: v })} />
          <TextField label="Grade1 :" value={values.beforeGrade1} disabled={beforeLocked} onChange={(v) => patch({ beforeGrade1: v })} />
          <TextField label="WBC :" value={values.beforeWbc} disabled={beforeLocked} onChange={(v) => patch({ beforeWbc: v })} />
          <TextField label="Grade2 :" value={values.beforeGrade2} disabled={beforeLocked} onChange={(v) => patch({ beforeGrade2: v })} />
          <TextField label="RBC :" value={values.beforeRbc} disabled={beforeLocked} onChange={(v) => patch({ beforeRbc: v })} />
          <TextField label="Grade3 :" value={values.beforeGrade3} disabled={beforeLocked} onChange={(v) => patch({ beforeGrade3: v })} />
          <TextField label="Epith Cell :" value={values.beforeEpith} disabled={beforeLocked} onChange={(v) => patch({ beforeEpith: v })} />
          <TextField label="Grade4 :" value={values.beforeGrade4} disabled={beforeLocked} onChange={(v) => patch({ beforeGrade4: v })} />
          <TextField label="Round Cell :" value={values.beforeRound} disabled={beforeLocked} onChange={(v) => patch({ beforeRound: v })} />
          <TextField label="Trial Swim Up :" value={values.recovery} disabled={beforeLocked} onChange={(v) => patch({ recovery: v })} />
          <label className="flex items-end gap-2 pb-1 text-xs font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={values.hams}
              disabled={beforeLocked}
              onChange={(e) => patch({ hams: e.target.checked })}
            />
            Ham&apos;s
          </label>
        </div>
      </div>

      {!afterHidden && (
        <div>
          <h4 className="mb-2 text-[11px] font-bold uppercase text-slate-800">After Processing</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            <TextField label="Vol :" value={values.afterVol} unit="ml." onChange={(v) => patch({ afterVol: v })} />
            <TextField label="Conc. Total Sperms :" value={values.afterSperms} unit="M/ml." onChange={(v) => patch({ afterSperms: v })} />
            <TextField label="Total Motility :" value={values.afterMotility} unit="%" onChange={(v) => patch({ afterMotility: v })} />
            <TextField label="Prog. Motility :" value={values.afterProgMotility} unit="%" onChange={(v) => patch({ afterProgMotility: v })} />
            <MasterSelect label="Linearity :" value={values.afterLinearity} options={masters.linearity} onChange={(v) => patch({ afterLinearity: v })} />
            {showSurvival && (
              <>
                <TextField label="Servival 24 Hours :" value={values.survival24} unit="%" onChange={(v) => patch({ survival24: v })} />
                <TextField label="Servival 48 Hours :" value={values.survival48} unit="%" onChange={(v) => patch({ survival48: v })} />
              </>
            )}
            {showCycleAfterGrades && (
              <>
                <TextField label="Grade1 :" value={values.afterGrade1} onChange={(v) => patch({ afterGrade1: v })} />
                <TextField label="WBC :" value={values.afterWbc} onChange={(v) => patch({ afterWbc: v })} />
                <TextField label="Grade2 :" value={values.afterGrade2} onChange={(v) => patch({ afterGrade2: v })} />
                <TextField label="RBC :" value={values.afterRbc} onChange={(v) => patch({ afterRbc: v })} />
                <TextField label="Grade3 :" value={values.afterGrade3} onChange={(v) => patch({ afterGrade3: v })} />
                <TextField label="Epith Cell :" value={values.afterEpith} onChange={(v) => patch({ afterEpith: v })} />
                <TextField label="Grade4 :" value={values.afterGrade4} onChange={(v) => patch({ afterGrade4: v })} />
                <TextField label="Round Cell :" value={values.afterRound} onChange={(v) => patch({ afterRound: v })} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
