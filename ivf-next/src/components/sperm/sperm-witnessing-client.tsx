'use client';

import React, { useState, useEffect } from 'react';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';
import { SemenSelfForm } from '@/components/cryo/semen-self-form';
import { SemenDonorForm } from '@/components/cryo/semen-donor-form';
import {
  defaultSelectionFromMode,
  deriveSpermFlow,
  type SpermFlowSelection,
  type SpermSource,
  type SampleState,
  type IntendedUse,
  type SemenAnalysisType,
  type IuiIndication,
  type CycleIndication,
  type AnalysisEntryPath,
} from '@/lib/sperm-flow';

export type { SpermSource, SampleState, IntendedUse, SemenAnalysisType, IuiIndication };

export function SpermWitnessingClient() {
  const { selectedPatient } = usePatient();
  const { user } = useAuth();

  // Workflow View State: 'registration' (Default initial view) | 'workflow' (Downstream view after Accept & Continue)
  const [currentView, setCurrentView] = useState<'registration' | 'workflow'>('registration');

  // 1. Top Bar Demographics — never invent a patient when none is selected
  const hasPatient = Boolean(selectedPatient);
  const blank = '—';
  const patientId = selectedPatient?.uhid || (selectedPatient?.id ? String(selectedPatient.id) : blank);
  const patientName = selectedPatient?.name || blank;
  const ageSex = selectedPatient
    ? `${selectedPatient.age || blank} Y / ${selectedPatient.gender || 'F'}`
    : blank;
  const lmpDate = blank;
  const cycleDay = blank;
  const displayDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const operator = user?.userName || blank;

  // Outcome-first registration (SMART indication drives source / type / fields)
  const [flowSel, setFlowSel] = useState<SpermFlowSelection>(() => defaultSelectionFromMode('IUI'));
  const flow = deriveSpermFlow(flowSel);

  const spermSource = flow.spermSource;
  const sampleState = flow.sampleState;
  const intendedUse = flow.intendedUse;
  const semenAnalysisType: SemenAnalysisType = flow.semenAnalysisType ?? flowSel.analysisType;
  const iuiIndication = flowSel.iuiIndication;

  function patchFlow(partial: Partial<SpermFlowSelection>) {
    setFlowSel((prev) => ({ ...prev, ...partial }));
  }

  function setSemenAnalysisType(type: SemenAnalysisType) {
    patchFlow({ analysisType: type, iuiIndication: type });
  }

  function applyRadios(next: { source?: SpermSource; state?: SampleState; use?: IntendedUse }) {
    const source = next.source ?? spermSource;
    const rawState = next.state ?? sampleState;
    const state: 'Fresh' | 'Frozen' = rawState === 'Frozen' || rawState === 'Thawed / Prepared' ? 'Frozen' : 'Fresh';
    const use = next.use ?? intendedUse;
    const preferDouble = flow.iuiInscription === 'DOUBLE';

    if (use === 'Semen Analysis') {
      patchFlow({
        module: 'SEMEN_ANALYSIS',
        analysisType: flowSel.analysisType,
        iuiIndication: flowSel.analysisType,
      });
      return;
    }
    if (use === 'Cryopreservation') {
      patchFlow({
        module: 'CRYOPRESERVATION',
        cryoType: state === 'Frozen' ? 'Frozen' : 'Fresh',
        cryoSource: source,
      });
      return;
    }
    if (use === 'IVF / ICSI') {
      patchFlow({
        module: 'CYCLE',
        cycleSpermId: source === 'Donor' ? 'donor_frozen' : state === 'Frozen' ? 'husband_frozen' : 'husband_fresh',
      });
      return;
    }

    let indication: IuiIndication;
    if (source === 'Donor') indication = preferDouble ? 'DONOR DOUBLE IUI' : 'DONOR SINGLE IUI';
    else if (state === 'Frozen') indication = preferDouble ? 'HUSBAND THAW DOUBLE' : 'HUSBAND THAW SINGLE';
    else indication = preferDouble ? 'HUSBAND DOUBLE IUI' : 'HUSBAND SINGLE IUI';
    patchFlow({ module: 'IUI', iuiIndication: indication });
  }

  // URL Query Sync — module from SMART nav shortcuts
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setFlowSel(defaultSelectionFromMode(params.get('mode')));
  }, []);

  useEffect(() => {
    if (!hasPatient) setCurrentView('registration');
  }, [hasPatient]);

  useEffect(() => {
    if (!selectedPatient) {
      setPartnerId('');
      setPartnerDobAge('');
      setPartnerPhone('');
      return;
    }
    setPartnerId(selectedPatient.uhid || String(selectedPatient.id));
    setPartnerDobAge(selectedPatient.age ? `${selectedPatient.age} Y` : '');
    setPartnerPhone(selectedPatient.mobile || selectedPatient.phone || '');
  }, [selectedPatient]);

  const cycleVisitId = !hasPatient
    ? blank
    : intendedUse === 'IUI'
    ? 'IUI-pending'
    : intendedUse === 'Semen Analysis'
    ? (semenAnalysisType === 'HSA' ? 'HSA-pending' : 'SQA-pending')
    : intendedUse === 'Cryopreservation'
    ? 'CRYO-pending'
    : 'IVF-pending';

  const procedureLabel = intendedUse === 'IUI' 
    ? `IUI (${iuiIndication})` 
    : intendedUse === 'Semen Analysis' 
    ? (semenAnalysisType === 'HSA' ? 'Semen Analysis (HSA)' : 'Semen Qualitative Analysis (SQA)') 
    : intendedUse === 'Cryopreservation' 
    ? 'Sperm Cryopreservation' 
    : 'IVF / ICSI';

  // Collection fields
  const [collectionDateTime, setCollectionDateTime] = useState('');
  const [collectionMethod, setCollectionMethod] = useState('Masturbation');
  const [abstinenceDays, setAbstinenceDays] = useState(0);
  const [collectedBy, setCollectedBy] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');

  // Identifiers & Witness Scanning
  const [sampleId, setSampleId] = useState('');
  const [rfidBarcode, setRfidBarcode] = useState('');
  const [isValidated, setIsValidated] = useState(false);

  // Source details
  const [partnerId, setPartnerId] = useState('');
  const [partnerDobAge, setPartnerDobAge] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [frozenStrawId, setFrozenStrawId] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [donorType, setDonorType] = useState('Select');
  const [consentVerified, setConsentVerified] = useState(false);

  // Traceability Sample IDs
  const [prepSampleId, setPrepSampleId] = useState('');
  const [finalSyringeId, setFinalSyringeId] = useState('');

  // Semen Analysis Parameters (Box 5: Before Processing / Pre-Freezing)
  const [volume, setVolume] = useState('');
  const [appearance, setAppearance] = useState('');
  const [liquefaction, setLiquefaction] = useState('');
  const [ph, setPh] = useState('');
  const [concentration, setConcentration] = useState('');
  const [totalCount, setTotalCount] = useState('');
  const [progMotility, setProgMotility] = useState('');
  const [totalMotility, setTotalMotility] = useState('');
  const [morphology, setMorphology] = useState('');
  const [vitality, setVitality] = useState('');
  const [wbc, setWbc] = useState('');
  const [agglutination, setAgglutination] = useState('');
  const [analysisRemarks, setAnalysisRemarks] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [analysisSaved, setAnalysisSaved] = useState(false);

  // Post-Processing & Survival Motility Parameters (SQA & IUI Wash / Thaw)
  const [postVolume, setPostVolume] = useState('');
  const [postCount, setPostCount] = useState('');
  const [postProgMotility, setPostProgMotility] = useState('');
  const [postTotalMotility, setPostTotalMotility] = useState('');
  const [survival24Hr, setSurvival24Hr] = useState('');
  const [survival12Hr, setSurvival12Hr] = useState('');
  const [prepMethod, setPrepMethod] = useState('');
  const [prepMedia, setPrepMedia] = useState('');
  const [linearity, setLinearity] = useState('');

  // Pre-IUI Authorization (Box 6)
  const [authBy, setAuthBy] = useState('');
  const [authTime, setAuthTime] = useState('');

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleGenerateSampleId() {
    if (!hasPatient) {
      showToast('Select a patient first.');
      return;
    }
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    const newId = `SEM-26-${randomNum.toString().slice(0, 8)}`;
    setSampleId(newId);
    showToast(`New Original Sample ID generated: ${newId}`);
  }

  function handleBarcodeScan() {
    if (!hasPatient) {
      showToast('Select a patient first.');
      return;
    }
    if (!rfidBarcode.trim()) {
      showToast('Scan or enter a barcode / RFID.');
      return;
    }
    setIsValidated(true);
    showToast(`Scanned tag ${rfidBarcode} verified successfully!`);
  }

  return (
    <div className="mx-auto w-full space-y-4 font-sans text-slate-800 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-white p-4 shadow-2xl ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800">{toast}</span>
        </div>
      )}

      {/* TOP PATIENT / CYCLE HEADER BAR (Matches Screenshot 2 top bar) */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-y-3 text-xs">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Female Patient ID</span>
            <span className="font-bold text-blue-600 font-mono text-sm">{patientId}</span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Name</span>
            <span className={`text-sm ${hasPatient ? 'font-bold text-slate-800' : 'font-medium text-slate-400'}`}>
              {hasPatient ? patientName : 'Select a patient'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Age / Sex</span>
            <span className="font-semibold text-slate-700">{ageSex}</span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Cycle / Visit ID</span>
            <span className="font-bold text-blue-600 font-mono">{cycleVisitId}</span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Procedure</span>
            <span className="font-bold text-blue-700">{procedureLabel}</span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">LMP</span>
            <span className="font-semibold text-slate-700">{lmpDate}</span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Cycle Day</span>
            <span className="font-bold text-slate-800">{cycleDay}</span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</span>
            <span className="font-semibold text-slate-700">{displayDate}</span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Operator</span>
            <span className="font-semibold text-slate-700">{operator}</span>
          </div>
        </div>
      </div>

      {/* INITIAL VIEW: SPERM SAMPLE REGISTRATION & VALIDATION SUMMARY (ONLY BOX 1 & BOX 2) */}
      {currentView === 'registration' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* 1. SPERM SAMPLE REGISTRATION (COL 8) */}
            <div className="lg:col-span-8 rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
              {/* Header */}
              <div className="bg-[#0b4a8b] px-4 py-2 text-white flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider">
                  1. SPERM SAMPLE REGISTRATION
                </h2>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded font-medium">
                  {flow.summaryTitle || intendedUse}
                </span>
              </div>

              <div className="p-4 space-y-4 text-xs">
                {/* Outcome-first: module + SMART indication, then derived source/type */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-b border-slate-200 pb-4">
                  <div className="md:col-span-9 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2">1. SPERM SOURCE</label>
                        <div className="space-y-2">
                          {(['Husband / Partner', 'Donor'] as SpermSource[]).map((src) => {
                            const donorBlocked = intendedUse === 'Semen Analysis' && src === 'Donor';
                            return (
                              <label
                                key={src}
                                className={`flex items-center gap-2 text-[11px] font-medium ${
                                  donorBlocked ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="spermSource"
                                  checked={spermSource === src}
                                  disabled={donorBlocked}
                                  onChange={() =>
                                    applyRadios({
                                      source: src,
                                      state:
                                        src === 'Donor' && intendedUse !== 'Cryopreservation'
                                          ? 'Frozen'
                                          : sampleState,
                                    })
                                  }
                                  className="h-4 w-4 text-blue-600 border-slate-300"
                                />
                                <span>{src}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2">2. SAMPLE STATE</label>
                        <div className="space-y-2">
                          {(['Fresh', 'Frozen', 'Thawed / Prepared'] as SampleState[]).map((state) => {
                            const donorFreshBlocked =
                              spermSource === 'Donor' &&
                              state === 'Fresh' &&
                              intendedUse !== 'Cryopreservation';
                            const analysisFrozenBlocked = intendedUse === 'Semen Analysis' && state !== 'Fresh';
                            const cryoThawBlocked = intendedUse === 'Cryopreservation' && state === 'Thawed / Prepared';
                            const blocked = donorFreshBlocked || analysisFrozenBlocked || cryoThawBlocked;
                            return (
                              <label
                                key={state}
                                className={`flex items-center gap-2 text-[11px] font-medium ${
                                  blocked ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="sampleState"
                                  checked={sampleState === state}
                                  disabled={blocked}
                                  onChange={() => applyRadios({ state })}
                                  className="h-4 w-4 text-blue-600 border-slate-300"
                                />
                                <span>{state}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-2">3. INTENDED USE</label>
                        <div className="space-y-2">
                          {(['Semen Analysis', 'IUI', 'IVF / ICSI', 'Cryopreservation'] as IntendedUse[]).map((use) => {
                            const hsaDonorDisabled = spermSource === 'Donor' && use === 'Semen Analysis';
                            return (
                              <label
                                key={use}
                                className={`flex items-center gap-2 text-[11px] font-medium ${
                                  hsaDonorDisabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="intendedUse"
                                  checked={intendedUse === use}
                                  disabled={hsaDonorDisabled}
                                  onChange={() => applyRadios({ use })}
                                  className="h-4 w-4 text-blue-600 border-slate-300"
                                />
                                <span>{use}</span>
                              </label>
                            );
                          })}
                        </div>
                        {intendedUse === 'Semen Analysis' && (
                          <div className="mt-3">
                            <select
                              value={`${semenAnalysisType}|${flowSel.analysisEntryPath}`}
                              onChange={(e) => {
                                const [type, path] = e.target.value.split('|') as [SemenAnalysisType, AnalysisEntryPath];
                                patchFlow({ analysisType: type, iuiIndication: type, analysisEntryPath: path });
                              }}
                              className="h-7 w-full rounded border border-slate-300 bg-white px-2 text-[11px] font-bold text-slate-800"
                            >
                              <option value="HSA|iui">HSA — Via IUI</option>
                              <option value="HSA|cycle">HSA — Via Cycle</option>
                              <option value="SQA|iui">SQA — Via IUI</option>
                              <option value="SQA|cycle">SQA — Via Cycle</option>
                            </select>
                          </div>
                        )}
                        {intendedUse === 'IUI' && (
                          <div className="mt-3 flex items-center gap-4">
                            {(['SINGLE', 'DOUBLE'] as const).map((n) => (
                              <label key={n} className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                                <input
                                  type="radio"
                                  name="iuiInscription"
                                  checked={(flow.iuiInscription || 'SINGLE') === n}
                                  onChange={() => {
                                    const double = n === 'DOUBLE';
                                    let indication: IuiIndication;
                                    if (spermSource === 'Donor') indication = double ? 'DONOR DOUBLE IUI' : 'DONOR SINGLE IUI';
                                    else if (sampleState === 'Frozen') indication = double ? 'HUSBAND THAW DOUBLE' : 'HUSBAND THAW SINGLE';
                                    else indication = double ? 'HUSBAND DOUBLE IUI' : 'HUSBAND SINGLE IUI';
                                    patchFlow({ iuiIndication: indication });
                                  }}
                                  className="h-3.5 w-3.5 text-blue-600"
                                />
                                {n}
                              </label>
                            ))}
                          </div>
                        )}
                        {intendedUse === 'IVF / ICSI' && (
                          <div className="mt-3 flex items-center gap-4">
                            {(['IVF', 'ICSI'] as CycleIndication[]).map((c) => (
                              <label key={c} className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold">
                                <input type="radio" name="cycleIndication" checked={flowSel.cycleIndication === c} onChange={() => patchFlow({ cycleIndication: c })} className="h-3.5 w-3.5 text-blue-600" />
                                {c}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>


                  {/* Collection Parameters — shown when SMART requires a fresh collection */}
                  <div className={`md:col-span-3 space-y-2.5 ${flow.collectionRequired ? '' : 'opacity-40 pointer-events-none'}`}>
                    {!flow.collectionRequired && (
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        Collection N/A for this outcome (frozen bank / TIC)
                      </p>
                    )}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Collection Date / Time</label>
                      <input
                        type="datetime-local"
                        value={collectionDateTime}
                        onChange={(e) => setCollectionDateTime(e.target.value)}
                        className="h-7 w-full rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Collection Method</label>
                      <select
                        value={collectionMethod}
                        onChange={(e) => setCollectionMethod(e.target.value)}
                        className="h-7 w-full rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-blue-500"
                      >
                        <option>Masturbation</option>
                        <option>PESA</option>
                        <option>TESA / TESE</option>
                        <option>Micro-TESE</option>
                        <option>Surgical Retrieval</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Abstinence (Days)</label>
                      <input
                        type="number"
                        value={abstinenceDays}
                        onChange={(e) => setAbstinenceDays(Number(e.target.value))}
                        className="h-7 w-full rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Collected By</label>
                      <select
                        value={collectedBy}
                        onChange={(e) => setCollectedBy(e.target.value)}
                        className="h-7 w-full rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option>EMB-01 - Dr. Satish</option>
                        <option>EMB-02 - Dr. Amit Verma</option>
                        <option>EMB-03 - Dr. Neha Kapoor</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Received By</label>
                      <select
                        value={receivedBy}
                        onChange={(e) => setReceivedBy(e.target.value)}
                        className="h-7 w-full rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option>EMB-01 - Dr. Satish</option>
                        <option>EMB-02 - Dr. Amit Verma</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Notes</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter notes if any..."
                        className="h-7 w-full rounded border border-slate-300 px-2 text-[11px] outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Section: Sample ID, QR Code, RFID Barcode & Status */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-slate-200 pb-4">
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Original Sample ID</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={sampleId}
                        onChange={(e) => setSampleId(e.target.value)}
                        className="h-8 w-full rounded border border-slate-300 px-2 font-mono font-bold text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateSampleId}
                        className="h-8 rounded bg-[#0b4a8b] hover:bg-blue-800 px-2.5 text-[10px] font-bold text-white whitespace-nowrap"
                      >
                        Generate ID
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="md:col-span-3 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-600 mb-1">QR Code</span>
                    <div className="h-16 w-16 bg-slate-900 p-1.5 rounded flex items-center justify-center shadow-xs">
                      <svg viewBox="0 0 24 24" className="h-full w-full fill-white">
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm-2 10h8v8H2v-8zm2 2v4h4v-4H4zm10-14h8v8h-8V2zm2 2v4h4V4h-4zm-1 9h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 3h2v2h-2v-2zm2-3h2v2h-2v-2zm-2-3h2v2h-2v-2zm3-3h2v2h-2v-2zm-6 9h2v2h-2v-2z" />
                      </svg>
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 font-medium">Scan to Validate</span>
                  </div>

                  {/* RFID / Barcode */}
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">RFID / Barcode</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={rfidBarcode}
                        onChange={(e) => setRfidBarcode(e.target.value)}
                        placeholder="Scan / Enter Barcode or RFID"
                        className="h-8 w-full rounded border border-slate-300 px-2 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleBarcodeScan}
                        className="h-8 rounded bg-[#0b4a8b] hover:bg-blue-800 px-4 text-xs font-bold text-white whitespace-nowrap"
                      >
                        Scan
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Status</span>
                      {isValidated ? (
                        <span className="rounded bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          VALIDATED ✓
                        </span>
                      ) : (
                        <span className="rounded bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                          NOT YET VALIDATED
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SOURCE DETAILS */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">SOURCE DETAILS</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 items-end">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">
                        {spermSource === 'Donor' ? 'Donor ID' : 'Husband / Partner ID'}
                      </label>
                      <input
                        type="text"
                        value={partnerId}
                        onChange={(e) => setPartnerId(e.target.value)}
                        className="h-7 w-full rounded border border-slate-300 px-2 font-mono font-bold text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">DOB / Age</label>
                      <input
                        type="text"
                        value={partnerDobAge}
                        onChange={(e) => setPartnerDobAge(e.target.value)}
                        className="h-7 w-full rounded border border-slate-300 px-2 font-medium text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Phone</label>
                      <input
                        type="text"
                        value={partnerPhone}
                        onChange={(e) => setPartnerPhone(e.target.value)}
                        className="h-7 w-full rounded border border-slate-300 px-2 font-medium text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">
                        {sampleState === 'Fresh'
                          ? 'Frozen Straw ID'
                          : spermSource === 'Donor'
                          ? 'Donor Frozen Straw (Drop Down)'
                          : 'Husband Frozen Straw (Drop Down)'}
                      </label>
                      {sampleState === 'Fresh' ? (
                        <input
                          type="text"
                          value="NA"
                          disabled
                          className="h-7 w-full rounded border border-slate-200 bg-slate-100 px-2 font-mono text-[11px] text-slate-400 font-bold"
                        />
                      ) : spermSource === 'Donor' ? (
                        <select
                          value={frozenStrawId}
                          onChange={(e) => {
                            setFrozenStrawId(e.target.value);
                          }}
                          className="h-7 w-full rounded border border-blue-400 bg-blue-50/50 px-2 font-mono text-[11px] font-bold text-blue-800"
                        >
                          <option value="DON-2026/001">DON-2026/001 (CryoLife / B+)</option>
                          <option value="DON-2026/002">DON-2026/002 (LifeCell / O+)</option>
                          <option value="DON-2026/003">DON-2026/003 (Mumbai Bank / A+)</option>
                        </select>
                      ) : (
                        <select
                          value={frozenStrawId}
                          onChange={(e) => {
                            setFrozenStrawId(e.target.value);
                          }}
                          className="h-7 w-full rounded border border-blue-400 bg-blue-50/50 px-2 font-mono text-[11px] font-bold text-blue-800"
                        >
                          <option value="FROZ-26-000554">FROZ-26-000554 (Tank 1 / Can 2)</option>
                          <option value="FROZ-26-000412">FROZ-26-000412 (Tank 2 / Can 1)</option>
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Storage Location</label>
                      <select
                        value={storageLocation}
                        onChange={(e) => setStorageLocation(e.target.value)}
                        disabled={sampleState === 'Fresh'}
                        className={`h-7 w-full rounded border px-2 text-[11px] ${
                          sampleState === 'Fresh'
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : 'border-slate-300'
                        }`}
                      >
                        <option>Tank 1 - Canister 2</option>
                        <option>Tank 2 - Canister 1</option>
                        <option>Tank 3 - Canister 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Donor Type</label>
                      <select
                        value={donorType}
                        onChange={(e) => setDonorType(e.target.value)}
                        disabled={spermSource !== 'Donor'}
                        className={`h-7 w-full rounded border px-2 text-[11px] ${
                          spermSource !== 'Donor' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'border-slate-300'
                        }`}
                      >
                        <option>Select</option>
                        <option>Anonymous</option>
                        <option>Open Identity</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 pb-1">
                      <input
                        type="checkbox"
                        id="consentCheck"
                        checked={consentVerified}
                        onChange={(e) => setConsentVerified(e.target.checked)}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <label htmlFor="consentCheck" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                        Consent Verified
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. VALIDATION SUMMARY (COL 4) */}
            <div className="lg:col-span-4 rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="bg-[#0b4a8b] px-4 py-2 text-white flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider">
                    2. VALIDATION SUMMARY
                  </h2>
                </div>

                <div className="p-4 space-y-2 text-xs">
                  {[
                    { key: 'patientCoupleMatch', label: 'Patient / Couple Match', ok: hasPatient },
                    { key: 'cycleVisitMatch', label: 'Cycle / Visit Match', ok: hasPatient },
                    { key: 'sourceValid', label: 'Source Valid', ok: hasPatient },
                    { key: 'sampleStateValid', label: 'Sample State Valid', ok: hasPatient },
                    { key: 'intendedUseValid', label: 'Intended Use Valid', ok: hasPatient },
                    { key: 'sampleAvailability', label: 'Sample Availability', ok: hasPatient && Boolean(sampleId) },
                    { key: 'processSequenceValid', label: 'Process Sequence Valid', ok: hasPatient && isValidated },
                    { key: 'operatorAuthorized', label: 'Operator Authorized', ok: Boolean(user) },
                  ].map(({ key, label, ok }) => (
                    <div key={key} className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-600 text-[11px]">{label}</span>
                      <span className={`font-bold text-xs ${ok ? 'text-emerald-600' : 'text-slate-300'}`}>{ok ? '✓' : '—'}</span>
                    </div>
                  ))}

                  {/* Status Banner */}
                  {hasPatient ? (
                    <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          <polyline points="9 12 11 14 15 10" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-black text-emerald-900 text-xs tracking-wide">PATIENT SELECTED</div>
                        <div className="text-[11px] text-emerald-800">Complete sample details, then continue.</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
                      <div className="font-black text-amber-900 text-xs tracking-wide">NO PATIENT SELECTED</div>
                      <div className="text-[11px] text-amber-800">Use Select Patient in the top bar. No sample data is shown until then.</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!hasPatient) {
                      showToast('Select a patient first. No sample data is created without a patient.');
                      return;
                    }
                    setCurrentView('workflow');
                    showToast(
                      flow.skipAndrology
                        ? 'TIC / FM selected. Follicular study only — andrology inputs skipped.'
                        : `Outcome locked: ${flow.summaryTitle || intendedUse}. Opening SMART inputs...`
                    );
                  }}
                  className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-bold text-white shadow-xs transition"
                >
                  Accept &amp; Continue →
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Sample placed on Clinical Hold / Rejected')}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition"
                >
                  Hold / Reject ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DOWNSTREAM WORKFLOW VIEW (Appears on clicking Accept & Continue or selecting flow) */
        <div className="space-y-4">
          {/* Navigation Bar to switch back to registration */}
          <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => setCurrentView('registration')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
            >
              ← Back to Registration
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Current Flow:</span>
              <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700">
                {flow.summaryTitle || intendedUse} • {spermSource} • {sampleState}
              </span>
            </div>
          </div>

          {/* DYNAMIC SCREEN ROUTING BASED ON INTENDED USE & SPERM SOURCE */}
          {intendedUse === 'Cryopreservation' ? (
            spermSource === 'Donor' ? (
              <SemenDonorForm onBack={() => setCurrentView('registration')} />
            ) : (
              <SemenSelfForm cryoType={flowSel.cryoType} onBack={() => setCurrentView('registration')} />
            )
          ) : flow.skipAndrology ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
              <h3 className="text-sm font-black text-slate-800">TIC / FM — Andrology not required</h3>
              <p className="mt-2 text-xs text-slate-600 max-w-xl mx-auto">
                SMART IUI flow: indication TIC/FM needs follicular study only. Sperm ID, type, before/after processing, and HSA/SQA radios are not used.
              </p>
            </div>
          ) : (
            /* STANDARD ANDROLOGY FLOW: BOX 3, BOX 4, BOX 5 / BOX 6 / BOX 7 */
            <>
              {/* ROW 2: BOX 3 (PROCESS FLOW SPERM / IUI / IVF / SEMEN ANALYSIS WORKFLOW) */}
              <div className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
                <div className="bg-[#0b4a8b] px-4 py-2 text-white flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider">
                    3. PROCESS FLOW ({intendedUse.toUpperCase()} {intendedUse === 'Semen Analysis' ? `• ${semenAnalysisType}` : intendedUse === 'IUI' ? `• ${iuiIndication}` : ''})
                  </h2>
                  <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded font-medium">
                    {spermSource} • {sampleState}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-8 items-center text-center">
                    {(intendedUse === 'Semen Analysis' ? [
                      { label: 'Sample Collection', icon: '🧪', status: 'completed' },
                      { label: 'Sample Validation', icon: '🛡️', status: 'active' },
                      { label: 'Liquefaction (30m)', icon: '⏱️', status: 'ready' },
                      { label: 'Macroscopic Exam', icon: '🔍', status: 'ready' },
                      { label: 'Microscopic Exam', icon: '🔬', status: 'ready' },
                      { label: semenAnalysisType === 'SQA' ? 'Wash Prep (SQA)' : 'Wash (N/A HSA)', icon: '🧬', status: semenAnalysisType === 'SQA' ? 'ready' : 'skipped' },
                      { label: semenAnalysisType === 'SQA' ? '24-Hr Survival' : 'Survival (N/A HSA)', icon: '📊', status: semenAnalysisType === 'SQA' ? 'ready' : 'skipped' },
                      { label: 'Report Sign-off', icon: '✅', status: 'ready' },
                    ] : intendedUse === 'IVF / ICSI' ? [
                      { label: 'Sample Received', icon: '🧪', status: 'completed' },
                      { label: 'Sample Validation', icon: '🛡️', status: 'active' },
                      { label: sampleState === 'Frozen' ? 'Thaw Straw' : 'Density Gradient', icon: '🧬', status: 'ready' },
                      { label: 'Post-Prep Eval', icon: '🔬', status: 'ready' },
                      { label: 'Fertilization Dish', icon: '🧫', status: 'ready' },
                      { label: 'Witness Cohort Match', icon: '🔒', status: 'ready' },
                      { label: 'Insemination / ICSI', icon: '💉', status: 'ready' },
                      { label: 'Incubator Culture', icon: '✅', status: 'ready' },
                    ] : [
                      { label: 'Sample Collection', icon: '🧪', status: 'completed' },
                      { label: 'Sample Validation', icon: '🛡️', status: 'active' },
                      { label: sampleState === 'Frozen' ? 'Thaw Straw' : 'Sperm Wash', icon: sampleState === 'Frozen' ? '❄️' : '🧬', status: 'ready' },
                      { label: sampleState === 'Frozen' ? 'Post-Thaw Eval' : 'Post-Wash Eval', icon: '🧪', status: 'ready' },
                      { label: 'Final Syringe (IUI)', icon: '💉', status: 'ready' },
                      { label: 'Double Witnessing', icon: '👥', status: 'ready' },
                      { label: 'Pre-IUI Authorization', icon: '🔒', status: 'ready' },
                      { label: 'Insemination Done', icon: '✅', status: 'ready' },
                    ]).map((step, idx) => {
                      const isCurrent = step.status === 'active';
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div
                            className={`h-11 w-11 rounded-full flex items-center justify-center text-base border-2 shadow-xs transition ${
                              isCurrent
                                ? 'border-blue-600 bg-blue-50 text-blue-800 scale-105 ring-2 ring-blue-400/40'
                                : step.status === 'completed'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : step.status === 'skipped'
                                ? 'border-slate-200 bg-slate-100 text-slate-300 line-through'
                                : 'border-slate-200 bg-slate-50 text-slate-400'
                            }`}
                          >
                            {step.icon}
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 mt-1.5 leading-tight">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      You are here: <span className="underline">Sample Validation</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ROW 3: BOX 4 (SAMPLE INFORMATION & TRACEABILITY) */}
              <div className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
                <div className="bg-[#0b4a8b] px-4 py-2 text-white">
                  <h2 className="text-xs font-bold uppercase tracking-wider">
                    4. SAMPLE INFORMATION &amp; TRACEABILITY
                  </h2>
                </div>

                <div className="p-4 space-y-4">
                  {/* Sample Lineage Flow */}
                  <div className="flex flex-wrap items-center justify-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs font-mono">
                    <div className="text-center">
                      <span className="block text-[10px] uppercase font-sans font-bold text-slate-500">Original Sample ID</span>
                      <strong className="text-blue-700 text-sm">{sampleId}</strong>
                    </div>
                    <span className="text-slate-400 font-bold text-lg font-sans">➔</span>
                    <div className="text-center">
                      <span className="block text-[10px] uppercase font-sans font-bold text-slate-500">
                        {intendedUse === 'Semen Analysis' ? 'Analysis Method' : 'Prepared Sample ID'}
                      </span>
                      <strong className="text-slate-800 text-sm">
                        {intendedUse === 'Semen Analysis'
                          ? (semenAnalysisType === 'HSA' ? 'HSA (Diagnostic Baseline)' : 'SQA (Qualitative + Survival)')
                          : prepSampleId}
                      </strong>
                    </div>
                    <span className="text-slate-400 font-bold text-lg font-sans">➔</span>
                    <div className="text-center">
                      <span className="block text-[10px] uppercase font-sans font-bold text-slate-500">
                        {intendedUse === 'Semen Analysis'
                          ? 'Summary Report'
                          : intendedUse === 'IVF / ICSI'
                          ? 'Fertilization Dish ID'
                          : 'Final Syringe ID'}
                      </span>
                      <strong className="text-emerald-700 text-sm">
                        {intendedUse === 'Semen Analysis'
                          ? (semenAnalysisType === 'HSA' ? 'HSASummary.rdlc (1 Page)' : 'SQASummary.rdlc (1 Page)')
                          : intendedUse === 'IVF / ICSI'
                          ? 'ICSI-DISH-00158'
                          : finalSyringeId}
                      </strong>
                    </div>
                  </div>

                  {/* Traceability Table */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="px-3 py-2 text-left">Step</th>
                          <th className="px-3 py-2 text-left">ID / Description</th>
                          <th className="px-3 py-2 text-left">Date / Time</th>
                          <th className="px-3 py-2 text-left">Operator</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {!(hasPatient && sampleId) ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-4 text-center text-slate-400">
                              No sample recorded. Select a patient and generate a sample ID.
                            </td>
                          </tr>
                        ) : (intendedUse === 'Semen Analysis' ? [
                          { step: 'Sample Received', id: sampleId, time: '18-Aug-2026 09:42', operator: 'EMB-01', status: '✓' },
                          { step: 'Sample Validated', id: sampleId, time: '18-Aug-2026 09:55', operator: 'EMB-01', status: '✓' },
                          { step: 'Liquefaction Evaluation', id: `${liquefaction} min`, time: '18-Aug-2026 10:12', operator: 'EMB-01', status: '✓' },
                          { step: 'Macroscopic Exam (Vol / pH / Viscosity)', id: `${volume} ml / pH ${ph}`, time: '18-Aug-2026 10:15', operator: 'EMB-02', status: '✓' },
                          { step: 'Microscopic Exam (Count / Motility / Morph)', id: `${concentration} M/ml / ${progMotility}% PR`, time: '18-Aug-2026 10:20', operator: 'EMB-02', status: '✓' },
                          ...(semenAnalysisType === 'SQA' ? [
                            { step: 'Sample Wash Preparation', id: prepMethod, time: '18-Aug-2026 10:35', operator: 'EMB-02', status: '✓' },
                            { step: '24-Hr Survival Motility Readout', id: `${survival24Hr}% Motile`, time: '19-Aug-2026 10:35', operator: 'EMB-02', status: '✓' },
                          ] : []),
                          { step: 'Diagnostic Sign-off', id: analysisResult, time: '18-Aug-2026 10:40', operator: 'DR-01', status: '✓' },
                        ] : intendedUse === 'IVF / ICSI' ? [
                          { step: 'Sample Received', id: sampleId, time: '18-Aug-2026 09:42', operator: 'EMB-01', status: '✓' },
                          { step: 'Sample Validated', id: sampleId, time: '18-Aug-2026 09:55', operator: 'EMB-01', status: '✓' },
                          { step: sampleState === 'Frozen' ? 'Straw Thaw Event' : 'Density Gradient Wash', id: sampleState === 'Frozen' ? frozenStrawId : prepSampleId, time: '18-Aug-2026 10:15', operator: 'EMB-02', status: '✓' },
                          { step: 'Post-Prep Assessment', id: `${postCount} M/ml (${postProgMotility}% PR)`, time: '18-Aug-2026 10:25', operator: 'EMB-02', status: '✓' },
                          { step: 'Dish Loading & Cohort Match', id: 'ICSI-DISH-00158', time: '18-Aug-2026 10:45', operator: 'DR-01', status: '✓' },
                          { step: 'Insemination / ICSI Done', id: 'ICSI-DISH-00158', time: '18-Aug-2026 11:00', operator: 'DR-01', status: '✓' },
                        ] : [
                          { step: 'Sample Received', id: sampleId, time: '18-Aug-2026 09:42', operator: 'EMB-01', status: '✓' },
                          { step: 'Sample Validated', id: sampleId, time: '18-Aug-2026 09:55', operator: 'EMB-01', status: '✓' },
                          { step: 'Thaw Event', id: sampleState === 'Frozen' ? frozenStrawId : 'N/A (Fresh)', time: sampleState === 'Frozen' ? '18-Aug-2026 10:05' : 'N/A', operator: sampleState === 'Frozen' ? 'EMB-02' : 'N/A', status: '✓' },
                          { step: 'Preparation Completed', id: prepSampleId, time: '18-Aug-2026 10:18', operator: 'EMB-02', status: '✓' },
                          { step: 'Final Syringe Witnessed', id: finalSyringeId, time: '18-Aug-2026 10:25', operator: 'DR-01', status: '✓' },
                          { step: 'Pre-IUI Authorization', id: finalSyringeId, time: '18-Aug-2026 10:30', operator: 'DR-01', status: '✓' },
                          { step: 'Insemination Done', id: finalSyringeId, time: '18-Aug-2026 10:32', operator: 'DR-01', status: '✓' },
                        ]).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition">
                            <td className="px-3 py-2 font-medium text-slate-700">{row.step}</td>
                            <td className="px-3 py-2 font-mono font-bold text-slate-800">{row.id}</td>
                            <td className="px-3 py-2 text-slate-600">{row.time}</td>
                            <td className="px-3 py-2 text-slate-600">{row.operator}</td>
                            <td className="px-3 py-2 text-center text-emerald-600 font-bold">{row.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* ROW 4: DYNAMIC DOWNSTREAM BOXES (BOX 5: SEMEN ANALYSIS, BOX 6: PRE-IUI AUTH / SIGN-OFF, BOX 7: AUDIT TRAIL) */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                
                {/* BOX 5: SEMEN ANALYSIS & PREPARATION */}
                <div className={`${intendedUse === 'Semen Analysis' ? 'lg:col-span-8' : 'lg:col-span-6'} rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden flex flex-col justify-between`}>
                  <div>
                    <div className="bg-[#0b4a8b] px-4 py-2 text-white flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider">
                        {intendedUse === 'Semen Analysis'
                          ? `5. SEMEN ANALYSIS (${semenAnalysisType === 'HSA' ? 'HSA - HUSBAND SEMEN ANALYSIS' : 'SQA - SEMEN QUALITATIVE ANALYSIS'})`
                          : intendedUse === 'IUI'
                          ? `5. IUI SEMEN PREPARATION (${sampleState === 'Frozen' ? 'THAWED SAMPLE' : 'FRESH SAMPLE'} • ${iuiIndication})`
                          : '5. SPERM PREPARATION FOR IVF / ICSI'}
                      </h2>
                      {intendedUse === 'Semen Analysis' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSemenAnalysisType('HSA')}
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase transition ${
                              semenAnalysisType === 'HSA' ? 'bg-white text-blue-900 shadow-xs' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            HSA (1 Page)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSemenAnalysisType('SQA')}
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase transition ${
                              semenAnalysisType === 'SQA' ? 'bg-white text-blue-900 shadow-xs' : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            SQA (+ Survival)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* SMART THAW NOTIFICATION BANNER (When Frozen is selected) */}
                    {sampleState === 'Frozen' && (
                      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs flex items-center justify-between text-amber-900">
                        <div className="flex items-center gap-2">
                          <span className="text-base">❄️</span>
                          <span>
                            <strong>SMART Thaw Rule Active:</strong> Pre-freezing fields are <strong>Locked (Read-only)</strong> from Cryo Master. Post-thaw fields are <strong>Active</strong>.
                          </span>
                        </div>
                        <span className="font-mono font-bold bg-amber-200/80 px-2 py-0.5 rounded text-[11px]">
                          Straw: {frozenStrawId}
                        </span>
                      </div>
                    )}

                    <div className="p-4 space-y-4 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-bold">Analysis Date / Time</span>
                          <input
                            type="text"
                            defaultValue="18-Aug-2026 09:58"
                            className="h-7 rounded border border-slate-300 px-2 text-xs font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-bold">Analysed By</span>
                          <select className="h-7 rounded border border-slate-300 px-2 text-xs font-medium">
                            <option>EMB-02 - Dr. Amit Verma</option>
                            <option value="">Select</option>
                        <option>EMB-01 - Dr. Satish</option>
                            <option>EMB-03 - Dr. Neha Kapoor</option>
                          </select>
                        </div>
                      </div>

                      {/* BEFORE PROCESSING / PRE-FREEZING SECTION */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                            <span>{sampleState === 'Frozen' ? '❄️ Pre-Freezing Parameters (Locked Snapshot)' : '🧪 Before Processing Parameters (Pre-Wash)'}</span>
                            {sampleState === 'Frozen' && (
                              <span className="rounded bg-slate-200 text-slate-700 px-1.5 py-0.2 text-[9px] font-bold">Read-Only</span>
                            )}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-medium">WHO Reference Criteria</span>
                        </div>

                        {/* WHO Parameters Table */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          {/* Left Column: Macroscopic */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Volume</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={volume}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setVolume(e.target.value)}
                                  className={`h-6 w-14 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-6">ml</span>
                                <span className="text-slate-400 text-[10px]">≥ 1.4</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Appearance</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={appearance}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setAppearance(e.target.value)}
                                  className={`h-6 w-24 rounded border border-slate-300 px-1 text-right text-xs ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Liquefaction</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={liquefaction}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setLiquefaction(e.target.value)}
                                  className={`h-6 w-14 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-6">min</span>
                                <span className="text-slate-400 text-[10px]">≤ 60</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">pH</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={ph}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setPh(e.target.value)}
                                  className={`h-6 w-14 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-6">-</span>
                                <span className="text-slate-400 text-[10px]">≥ 7.2</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Concentration</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={concentration}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setConcentration(e.target.value)}
                                  className={`h-6 w-14 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-14">million/ml</span>
                                <span className="text-slate-400 text-[10px]">≥ 16</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Total Count</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={totalCount}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setTotalCount(e.target.value)}
                                  className={`h-6 w-14 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-14">million</span>
                                <span className="text-slate-400 text-[10px]">≥ 39</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Microscopic */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Motility (Progressive)</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={progMotility}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setProgMotility(e.target.value)}
                                  className={`h-6 w-12 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-4">%</span>
                                <span className="text-slate-400 text-[10px]">≥ 30</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Total Motility</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={totalMotility}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setTotalMotility(e.target.value)}
                                  className={`h-6 w-12 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-4">%</span>
                                <span className="text-slate-400 text-[10px]">≥ 42</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Morphology (Normal)</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={morphology}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setMorphology(e.target.value)}
                                  className={`h-6 w-12 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-4">%</span>
                                <span className="text-slate-400 text-[10px]">≥ 4</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Vitality</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={vitality}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setVitality(e.target.value)}
                                  className={`h-6 w-12 rounded border border-slate-300 px-1 text-right font-bold ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-4">%</span>
                                <span className="text-slate-400 text-[10px]">≥ 54</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">WBC</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={wbc}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setWbc(e.target.value)}
                                  className={`h-6 w-12 rounded border border-slate-300 px-1 text-right font-medium ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] w-8">/HPF</span>
                                <span className="text-slate-400 text-[10px]">&lt; 1</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-b border-slate-100 pb-0.5">
                              <span className="text-slate-600 font-medium">Agglutination</span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={agglutination}
                                  disabled={sampleState === 'Frozen'}
                                  onChange={(e) => setAgglutination(e.target.value)}
                                  className={`h-6 w-16 rounded border border-slate-300 px-1 text-right text-xs ${
                                    sampleState === 'Frozen' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''
                                  }`}
                                />
                                <span className="text-slate-400 text-[10px]">None</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AFTER PROCESSING / POST-THAW SECTION */}
                      {intendedUse === 'Semen Analysis' && (semenAnalysisType === 'HSA' || flow.afterProcessing === 'disabled') ? (
                        /* HSA MODE: After Processing is DISABLED (As per SMART HSASummary protocol) */
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600">
                          <div className="flex items-center gap-2 font-bold text-slate-700 mb-1">
                            <span>ℹ️</span>
                            <span>HSA Protocol: After-Processing &amp; Survival Motility are Disabled</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Husband Semen Analysis (HSA) is a diagnostic baseline assessment. As per SMART application architecture and standard andrology protocol, sample washing and 24-hr survival tests are only performed in SQA or cycle preparation.
                          </p>
                        </div>
                      ) : (
                        /* SQA, IUI, or IVF/ICSI MODE: After Processing / Post-Thaw is ACTIVE */
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-tight flex items-center gap-1.5">
                              <span>{sampleState === 'Frozen' ? '❄️ Post-Thaw Evaluation (Active)' : '🧬 After Processing / Washed Sperm Parameters'}</span>
                            </h4>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">
                              {sampleState === 'Frozen' ? 'Thaw Assessment' : prepMethod}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                {sampleState === 'Frozen' ? 'Post-Thaw Volume' : 'Post-Wash Volume'}
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={postVolume}
                                  onChange={(e) => setPostVolume(e.target.value)}
                                  className="h-7 w-full rounded border border-slate-300 px-2 font-bold text-xs"
                                />
                                <span className="text-slate-400 text-[10px]">ml</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                                {sampleState === 'Frozen' ? 'Post-Thaw Count' : 'Post-Wash Count'}
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={postCount}
                                  onChange={(e) => setPostCount(e.target.value)}
                                  className="h-7 w-full rounded border border-slate-300 px-2 font-bold text-xs"
                                />
                                <span className="text-slate-400 text-[10px]">M/ml</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Progressive Motility</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={postProgMotility}
                                  onChange={(e) => setPostProgMotility(e.target.value)}
                                  className="h-7 w-full rounded border border-slate-300 px-2 font-bold text-xs text-blue-700"
                                />
                                <span className="text-slate-400 text-[10px]">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Total Motility</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={postTotalMotility}
                                  onChange={(e) => setPostTotalMotility(e.target.value)}
                                  className="h-7 w-full rounded border border-slate-300 px-2 font-bold text-xs text-blue-700"
                                />
                                <span className="text-slate-400 text-[10px]">%</span>
                              </div>
                            </div>
                          </div>

                          {/* SQA ONLY: 24-HOUR & 12-HOUR SURVIVAL MOTILITY ROW (txtIUIAPAS24Hr in SMART) */}
                          {((intendedUse === 'Semen Analysis' && semenAnalysisType === 'SQA') || flow.afterProcessing === 'survival24') && (
                            <div className="pt-2 border-t border-blue-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div className="bg-white p-2 rounded border border-blue-200 shadow-2xs">
                                <label className="block text-[10px] font-bold text-purple-900 mb-0.5">
                                  24-Hour Survival Motility (%)
                                </label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={survival24Hr}
                                    onChange={(e) => setSurvival24Hr(e.target.value)}
                                    className="h-7 w-full rounded border border-purple-300 px-2 font-black text-xs text-purple-800"
                                  />
                                  <span className="text-purple-600 text-[10px] font-bold">%</span>
                                </div>
                                <span className="text-[9px] text-slate-400">SMART txtIUIAPAS24Hr</span>
                              </div>

                              <div className="bg-white p-2 rounded border border-blue-200 shadow-2xs">
                                <label className="block text-[10px] font-bold text-purple-900 mb-0.5">
                                  12-Hour Survival Motility (%)
                                </label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={survival12Hr}
                                    onChange={(e) => setSurvival12Hr(e.target.value)}
                                    className="h-7 w-full rounded border border-purple-300 px-2 font-black text-xs text-purple-800"
                                  />
                                  <span className="text-purple-600 text-[10px] font-bold">%</span>
                                </div>
                                <span className="text-[9px] text-slate-400">SMART txtIUIAPAS12Hr</span>
                              </div>

                              <div className="bg-white p-2 rounded border border-blue-200 shadow-2xs">
                                <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Linearity</label>
                                <select
                                  value={linearity}
                                  onChange={(e) => setLinearity(e.target.value)}
                                  className="h-7 w-full rounded border border-slate-300 px-1.5 text-xs font-bold text-slate-800"
                                >
                                  <option>Rapid Linear</option>
                                  <option>Slow Linear</option>
                                  <option>Non-Linear</option>
                                </select>
                                <span className="text-[9px] text-slate-400">Progression Velocity</span>
                              </div>
                            </div>
                          )}

                          {/* Inventory Audit Note for Thawed Samples */}
                          {sampleState === 'Frozen' && (
                            <p className="text-[10px] text-amber-800 italic">
                              * Database action on save: Stored procedure <code>updateIUIThawIDToSelfAndDonor</code> connects straw <strong>{frozenStrawId}</strong> to <strong>{cycleVisitId}</strong> and marks it consumed (InUse=0).
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Remarks &amp; Recommendations</label>
                        <input
                          type="text"
                          value={analysisRemarks}
                          onChange={(e) => setAnalysisRemarks(e.target.value)}
                          placeholder="e.g. Normal liquefaction, good progression, sample suitable for planned procedure."
                          className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Diagnosis:</span>
                      {analysisResult && (
                      <span className="rounded bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 font-black text-emerald-800 text-xs tracking-wider">
                        {analysisResult}
                      </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {intendedUse === 'Semen Analysis' && (
                        <button
                          type="button"
                          onClick={() => {
                            showToast(`Opening ${semenAnalysisType === 'HSA' ? 'HSASummary.rdlc' : 'SQASummary.rdlc'} 1-page summary report preview.`);
                          }}
                          className="rounded-lg border border-blue-400 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800 transition flex items-center gap-1"
                        >
                          <span>📄</span>
                          <span>Print {semenAnalysisType} Summary</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setAnalysisSaved(true);
                          showToast('Analysis & Processing parameters successfully recorded.');
                        }}
                        className="rounded-lg bg-[#0b4a8b] hover:bg-blue-800 px-4 py-1.5 text-xs font-bold text-white shadow-xs"
                      >
                        Save &amp; Lock Parameters
                      </button>
                    </div>
                  </div>
                </div>

                {/* BOX 6: PRE-IUI AUTHORIZATION OR DIAGNOSTIC SIGN-OFF */}
                <div className={`${intendedUse === 'Semen Analysis' ? 'lg:col-span-4' : 'lg:col-span-3'} rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden flex flex-col justify-between`}>
                  <div>
                    <div className="bg-[#0b4a8b] px-4 py-2 text-white">
                      <h2 className="text-xs font-bold uppercase tracking-wider">
                        {intendedUse === 'Semen Analysis'
                          ? '6. DIAGNOSTIC INTERPRETATION'
                          : intendedUse === 'IVF / ICSI'
                          ? '6. DISH MATCH & WITNESS'
                          : '6. PRE-IUI AUTHORIZATION'}
                      </h2>
                    </div>

                    <div className="p-4 space-y-3 text-xs">
                      {intendedUse === 'Semen Analysis' ? (
                        /* DIAGNOSTIC INTERPRETATION VIEW */
                        <div className="space-y-3">
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 space-y-1 text-[11px]">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase">WHO 6th Ed Category</span>
                            <div className="text-sm font-black text-slate-800">{analysisResult}</div>
                            <p className="text-[10px] text-slate-500">
                              All sperm parameters (Count, PR Motility, Vitality, Morphology) meet normal fertile thresholds.
                            </p>
                          </div>

                          <div className="space-y-1.5 pt-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Diagnostic Checkpoints</span>
                            {[
                              { label: 'Liquefaction within 60 min', pass: true },
                              { label: 'Sperm Conc ≥ 16 M/ml', pass: true },
                              { label: 'Progressive Motility ≥ 30%', pass: true },
                              { label: 'Morphology ≥ 4%', pass: true },
                              { label: 'Vitality ≥ 54%', pass: true },
                              { label: 'WBC < 1 M/ml (No Pyospermia)', pass: true },
                            ].map((cp, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-600">{cp.label}</span>
                                <span className="text-emerald-600 font-bold">✓</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
                            <span className="text-slate-500">Signed By</span>
                            <strong className="text-slate-800">{authBy}</strong>
                          </div>
                        </div>
                      ) : intendedUse === 'IVF / ICSI' ? (
                        /* IVF / ICSI COHORT WITNESS VIEW */
                        <div className="space-y-2.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Dish ID</span>
                            <strong className="font-mono text-blue-700">ICSI-DISH-00158</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Oocyte Cohort</span>
                            <strong className="text-slate-800">12 MII Oocytes</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Embryologist</span>
                            <strong className="text-slate-800">{authBy}</strong>
                          </div>
                          <div className="pt-2 border-t border-slate-100 space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Witness Checkpoints</span>
                            {[
                              'Patient & Partner RFID Match',
                              'Sperm Prep Tube Match',
                              'ICSI Injector Pipette Verified',
                              'Dish ID Matched to Patient UHID',
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-600">{item}</span>
                                <span className="text-emerald-600 font-bold">✓</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* STANDARD IUI AUTHORIZATION VIEW */
                        <div className="space-y-2.5">
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[11px]">Prepared Sample ID</span>
                              <strong className="font-mono text-slate-800">{prepSampleId}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[11px]">Final Syringe ID</span>
                              <strong className="font-mono text-blue-700">{finalSyringeId}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[11px]">Authorization By</span>
                              <strong className="text-slate-800">{authBy}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 text-[11px]">Authorization Time</span>
                              <span className="text-slate-700">18-Aug-2026 10:30</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-1">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Checkpoints</span>
                            {[
                              'Patient / Cycle Match',
                              'Sperm Source & ID Match',
                              'Prepared Sample Match',
                              'Final Syringe Match',
                              'Procedure = IUI',
                              'Ready for Insemination',
                            ].map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-600">{item}</span>
                                <span className="text-emerald-600 font-bold">✓</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-black text-emerald-900 text-xs uppercase tracking-wider">
                          {intendedUse === 'Semen Analysis' ? 'REPORT VERIFIED' : 'AUTHORIZED'}
                        </div>
                        <div className="text-[10px] text-emerald-800">
                          {intendedUse === 'Semen Analysis'
                            ? 'Ready for consultation & print.'
                            : intendedUse === 'IVF / ICSI'
                            ? 'Ready for ICSI / Insemination.'
                            : 'You can proceed for IUI.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOX 7: AUDIT TRAIL (COL 3, only for IUI / IVF or stacked for Semen Analysis) */}
                {intendedUse !== 'Semen Analysis' && (
                  <div className="lg:col-span-3 rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="bg-[#0b4a8b] px-4 py-2 text-white">
                        <h2 className="text-xs font-bold uppercase tracking-wider">
                          7. AUDIT TRAIL
                        </h2>
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="overflow-x-auto rounded border border-slate-200">
                          <table className="min-w-full divide-y divide-slate-200 text-[10px]">
                            <thead className="bg-slate-50 font-bold text-slate-600">
                              <tr>
                                <th className="px-1.5 py-1 text-left">Date / Time</th>
                                <th className="px-1.5 py-1 text-left">Event</th>
                                <th className="px-1.5 py-1 text-left">ID</th>
                                <th className="px-1.5 py-1 text-left">Operator</th>
                                <th className="px-1.5 py-1 text-left">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {!(hasPatient && sampleId) ? (
                                <tr>
                                  <td colSpan={5} className="px-1.5 py-3 text-center text-slate-400">No audit events.</td>
                                </tr>
                              ) : (
                                [
                                  { time: displayDate, event: 'Sample Received', id: sampleId, op: operator || '—', act: 'Create' },
                                ].map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-1.5 py-1 text-slate-500 whitespace-nowrap">{row.time}</td>
                                    <td className="px-1.5 py-1 font-medium text-slate-700">{row.event}</td>
                                    <td className="px-1.5 py-1 font-mono text-slate-800">{row.id}</td>
                                    <td className="px-1.5 py-1 text-slate-600">{row.op}</td>
                                    <td className="px-1.5 py-1 text-blue-700 font-bold">{row.act}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        onClick={() => showToast('Displaying comprehensive immutable audit logs for this sample.')}
                        className="w-full rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 py-2 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
                      >
                        <span>View Full Audit Log</span>
                        <span>📋</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* BOTTOM SAFETY ALERT BANNER */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 flex items-center justify-center gap-2 text-center text-xs font-semibold text-amber-900 shadow-xs">
                <span className="text-amber-600 text-sm">⚠️</span>
                <span>
                  <strong>NOTE:</strong> All samples are uniquely identified. Mismatch at any step <strong>WILL BLOCK</strong> the process and raise an alert.
                </span>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
