'use client';

import React, { useState, useEffect } from 'react';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';

export type WorkflowMode = 'Semen Analysis' | 'IUI' | 'IVF / ICSI' | 'Cryopreservation';

export function SpermWitnessingClient() {
  const { selectedPatient } = usePatient();
  const { user } = useAuth();

  // Workflow Mode Selection
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>('IVF / ICSI');

  // Check URL params for initial mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'Cryopreservation') setWorkflowMode('Cryopreservation');
      else if (modeParam === 'IUI') setWorkflowMode('IUI');
      else if (modeParam === 'Semen Analysis') setWorkflowMode('Semen Analysis');
    }
  }, []);

  // Patient & Cycle Header Information
  const patientId = selectedPatient?.uhid || (selectedPatient?.id ? `P-2026-00${selectedPatient.id}` : 'P-2026-00125');
  const patientName = selectedPatient?.name || 'Mrs. Anjali Sharma';
  const partnerName = selectedPatient?.partner || 'Mr. Rohit Sharma';
  const cycleId = selectedPatient?.id ? `C-2026-00${selectedPatient.id}` : 'C-2026-00158';
  const ageSex = selectedPatient?.age ? `${selectedPatient.age} Y / F` : '31 Y / F';
  const procedure = workflowMode === 'IUI' ? 'IUI' : workflowMode === 'Cryopreservation' ? 'Sperm Cryopreservation' : 'IVF / ICSI';
  const operator = user?.userName || 'Dr. Satish Sharma (EMB-01)';

  // 1. Source & Sample Details State
  const [source, setSource] = useState<'Husband / Partner' | 'Donor'>('Husband / Partner');
  const [sampleState, setSampleState] = useState<'Fresh' | 'Frozen' | 'Thawed / Prepared'>('Fresh');
  const [collectionDateTime, setCollectionDateTime] = useState('2026-08-18T09:42');
  const [collectionMethod, setCollectionMethod] = useState('Masturbation');
  const [abstinenceDays, setAbstinenceDays] = useState(3);
  const [donorId, setDonorId] = useState('');
  const [sampleId, setSampleId] = useState('SEM-26-00018472');
  const [rfidBarcode, setRfidBarcode] = useState('RF-88921-X');
  const [isValidated, setIsValidated] = useState(true);

  // Frozen Storage Details
  const [strawVialId, setStrawVialId] = useState('FROZ-26-000554');
  const [tankCanister, setTankCanister] = useState('Tank 1 - Canister 2');
  const [storageLocation, setStorageLocation] = useState('LN2 Room - 1');
  const [storedOn, setStoredOn] = useState('2026-08-05');
  const [sampleNotes, setSampleNotes] = useState('');

  // 2. Validation Checklist
  const [checks, setChecks] = useState({
    patientCoupleMatch: true,
    cycleMatch: true,
    sourceValid: true,
    sampleStateValid: true,
    intendedUseValid: true,
    sampleAvailability: true,
    processSequenceValid: true,
    operatorAuthorized: true,
  });

  // 4. Sperm Preparation & Assignment State
  const [prepId, setPrepId] = useState('PREP-26-000918');
  const [prepMethod, setPrepMethod] = useState('Density Gradient');
  const [prepDateTime, setPrepDateTime] = useState('2026-08-18T10:18');
  const [prepBy, setPrepBy] = useState('EMB-02 - Dr. Amit Verma');
  const [concentration, setConcentration] = useState(85);
  const [motility, setMotility] = useState(65);
  const [progMotility, setProgMotility] = useState(55);
  const [volume, setVolume] = useState(2.5);
  const [finalVolume, setFinalVolume] = useState(0.5);
  const [vitality, setVitality] = useState(75);
  const [morphology, setMorphology] = useState(5);
  const [prepNotes, setPrepNotes] = useState('Good post-wash recovery with high progressive motility.');

  // 5. Dish Linkage State
  const [dishId, setDishId] = useState('ICSI-DISH-26-000421');
  const [linkProcedure, setLinkProcedure] = useState<'ICSI' | 'Conventional IVF'>('ICSI');
  const [linkConfirmed, setLinkConfirmed] = useState(true);

  // 6. Authorization State
  const [isAuthorized, setIsAuthorized] = useState(true);

  // Cryopreservation 3-Step Wizard State
  const [cryoStep, setCryoStep] = useState<1 | 2 | 3>(1);
  const [cryoDate, setCryoDate] = useState('2026-05-22T11:20');
  const [cryoMethod, setCryoMethod] = useState('Slow Freezing');
  const [cryoprotectant, setCryoprotectant] = useState('Glycerol');
  const [cryoprotectantConc, setCryoprotectantConc] = useState(7);
  const [equilibrationTime, setEquilibrationTime] = useState(10);
  const [strawType, setStrawType] = useState('0.25 ml French Straw');
  const [sealingType, setSealingType] = useState('Powder');
  const [strawCount, setStrawCount] = useState(6);
  const [startingStrawNo, setStartingStrawNo] = useState('SP25-000789-S01');
  const [witnessRequired, setWitnessRequired] = useState(true);
  const [witnessName, setWitnessName] = useState('Dr. Neha Kapoor (Witness EMB-03)');

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleGenerateSampleId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const newId = `SEM-26-00${randomNum.toString().slice(0, 5)}`;
    setSampleId(newId);
    showToast(`New Sample ID generated: ${newId}`);
  }

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

      {/* TOP PATIENT / CYCLE DEMOGRAPHIC BANNER */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600 font-black text-sm">
              PT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{patientName}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {patientId}
                </span>
                <span className="rounded-md bg-pink-50 px-2 py-0.5 text-[11px] font-bold text-pink-600 border border-pink-200/60">
                  Partner: {partnerName}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Age / Sex: <strong className="text-slate-700">{ageSex}</strong> • Blood Group: <strong className="text-slate-700">B+</strong> • Primary Phone: <strong className="text-slate-700">9892590046</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Cycle / Visit ID</span>
              <span className="font-bold text-slate-700">{cycleId}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Procedure</span>
              <span className="font-bold text-pink-600">{procedure}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Cycle Day</span>
              <span className="font-bold text-slate-700">Day 16</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Active Operator</span>
              <span className="font-bold text-slate-700">{operator}</span>
            </div>
          </div>
        </div>

        {/* WORKFLOW / INTENDED USE TABS */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2">
              WORKFLOW / INTENDED USE:
            </span>
            {(['Semen Analysis', 'IUI', 'IVF / ICSI', 'Cryopreservation'] as WorkflowMode[]).map((mode) => {
              const active = workflowMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setWorkflowMode(mode);
                    showToast(`Switched workflow mode to ${mode}`);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'bg-[#181d38] text-white shadow-md shadow-slate-900/10 scale-[1.02]'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{mode}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            Electronic Witnessing Active
          </div>
        </div>
      </div>

      {/* CONDITIONAL RENDERING BASED ON WORKFLOW MODE */}
      {workflowMode === 'Cryopreservation' ? (
        /* CRYOPRESERVATION 3-STEP WIZARD (MOCKUPS 2 & 3) */
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-800 tracking-tight">
                Cryopreservation (Sperm)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Vitrification and liquid nitrogen storage protocol with multi-point straw verification
              </p>
            </div>

            {/* Stepper Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCryoStep(1)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  cryoStep === 1
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                1. Cryo Entry {cryoStep > 1 && '✓'}
              </button>
              <span className="text-slate-300">→</span>
              <button
                type="button"
                onClick={() => setCryoStep(2)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  cryoStep === 2
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                2. Vials / Straws {cryoStep > 2 && '✓'}
              </button>
              <span className="text-slate-300">→</span>
              <button
                type="button"
                onClick={() => setCryoStep(3)}
                className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                  cryoStep === 3
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                3. Review & Confirm
              </button>
            </div>
          </div>

          {/* STEP 1: CRYO ENTRY */}
          {cryoStep === 1 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Cryopreservation Details
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Freezing Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={cryoDate}
                      onChange={(e) => setCryoDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Freezing By *</label>
                    <input
                      type="text"
                      defaultValue="Dr. Amit Verma"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Method *</label>
                    <select
                      value={cryoMethod}
                      onChange={(e) => setCryoMethod(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    >
                      <option value="Slow Freezing">Slow Freezing</option>
                      <option value="Rapid Freezing">Rapid Freezing</option>
                      <option value="Vitrification">Vitrification</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Semen Volume (ml) *</label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue="2.50"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Concentration (M/ml) *</label>
                    <input
                      type="number"
                      defaultValue="48.0"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Total Motility (%) *</label>
                    <input
                      type="number"
                      defaultValue="60"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prog. Motility (%) *</label>
                    <input
                      type="number"
                      defaultValue="45"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Morphology (%) *</label>
                    <input
                      type="number"
                      defaultValue="5"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Vitality (%)</label>
                    <input
                      type="number"
                      defaultValue="70"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Leukocytes (M/ml)</label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue="0.6"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">pH</label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue="7.8"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cryoprotectant Used *</label>
                    <input
                      type="text"
                      value={cryoprotectant}
                      onChange={(e) => setCryoprotectant(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Concentration (%) *</label>
                    <input
                      type="number"
                      value={cryoprotectantConc}
                      onChange={(e) => setCryoprotectantConc(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Equilibration Time (min)</label>
                    <input
                      type="number"
                      value={equilibrationTime}
                      onChange={(e) => setEquilibrationTime(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCryoStep(2)}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-xs font-bold uppercase text-white shadow-md shadow-purple-600/20 transition"
                  >
                    Save & Next: Vials / Straws →
                  </button>
                </div>
              </div>

              {/* Sidebar Cryo Info */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4 text-xs">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Sample Summary
                </h4>
                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span>Sample ID:</span>
                    <strong className="text-slate-800 font-mono">{sampleId}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span>Sample Type:</span>
                    <strong className="text-slate-800">Ejaculate</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span>Volume:</span>
                    <strong className="text-slate-800">2.50 ml</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span>Concentration:</span>
                    <strong className="text-slate-800">48.0 M/ml</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span>Total Motility:</span>
                    <strong className="text-slate-800">60%</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span>Prog. Motility:</span>
                    <strong className="text-slate-800">45%</strong>
                  </div>
                </div>

                <div className="rounded-xl bg-purple-50 border border-purple-200/80 p-3 space-y-1">
                  <div className="text-[11px] font-bold text-purple-900">Vitrification Protocols</div>
                  <p className="text-[11px] text-purple-700 leading-relaxed">
                    Ensure glycerol dilution is performed drop-wise over 10 minutes at room temperature.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VIALS / STRAWS */}
          {cryoStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                  <span className="text-[10px] font-bold uppercase text-purple-600">Total Vials</span>
                  <div className="text-xl font-black text-purple-950 mt-1">0</div>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                  <span className="text-[10px] font-bold uppercase text-purple-600">Total Straws</span>
                  <div className="text-xl font-black text-purple-950 mt-1">{strawCount}</div>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                  <span className="text-[10px] font-bold uppercase text-purple-600">Total Volume</span>
                  <div className="text-xl font-black text-purple-950 mt-1">{(strawCount * 0.25).toFixed(2)} ml</div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <span className="text-[10px] font-bold uppercase text-emerald-600">Freezer Status</span>
                  <div className="text-xl font-black text-emerald-900 mt-1">In Freezer ({strawCount})</div>
                </div>
              </div>

              {/* Straw Creation Form */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Vial / Straw Parameters & Storage Location
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Straw Type</label>
                    <select
                      value={strawType}
                      onChange={(e) => setStrawType(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 px-3 font-medium outline-none focus:border-purple-500"
                    >
                      <option value="0.25 ml French Straw">0.25 ml French Straw</option>
                      <option value="0.5 ml French Straw">0.5 ml French Straw</option>
                      <option value="Cryovial 1.8 ml">Cryovial 1.8 ml</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Number of Straws</label>
                    <input
                      type="number"
                      value={strawCount}
                      onChange={(e) => setStrawCount(Number(e.target.value))}
                      className="h-9 w-full rounded-xl border border-slate-200 px-3 font-medium outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Starting Straw No</label>
                    <input
                      type="text"
                      value={startingStrawNo}
                      onChange={(e) => setStartingStrawNo(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 px-3 font-mono font-bold outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Storage Location (Tank / Rack)</label>
                    <select className="h-9 w-full rounded-xl border border-slate-200 px-3 font-medium outline-none focus:border-purple-500">
                      <option>Tank A &gt; Rack 3 &gt; Level 2</option>
                      <option>Tank B &gt; Canister 1 &gt; Goblet A</option>
                      <option>Tank C &gt; Canister 4 &gt; Goblet B</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Straws Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">#</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Straw No.</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Volume (ml)</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Location</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Status</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Filled By</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Filled On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {Array.from({ length: strawCount }).map((_, idx) => {
                      const strawNumber = `SP25-000789-S0${idx + 1}`;
                      return (
                        <tr key={idx} className="hover:bg-purple-50/40 transition">
                          <td className="px-3.5 py-2.5 font-bold text-slate-500">{idx + 1}</td>
                          <td className="px-3.5 py-2.5 font-mono font-bold text-purple-700">{strawNumber}</td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-700">0.25</td>
                          <td className="px-3.5 py-2.5 text-slate-700">Tank A &gt; Rack 3 &gt; Level 2</td>
                          <td className="px-3.5 py-2.5">
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              In Freezer
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-600">Dr. Amit Verma</td>
                          <td className="px-3.5 py-2.5 text-slate-500">22/05/2026 11:45 AM</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCryoStep(1)}
                  className="rounded-xl border border-slate-300 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  ← Back to Cryo Entry
                </button>
                <button
                  type="button"
                  onClick={() => setCryoStep(3)}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 px-6 py-2.5 text-xs font-bold uppercase text-white shadow-md shadow-purple-600/20 transition"
                >
                  Review &amp; Confirm Witnessing →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {cryoStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Cryopreservation &amp; Storage Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-slate-600">
                      <div>
                        Patient: <strong className="text-slate-800">{patientName} ({patientId})</strong>
                      </div>
                      <div>
                        Sample ID: <strong className="font-mono text-purple-700">{sampleId}</strong>
                      </div>
                      <div>
                        Straw Range: <strong className="font-mono text-slate-800">SP25-000789-S01 to S06</strong>
                      </div>
                      <div>
                        Straws Created: <strong className="text-slate-800">{strawCount} straws (1.50 ml)</strong>
                      </div>
                      <div>
                        Freezing Method: <strong className="text-slate-800">{cryoMethod}</strong>
                      </div>
                      <div>
                        Tank Coordinates: <strong className="text-slate-800">Tank A &gt; Rack 3 &gt; Level 2</strong>
                      </div>
                    </div>
                  </div>

                  {/* Dual Witness Verification */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white font-black text-xs">
                          ✓
                        </span>
                        Dual-Witness Verification (Mandatory Cryo Sign-Off)
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-emerald-800">
                        <input
                          type="checkbox"
                          checked={witnessRequired}
                          onChange={(e) => setWitnessRequired(e.target.checked)}
                          className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        Witness Verified
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <label className="block font-medium text-emerald-800 mb-1">Witnessing Embryologist</label>
                        <select
                          value={witnessName}
                          onChange={(e) => setWitnessName(e.target.value)}
                          className="h-9 w-full rounded-xl border border-emerald-300 bg-white px-3 font-medium text-slate-800"
                        >
                          <option>Dr. Neha Kapoor (Witness EMB-03)</option>
                          <option>Dr. Satish Sharma (EMB-01)</option>
                          <option>Dr. Amit Verma (EMB-02)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-emerald-800 mb-1">Witness Status</label>
                        <div className="h-9 flex items-center rounded-xl bg-white border border-emerald-300 px-3 font-bold text-emerald-700">
                          Completed &amp; Signed Digitally
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCryoStep(2)}
                      className="rounded-xl border border-slate-300 px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      ← Back to Vials
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        showToast('Cryopreservation record successfully saved and committed to LN2 inventory!');
                        setTimeout(() => setWorkflowMode('IVF / ICSI'), 1500);
                      }}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-8 py-2.5 text-xs font-bold uppercase text-white shadow-md shadow-emerald-600/20 transition"
                    >
                      Confirm &amp; Commit to Inventory
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4 text-xs">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Labels &amp; Barcode Printing
                  </h4>
                  <p className="text-slate-500 leading-relaxed">
                    6 cryo-resistant cryogenic labels are ready for thermal transfer print.
                  </p>
                  <button
                    type="button"
                    onClick={() => showToast('Dispatched 6 straw labels to Citizen CL-S621 Cryo Printer')}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Print 6 Straw Labels
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MAIN SPERM WITNESSING VIEW (SEMEN ANALYSIS, IUI, IVF/ICSI) */
        <div className="space-y-5">
          {/* ROW 1: SOURCE & SAMPLE DETAILS + VALIDATION SUMMARY */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            
            {/* 1. SOURCE & SAMPLE DETAILS (COL 8) */}
            <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Source &amp; Sample Details
                </h3>
                <span className="rounded-md bg-pink-50 px-2 py-0.5 text-[11px] font-bold text-pink-600 border border-pink-200/60">
                  Mode: {workflowMode}
                </span>
              </div>

              {/* Source & Sample State Radio Groups */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Source</label>
                  <div className="flex items-center gap-5 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
                      <input
                        type="radio"
                        name="sampleSource"
                        value="Husband / Partner"
                        checked={source === 'Husband / Partner'}
                        onChange={() => setSource('Husband / Partner')}
                        className="h-4 w-4 text-pink-600 border-slate-300 focus:ring-pink-500"
                      />
                      Husband / Partner
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
                      <input
                        type="radio"
                        name="sampleSource"
                        value="Donor"
                        checked={source === 'Donor'}
                        onChange={() => setSource('Donor')}
                        className="h-4 w-4 text-pink-600 border-slate-300 focus:ring-pink-500"
                      />
                      Donor
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Sample State</label>
                  <div className="flex items-center gap-4 pt-0.5">
                    {(['Fresh', 'Frozen', 'Thawed / Prepared'] as const).map((state) => (
                      <label key={state} className="flex items-center gap-1.5 cursor-pointer select-none text-xs font-medium text-slate-700">
                        <input
                          type="radio"
                          name="sampleState"
                          value={state}
                          checked={sampleState === state}
                          onChange={() => setSampleState(state)}
                          className="h-4 w-4 text-pink-600 border-slate-300 focus:ring-pink-500"
                        />
                        {state}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Collection Parameters */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Collection Date / Time</label>
                  <input
                    type="datetime-local"
                    value={collectionDateTime}
                    onChange={(e) => setCollectionDateTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Collection Method</label>
                  <select
                    value={collectionMethod}
                    onChange={(e) => setCollectionMethod(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-pink-500"
                  >
                    <option>Masturbation</option>
                    <option>PESA</option>
                    <option>TESA / TESE</option>
                    <option>Micro-TESE</option>
                    <option>Surgical Retrieval</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Abstinence (Days)</label>
                  <input
                    type="number"
                    value={abstinenceDays}
                    onChange={(e) => setAbstinenceDays(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-medium outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Sample ID & RFID / Barcode Scanning */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-end pt-1">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Original Sample ID</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={sampleId}
                      onChange={(e) => setSampleId(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-bold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateSampleId}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2.5 text-[10px] font-bold uppercase text-slate-700 hover:bg-slate-100"
                    >
                      Gen
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-slate-600 mb-1">RFID / Barcode</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={rfidBarcode}
                      onChange={(e) => setRfidBarcode(e.target.value)}
                      placeholder="Scan or enter barcode"
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs font-semibold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => showToast(`Scanned Barcode: ${rfidBarcode} verified successfully`)}
                      className="rounded-xl bg-[#181d38] hover:bg-[#23294c] px-4 py-2.5 text-xs font-bold uppercase text-white shadow-xs"
                    >
                      Scan
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 p-2 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Witness Status</span>
                    <span className="text-xs font-black text-emerald-700 mt-0.5">VALIDATED</span>
                  </div>
                </div>
              </div>

              {/* If Frozen, show storage coordinates */}
              {sampleState === 'Frozen' && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 space-y-2 text-xs">
                  <span className="font-bold text-amber-900 uppercase text-[10px]">Frozen Storage Coordinates</span>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                    <div>
                      <span className="block text-[10px] text-slate-500">Straw / Vial ID</span>
                      <strong className="font-mono text-slate-800">{strawVialId}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Tank / Canister</span>
                      <strong className="text-slate-800">{tankCanister}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Storage Location</span>
                      <strong className="text-slate-800">{storageLocation}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-500">Stored On</span>
                      <strong className="text-slate-800">{storedOn}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. VALIDATION SUMMARY (COL 4) */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5">
                2. Validation Summary
              </h3>

              <div className="space-y-2 text-xs">
                {Object.entries(checks).map(([k, v]) => {
                  const label = k
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, (str) => str.toUpperCase());
                  return (
                    <div key={k} className="flex items-center justify-between border-b border-slate-100/70 pb-1.5">
                      <span className="text-slate-600">{label}</span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-xs">
                        ✓
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status Box */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  ALL CHECKS PASSED
                </div>
                <p className="text-[11px] text-emerald-800">
                  Sample is Validated. You can proceed to next step.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => showToast('Sample accepted and locked into process pipeline')}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold uppercase text-white shadow-xs"
                >
                  Accept &amp; Continue →
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Sample placed on Clinical Hold')}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold uppercase text-rose-600 hover:bg-rose-100"
                >
                  Hold / Reject
                </button>
              </div>
            </div>

          </div>

          {/* ROW 2: PROCESS FLOW INTERACTIVE STEPPER */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              3. Process Flow ({workflowMode} Workflow)
            </h3>

            {/* Visual Stepper */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 text-center text-xs">
              {[
                { title: 'Sample Collection', time: '09:42 AM', done: true },
                { title: 'Sample Validation', time: '09:55 AM', done: true },
                { title: sampleState === 'Frozen' ? 'Thaw (Frozen)' : 'Thaw (Skipped)', time: sampleState === 'Frozen' ? '10:05 AM' : 'N/A', done: true },
                { title: 'Sperm Preparation', time: '10:18 AM', done: true },
                { title: workflowMode === 'IUI' ? 'Syringe Witness' : 'Assigned to Dish', time: '10:25 AM', done: true },
                { title: 'Complete', time: '10:30 AM', done: true },
              ].map((step, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-center">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#181d38] text-white font-bold text-[10px]">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 text-[11px] mt-1">{step.title}</div>
                  <div className="text-[10px] text-slate-500">{step.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ROW 3: SPERM PREPARATION + LINK TO DISH + AUTHORIZATION */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            
            {/* 4. SPERM PREPARATION (COL 5) */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                4. Sperm Preparation &amp; Assignment
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Preparation ID</label>
                  <input
                    type="text"
                    value={prepId}
                    onChange={(e) => setPrepId(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Preparation Method</label>
                  <select
                    value={prepMethod}
                    onChange={(e) => setPrepMethod(e.target.value)}
                    className="h-9 w-full rounded-xl border border-slate-200 px-3 font-medium text-slate-800"
                  >
                    <option>Density Gradient</option>
                    <option>Swim Up</option>
                    <option>Simple Wash</option>
                    <option>MACS Separation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Count (M/ml)</label>
                  <input
                    type="number"
                    value={concentration}
                    onChange={(e) => setConcentration(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Motility (%)</label>
                  <input
                    type="number"
                    value={motility}
                    onChange={(e) => setMotility(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Prog. Motility (%)</label>
                  <input
                    type="number"
                    value={progMotility}
                    onChange={(e) => setProgMotility(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Pre Vol (ml)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Final Vol (ml)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={finalVolume}
                    onChange={(e) => setFinalVolume(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Vitality (%)</label>
                  <input
                    type="number"
                    value={vitality}
                    onChange={(e) => setVitality(Number(e.target.value))}
                    className="h-9 w-full rounded-xl border border-slate-200 px-2 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Preparation Notes</label>
                <input
                  type="text"
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* 5. LINK TO IVF / ICSI / IUI (COL 4) */}
            <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                5. Link to {workflowMode === 'IUI' ? 'IUI Syringe' : 'IVF / ICSI Dish'}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    {workflowMode === 'IUI' ? 'Insemination Syringe ID' : 'Oocyte / Dish ID'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={dishId}
                      onChange={(e) => setDishId(e.target.value)}
                      className="h-9 w-full rounded-xl border border-slate-200 px-3 font-mono font-bold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => showToast(`Dish scanned and linked: ${dishId}`)}
                      className="rounded-xl bg-[#181d38] px-3.5 py-2 text-xs font-bold text-white uppercase"
                    >
                      Scan
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Procedure Type</label>
                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="linkProc"
                        value="ICSI"
                        checked={linkProcedure === 'ICSI'}
                        onChange={() => setLinkProcedure('ICSI')}
                        className="h-4 w-4 text-pink-600 border-slate-300"
                      />
                      ICSI
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="linkProc"
                        value="Conventional IVF"
                        checked={linkProcedure === 'Conventional IVF'}
                        onChange={() => setLinkProcedure('Conventional IVF')}
                        className="h-4 w-4 text-pink-600 border-slate-300"
                      />
                      Conventional IVF
                    </label>
                  </div>
                </div>

                {/* Link Badge */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-base">
                    🔗
                  </div>
                  <div>
                    <div className="font-bold text-emerald-900 text-xs">LINK CONFIRMED</div>
                    <div className="text-[10px] text-emerald-700">
                      Sperm sample successfully linked to ICSI/IVF dish.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. FINAL AUTHORIZATION (COL 3) */}
            <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                6. Authorization (Final Witness)
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Patient / Cycle Match</span>
                  <span className="font-bold text-emerald-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Sperm Source Match</span>
                  <span className="font-bold text-emerald-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Dish / Syringe Match</span>
                  <span className="font-bold text-emerald-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Operator Authorized</span>
                  <span className="font-bold text-emerald-600">✓</span>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-center space-y-1">
                <div className="font-black text-emerald-800 text-xs uppercase tracking-wider">
                  AUTHORIZED
                </div>
                <p className="text-[10px] text-emerald-700">
                  Ready to proceed for {workflowMode === 'IUI' ? 'IUI Insemination' : 'ICSI / IVF Procedure'}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => showToast('Authorized: Electronic witness record locked and time-stamped.')}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold uppercase text-white shadow-md shadow-emerald-600/20 transition"
              >
                Authorize {workflowMode === 'IUI' ? 'IUI' : 'IVF / ICSI'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
