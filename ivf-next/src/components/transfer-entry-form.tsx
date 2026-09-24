'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ModuleAlerts, ModuleCard, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import {
  CycleDateOption,
  asBool,
  btApi,
  etApi,
  formatCycleDate,
  toDateInput,
} from '@/lib/services/clinical-modules';
import {
  BT_EXPANSION_OPTIONS,
  BT_ICM_OPTIONS,
  BT_TE_OPTIONS,
  ET_ACTION_OPTIONS,
  ET_CELLER_OPTIONS,
  ET_GRADE_OPTIONS,
  EmbryoRow,
  MEDIA_OPTIONS,
  PROTOCOL_OPTIONS,
} from '@/lib/services/iui';
import type { LookupItem } from '@/lib/types/master';

const inputCls = 'mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm';
const labelCls = 'text-xs font-medium text-slate-600';
const checkCls = 'flex items-center gap-2 text-sm text-slate-700';

type Tab = 'transfer' | 'grid' | 'summary';
type ModuleKind = 'et' | 'bt';

interface TransferEntryFormProps {
  module: ModuleKind;
}

const today = () => new Date().toISOString().slice(0, 10);

const defaultTransfer = () => ({
  transferDate: today(),
  diagnosis: '',
  procedure: '',
  embryologist: '',
  surgeon: '' as string | number,
  anesthesia: 0,
  anesthesiaOther: '',
  complication: 0,
  complicationNote: '',
  fbe: 0,
  fav: false,
  frv: false,
  fax: false,
  ftr: 0,
  fmtd: 0,
  fdr: 0,
  fug: 0,
  catheterCcd: true,
  catheterLaboTech: false,
  catheterSoftPass: false,
  catheterCook: false,
  difficultyNone: false,
  difficultySome: false,
  difficultyModerate: false,
  difficultySignificant: false,
  nextCatheter: false,
  nextWallace: false,
  nextMarrs: false,
  nextDifficult: false,
  nextDifficultyNone: true,
  nextDifficultySome: false,
  nextDifficultyModerate: false,
  nextDifficultySignificant: false,
  depthOfPlacement: 0,
  bloodOnCatheter: 0,
  embryoRemaining: 0,
  operTech: '',
  comments: '',
  protocolUsed: 1,
  mediaUsed: 1,
  procedureDoneBy: '',
});

const defaultSummary = () => ({
  etDate: today(),
  transfer: 0,
  freeze: 0,
  blastocyst: 0,
  stuck: 0,
  discard: 0,
  donate: 0,
  donateResearch: 0,
  remark: '',
});

function applyTransferRecord(
  module: ModuleKind,
  transfer: ReturnType<typeof defaultTransfer>,
  summary: ReturnType<typeof defaultSummary>,
  rows: EmbryoRow[],
  data: Record<string, unknown>
) {
  const tn = (data.transferNote as Record<string, unknown>) || data;
  const idKey = module === 'et' ? 'ETID' : 'BTID';
  const dateKey = module === 'et' ? 'ETDate' : 'BTDate';
  const summaryData = (data.summary as Record<string, unknown>) || {};

  const nextTransfer = {
    ...transfer,
    transferDate: toDateInput(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}Date`] ?? tn['ETTNDate']),
    diagnosis: String(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}Diagnosis`] ?? tn['ETTNDiagnosis'] ?? ''),
    procedure: String(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}Proc`] ?? tn['ETTNProc'] ?? ''),
    embryologist: String(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}Embryologist`] ?? tn['ETTNEmbryologist'] ?? ''),
    surgeon: String(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}Surgeon`] ?? tn['ETTNSurgeon'] ?? ''),
    anesthesia: Number(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}Anesthesia`] ?? tn['ETTNAnesthesia'] ?? 0),
    anesthesiaOther: String(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}AnesOther`] ?? tn['ETTNAnesOther'] ?? ''),
    complication: Number(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}Complication`] ?? tn['ETTNComplication'] ?? 0),
    complicationNote: String(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}CompNote`] ?? tn['ETTNCompNote'] ?? ''),
    depthOfPlacement: Number(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}DepthOfPlacement`] ?? tn['ETTNDepthOfPlacement'] ?? 0),
    bloodOnCatheter: Number(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}BloodOnCatheter`] ?? tn['ETTNBloodOnCatheter'] ?? 0),
    embryoRemaining: Number(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}EmbryoRemaining`] ?? tn['ETTNEmbryoRemaining'] ?? 0),
    operTech: String(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}OperTech`] ?? tn['ETTNOperTech'] ?? ''),
    comments: String(tn[`${module === 'et' ? 'ETTN' : 'BTTN'}Comments`] ?? tn['ETTNComments'] ?? ''),
    protocolUsed: Number(tn[`${module === 'et' ? 'ETED' : 'BTBD'}ProtocolUsed`] ?? tn['ETEDProtocolUsed'] ?? 1),
    mediaUsed: Number(tn[`${module === 'et' ? 'ETED' : 'BTBD'}MediaUsed`] ?? tn['ETEDMediaUsed'] ?? 1),
    procedureDoneBy: String(tn[`${module === 'et' ? 'ETED' : 'BTBD'}ProcedureDoneBy`] ?? tn['ETEDProcedureDoneBy'] ?? ''),
    catheterCcd: asBool(tn['ETTNCCCD'] ?? tn['BTTNCCCD']),
    catheterLaboTech: asBool(tn['ETTNCLaboTech'] ?? tn['BTTNCLaboTech']),
    catheterSoftPass: asBool(tn['ETTNCSoftPass'] ?? tn['BTTNCSoftPass']),
    catheterCook: asBool(tn['ETTNCCook'] ?? tn['BTTNCCook']),
  };

  const gridKey = module === 'et' ? 'embryoRows' : 'blastocystRows';
  const rawRows = (data[gridKey] as Record<string, unknown>[]) || [];
  const prefix = module === 'et' ? 'ETED' : 'BTBD';
  const nextRows: EmbryoRow[] = rawRows.map((row) => ({
    etEdId: Number(row[`${prefix}ID`] || row.etEdId || 0),
    btBdId: Number(row[`${prefix}ID`] || row.btBdId || 0),
    source: String(row[`${prefix}Source`] || row.source || 'IVF'),
    celler: Number(row[`${prefix}Celler`] || row.celler || 0),
    grade: Number(row[`${prefix}Grade`] || row.grade || 0),
    teGrade: Number(row[`${prefix}TEGrade`] || row.BTTEGrade || row.teGrade || 0),
    action: Number(row[`${prefix}Action`] || row.action || 0),
    remark: String(row[`${prefix}Remark`] || row.remark || ''),
    location: String(row[`${prefix}Location`] || row.location || ''),
    isNew: false,
  }));

  const sumPrefix = module === 'et' ? 'ETEDS' : 'BTBDS';
  const nextSummary = {
    ...summary,
    etDate: toDateInput(summaryData[dateKey] ?? summaryData['ETDate']),
    transfer: Number(summaryData[`${sumPrefix}Transfer`] ?? summaryData['ETEDSTransfer'] ?? 0),
    freeze: Number(summaryData[`${sumPrefix}Freeze`] ?? summaryData['ETEDSFreeze'] ?? 0),
    blastocyst: Number(summaryData[`${sumPrefix}Blastocyst`] ?? summaryData['ETEDSBlastocyst'] ?? 0),
    stuck: Number(summaryData[`${sumPrefix}Stuck`] ?? summaryData['ETEDSStuck'] ?? 0),
    discard: Number(summaryData[`${sumPrefix}Discard`] ?? summaryData['ETEDSDiscard'] ?? 0),
    donate: Number(summaryData[`${sumPrefix}Donate`] ?? summaryData['ETEDSDonate'] ?? 0),
    donateResearch: Number(summaryData[`${sumPrefix}DonateResearch`] ?? summaryData['ETEDSDonateResearch'] ?? 0),
    remark: String(summaryData[`${sumPrefix}Remark`] ?? summaryData['ETEDSRemark'] ?? ''),
  };

  return {
    recordId: String(tn[idKey] || data[idKey] || ''),
    transfer: nextTransfer,
    summary: nextSummary,
    rows: nextRows,
  };
}

export function TransferEntryForm({ module }: TransferEntryFormProps) {
  const api = module === 'et' ? etApi : btApi;
  const title = module === 'et' ? 'Embryo Transfer (ET)' : 'Blastocyst Transfer (BT)';
  const idLabel = module === 'et' ? 'ET Id' : 'BT Id';
  const idField = module === 'et' ? 'etId' : 'btId';
  const gridTabLabel = module === 'et' ? 'Embryo Details' : 'Blastocyst Details';
  const dateField = module === 'et' ? 'etDate' : 'btDate';

  const { token } = useAuth();
  const { patId, satId, ready } = usePatientIds();

  const [cycId, setCycId] = useState('');
  const [cycleDate, setCycleDate] = useState('');
  const [recordId, setRecordId] = useState('');
  const [cycleDates, setCycleDates] = useState<CycleDateOption[]>([]);
  const [doctors, setDoctors] = useState<LookupItem[]>([]);
  const [transfer, setTransfer] = useState(defaultTransfer);
  const [summary, setSummary] = useState(defaultSummary);
  const [gridRows, setGridRows] = useState<EmbryoRow[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('transfer');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const init = useCallback(async () => {
    if (!token || !ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [dates, lookups] = await Promise.all([
        api.getCycleDates(token, patId, satId),
        api.getLookups<{ doctors: LookupItem[] }>(token).catch(() => ({ doctors: [] })),
      ]);
      setCycleDates(dates);
      setDoctors(lookups.doctors || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to load ${module.toUpperCase()} module.`);
    } finally {
      setLoading(false);
    }
  }, [token, ready, patId, satId, api, module]);

  useEffect(() => {
    void init();
  }, [init]);

  async function onCycleChange(nextCycId: string) {
    if (!token || !nextCycId) {
      setShowForm(false);
      setCycId('');
      return;
    }
    const selected = cycleDates.find((c) => String(c.cycId) === nextCycId);
    if (!selected) return;

    setLoading(true);
    setError('');
    setCycId(nextCycId);
    setCycleDate(selected.cycleDate);
    const formatted = formatCycleDate(selected.cycleDate);

    try {
      const res = await api.loadRecord(token, patId, satId, nextCycId, formatted);
      if (res.exists && res.data) {
        const applied = applyTransferRecord(module, defaultTransfer(), defaultSummary(), [], res.data);
        setRecordId(applied.recordId);
        setTransfer(applied.transfer);
        setSummary(applied.summary);
        setGridRows(applied.rows);
        setIsUpdate(true);
      } else {
        setRecordId('');
        setTransfer(defaultTransfer());
        setSummary(defaultSummary());
        setGridRows([]);
        setIsUpdate(false);
      }
      setShowForm(true);
      setActiveTab('transfer');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load record.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !cycId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload: Record<string, unknown> = {
        mode: isUpdate ? 'update' : 'insert',
        patId,
        satId,
        cycId,
        cycleDate,
        [idField]: recordId,
        [dateField]: summary.etDate,
        transferNote: transfer,
        protocolUsed: transfer.protocolUsed,
        mediaUsed: transfer.mediaUsed,
        procedureDoneBy: transfer.procedureDoneBy,
        summary,
      };
      payload[module === 'et' ? 'embryoRows' : 'blastocystRows'] = gridRows;

      const res = await api.save(token, payload);
      setSuccess(res.message);
      setIsUpdate(true);
      const savedId = (res.data as Record<string, string>)[idField];
      if (savedId) setRecordId(savedId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save record.');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setShowForm(false);
    setCycId('');
    setCycleDate('');
    setRecordId('');
    setIsUpdate(false);
    setSuccess('');
    setError('');
  }

  return (
    <PatientRequired>
      <ModuleCard title={title}>
        <ModuleAlerts error={error} success={success} />
        {loading && !showForm && <p className="text-sm text-slate-500">Loading…</p>}

        <div className="mb-4 flex flex-wrap items-end gap-4">
          <label className={labelCls}>
            Select Cycle Date
            <select value={cycId} onChange={(e) => void onCycleChange(e.target.value)} className={`${inputCls} min-w-[220px]`}>
              <option value="">Select Cycle Date</option>
              {cycleDates.map((item) => (
                <option key={item.cycId} value={item.cycId}>
                  {new Date(item.cycleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </option>
              ))}
            </select>
          </label>
          {recordId && (
            <span className="text-sm text-slate-600">
              {idLabel}: <strong>{recordId}</strong>
            </span>
          )}
        </div>

        {showForm && (
          <>
            <nav className="mb-4 flex gap-2 border-b border-slate-200">
              {(
                [
                  ['transfer', 'Transfer Note'],
                  ['grid', gridTabLabel],
                  ['summary', 'Summary'],
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`border-b-2 px-4 py-2 text-sm font-medium ${
                    activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>

            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === 'transfer' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <label className={labelCls}>
                    Transfer Date
                    <input type="date" value={transfer.transferDate} onChange={(e) => setTransfer((t) => ({ ...t, transferDate: e.target.value }))} className={inputCls} />
                  </label>
                  <label className={labelCls}>
                    Surgeon
                    {module === 'et' ? (
                      <select value={String(transfer.surgeon)} onChange={(e) => setTransfer((t) => ({ ...t, surgeon: e.target.value }))} className={inputCls}>
                        <option value="">Select</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select value={Number(transfer.surgeon) || 0} onChange={(e) => setTransfer((t) => ({ ...t, surgeon: Number(e.target.value) }))} className={inputCls}>
                        <option value={0}>Select</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </label>
                  <label className={labelCls}>
                    Embryologist
                    <input value={transfer.embryologist} onChange={(e) => setTransfer((t) => ({ ...t, embryologist: e.target.value }))} className={inputCls} />
                  </label>
                  <label className={labelCls}>
                    Diagnosis
                    <input value={transfer.diagnosis} onChange={(e) => setTransfer((t) => ({ ...t, diagnosis: e.target.value }))} className={inputCls} />
                  </label>
                  <label className={labelCls}>
                    Procedure
                    <input value={transfer.procedure} onChange={(e) => setTransfer((t) => ({ ...t, procedure: e.target.value }))} className={inputCls} />
                  </label>
                  <label className={labelCls}>
                    Anesthesia
                    <select value={transfer.anesthesia} onChange={(e) => setTransfer((t) => ({ ...t, anesthesia: Number(e.target.value) }))} className={inputCls}>
                      <option value={0}>None</option>
                      <option value={1}>Local</option>
                      <option value={2}>General</option>
                      <option value={3}>Other</option>
                    </select>
                  </label>
                  <label className={labelCls}>
                    Protocol
                    <select value={transfer.protocolUsed} onChange={(e) => setTransfer((t) => ({ ...t, protocolUsed: Number(e.target.value) }))} className={inputCls}>
                      {PROTOCOL_OPTIONS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelCls}>
                    Media
                    <select value={transfer.mediaUsed} onChange={(e) => setTransfer((t) => ({ ...t, mediaUsed: Number(e.target.value) }))} className={inputCls}>
                      {MEDIA_OPTIONS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelCls}>
                    Procedure Done By
                    <input value={transfer.procedureDoneBy} onChange={(e) => setTransfer((t) => ({ ...t, procedureDoneBy: e.target.value }))} className={inputCls} />
                  </label>
                  <label className={`${labelCls} md:col-span-2 xl:col-span-3`}>
                    Comments
                    <textarea value={transfer.comments} onChange={(e) => setTransfer((t) => ({ ...t, comments: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  {(['catheterCcd', 'catheterLaboTech', 'catheterSoftPass', 'catheterCook'] as const).map((key) => (
                    <label key={key} className={checkCls}>
                      <input type="checkbox" checked={transfer[key]} onChange={(e) => setTransfer((t) => ({ ...t, [key]: e.target.checked }))} />
                      {key.replace('catheter', 'Catheter ')}
                    </label>
                  ))}
                </div>
              )}

              {activeTab === 'grid' && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setGridRows((rows) => [...rows, { source: module === 'et' ? 'IVF' : 'BT', celler: 0, grade: 0, action: 0, remark: '', location: '', isNew: true }])
                    }
                    className="mb-3 rounded-lg border border-slate-300 px-4 py-2 text-sm"
                  >
                    Add Row
                  </button>
                  {gridRows.length === 0 ? (
                    <p className="text-sm text-slate-500">No rows yet. Click Add Row to begin.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-2 py-2">Source</th>
                            <th className="px-2 py-2">{module === 'et' ? 'Celler' : 'Expansion grade'}</th>
                            <th className="px-2 py-2">{module === 'et' ? 'Grade' : 'ICM Grade'}</th>
                            {module === 'bt' ? <th className="px-2 py-2">TE Grade</th> : null}
                            <th className="px-2 py-2">Action</th>
                            <th className="px-2 py-2">Location</th>
                            <th className="px-2 py-2">Remark</th>
                            <th className="px-2 py-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {gridRows.map((row, index) => (
                            <tr key={index} className="border-t border-slate-100">
                              <td className="px-2 py-1">
                                <input value={row.source || ''} onChange={(e) => setGridRows((rows) => rows.map((r, i) => (i === index ? { ...r, source: e.target.value } : r)))} className={inputCls} />
                              </td>
                              <td className="px-2 py-1">
                                <select value={row.celler ?? 0} onChange={(e) => setGridRows((rows) => rows.map((r, i) => (i === index ? { ...r, celler: Number(e.target.value) } : r)))} className={inputCls}>
                                  {(module === 'et' ? ET_CELLER_OPTIONS : BT_EXPANSION_OPTIONS).map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-1">
                                <select value={row.grade ?? 0} onChange={(e) => setGridRows((rows) => rows.map((r, i) => (i === index ? { ...r, grade: Number(e.target.value) } : r)))} className={inputCls}>
                                  {(module === 'et' ? ET_GRADE_OPTIONS : BT_ICM_OPTIONS).map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              {module === 'bt' ? (
                                <td className="px-2 py-1">
                                  <select value={row.teGrade ?? 0} onChange={(e) => setGridRows((rows) => rows.map((r, i) => (i === index ? { ...r, teGrade: Number(e.target.value) } : r)))} className={inputCls}>
                                    {BT_TE_OPTIONS.map((g) => (
                                      <option key={g.id} value={g.id}>
                                        {g.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              ) : null}
                              <td className="px-2 py-1">
                                <select value={row.action ?? 0} onChange={(e) => setGridRows((rows) => rows.map((r, i) => (i === index ? { ...r, action: Number(e.target.value) } : r)))} className={inputCls}>
                                  {ET_ACTION_OPTIONS.map((a) => (
                                    <option key={a.id} value={a.id}>
                                      {a.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-2 py-1">
                                <input value={row.location || ''} onChange={(e) => setGridRows((rows) => rows.map((r, i) => (i === index ? { ...r, location: e.target.value } : r)))} className={inputCls} />
                              </td>
                              <td className="px-2 py-1">
                                <input value={row.remark || ''} onChange={(e) => setGridRows((rows) => rows.map((r, i) => (i === index ? { ...r, remark: e.target.value } : r)))} className={inputCls} />
                              </td>
                              <td className="px-2 py-1">
                                <button type="button" onClick={() => setGridRows((rows) => rows.filter((_, i) => i !== index))} className="text-red-600">
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'summary' && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <label className={labelCls}>
                    {module === 'et' ? 'ET Date' : 'BT Date'}
                    <input type="date" value={summary.etDate} onChange={(e) => setSummary((s) => ({ ...s, etDate: e.target.value }))} className={inputCls} />
                  </label>
                  {(['transfer', 'freeze', 'blastocyst', 'stuck', 'discard', 'donate', 'donateResearch'] as const).map((key) => (
                    <label key={key} className={labelCls}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      <input type="number" value={summary[key]} onChange={(e) => setSummary((s) => ({ ...s, [key]: Number(e.target.value) }))} className={inputCls} />
                    </label>
                  ))}
                  <label className={`${labelCls} md:col-span-2 xl:col-span-3`}>
                    Remark
                    <textarea value={summary.remark} onChange={(e) => setSummary((s) => ({ ...s, remark: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="rounded-lg bg-brand-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? 'Saving…' : isUpdate ? 'Update' : 'Submit'}
                </button>
                <button type="button" onClick={cancel} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600">
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </ModuleCard>
    </PatientRequired>
  );
}
