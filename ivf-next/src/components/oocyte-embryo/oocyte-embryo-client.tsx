'use client';

import React, { useState, useEffect } from 'react';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';
import { usePatientIds } from '@/components/clinical/clinical-shared';
import { ApiError } from '@/lib/api';
import { loadOocyteEmbryoOverview } from '@/lib/services/oocyte-embryo';
import { BT_EXPANSION_OPTIONS, BT_ICM_OPTIONS, ET_ACTION_OPTIONS } from '@/lib/services/iui';
import { readRetrievalSnapshot, type CycleRetrievalSnapshot } from '@/lib/cycle-snapshot';
import type { EtEmbryoRow, LabSource, OocyteItem, SourceSummary } from '@/lib/types/oocyte-embryo';

export type OocyteEmbryoTab =
  | 'oocytes'
  | 'fertilization'
  | 'embryo-culture'
  | 'embryo-transfer'
  | 'blastocyst-transfer'
  | 'cryopreservation'
  | 'thaw'
  | 'embryo-disposition';

const INITIAL_OOCYTES: OocyteItem[] = [
  {
    id: '1',
    oocyteId: 'OO-26-001201',
    collectionDateTime: '18-Aug-2026 09:20',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-01',
    day3Grade: '8-Cell Grade A',
    day5Grade: '4AA',
    transferStatus: 'Transferred',
  },
  {
    id: '2',
    oocyteId: 'OO-26-001202',
    collectionDateTime: '18-Aug-2026 09:21',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-02',
    day3Grade: '8-Cell Grade A',
    day5Grade: '4AA',
    transferStatus: 'Transferred',
  },
  {
    id: '3',
    oocyteId: 'OO-26-001203',
    collectionDateTime: '18-Aug-2026 09:22',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-03',
    day3Grade: '6-Cell Grade B',
    day5Grade: '3AB',
    cryoStrawNo: 'STR-26-001',
    transferStatus: 'Cryopreserved',
  },
  {
    id: '4',
    oocyteId: 'OO-26-001204',
    collectionDateTime: '18-Aug-2026 09:22',
    maturity: 'MI',
    morphologyGrade: '-',
    linkedSpermId: '-',
    status: 'Immature',
    fertilizationResult: '0PN',
    transferStatus: 'Culturing',
  },
  {
    id: '5',
    oocyteId: 'OO-26-001205',
    collectionDateTime: '18-Aug-2026 09:23',
    maturity: 'GV',
    morphologyGrade: '-',
    linkedSpermId: '-',
    status: 'Immature',
    fertilizationResult: '0PN',
    transferStatus: 'Culturing',
  },
  {
    id: '6',
    oocyteId: 'OO-26-001206',
    collectionDateTime: '18-Aug-2026 09:24',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-04',
    day3Grade: '8-Cell Grade A',
    day5Grade: '3BA',
    cryoStrawNo: 'STR-26-002',
    transferStatus: 'Cryopreserved',
  },
  {
    id: '7',
    oocyteId: 'OO-26-001207',
    collectionDateTime: '18-Aug-2026 09:25',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-05',
    day3Grade: '7-Cell Grade B',
    day5Grade: '3BB',
    cryoStrawNo: 'STR-26-003',
    transferStatus: 'Cryopreserved',
  },
  {
    id: '8',
    oocyteId: 'OO-26-001208',
    collectionDateTime: '18-Aug-2026 09:26',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-06',
    day3Grade: '8-Cell Grade A',
    day5Grade: '4BB',
    transferStatus: 'Culturing',
  },
  {
    id: '9',
    oocyteId: 'OO-26-001209',
    collectionDateTime: '18-Aug-2026 09:27',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-07',
    day3Grade: '6-Cell Grade B',
    day5Grade: 'Early Blast',
    transferStatus: 'Culturing',
  },
  {
    id: '10',
    oocyteId: 'OO-26-001210',
    collectionDateTime: '18-Aug-2026 09:28',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-08',
    day3Grade: '8-Cell Grade A',
    day5Grade: 'Morula',
    transferStatus: 'Culturing',
  },
  {
    id: '11',
    oocyteId: 'OO-26-001211',
    collectionDateTime: '18-Aug-2026 09:29',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Retrieved',
    transferStatus: 'Culturing',
  },
  {
    id: '12',
    oocyteId: 'OO-26-001212',
    collectionDateTime: '18-Aug-2026 09:30',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Retrieved',
    transferStatus: 'Culturing',
  },
];

const EMPTY_SUMMARY: SourceSummary = {
  source: 'IVF',
  hasRecord: false,
  recordId: '',
  cycleId: '',
  cycleDate: '',
  retrieved: 0,
  matureMII: 0,
  immature: 0,
  degenerated: 0,
  fertilized2PN: 0,
  abnormalPn: 0,
  unfertilized: 0,
  cleavage: 0,
  blastocyst: 0,
  cryopreserved: 0,
  transferred: 0,
  stuck: 0,
  discard: 0,
  donated: 0,
  donatedForResearch: 0,
};

const SMART_ACTIONS = ET_ACTION_OPTIONS.filter((item) => item.id !== 0);

type LabView = LabSource | 'BOTH';

function overlayAllotment(summary: SourceSummary, allotted: number): SourceSummary {
  if (allotted <= 0) return summary;
  return {
    ...summary,
    allotted,
    retrieved: summary.retrieved > 0 ? summary.retrieved : allotted,
  };
}

export function OocyteEmbryoClient() {
  const { selectedPatient } = usePatient();
  const { user, token } = useAuth();
  const { patId, satId, ready } = usePatientIds();

  const [activeTab, setActiveTab] = useState<OocyteEmbryoTab>('oocytes');
  const [sourceTab, setSourceTab] = useState<LabSource>('IVF');
  const [oocytes, setOocytes] = useState<OocyteItem[]>(INITIAL_OOCYTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOocyte, setSelectedOocyte] = useState<OocyteItem | null>(null);
  const [ivfSummary, setIvfSummary] = useState<SourceSummary>({ ...EMPTY_SUMMARY, source: 'IVF' });
  const [icsiSummary, setIcsiSummary] = useState<SourceSummary>({ ...EMPTY_SUMMARY, source: 'ICSI' });
  const [embryos, setEmbryos] = useState<EtEmbryoRow[]>([]);
  const [summaryError, setSummaryError] = useState('');
  const [retrieval, setRetrieval] = useState<CycleRetrievalSnapshot | null>(null);
  const [labView, setLabView] = useState<LabView>('IVF');

  // Modals for Quick Actions
  const [showAddOocyteModal, setShowAddOocyteModal] = useState(false);
  const [showFertilizationModal, setShowFertilizationModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // New Oocyte Form State
  const [newMaturity, setNewMaturity] = useState<'MII' | 'MI' | 'GV'>('MII');
  const [newMorphology, setNewMorphology] = useState<'A' | 'B' | 'C'>('A');

  // Toast alert
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // Handle URL query parameter for tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['oocytes', 'fertilization', 'embryo-culture', 'embryo-transfer', 'blastocyst-transfer', 'cryopreservation', 'thaw', 'embryo-disposition'].includes(tabParam)) {
        setActiveTab(tabParam as OocyteEmbryoTab);
      }
    }
  }, []);

  useEffect(() => {
    if (!token || !ready) return;
    let cancelled = false;
    setSummaryError('');
    const snapshot = readRetrievalSnapshot(undefined, patId);
    setRetrieval(snapshot);
    loadOocyteEmbryoOverview(token, patId, satId)
      .then((data) => {
        if (cancelled) return;
        const ivf = overlayAllotment(data.ivf, snapshot?.ivfAllotted || 0);
        const icsi = overlayAllotment(data.icsi, snapshot?.icsiAllotted || 0);
        setIvfSummary(ivf);
        setIcsiSummary(icsi);
        setEmbryos(data.embryos || []);
        const bothAllotted = (snapshot?.ivfAllotted || 0) > 0 && (snapshot?.icsiAllotted || 0) > 0;
        if (bothAllotted) {
          setLabView('BOTH');
          setSourceTab('IVF');
        } else if (!data.ivf.hasRecord && (data.icsi.hasRecord || (snapshot?.icsiAllotted || 0) > 0)) {
          setLabView('ICSI');
          setSourceTab('ICSI');
        }
      })
      .catch((err) => {
        if (!cancelled) setSummaryError(err instanceof ApiError ? err.message : 'Could not load IVF/ICSI summary.');
      });
    return () => {
      cancelled = true;
    };
  }, [token, ready, patId, satId]);

  // Demographic details
  const patientId = selectedPatient?.uhid || (selectedPatient?.id ? `P-2026-00${selectedPatient.id}` : 'P-2026-00125');
  const patientName = selectedPatient?.name || 'Mrs. Anjali Sharma';
  const summary = sourceTab === 'ICSI' ? icsiSummary : ivfSummary;
  const bothLabs = labView === 'BOTH';
  const cycleId = summary.cycleId || retrieval?.cycleId || (selectedPatient?.id ? `C-2026-00${selectedPatient.id}` : 'C-2026-00158');
  const cycleType = bothLabs ? 'IVF + ICSI' : sourceTab;
  const cycleDay = 16;
  const operator = user?.userName || 'Dr. Satish Sharma (EMB-01)';
  const sourceEmbryos = embryos.filter((row) => row.source === sourceTab);

  const retrievedCount = summary.retrieved;
  const matureCount = summary.matureMII;
  const immatureCount = summary.immature;
  const degeneratedCount = summary.degenerated;
  const fertilized2PN = summary.fertilized2PN;
  const cleavageCount = summary.cleavage;
  const blastocystCount = summary.blastocyst;
  const cryopreservedCount = summary.cryopreserved;
  const transferredCount = summary.transferred;

  // Add new oocyte handler
  function handleAddOocyte() {
    const nextNum = oocytes.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const newId = `OO-26-0012${padded}`;
    const newItem: OocyteItem = {
      id: String(Date.now()),
      oocyteId: newId,
      collectionDateTime: '18-Aug-2026 09:35',
      maturity: newMaturity,
      morphologyGrade: newMorphology,
      linkedSpermId: 'SEM-26-00018472',
      status: 'Retrieved',
      transferStatus: 'Culturing',
    };
    setOocytes((prev) => [...prev, newItem]);
    setShowAddOocyteModal(false);
    showToast(`Oocyte ${newId} logged successfully.`);
  }

  // Filtered oocytes table list
  const filteredOocytes = oocytes.filter((item) => {
    const matchesSearch =
      item.oocyteId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.linkedSpermId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800">{toast}</span>
        </div>
      )}

      {/* TOP PATIENT / CYCLE HEADER BANNER */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-black text-sm">
              OC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{patientName}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {patientId}
                </span>
                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200/60">
                  {cycleType}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Cycle ID: <strong className="text-slate-700 font-mono">{cycleId || '—'}</strong>
                {summary.cycleDate ? (
                  <>
                    {' '}
                    • Cycle date: <strong className="text-slate-700">{summary.cycleDate}</strong>
                  </>
                ) : null}{' '}
                • Operator: <strong className="text-slate-700">{operator}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Cycle Day</span>
              <span className="font-bold text-slate-800 text-sm">Day {cycleDay}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Oocytes</span>
              <span className="font-bold text-purple-700 text-sm">{pairLabel(bothLabs, ivfSummary.retrieved, icsiSummary.retrieved, retrievedCount)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Fertilized (2PN)</span>
              <span className="font-bold text-emerald-600 text-sm">{pairLabel(bothLabs, ivfSummary.fertilized2PN, icsiSummary.fertilized2PN, fertilized2PN)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Transferred</span>
              <span className="font-bold text-slate-800 text-sm">{pairLabel(bothLabs, ivfSummary.transferred, icsiSummary.transferred, transferredCount)}</span>
            </div>
          </div>
        </div>

        {/* IVF / ICSI / IVF+ICSI SOURCE TABS */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {([
            { id: 'IVF' as LabView, label: 'IVF', count: ivfSummary.retrieved },
            { id: 'ICSI' as LabView, label: 'ICSI', count: icsiSummary.retrieved },
            { id: 'BOTH' as LabView, label: 'IVF + ICSI', count: 0 },
          ]).map((tab) => {
            const active = labView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setLabView(tab.id);
                  if (tab.id !== 'BOTH') setSourceTab(tab.id);
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  active
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                {tab.label}
                <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-white text-purple-700'}`}>
                  {tab.id === 'BOTH' ? `${ivfSummary.retrieved} | ${icsiSummary.retrieved}` : tab.count}
                </span>
              </button>
            );
          })}
          <span className="text-[11px] text-slate-500">
            {labView === 'BOTH'
              ? 'IVF and ICSI stay in separate columns. The badge is IVF | ICSI.'
              : `Counts come from the ${sourceTab} screen`}
            {summary.hasRecord || (retrieval?.ivfAllotted || retrieval?.icsiAllotted) ? '' : ' — no saved record yet'}
          </span>
        </div>
        {retrieval && (retrieval.ivfAllotted > 0 || retrieval.icsiAllotted > 0 || retrieval.sperm?.sampleId) ? (
          <p className="mt-2 text-[11px] text-slate-500">
            From Cycle Retrieval
            {retrieval.totalRetrieved ? ` · Total retrieved ${retrieval.totalRetrieved}` : ''}
            {retrieval.ivfAllotted ? ` · IVF allotted ${retrieval.ivfAllotted}` : ''}
            {retrieval.icsiAllotted ? ` · ICSI allotted ${retrieval.icsiAllotted}` : ''}
            {retrieval.sperm?.sampleLabel || retrieval.sperm?.sampleId
              ? ` · Sperm ${retrieval.sperm.sampleLabel || retrieval.sperm.sampleId}`
              : ''}
          </p>
        ) : null}

        {/* 7 MODULE TABS */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {[
            { id: 'oocytes', label: 'Oocytes' },
            { id: 'fertilization', label: 'Fertilization' },
            { id: 'embryo-culture', label: 'Embryo Culture' },
            { id: 'embryo-transfer', label: 'Embryo Transfer' },
            { id: 'blastocyst-transfer', label: 'Blastocyst Transfer' },
            { id: 'cryopreservation', label: 'Cryopreservation' },
            { id: 'thaw', label: 'Thaw' },
            { id: 'embryo-disposition', label: 'Embryo Disposition' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as OocyteEmbryoTab)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#181d38] text-white shadow-sm scale-[1.01]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUMMARY STAT METRICS CARDS */}
      {summaryError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{summaryError}</p>
      )}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* OOCYTE SUMMARY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Oocyte Summary · {cycleType}
            </h3>
            <span className="text-[11px] font-semibold text-purple-600">
              {summary.cycleDate ? `Cycle ${summary.cycleDate}` : 'From IVF / ICSI screen'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-2.5">
              <span className="block text-[10px] font-bold text-purple-600 uppercase">Retrieved</span>
              <PairCount both={bothLabs} ivf={ivfSummary.retrieved} icsi={icsiSummary.retrieved} single={retrievedCount} />
            </div>
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase">Mature (MII)</span>
              <PairCount both={bothLabs} ivf={ivfSummary.matureMII} icsi={icsiSummary.matureMII} single={matureCount} />
            </div>
            <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-2.5">
              <span className="block text-[10px] font-bold text-amber-600 uppercase">Immature (GV/MI)</span>
              <PairCount both={bothLabs} ivf={ivfSummary.immature} icsi={icsiSummary.immature} single={immatureCount} />
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-2.5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Degenerated</span>
              <PairCount both={bothLabs} ivf={ivfSummary.degenerated} icsi={icsiSummary.degenerated} single={degeneratedCount} />
            </div>
          </div>
        </div>

        {/* EMBRYO SUMMARY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Embryo Summary · {cycleType}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600">
              2PN / cleaved from {sourceTab}; blastocyst &amp; freeze from ET Action
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase">Fertilized (2PN)</span>
              <PairCount both={bothLabs} ivf={ivfSummary.fertilized2PN} icsi={icsiSummary.fertilized2PN} single={fertilized2PN} />
            </div>
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-2.5">
              <span className="block text-[10px] font-bold text-blue-600 uppercase">Cleavage</span>
              <PairCount both={bothLabs} ivf={ivfSummary.cleavage} icsi={icsiSummary.cleavage} single={cleavageCount} />
            </div>
            <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-2.5">
              <span className="block text-[10px] font-bold text-purple-600 uppercase">Blastocyst</span>
              <PairCount both={bothLabs} ivf={ivfSummary.blastocyst} icsi={icsiSummary.blastocyst} single={blastocystCount} />
            </div>
            <div className="rounded-xl bg-teal-50/60 border border-teal-100 p-2.5">
              <span className="block text-[10px] font-bold text-teal-600 uppercase">Cryopreserved</span>
              <PairCount both={bothLabs} ivf={ivfSummary.cryopreserved} icsi={icsiSummary.cryopreserved} single={cryopreservedCount} />
            </div>
          </div>
        </div>
      </div>

      <Main2PagesGrid view={labView} tab={activeTab} ivf={ivfSummary} icsi={icsiSummary} />

      {/* MAIN CONTENT AREA: TAB CONTENTS + QUICK ACTIONS SIDEBAR */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        
        {/* TAB CONTENTS (COL 9) */}
        <div className="lg:col-span-9 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          
          {/* TAB 1: OOCYTES LIST TABLE */}
          {activeTab === 'oocytes' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Oocyte List ({filteredOocytes.length})
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Search Oocyte ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-purple-500 w-44"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 rounded-xl border border-slate-200 px-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Fertilized">Fertilized</option>
                    <option value="Retrieved">Retrieved</option>
                    <option value="Immature">Immature</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Oocyte ID</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Collection Date / Time</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Maturity</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Grade</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Linked Sperm ID</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Status</th>
                      <th className="px-3.5 py-2.5 text-right font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredOocytes.map((item) => (
                      <tr key={item.id} className="hover:bg-purple-50/30 transition">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-purple-700">
                          {item.oocyteId}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600">{item.collectionDateTime}</td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              item.maturity === 'MII'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.maturity}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-700">{item.morphologyGrade}</td>
                        <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-600">
                          {item.linkedSpermId}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              item.status === 'Fertilized'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'Retrieved'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOocyte(item)}
                            className="rounded-lg bg-slate-100 hover:bg-slate-200 p-1 text-slate-600 transition"
                            title="View Details"
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: FERTILIZATION */}
          {activeTab === 'fertilization' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Fertilization &amp; Pronuclear (2PN) Assessment (16-18h Post Insemination)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFertilizationModal(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white uppercase"
                >
                  + Record Fertilization
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                  <span className="text-[11px] text-emerald-800 font-medium">Normal Fertilization (2PN)</span>
                  <div className="text-2xl font-black text-emerald-950 mt-1">{fertilized2PN} / {matureCount || 0}</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    {matureCount ? `${((fertilized2PN / matureCount) * 100).toFixed(1)}% Fertilization Rate` : 'No MII oocytes'}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
                  <span className="text-[11px] text-amber-800 font-medium">Abnormal (1PN / 3PN)</span>
                  <div className="text-2xl font-black text-amber-950 mt-1">{summary.abnormalPn}</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">From {sourceTab} fertilization grid</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <span className="text-[11px] text-slate-600 font-medium">Unfertilized (0PN)</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">{summary.unfertilized}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">From {sourceTab} fertilization grid</div>
                </div>
              </div>

              {/* Fertilization Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold uppercase">Oocyte ID</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Insemination Method</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Pronuclei (PN)</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Polar Bodies</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Result</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Embryo ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {oocytes.filter((o) => o.maturity === 'MII').map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-purple-700">{o.oocyteId}</td>
                        <td className="px-3 py-2 text-slate-700">{sourceTab}</td>
                        <td className="px-3 py-2 font-bold text-emerald-700">{o.fertilizationResult || '2PN'}</td>
                        <td className="px-3 py-2 text-slate-600">2 PB Extruded</td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 text-[10px]">
                            Normal 2PN
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-800">{o.embryoId || 'EMB-26-XX'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EMBRYO CULTURE */}
          {activeTab === 'embryo-culture' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Embryo Morphokinetic Progression &amp; Blastocyst Grading (Day 1 - 6)
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold uppercase">Embryo ID</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Origin Oocyte</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Day 3 Cleavage</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Day 5 Blastocyst Grade</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Disposition Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {oocytes.filter((o) => o.embryoId).map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-purple-700">{e.embryoId}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{e.oocyteId}</td>
                        <td className="px-3 py-2 text-slate-800 font-semibold">{e.day3Grade || '8-Cell Grade A'}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-purple-50 border border-purple-200 px-2.5 py-0.5 font-black text-purple-800">
                            {e.day5Grade || '4AA'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 font-bold text-[10px]">
                            {e.transferStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: EMBRYO TRANSFER (ET) */}
          {activeTab === 'embryo-transfer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  ET Entry · {sourceTab} embryos
                </h3>
                <span className="text-[11px] text-slate-500">Action list matches SMART ET Entry</span>
              </div>

              {sourceEmbryos.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No {sourceTab} embryo rows in ET yet. Add embryos on the ET screen; Action options are Transfer, Freeze, Stuck, KeepForBlast, Discard, Donated, DonatedForResearch.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold uppercase">Source</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Celler</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Grade</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Action</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Location</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sourceEmbryos.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-bold text-slate-800">{row.source}</td>
                          <td className="px-3 py-2 text-slate-700">{row.celler || '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{row.grade || '—'}</td>
                          <td className="px-3 py-2">
                            <select
                              value={row.action}
                              disabled
                              className="h-8 min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 text-xs"
                            >
                              {ET_ACTION_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.location || '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{row.remark || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'blastocyst-transfer' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  BT Entry · {bothLabs ? 'IVF and ICSI' : sourceTab} blastocysts
                </h3>
                <a href="/bt" className="text-[11px] font-bold text-purple-700 underline">
                  Open full Blastocyst Transfer
                </a>
              </div>
              <p className="text-[11px] text-slate-500">
                SMART BT columns: Source, Expansion grade, ICM Grade, TE Grade, Action, Location, Remarks. IVF and ICSI are listed on separate rows.
              </p>
              {sourceEmbryos.length === 0 && !bothLabs ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No {sourceTab} blastocyst rows yet. Add them on the BT screen.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold uppercase">Source</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Expansion grade</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">ICM Grade</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">TE Grade</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Action</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Location</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(bothLabs ? embryos : sourceEmbryos).map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-bold text-slate-800">{row.source}</td>
                          <td className="px-3 py-2 text-slate-700">{gradeLabel(BT_EXPANSION_OPTIONS, row.celler)}</td>
                          <td className="px-3 py-2 text-slate-700">{gradeLabel(BT_ICM_OPTIONS, row.grade)}</td>
                          <td className="px-3 py-2 text-slate-700">—</td>
                          <td className="px-3 py-2 text-slate-700">{row.actionLabel || '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{row.location || '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{row.remark || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CRYOPRESERVATION */}
          {activeTab === 'cryopreservation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Vitrified Embryo Inventory (LN2 Coordinates)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFreezeModal(true)}
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white uppercase"
                >
                  + Vitrify Embryo / Oocyte
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold uppercase">Straw No.</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Embryo ID</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Stage &amp; Grade</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Device</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Location</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Freeze Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {oocytes.filter((o) => o.cryoStrawNo).map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-teal-700">{o.cryoStrawNo}</td>
                        <td className="px-3 py-2 font-mono text-slate-800">{o.embryoId}</td>
                        <td className="px-3 py-2 font-bold text-purple-700">{o.day5Grade}</td>
                        <td className="px-3 py-2 text-slate-600">Cryotop (High Security)</td>
                        <td className="px-3 py-2 text-slate-800 font-medium">Tank 1 &gt; Canister 3 &gt; Goblet Green</td>
                        <td className="px-3 py-2 text-slate-500">23-Aug-2026</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: THAW */}
          {activeTab === 'thaw' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Warming &amp; Thawing Protocol
              </h3>
              <p className="text-slate-500 leading-relaxed">
                No thaw events currently pending for active fresh cycle C-2026-00158. Thawing can be scheduled for subsequent Frozen Embryo Transfer (FET).
              </p>
              <button
                type="button"
                onClick={() => showToast('Initiated Thaw Protocol request for FET')}
                className="rounded-xl bg-[#181d38] px-4 py-2 text-xs font-bold text-white uppercase"
              >
                Schedule Thaw Event
              </button>
            </div>
          )}

          {/* TAB 7: DISPOSITION */}
          {activeTab === 'embryo-disposition' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Embryo Disposition &amp; Discard Audit Log
              </h3>
              <p className="text-slate-500 leading-relaxed">
                All disposals require dual-embryologist witnessing, photographic documentation, and signed patient consent according to ART Act guidelines.
              </p>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-slate-600">
                0 Embryos Discarded. All viable embryos successfully transferred or cryopreserved.
              </div>
            </div>
          )}

        </div>

        {/* QUICK ACTIONS SIDEBAR (COL 3) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5">
            SMART ET Actions
          </h3>
          <p className="text-[11px] text-slate-500">Same Action list as SMART ET Entry. Counts are for {sourceTab}.</p>

          <div className="space-y-2">
            {SMART_ACTIONS.map((action) => {
              const count =
                action.id === 1
                  ? summary.transferred
                  : action.id === 2
                    ? summary.cryopreserved
                    : action.id === 3
                      ? summary.stuck
                      : action.id === 4
                        ? summary.blastocyst
                        : action.id === 5
                          ? summary.discard
                          : action.id === 6
                            ? summary.donated
                            : summary.donatedForResearch;
              return (
                <div
                  key={action.id}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800"
                >
                  <span>{action.name}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL: ADD OOCYTE */}
      {showAddOocyteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Add Retrieved Oocyte</h3>
              <button
                type="button"
                onClick={() => setShowAddOocyteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Maturity Status</label>
                <select
                  value={newMaturity}
                  onChange={(e) => setNewMaturity(e.target.value as 'MII' | 'MI' | 'GV')}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 outline-none"
                >
                  <option value="MII">MII (Mature with 1st Polar Body)</option>
                  <option value="MI">MI (Intermediate, No Polar Body)</option>
                  <option value="GV">GV (Germinal Vesicle, Immature)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Morphology Grade</label>
                <select
                  value={newMorphology}
                  onChange={(e) => setNewMorphology(e.target.value as 'A' | 'B' | 'C')}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 outline-none"
                >
                  <option value="A">Grade A (Optimal Ooplasm, Clear Zona)</option>
                  <option value="B">Grade B (Mild Inclusions / Granularity)</option>
                  <option value="C">Grade C (Moderate Inclusions / Dark Zona)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddOocyteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddOocyte}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white uppercase"
              >
                Save Oocyte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD FERTILIZATION */}
      {showFertilizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Record Fertilization (2PN)</h3>
              <button
                type="button"
                onClick={() => setShowFertilizationModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Confirm 2PN check across all 10 mature (MII) oocytes injected with sperm SEM-26-00018472.
            </p>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              ✓ 8 of 10 confirmed 2PN with 2 clear polar bodies.<br />
              ✓ 2 unfertilized (0PN) retained for observation.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFertilizationModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFertilizationModal(false);
                  showToast('Pronuclear 2PN assessment logged and verified.');
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white uppercase"
              >
                Confirm 2PN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FREEZE (CRYO) */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Vitrify Embryos</h3>
              <button
                type="button"
                onClick={() => setShowFreezeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Vitrify remaining blastocysts (EMB-26-03, EMB-26-04, EMB-26-05) into Cryotop straws.
            </p>
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800">
              Storage Target: <strong>Tank 1 &gt; Canister 3 &gt; Goblet Green</strong>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFreezeModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFreezeModal(false);
                  showToast('Embryos vitrified and assigned straw IDs STR-26-001..003');
                }}
                className="rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2 text-xs font-bold text-white uppercase"
              >
                Commit to Cryo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER (ET) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Record Embryo Transfer</h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Transfer 2 Top-Grade Day 5 Blastocysts (EMB-26-01 &amp; EMB-26-02).
            </p>
            <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-xs text-purple-800">
              Physician: <strong>Dr. Sanjay Kumar Pagare</strong><br />
              Catheter: <strong>Cook Soft-Pass Echogenic</strong>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTransferModal(false);
                  showToast('Embryo Transfer (ET) completed and recorded.');
                }}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white uppercase"
              >
                Finalize Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OOCYTE DETAILS */}
      {selectedOocyte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                Oocyte Details ({selectedOocyte.oocyteId})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOocyte(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Retrieval Time:</span>
                <strong className="text-slate-800">{selectedOocyte.collectionDateTime}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Maturity:</span>
                <strong className="text-purple-700">{selectedOocyte.maturity}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Morphology Grade:</span>
                <strong className="text-slate-800">{selectedOocyte.morphologyGrade}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Linked Sperm ID:</span>
                <strong className="font-mono text-slate-800">{selectedOocyte.linkedSpermId}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Fertilization Result:</span>
                <strong className="text-emerald-700">{selectedOocyte.fertilizationResult || 'Pending'}</strong>
              </div>
              {selectedOocyte.embryoId && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Embryo ID:</span>
                  <strong className="font-mono text-purple-700">{selectedOocyte.embryoId}</strong>
                </div>
              )}
              {selectedOocyte.day5Grade && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Day 5 Grade:</span>
                  <strong className="font-bold text-purple-800">{selectedOocyte.day5Grade}</strong>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOocyte(null)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function metric(summary: SourceSummary, key: keyof SourceSummary) {
  const value = summary[key];
  return typeof value === 'number' ? value : 0;
}

function pairLabel(both: boolean, ivf: number, icsi: number, single: number) {
  return both ? `IVF ${ivf} · ICSI ${icsi}` : String(single);
}

function PairCount({ both, ivf, icsi, single }: { both: boolean; ivf: number; icsi: number; single: number }) {
  if (!both) return <span className="text-xl font-black">{single}</span>;
  return (
    <span className="mt-0.5 flex items-end justify-center gap-2 text-sm font-black leading-none">
      <span>
        <span className="mb-0.5 block text-[9px] font-bold opacity-70">IVF</span>
        {ivf}
      </span>
      <span className="pb-0.5 opacity-40">|</span>
      <span>
        <span className="mb-0.5 block text-[9px] font-bold opacity-70">ICSI</span>
        {icsi}
      </span>
    </span>
  );
}

function gradeLabel(options: { id: number; name: string }[], value: string | number | undefined) {
  const text = String(value ?? '').trim();
  if (!text) return '—';
  if (/^\d+$/.test(text)) return options.find((item) => item.id === Number(text))?.name || '—';
  return text;
}

const SPLIT_BY_TAB: Record<OocyteEmbryoTab, { label: string; key: keyof SourceSummary }[]> = {
  oocytes: [
    { label: 'Allotted', key: 'allotted' },
    { label: 'Total retrieved', key: 'retrieved' },
    { label: 'Mature MII', key: 'matureMII' },
    { label: 'Immature MI / GV', key: 'immature' },
    { label: 'Degenerated', key: 'degenerated' },
  ],
  fertilization: [
    { label: 'Mature MII inseminated', key: 'matureMII' },
    { label: '2PN', key: 'fertilized2PN' },
    { label: 'Abnormal PN', key: 'abnormalPn' },
    { label: 'Unfertilized', key: 'unfertilized' },
    { label: 'Stuck 2PN', key: 'stuck' },
  ],
  'embryo-culture': [
    { label: 'Embryo', key: 'cleavage' },
    { label: 'Blastocyst', key: 'blastocyst' },
  ],
  'embryo-transfer': [
    { label: 'Transferred', key: 'transferred' },
    { label: 'Frozen', key: 'cryopreserved' },
    { label: 'Stuck', key: 'stuck' },
    { label: 'Keep for blastocyst', key: 'blastocyst' },
    { label: 'Discarded', key: 'discard' },
    { label: 'Donated', key: 'donated' },
    { label: 'Donated for research', key: 'donatedForResearch' },
  ],
  'blastocyst-transfer': [
    { label: 'Blastocyst', key: 'blastocyst' },
    { label: 'Transferred', key: 'transferred' },
    { label: 'Frozen', key: 'cryopreserved' },
    { label: 'Stuck', key: 'stuck' },
    { label: 'Discarded', key: 'discard' },
    { label: 'Donated', key: 'donated' },
    { label: 'Donated for research', key: 'donatedForResearch' },
  ],
  cryopreservation: [
    { label: 'Frozen', key: 'cryopreserved' },
    { label: 'Blastocyst', key: 'blastocyst' },
  ],
  thaw: [{ label: 'Frozen available', key: 'cryopreserved' }],
  'embryo-disposition': [
    { label: 'Discarded', key: 'discard' },
    { label: 'Donated', key: 'donated' },
    { label: 'Donated for research', key: 'donatedForResearch' },
  ],
};

function Main2PagesGrid({
  view,
  tab,
  ivf,
  icsi,
}: {
  view: LabView;
  tab: OocyteEmbryoTab;
  ivf: SourceSummary;
  icsi: SourceSummary;
}) {
  const showIvf = view === 'IVF' || view === 'BOTH';
  const showIcsi = view === 'ICSI' || view === 'BOTH';
  const rows = SPLIT_BY_TAB[tab];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {tab === 'fertilization' ? 'Fertilization split' : tab === 'blastocyst-transfer' ? 'Blastocyst split' : 'Oocyte / Embryo split'} · {view === 'BOTH' ? 'IVF + ICSI' : view}
        </h3>
        <span className="text-[11px] text-slate-500">IVF and ICSI are shown in their own columns</span>
      </div>
      <table className="min-w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="px-3 py-2 font-semibold">Parameter</th>
            {showIvf ? <th className="px-3 py-2 text-center font-semibold">IVF</th> : null}
            {showIcsi ? <th className="px-3 py-2 text-center font-semibold">ICSI</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ivfValue = row.key === 'allotted' ? ivf.allotted || ivf.retrieved : metric(ivf, row.key);
            const icsiValue = row.key === 'allotted' ? icsi.allotted || icsi.retrieved : metric(icsi, row.key);
            return (
              <tr key={row.key} className="odd:bg-white even:bg-slate-50/70">
                <td className="px-3 py-2 font-semibold text-slate-700">{row.label}</td>
                {showIvf ? <td className="px-3 py-2 text-center font-black text-slate-900">{ivfValue}</td> : null}
                {showIcsi ? <td className="px-3 py-2 text-center font-black text-slate-900">{icsiValue}</td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
