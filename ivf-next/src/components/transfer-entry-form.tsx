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

const CRYO_PALETTE = [
  { code: 'BL', name: 'BL-BLUE', bg: '#0000FF', fg: '#FFA500' },
  { code: 'PK', name: 'PK-PINK', bg: '#FFC0CB', fg: '#008000' },
  { code: 'BK', name: 'BK-BLACK', bg: '#000000', fg: '#FFFFFF' },
  { code: 'BR', name: 'BR-BROWN', bg: '#8B4513', fg: '#0000FF' },
  { code: 'GN', name: 'GN-GREEN', bg: '#008000', fg: '#FF0000' },
  { code: 'RD', name: 'RD-RED', bg: '#FF0000', fg: '#008000' },
  { code: 'WT', name: 'WT-WHITE', bg: '#FFFFFF', fg: '#000000', border: true },
  { code: 'YL', name: 'YL-YELLOW', bg: '#FFFF00', fg: '#8A2BE2' },
  { code: 'GY', name: 'GY-GRAY', bg: '#808080', fg: '#0000FF' },
  { code: 'OR', name: 'OR-ORANGE', bg: '#FFA500', fg: '#00BFFF' },
  { code: 'VT', name: 'VT-VIOLET', bg: '#8A2BE2', fg: '#008000' },
  { code: 'CR', name: 'CR-CRIMSON', bg: '#DC143C', fg: '#FFFF00' },
  { code: 'MR', name: 'MR-MAROON', bg: '#800000', fg: '#008000' },
  { code: 'OL', name: 'OL-OLIVE', bg: '#808000', fg: '#FFFFFF' },
  { code: 'LM', name: 'LM-LIME', bg: '#32CD32', fg: '#8A2BE2' },
  { code: 'AQ', name: 'AQ-AQUA', bg: '#00FFFF', fg: '#8A2BE2' },
  { code: 'GD', name: 'GD-GOLD', bg: '#FFD700', fg: '#C0C0C0' },
  { code: 'SL', name: 'SL-SILVER', bg: '#C0C0C0', fg: '#FFD700' },
  { code: 'FU', name: 'FU-FUCHSIA', bg: '#FF00FF', fg: '#0000FF' },
  { code: 'TL', name: 'TL-TEAL', bg: '#008080', fg: '#FF0000' },
];

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
    recipient: String(row[`${prefix}RecipientBT`] || row.BTBDRecipientBT || row.recipient || ''),
    recipientCycle: String(row[`${prefix}RecipientCycleBT`] || row.BTBDRecipientCycleBT || row.recipientCycle || ''),
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

  // Location Modal State
  const [showLocModal, setShowLocModal] = useState(false);
  const [locRowIndex, setLocRowIndex] = useState<number | null>(null);
  const [locType, setLocType] = useState<'Straw' | 'Cryovial'>('Straw');
  const [strawECC, setStrawECC] = useState('');
  const [strawEC, setStrawEC] = useState('');
  const [strawGO, setStrawGO] = useState('');
  const [strawVE, setStrawVE] = useState('');
  const [strawVI, setStrawVI] = useState('');
  const [strawST, setStrawST] = useState('');
  const [cryoCC, setCryoCC] = useState('');
  const [cryoC, setCryoC] = useState('');
  const [cryoCH, setCryoCH] = useState('');
  const [cryoCV, setCryoCV] = useState('');
  const [cryoColor, setCryoColor] = useState('');
  const [activeColorField, setActiveColorField] = useState<'GO' | 'VE' | 'VI' | 'ST' | 'CV_COLOR'>('GO');
  const [locModalError, setLocModalError] = useState('');

  // Row Generator State
  const [genIvfCount, setGenIvfCount] = useState(0);
  const [genIcsiCount, setGenIcsiCount] = useState(0);

  function addRow(source: 'IVF' | 'ICSI' = 'IVF') {
    setGridRows((rows) => [
      ...rows,
      {
        source,
        celler: 0,
        grade: 0,
        teGrade: 0,
        action: 0,
        recipient: '',
        recipientCycle: '',
        remark: '',
        location: '',
        isNew: true,
      },
    ]);
  }

  function handleGenerateRows() {
    const newRows: EmbryoRow[] = [];
    for (let i = 0; i < genIvfCount; i++) {
      newRows.push({
        source: 'IVF',
        celler: 0,
        grade: 0,
        teGrade: 0,
        action: 0,
        recipient: '',
        recipientCycle: '',
        remark: '',
        location: '',
        isNew: true,
      });
    }
    for (let i = 0; i < genIcsiCount; i++) {
      newRows.push({
        source: 'ICSI',
        celler: 0,
        grade: 0,
        teGrade: 0,
        action: 0,
        recipient: '',
        recipientCycle: '',
        remark: '',
        location: '',
        isNew: true,
      });
    }
    if (newRows.length > 0) {
      setGridRows((prev) => [...prev, ...newRows]);
    }
  }

  function openLocationModal(index: number) {
    setLocRowIndex(index);
    setLocModalError('');
    const loc = gridRows[index]?.location || '';
    if (loc.includes('/CH-')) {
      setLocType('Cryovial');
      const m = loc.match(/CC-([^/]*)\/C-([^/]*)\/CH-([^/]*)\/CV-([^-]*)-?(.*)/i);
      if (m) {
        setCryoCC(m[1] || '');
        setCryoC(m[2] || '');
        setCryoCH(m[3] || '');
        setCryoCV(m[4] || '');
        setCryoColor(m[5] || '');
      } else {
        setCryoCC('');
        setCryoC('');
        setCryoCH('');
        setCryoCV('');
        setCryoColor('');
      }
      setActiveColorField('CV_COLOR');
    } else {
      setLocType('Straw');
      const m = loc.match(/CC-([^/]*)\/C-([^/]*)\/GO-([^/]*)\/VE-([^/]*)\/VI-([^/]*)\/ST-([^/]*)/i);
      if (m) {
        setStrawECC(m[1] || '');
        setStrawEC(m[2] || '');
        setStrawGO(m[3] || '');
        setStrawVE(m[4] || '');
        setStrawVI(m[5] || '');
        setStrawST(m[6] || '');
      } else {
        setStrawECC('');
        setStrawEC('');
        setStrawGO('');
        setStrawVE('');
        setStrawVI('');
        setStrawST('');
      }
      setActiveColorField('GO');
    }
    setShowLocModal(true);
  }

  function handleSelectColor(code: string) {
    if (locType === 'Straw') {
      if (activeColorField === 'GO') setStrawGO(code);
      else if (activeColorField === 'VE') setStrawVE(code);
      else if (activeColorField === 'VI') setStrawVI(code);
      else if (activeColorField === 'ST') setStrawST(code);
    } else {
      setCryoColor(code);
    }
  }

  function handleApplyLocation() {
    setLocModalError('');
    let finalLoc = '';
    if (locType === 'Straw') {
      finalLoc = `CC-${strawECC.trim().toUpperCase()}/C-${strawEC.trim().toUpperCase()}/GO-${strawGO.trim().toUpperCase()}/VE-${strawVE.trim().toUpperCase()}/VI-${strawVI.trim().toUpperCase()}/ST-${strawST.trim().toUpperCase()}`;
    } else {
      finalLoc = `CC-${cryoCC.trim().toUpperCase()}/C-${cryoC.trim().toUpperCase()}/CH-${cryoCH.trim().toUpperCase()}/CV-${cryoCV.trim().toUpperCase()}-${cryoColor.trim().toUpperCase()}`;
    }

    // 5-embryo maximum validation
    const otherRows = gridRows.filter((_, i) => i !== locRowIndex);
    const count = otherRows.filter((r) => (r.location || '').trim().toUpperCase() === finalLoc).length;
    if (count >= 5) {
      setLocModalError(`Location ${finalLoc} can not be used more than 5`);
      return;
    }

    if (locRowIndex !== null) {
      setGridRows((rows) =>
        rows.map((r, i) => (i === locRowIndex ? { ...r, location: finalLoc } : r))
      );
    }
    setShowLocModal(false);
  }

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
                <div className="space-y-4">
                  {/* Quick Add and Row Generator Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Add Rows:</span>
                      <button
                        type="button"
                        onClick={() => addRow('IVF')}
                        className="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-50"
                      >
                        + Add IVF
                      </button>
                      <button
                        type="button"
                        onClick={() => addRow('ICSI')}
                        className="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 shadow-2xs hover:bg-purple-50"
                      >
                        + Add ICSI
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-600">IVF count:</span>
                      <input
                        type="number"
                        min="0"
                        value={genIvfCount}
                        onChange={(e) => setGenIvfCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 w-14 rounded-lg border border-slate-300 bg-white px-2 text-center font-bold"
                      />
                      <span className="text-slate-600">ICSI count:</span>
                      <input
                        type="number"
                        min="0"
                        value={genIcsiCount}
                        onChange={(e) => setGenIcsiCount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-8 w-14 rounded-lg border border-slate-300 bg-white px-2 text-center font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateRows}
                        className="h-8 rounded-lg bg-purple-700 px-3 font-bold text-white shadow-xs hover:bg-purple-800"
                      >
                        Generate Rows
                      </button>
                    </div>
                  </div>

                  {gridRows.length === 0 ? (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No rows yet. Use &ldquo;+ Add IVF&rdquo; or &ldquo;Generate Rows&rdquo; to begin.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 text-left font-bold uppercase text-slate-600">
                          <tr>
                            <th className="px-2.5 py-2">Source</th>
                            <th className="px-2.5 py-2">{module === 'et' ? 'Celler' : 'Expansion grade'}</th>
                            <th className="px-2.5 py-2">{module === 'et' ? 'Grade' : 'ICM Grade'}</th>
                            {module === 'bt' ? <th className="px-2.5 py-2">TE Grade</th> : null}
                            <th className="px-2.5 py-2">Action</th>
                            <th className="px-2.5 py-2">Recipient</th>
                            <th className="px-2.5 py-2">Recipient Cycle</th>
                            <th className="px-2.5 py-2">Location</th>
                            <th className="px-2.5 py-2">Remark</th>
                            <th className="px-2.5 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {gridRows.map((row, index) => {
                            const isDonated = row.action === 6;
                            return (
                              <tr key={index} className="hover:bg-slate-50/70">
                                <td className="px-2 py-1.5">
                                  <select
                                    value={row.source || 'IVF'}
                                    onChange={(e) =>
                                      setGridRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, source: e.target.value } : r))
                                      )
                                    }
                                    className={`${inputCls} min-w-[75px] font-bold`}
                                  >
                                    <option value="IVF">IVF</option>
                                    <option value="ICSI">ICSI</option>
                                  </select>
                                </td>
                                <td className="px-2 py-1.5">
                                  <select
                                    value={row.celler ?? 0}
                                    onChange={(e) =>
                                      setGridRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, celler: Number(e.target.value) } : r))
                                      )
                                    }
                                    className={`${inputCls} min-w-[130px]`}
                                  >
                                    {(module === 'et' ? ET_CELLER_OPTIONS : BT_EXPANSION_OPTIONS).map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1.5">
                                  <select
                                    value={row.grade ?? 0}
                                    onChange={(e) =>
                                      setGridRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, grade: Number(e.target.value) } : r))
                                      )
                                    }
                                    className={`${inputCls} min-w-[120px]`}
                                  >
                                    {(module === 'et' ? ET_GRADE_OPTIONS : BT_ICM_OPTIONS).map((g) => (
                                      <option key={g.id} value={g.id}>
                                        {g.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                {module === 'bt' ? (
                                  <td className="px-2 py-1.5">
                                    <select
                                      value={row.teGrade ?? 0}
                                      onChange={(e) =>
                                        setGridRows((rows) =>
                                          rows.map((r, i) => (i === index ? { ...r, teGrade: Number(e.target.value) } : r))
                                        )
                                      }
                                      className={`${inputCls} min-w-[120px]`}
                                    >
                                      {BT_TE_OPTIONS.map((g) => (
                                        <option key={g.id} value={g.id}>
                                          {g.name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                ) : null}
                                <td className="px-2 py-1.5">
                                  <select
                                    value={row.action ?? 0}
                                    onChange={(e) =>
                                      setGridRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, action: Number(e.target.value) } : r))
                                      )
                                    }
                                    className={`${inputCls} min-w-[110px] font-semibold text-slate-800`}
                                  >
                                    {ET_ACTION_OPTIONS.map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {a.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    value={row.recipient || ''}
                                    disabled={!isDonated}
                                    placeholder={isDonated ? 'Recipient PatID/Name' : '—'}
                                    onChange={(e) =>
                                      setGridRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, recipient: e.target.value } : r))
                                      )
                                    }
                                    className={`${inputCls} min-w-[110px] ${!isDonated ? 'bg-slate-100 text-slate-400' : ''}`}
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    value={row.recipientCycle || ''}
                                    disabled={!isDonated}
                                    placeholder={isDonated ? 'Recipient CycID' : '—'}
                                    onChange={(e) =>
                                      setGridRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, recipientCycle: e.target.value } : r))
                                      )
                                    }
                                    className={`${inputCls} min-w-[110px] ${!isDonated ? 'bg-slate-100 text-slate-400' : ''}`}
                                  />
                                </td>
                                <td className="px-2 py-1.5">
                                  <div className="flex items-center gap-1 min-w-[180px]">
                                    <input
                                      readOnly
                                      value={row.location || ''}
                                      placeholder="CC-.../C-..."
                                      className={`${inputCls} font-mono text-[11px] bg-slate-50`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => openLocationModal(index)}
                                      className="mt-1 flex h-9 items-center justify-center rounded-lg border border-purple-300 bg-purple-50 px-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100"
                                      title="Open Cryo Location Coordinates Modal"
                                    >
                                      ...
                                    </button>
                                  </div>
                                </td>
                                <td className="px-2 py-1.5">
                                  <input
                                    value={row.remark || ''}
                                    placeholder="Remarks"
                                    onChange={(e) =>
                                      setGridRows((rows) =>
                                        rows.map((r, i) => (i === index ? { ...r, remark: e.target.value } : r))
                                      )
                                    }
                                    className={`${inputCls} min-w-[110px]`}
                                  />
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setGridRows((rows) => rows.filter((_, i) => i !== index))}
                                    className="h-8 w-8 rounded-lg text-base font-bold text-red-500 hover:bg-red-50"
                                    title="Delete row"
                                  >
                                    ×
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
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

        {/* SMART CRYO LOCATION COORDINATES MODAL */}
        {showLocModal && locRowIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Cryo Location Coordinates · Row #{locRowIndex + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowLocModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {locModalError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-700">
                  {locModalError}
                </div>
              )}

              <div className="mt-4 space-y-4">
                {/* Straw vs Cryovial toggle */}
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-slate-600">Cryopreservation:</span>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="locType"
                      value="Straw"
                      checked={locType === 'Straw'}
                      onChange={() => setLocType('Straw')}
                      className="text-purple-600"
                    />
                    Straw
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="locType"
                      value="Cryovial"
                      checked={locType === 'Cryovial'}
                      onChange={() => setLocType('Cryovial')}
                      className="text-purple-600"
                    />
                    Cryovial
                  </label>
                </div>

                {/* Coordinate Inputs */}
                {locType === 'Straw' ? (
                  <div className="grid grid-cols-3 gap-2.5 text-xs sm:grid-cols-6">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Cryocan</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">CC-</span>
                        <input
                          value={strawECC}
                          onChange={(e) => setStrawECC(e.target.value.toUpperCase())}
                          placeholder="A1"
                          className="h-8 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Canister</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">C-</span>
                        <input
                          value={strawEC}
                          onChange={(e) => setStrawEC(e.target.value.toUpperCase())}
                          placeholder="1"
                          className="h-8 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Goblet</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">GO-</span>
                        <input
                          value={strawGO}
                          onFocus={() => setActiveColorField('GO')}
                          onChange={(e) => setStrawGO(e.target.value.toUpperCase())}
                          placeholder="BL"
                          className={`h-8 w-full rounded-r-lg border px-1 text-center font-bold text-xs uppercase ${activeColorField === 'GO' ? 'border-purple-600 ring-2 ring-purple-100' : 'border-slate-300'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Vesitube</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">VE-</span>
                        <input
                          value={strawVE}
                          onFocus={() => setActiveColorField('VE')}
                          onChange={(e) => setStrawVE(e.target.value.toUpperCase())}
                          placeholder="PK"
                          className={`h-8 w-full rounded-r-lg border px-1 text-center font-bold text-xs uppercase ${activeColorField === 'VE' ? 'border-purple-600 ring-2 ring-purple-100' : 'border-slate-300'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Visotube</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">VI-</span>
                        <input
                          value={strawVI}
                          onFocus={() => setActiveColorField('VI')}
                          onChange={(e) => setStrawVI(e.target.value.toUpperCase())}
                          placeholder="WT"
                          className={`h-8 w-full rounded-r-lg border px-1 text-center font-bold text-xs uppercase ${activeColorField === 'VI' ? 'border-purple-600 ring-2 ring-purple-100' : 'border-slate-300'}`}
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Straw</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">ST-</span>
                        <input
                          value={strawST}
                          onFocus={() => setActiveColorField('ST')}
                          onChange={(e) => setStrawST(e.target.value.toUpperCase())}
                          placeholder="RD"
                          className={`h-8 w-full rounded-r-lg border px-1 text-center font-bold text-xs uppercase ${activeColorField === 'ST' ? 'border-purple-600 ring-2 ring-purple-100' : 'border-slate-300'}`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 text-xs sm:grid-cols-5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Cryocan</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">CC-</span>
                        <input
                          value={cryoCC}
                          onChange={(e) => setCryoCC(e.target.value.toUpperCase())}
                          placeholder="A1"
                          className="h-8 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Canister</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">C-</span>
                        <input
                          value={cryoC}
                          onChange={(e) => setCryoC(e.target.value.toUpperCase())}
                          placeholder="1"
                          className="h-8 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Holder</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">CH-</span>
                        <input
                          value={cryoCH}
                          onChange={(e) => setCryoCH(e.target.value.toUpperCase())}
                          placeholder="H1"
                          className="h-8 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Cryovial</span>
                      <div className="mt-0.5 flex items-center">
                        <span className="rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 px-1.5 py-1.5 text-[11px] font-bold text-slate-600">CV-</span>
                        <input
                          value={cryoCV}
                          onChange={(e) => setCryoCV(e.target.value.toUpperCase())}
                          placeholder="V1"
                          className="h-8 w-full rounded-r-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-500">Vial Color</span>
                      <input
                        value={cryoColor}
                        onFocus={() => setActiveColorField('CV_COLOR')}
                        onChange={(e) => setCryoColor(e.target.value.toUpperCase())}
                        placeholder="Color"
                        className="mt-0.5 h-8 w-full rounded-lg border border-slate-300 px-1 text-center font-bold text-xs uppercase"
                      />
                    </div>
                  </div>
                )}

                {/* Color Palette */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wide">
                      Select Color for {activeColorField}:
                    </span>
                    <span className="text-[11px] text-slate-500">Click field above, then click color</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                    {CRYO_PALETTE.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleSelectColor(c.code)}
                        style={{ backgroundColor: c.bg, color: c.fg }}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-black uppercase shadow-2xs transition hover:scale-105 active:scale-95"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Coordinate Preview */}
                <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs">
                  <span className="font-bold text-slate-600">Generated Coordinate: </span>
                  <span className="font-mono font-bold text-purple-900">
                    {locType === 'Straw'
                      ? `CC-${strawECC || '…'}/C-${strawEC || '…'}/GO-${strawGO || '…'}/VE-${strawVE || '…'}/VI-${strawVI || '…'}/ST-${strawST || '…'}`
                      : `CC-${cryoCC || '…'}/C-${cryoC || '…'}/CH-${cryoCH || '…'}/CV-${cryoCV || '…'}-${cryoColor || '…'}`}
                  </span>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Rule: maximum 5 embryos per unique location.
                  </div>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowLocModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyLocation}
                  className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple-800"
                >
                  Apply Location
                </button>
              </div>
            </div>
          </div>
        )}
      </ModuleCard>
    </PatientRequired>
  );
}
