'use client';

import React, { useState, useEffect } from 'react';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';
import { OocyteItem } from '@/lib/services-server/oocyte-embryo.service';

export type OocyteEmbryoTab =
  | 'oocytes'
  | 'fertilization'
  | 'embryo-culture'
  | 'embryo-transfer'
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

export function OocyteEmbryoClient() {
  const { selectedPatient } = usePatient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<OocyteEmbryoTab>('oocytes');
  const [oocytes, setOocytes] = useState<OocyteItem[]>(INITIAL_OOCYTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOocyte, setSelectedOocyte] = useState<OocyteItem | null>(null);

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
      if (tabParam && ['oocytes', 'fertilization', 'embryo-culture', 'embryo-transfer', 'cryopreservation', 'thaw', 'embryo-disposition'].includes(tabParam)) {
        setActiveTab(tabParam as OocyteEmbryoTab);
      }
    }
  }, []);

  // Demographic details
  const patientId = selectedPatient?.uhid || (selectedPatient?.id ? `P-2026-00${selectedPatient.id}` : 'P-2026-00125');
  const patientName = selectedPatient?.name || 'Mrs. Anjali Sharma';
  const cycleId = selectedPatient?.id ? `C-2026-00${selectedPatient.id}` : 'C-2026-00158';
  const cycleType = 'IVF / ICSI';
  const cycleDay = 16;
  const lmp = '02-Aug-2026';
  const operator = user?.userName || 'Dr. Satish Sharma (EMB-01)';

  // Calculate dynamic metrics
  const retrievedCount = oocytes.length;
  const matureCount = oocytes.filter((o) => o.maturity === 'MII').length;
  const immatureCount = oocytes.filter((o) => o.maturity === 'MI' || o.maturity === 'GV').length;
  const degeneratedCount = oocytes.filter((o) => o.maturity === 'Degenerated').length;

  const fertilized2PN = oocytes.filter((o) => o.fertilizationResult === '2PN').length;
  const cleavageCount = oocytes.filter((o) => o.day3Grade).length;
  const blastocystCount = oocytes.filter((o) => o.day5Grade && !['Early Blast', 'Morula'].includes(o.day5Grade)).length;
  const cryopreservedCount = oocytes.filter((o) => o.transferStatus === 'Cryopreserved').length;
  const transferredCount = oocytes.filter((o) => o.transferStatus === 'Transferred').length;

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
                Cycle ID: <strong className="text-slate-700 font-mono">{cycleId}</strong> • LMP: <strong className="text-slate-700">{lmp}</strong> • Operator: <strong className="text-slate-700">{operator}</strong>
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
              <span className="font-bold text-purple-700 text-sm">{retrievedCount}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Fertilized (2PN)</span>
              <span className="font-bold text-emerald-600 text-sm">{fertilized2PN}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Transferred</span>
              <span className="font-bold text-slate-800 text-sm">{transferredCount}</span>
            </div>
          </div>
        </div>

        {/* 7 MODULE TABS */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {[
            { id: 'oocytes', label: 'Oocytes' },
            { id: 'fertilization', label: 'Fertilization' },
            { id: 'embryo-culture', label: 'Embryo Culture' },
            { id: 'embryo-transfer', label: 'Embryo Transfer' },
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
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* OOCYTE SUMMARY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Oocyte Summary
            </h3>
            <span className="text-[11px] font-semibold text-purple-600">Retrieval Day 16</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-2.5">
              <span className="block text-[10px] font-bold text-purple-600 uppercase">Retrieved</span>
              <span className="text-xl font-black text-purple-950">{retrievedCount}</span>
            </div>
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase">Mature (MII)</span>
              <span className="text-xl font-black text-emerald-950">{matureCount}</span>
            </div>
            <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-2.5">
              <span className="block text-[10px] font-bold text-amber-600 uppercase">Immature (GV/MI)</span>
              <span className="text-xl font-black text-amber-950">{immatureCount}</span>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-2.5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Degenerated</span>
              <span className="text-xl font-black text-slate-700">{degeneratedCount}</span>
            </div>
          </div>
        </div>

        {/* EMBRYO SUMMARY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Embryo Summary
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600">Culture Day 5</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase">Fertilized (2PN)</span>
              <span className="text-xl font-black text-emerald-950">{fertilized2PN}</span>
            </div>
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-2.5">
              <span className="block text-[10px] font-bold text-blue-600 uppercase">Cleavage</span>
              <span className="text-xl font-black text-blue-950">{cleavageCount}</span>
            </div>
            <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-2.5">
              <span className="block text-[10px] font-bold text-purple-600 uppercase">Blastocyst</span>
              <span className="text-xl font-black text-purple-950">{blastocystCount}</span>
            </div>
            <div className="rounded-xl bg-teal-50/60 border border-teal-100 p-2.5">
              <span className="block text-[10px] font-bold text-teal-600 uppercase">Cryopreserved</span>
              <span className="text-xl font-black text-teal-950">{cryopreservedCount}</span>
            </div>
          </div>
        </div>
      </div>

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
                  <div className="text-2xl font-black text-emerald-950 mt-1">{fertilized2PN} / {matureCount}</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">80.0% Fertilization Rate</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
                  <span className="text-[11px] text-amber-800 font-medium">Abnormal (1PN / 3PN)</span>
                  <div className="text-2xl font-black text-amber-950 mt-1">0</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">Polyspermy / Parthenogenesis</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <span className="text-[11px] text-slate-600 font-medium">Unfertilized (0PN)</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">2</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Failed Activation</div>
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
                        <td className="px-3 py-2 text-slate-700">ICSI (Direct Injection)</td>
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
                  Embryo Transfer (ET) Procedure Protocol
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-1.5 text-xs font-bold text-white uppercase"
                >
                  + Record Transfer
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Transfer Date &amp; Time</span>
                    <strong className="text-slate-800">23-Aug-2026 11:30 AM</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Clinician</span>
                    <strong className="text-slate-800">Dr. Sanjay Kumar Pagare</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Embryologist</span>
                    <strong className="text-slate-800">Dr. Satish Sharma</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Catheter Type</span>
                    <strong className="text-slate-800">Cook Soft-Pass Echogenic</strong>
                  </div>
                </div>

                <div className="rounded-xl bg-purple-50 border border-purple-100 p-3">
                  <span className="text-[11px] font-bold text-purple-900 block mb-1">
                    Embryos Loaded &amp; Transferred (2 Blastocysts):
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="rounded-md bg-white px-2.5 py-1 font-mono font-bold text-purple-700 border border-purple-200">
                      EMB-26-01 (4AA)
                    </span>
                    <span className="rounded-md bg-white px-2.5 py-1 font-mono font-bold text-purple-700 border border-purple-200">
                      EMB-26-02 (4AA)
                    </span>
                    <span className="text-emerald-700 font-bold ml-2">✓ Flush Clear: No Retained Embryos</span>
                  </div>
                </div>
              </div>
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
            Quick Actions
          </h3>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAddOocyteModal(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-purple-200 bg-purple-50/70 px-3.5 py-2.5 text-xs font-bold text-purple-900 hover:bg-purple-100 transition text-left"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs">
                +
              </span>
              <div>
                <div>Add Oocyte</div>
                <div className="text-[10px] font-normal text-purple-700">Add new retrieved oocyte</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => showToast('Sperm SEM-26-00018472 linked to all MII oocytes')}
              className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs">
                🔗
              </span>
              <div>
                <div>Link Sperm</div>
                <div className="text-[10px] font-normal text-slate-500">Link selected sperm for ICSI</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowFertilizationModal(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs">
                ✓
              </span>
              <div>
                <div>Record Fertilization</div>
                <div className="text-[10px] font-normal text-slate-500">Record 2PN / Fertilization result</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => showToast('Embryo culture records updated')}
              className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs">
                🧬
              </span>
              <div>
                <div>Add Embryo</div>
                <div className="text-[10px] font-normal text-slate-500">Add new embryo culture record</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowFreezeModal(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs">
                ❄️
              </span>
              <div>
                <div>Freeze (Cryo)</div>
                <div className="text-[10px] font-normal text-slate-500">Cryopreserve oocyte/embryo</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition text-left"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-100 text-pink-700 text-xs">
                🚀
              </span>
              <div>
                <div>Transfer</div>
                <div className="text-[10px] font-normal text-slate-500">Record embryo transfer (ET)</div>
              </div>
            </button>
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
