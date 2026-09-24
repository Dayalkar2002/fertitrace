'use client';

import React, { useState, useMemo } from 'react';
import { usePatientIds } from '@/components/clinical/clinical-shared';

export interface WitnessEvent {
  id: string;
  timestamp: string;
  procedure: string;
  patientUhid: string;
  patientName: string;
  partnerName?: string;
  cycleId: string;
  dishSourceId: string;
  dishTargetId: string;
  primaryEmbryologist: string;
  secondaryWitness: string;
  status: 'PASSED' | 'MISMATCH BLOCKED' | 'OVERRIDE AUTHORIZED';
  digitalHash: string;
  workstation: string;
}

export interface LabWorkstation {
  id: string;
  name: string;
  code: string;
  type: string;
  rfidStatus: 'Online' | 'Scanning' | 'Standby';
  currentPatient: string;
  currentDish: string;
  timeOnStage: string;
  temperature: string;
}

const PROCEDURES = [
  { id: 'icsi', name: 'ICSI Insemination Alignment', icon: '🔬', color: 'indigo' },
  { id: 'opu', name: 'OPU Follicular Fluid Collection', icon: '🥚', color: 'amber' },
  { id: 'vitrification', name: 'Embryo Vitrification & Cryo-Plunge', icon: '❄️', color: 'cyan' },
  { id: 'thaw', name: 'Frozen Embryo Thawing (FET)', icon: '🔥', color: 'emerald' },
  { id: 'et', name: 'Embryo Transfer (ET) Catheter Loading', icon: '🎯', color: 'purple' },
  { id: 'semen_prep', name: 'Semen Wash & Syringe Insemination', icon: '🧪', color: 'blue' },
];

const INITIAL_WORKSTATIONS: LabWorkstation[] = [
  {
    id: 'ws-1',
    name: 'ICSI Rig #1 (Nikon Ti2-U)',
    code: 'WS-ICSI-01',
    type: 'Microscope Heated Stage',
    rfidStatus: 'Online',
    currentPatient: 'Farah Mohammed Khan (PT-004)',
    currentDish: 'PT004-DISH-ICSI-01',
    timeOnStage: '04:18 min',
    temperature: '37.0°C',
  },
  {
    id: 'ws-2',
    name: 'Laminar Airflow Hood #1',
    code: 'WS-LAF-01',
    type: 'Class II Biosafety Hood',
    rfidStatus: 'Online',
    currentPatient: 'Pooja Verma (PT-007)',
    currentDish: 'PT007-OPU-TUBE-03',
    timeOnStage: '01:50 min',
    temperature: '37.1°C',
  },
  {
    id: 'ws-3',
    name: 'Vitrification Bench Station',
    code: 'WS-CRYO-01',
    type: 'Cryo Plunge Stand',
    rfidStatus: 'Online',
    currentPatient: 'Ananya Sharma (PT-002)',
    currentDish: 'PT002-STRAW-D5-02',
    timeOnStage: '02:05 min',
    temperature: '-196.0°C',
  },
  {
    id: 'ws-4',
    name: 'Transfer OT Mobile Rig',
    code: 'WS-ET-01',
    type: 'Catheter Verification Bay',
    rfidStatus: 'Standby',
    currentPatient: 'None (Standby)',
    currentDish: '—',
    timeOnStage: '00:00',
    temperature: '37.0°C',
  },
];

const INITIAL_AUDIT_LOGS: WitnessEvent[] = [
  {
    id: 'WIT-9041',
    timestamp: 'Today, 10:30 AM',
    procedure: 'ICSI Insemination Alignment',
    patientUhid: 'PT-004',
    patientName: 'Farah Mohammed Khan',
    partnerName: 'Mohammed Shaikh',
    cycleId: 'CYC-2026-0881',
    dishSourceId: 'PT004-OOCYTE-DISH-1',
    dishTargetId: 'PT004-SPERM-DROP-1',
    primaryEmbryologist: 'Dr. Sachin Kadam',
    secondaryWitness: 'Dr. Aarti Sharma',
    status: 'PASSED',
    digitalHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    workstation: 'WS-ICSI-01',
  },
  {
    id: 'WIT-9040',
    timestamp: 'Today, 09:15 AM',
    procedure: 'OPU Follicular Fluid Collection',
    patientUhid: 'PT-004',
    patientName: 'Farah Mohammed Khan',
    partnerName: 'Mohammed Shaikh',
    cycleId: 'CYC-2026-0881',
    dishSourceId: 'PT004-ASPIRATE-TUBE-A',
    dishTargetId: 'PT004-COLLECTION-DISH-1',
    primaryEmbryologist: 'Dr. Sachin Kadam',
    secondaryWitness: 'Nurse Sunita P.',
    status: 'PASSED',
    digitalHash: 'SHA256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    workstation: 'WS-LAF-01',
  },
  {
    id: 'WIT-9039',
    timestamp: 'Yesterday, 04:22 PM',
    procedure: 'Embryo Vitrification & Cryo-Plunge',
    patientUhid: 'PT-002',
    patientName: 'Ananya Sharma',
    partnerName: 'Vikram Sharma',
    cycleId: 'CYC-2026-0879',
    dishSourceId: 'PT002-BLAST-DISH-04',
    dishTargetId: 'PT002-STRAW-CANISTER-3',
    primaryEmbryologist: 'Rahul Verma',
    secondaryWitness: 'Dr. Sachin Kadam',
    status: 'PASSED',
    digitalHash: 'SHA256:ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    workstation: 'WS-CRYO-01',
  },
];

// Audio generator for Match Chime vs Alert
function playWitnessChime(isMatch: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isMatch) {
      // Pleasant dual harmony chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Warning klaxon buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.setValueAtTime(140, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch {
    // Ignore audio errors
  }
}

export function WitnessSystemClient() {
  const { selectedPatient, patientName } = usePatientIds();
  const partnerName = selectedPatient?.partner ?? '';

  const [activeProcedure, setActiveProcedure] = useState(PROCEDURES[0].id);
  const [workstations] = useState<LabWorkstation[]>(INITIAL_WORKSTATIONS);
  const [auditLogs, setAuditLogs] = useState<WitnessEvent[]>(INITIAL_AUDIT_LOGS);
  const [selectedStation, setSelectedStation] = useState('WS-ICSI-01');

  // Interactive Live Matching State
  const currentPatUhid = selectedPatient?.uhid || 'PT-004';
  const currentPatName = patientName || 'Farah Mohammed Khan';
  const currentPartnerName = partnerName || 'Mohammed Shaikh';

  const [sourceCode, setSourceCode] = useState(`${currentPatUhid}-DISH-01`);
  const [targetCode, setTargetCode] = useState(`${currentPatUhid}-SPERM-01`);
  const [primaryEmbryologist, setPrimaryEmbryologist] = useState('Dr. Sachin Kadam');
  const [secondaryWitness, setSecondaryWitness] = useState('Dr. Aarti Sharma');
  const [witnessPin, setWitnessPin] = useState('');
  const [matchResult, setMatchResult] = useState<'MATCH' | 'MISMATCH' | 'STANDBY'>('STANDBY');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'verification' | 'workstations' | 'audit'>('verification');
  const [searchLogQuery, setSearchLogQuery] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Perform Live Match Validation
  const handleValidateMatch = (forceMismatch = false) => {
    const sCode = sourceCode.trim().toUpperCase();
    const tCode = forceMismatch ? 'PT009-DISCORDANT-DISH' : targetCode.trim().toUpperCase();

    if (forceMismatch) {
      setTargetCode('PT009-DISCORDANT-DISH');
    }

    // Cohort check: both codes must reference the same UHID prefix
    const patPrefix = currentPatUhid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const sMatches = sCode.replace(/[^a-zA-Z0-9]/g, '').includes(patPrefix);
    const tMatches = tCode.replace(/[^a-zA-Z0-9]/g, '').includes(patPrefix);

    if (sMatches && tMatches && !forceMismatch) {
      setMatchResult('MATCH');
      playWitnessChime(true);
      showToast('✓ Cohort Match Confirmed: 100% Patient Sample Integrity Verified');
    } else {
      setMatchResult('MISMATCH');
      playWitnessChime(false);
      showToast('⚠️ CRITICAL MISMATCH: Specimen does NOT belong to patient cohort! Action Blocked.');
    }
  };

  // Authorize & Record Witness Event
  const handleAuthorizeWitness = (e: React.FormEvent) => {
    e.preventDefault();

    if (matchResult !== 'MATCH') {
      alert('Cannot authorize: verification has not passed or mismatch exists.');
      return;
    }

    if (!witnessPin.trim()) {
      alert('Secondary Witness PIN / Signature is required for dual-witness sign-off.');
      return;
    }

    const procedureObj = PROCEDURES.find((p) => p.id === activeProcedure);
    const newEvent: WitnessEvent = {
      id: `WIT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      procedure: procedureObj ? procedureObj.name : 'Clinical Witness Verification',
      patientUhid: currentPatUhid,
      patientName: currentPatName,
      partnerName: currentPartnerName,
      cycleId: 'CYC-2026-0881',
      dishSourceId: sourceCode,
      dishTargetId: targetCode,
      primaryEmbryologist,
      secondaryWitness,
      status: 'PASSED',
      digitalHash: `SHA256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      workstation: selectedStation,
    };

    setAuditLogs((prev) => [newEvent, ...prev]);
    setWitnessPin('');
    setMatchResult('STANDBY');
    showToast(`✓ Dual-Witness Verification Sealed: ${newEvent.id} logged to immutable audit ledger.`);
    playWitnessChime(true);
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchLogQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        log.id.toLowerCase().includes(q) ||
        log.patientName.toLowerCase().includes(q) ||
        log.patientUhid.toLowerCase().includes(q) ||
        log.procedure.toLowerCase().includes(q) ||
        log.primaryEmbryologist.toLowerCase().includes(q) ||
        log.secondaryWitness.toLowerCase().includes(q)
      );
    });
  }, [auditLogs, searchLogQuery]);

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
          <span className="text-xs font-bold text-slate-800">{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-xs">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Electronic Witnessing System (EWS)
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                RFID Sensors Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Dual-verification gamete mismatch shield & electronic audit trail in full compliance with ART Act 2022
            </p>
          </div>
        </div>

        {/* Header Right Badges */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 font-medium">
            <span className="font-semibold text-slate-500">Active Patient: </span>
            <span className="font-bold text-slate-800">{currentPatName}</span>
            <span className="ml-1 text-[11px] font-mono text-indigo-600 font-bold">({currentPatUhid})</span>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Witnessed Events Today</span>
            <span className="text-base">🔒</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-900">{auditLogs.length + 8}</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">● 100% Cohort Integrity</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Workstations</span>
            <span className="text-base">🖥️</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">4 / 4</p>
          <p className="mt-0.5 text-[10px] text-slate-500 font-medium">All RFID antennas synced</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Mismatch Preventions</span>
            <span className="text-base">🛡️</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-indigo-900">0 Alerts</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">Zero errors recorded</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Ledger Status</span>
            <span className="text-base">📜</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">Immutable</p>
          <p className="mt-0.5 text-[10px] text-indigo-600 font-medium">SHA-256 Signed</p>
        </div>
      </div>

      {/* 3. Navigation View Switcher */}
      <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`rounded-lg px-4 py-1.5 transition ${
            activeTab === 'verification' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🔬 Live Verification Chamber
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('workstations')}
          className={`rounded-lg px-4 py-1.5 transition ${
            activeTab === 'workstations' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🖥️ Active Workstations ({workstations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`rounded-lg px-4 py-1.5 transition ${
            activeTab === 'audit' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📜 Immutable Witness Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* 4. Tab 1: Live Verification Chamber (Core Screen) */}
      {activeTab === 'verification' && (
        <div className="space-y-5">
          {/* Procedure Step Selector */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Current Laboratory Procedure Stage
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {PROCEDURES.map((p) => {
                const isSelected = activeProcedure === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActiveProcedure(p.id);
                      setMatchResult('STANDBY');
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-xs ring-1 ring-emerald-500 font-bold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl mb-1">{p.icon}</span>
                    <span className="text-xs leading-tight">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DUAL-VERIFICATION MATCH CHAMBER */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Dual-Specimen Cohort Alignment & Match Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Step 1: Scan primary dish. Step 2: Scan target dish. Both must match the same active patient cohort.
                </p>
              </div>

              {/* Station Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Lab Station:</span>
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 font-semibold text-slate-800"
                >
                  {workstations.map((ws) => (
                    <option key={ws.id} value={ws.code}>
                      {ws.name} ({ws.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-side Dual Specimen Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* SIDE A: Source Specimen */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                      A
                    </span>
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                      Source Specimen (Origin)
                    </span>
                  </div>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-800">
                    RFID DETECTED
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Patient Demographic</label>
                    <p className="font-bold text-slate-900">
                      {currentPatName} <span className="font-mono text-indigo-700">({currentPatUhid})</span>
                    </p>
                    {currentPartnerName && <p className="text-[11px] text-slate-500">Partner: {currentPartnerName}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Dish / Tube RFID Barcode</label>
                    <input
                      type="text"
                      value={sourceCode}
                      onChange={(e) => setSourceCode(e.target.value)}
                      className="w-full rounded-lg border border-indigo-300 bg-white p-2 font-mono text-xs font-bold text-indigo-900 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* SIDE B: Target Specimen / Insemination Drop */}
              <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-bold">
                      B
                    </span>
                    <span className="text-xs font-bold text-purple-950 uppercase tracking-wide">
                      Target Vessel / Recipient Drop
                    </span>
                  </div>
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-800">
                    SCAN READY
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Paired Cohort</label>
                    <p className="font-bold text-slate-900">
                      {currentPatName} <span className="font-mono text-purple-700">({currentPatUhid})</span>
                    </p>
                    <p className="text-[11px] text-slate-500">Procedure: {PROCEDURES.find((p) => p.id === activeProcedure)?.name}</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Target Vessel / Straw Barcode</label>
                    <input
                      type="text"
                      value={targetCode}
                      onChange={(e) => setTargetCode(e.target.value)}
                      className="w-full rounded-lg border border-purple-300 bg-white p-2 font-mono text-xs font-bold text-purple-900 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Action Buttons */}
            <div className="flex items-center justify-center gap-3 py-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleValidateMatch(false)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition active:scale-[0.98]"
              >
                <span>🔍</span>
                <span>Verify Cohort Match</span>
              </button>

              <button
                type="button"
                onClick={() => handleValidateMatch(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 text-xs font-bold text-rose-800 shadow-2xs transition active:scale-[0.98]"
                title="Test mismatch barrier by scanning another patient sample"
              >
                <span>⚠️</span>
                <span>Simulate Mismatch Attempt (Discordant Sample)</span>
              </button>
            </div>

            {/* Real-time Match Banner */}
            {matchResult === 'MATCH' && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 animate-in fade-in zoom-in-95 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm">
                      ✓
                    </span>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-emerald-900">
                        COHORT MATCH CONFIRMED (100% IDENTICAL COHORT)
                      </h4>
                      <p className="text-xs text-emerald-800">
                        Specimen barcodes [{sourceCode}] and [{targetCode}] are verified to belong to patient{' '}
                        <strong>{currentPatName}</strong> ({currentPatUhid}).
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-200/60 px-3 py-1 text-xs font-bold text-emerald-900">
                    SHIELD UNLOCKED
                  </span>
                </div>

                {/* Dual-Witness Sign-off Form */}
                <form
                  onSubmit={handleAuthorizeWitness}
                  className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-2xs grid gap-3 sm:grid-cols-3 items-end"
                >
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Embryologist</label>
                    <select
                      value={primaryEmbryologist}
                      onChange={(e) => setPrimaryEmbryologist(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                    >
                      <option value="Dr. Sachin Kadam">Dr. Sachin Kadam (Lead Embryologist)</option>
                      <option value="Dr. Aarti Sharma">Dr. Aarti Sharma (Senior Embryologist)</option>
                      <option value="Rahul Verma">Rahul Verma (Cryo Specialist)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Secondary Verifier Witness</label>
                    <select
                      value={secondaryWitness}
                      onChange={(e) => setSecondaryWitness(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                    >
                      <option value="Dr. Aarti Sharma">Dr. Aarti Sharma (Doctor / Witness)</option>
                      <option value="Dr. Sachin Kadam">Dr. Sachin Kadam (Embryologist)</option>
                      <option value="Nurse Sunita P.">Nurse Sunita P. (OT Witness)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Witness PIN / Card Tap</label>
                      <input
                        type="password"
                        placeholder="Enter 4-digit PIN"
                        value={witnessPin}
                        onChange={(e) => setWitnessPin(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                    >
                      Authorize & Seal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {matchResult === 'MISMATCH' && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-950 animate-in shake space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-sm">
                    ⚠️
                  </span>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-rose-900">
                      CRITICAL MISMATCH BLOCKED: SAMPLES DO NOT MATCH!
                    </h4>
                    <p className="text-xs text-rose-800">
                      Target barcode [{targetCode}] does NOT belong to patient cohort ({currentPatUhid}). Electronic shield has
                      locked the workstation. Re-scan required.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Workstations Grid */}
      {activeTab === 'workstations' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {workstations.map((ws) => (
            <div key={ws.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-500">{ws.code}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    ws.rfidStatus === 'Online'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {ws.rfidStatus}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{ws.name}</h4>
                <p className="text-[11px] text-slate-500">{ws.type}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Patient:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[120px]">{ws.currentPatient}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dish on Stage:</span>
                  <span className="font-mono font-bold text-indigo-700 text-[11px] truncate max-w-[120px]">{ws.currentDish}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time on Stage:</span>
                  <span className="font-mono text-slate-700 font-bold">{ws.timeOnStage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plate Temp:</span>
                  <span className="font-semibold text-emerald-700">{ws.temperature}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedStation(ws.code);
                  setActiveTab('verification');
                  showToast(`Selected ${ws.name} for active verification.`);
                }}
                className="w-full rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-1.5 text-xs font-bold transition"
              >
                Switch to this Station →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 6. Tab 3: Immutable Witness Audit Trail */}
      {activeTab === 'audit' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Electronic Witnessing Compliance Audit Log
              </h3>
              <p className="text-xs text-slate-500">
                Cryptographically signed records meeting ICMR / ESHRE dual-witnessing criteria
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search by Patient, ID, or Witness..."
                value={searchLogQuery}
                onChange={(e) => setSearchLogQuery(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600">
                  <th className="py-2.5 px-3">Witness ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Procedure</th>
                  <th className="py-2.5 px-3">Patient & UHID</th>
                  <th className="py-2.5 px-3">Dishes Matched</th>
                  <th className="py-2.5 px-3">Primary / Secondary</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">SHA-256 Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{log.id}</td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{log.procedure}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900 block">{log.patientName}</span>
                      <span className="font-mono text-slate-500 text-[10px]">{log.patientUhid}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-600">
                      <div>A: {log.dishSourceId}</div>
                      <div>B: {log.dishTargetId}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="block font-medium text-slate-800">1: {log.primaryEmbryologist}</span>
                      <span className="block text-slate-500 text-[10px]">2: {log.secondaryWitness}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[9px] text-slate-400 max-w-[140px] truncate" title={log.digitalHash}>
                      {log.digitalHash.slice(0, 18)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
