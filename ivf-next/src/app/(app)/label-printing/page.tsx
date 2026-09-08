'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import { listMasterPatients } from '@/lib/services/masters';
import type { PatientMasterRow } from '@/lib/types/master';

type LabelType = 'procedure' | 'cryo' | 'patient_id' | 'dish_tube';

interface GeneratedLabel {
  id: string;
  patientId: number;
  patientName: string;
  refNo: string;
  labelType: LabelType;
  procedureOrSpecimen: string;
  compactCode: string;
  displayCode: string;
  labelSize: string;
  sizeName: string;
  copies: number;
  date: string;
  printedAt?: string;
}

const LABEL_SIZES = [
  { key: 'A', name: 'A - CST 79N0T (35 x 22 mm)', widthMm: 35, heightMm: 22, desc: 'Cryo Straws & Vials' },
  { key: 'B', name: 'B - CST 28N0T (50.8 x 25.4 mm)', widthMm: 50.8, heightMm: 25.4, desc: 'Petri Dishes & Culture Plates' },
  { key: 'C', name: 'C - AMA 227NP (50.8 x 6.4 mm)', widthMm: 50.8, heightMm: 6.4, desc: 'Ultra-thin Straw Flag' },
  { key: 'D', name: 'D - CRF-510NP (35 x 22 mm)', widthMm: 35, heightMm: 22, desc: 'Standard Falcon Tubes' },
];

export default function LabelPrintingPage() {
  const { token } = useAuth();
  const { selectedPatient, selectPatient } = usePatient();

  const [patients, setPatients] = useState<PatientMasterRow[]>([]);
  const [selectedPatId, setSelectedPatId] = useState<number>(selectedPatient?.id ?? 0);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Form states
  const [activeTab, setActiveTab] = useState<LabelType>('procedure');
  const [procedureType, setProcedureType] = useState('IVF');
  const [specimenType, setSpecimenType] = useState('Embryo Straw');
  const [cryoLocation, setCryoLocation] = useState('CC-BA52/C-9/GO-BL/VE-RD/VI-BL/ST-01');
  const [labelSize, setLabelSize] = useState('A');
  const [copies, setCopies] = useState(2);
  const [procedureDate, setProcedureDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Generated labels history
  const [labelsHistory, setLabelsHistory] = useState<GeneratedLabel[]>([]);
  const [currentLabel, setCurrentLabel] = useState<GeneratedLabel | null>(null);
  const [printSuccessMsg, setPrintSuccessMsg] = useState<string | null>(null);

  // Load patients list
  useEffect(() => {
    if (!token) return;
    setLoadingPatients(true);
    listMasterPatients(token)
      .then((data) => {
        setPatients(data);
        if (data.length > 0 && !selectedPatId) {
          setSelectedPatId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load patients:', err))
      .finally(() => setLoadingPatients(false));
  }, [token, selectedPatId]);

  // Sync selectedPatId when selectedPatient context changes
  useEffect(() => {
    if (selectedPatient?.id) {
      setSelectedPatId(selectedPatient.id);
    }
  }, [selectedPatient]);

  const activePat = useMemo(() => {
    const found = patients.find((p) => p.id === selectedPatId);
    if (found) {
      return {
        id: found.id,
        name: found.name,
        refNo: found.refNo || '',
        partner: found.husbandName || '',
      };
    }
    if (selectedPatient) {
      return {
        id: selectedPatient.id,
        name: selectedPatient.name,
        refNo: selectedPatient.uhid || '',
        partner: selectedPatient.partner || '',
      };
    }
    return null;
  }, [patients, selectedPatId, selectedPatient]);

  // Compact code generator matching smart/App_Code/BarcodeQrEncoder.cs
  const generateCompactCode = () => {
    const patId = activePat?.id || 101;
    const dateObj = new Date(procedureDate || Date.now());
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    const dateStr = `${dd}${mm}${yy}`;

    if (activeTab === 'procedure') {
      let typeCode = '06'; // IVF
      if (procedureType === 'HSA') typeCode = '04';
      else if (procedureType === 'IUI') typeCode = '05';
      else if (procedureType === 'ICSI') typeCode = '07';
      return `${patId}${typeCode}${dateStr}${procedureType.toUpperCase()}`;
    }

    if (activeTab === 'cryo') {
      let typeCode = '01'; // Embryo
      if (specimenType.toLowerCase().includes('semen')) typeCode = '02';
      else if (specimenType.toLowerCase().includes('oocyte')) typeCode = '03';

      // Strip location separators
      const cleanLoc = cryoLocation
        .replace(/^CC-/i, '')
        .replace(/\/CV-/gi, '/')
        .replace(/^CV-/gi, '')
        .replace(/[\/\-\s]/g, '')
        .toUpperCase();

      return `${patId}${typeCode}${dateStr}${cleanLoc}`;
    }

    if (activeTab === 'dish_tube') {
      return `${patId}DISH${dateStr}${activePat?.refNo ? activePat.refNo.replace(/[^a-zA-Z0-9]/g, '') : 'REF'}`;
    }

    // patient_id card
    return `${patId}PID${activePat?.refNo ? activePat.refNo.replace(/[^a-zA-Z0-9]/g, '') : 'PAT'}`;
  };

  const handleGenerateLabel = () => {
    const compact = generateCompactCode();
    const sizeObj = LABEL_SIZES.find((s) => s.key === labelSize) || LABEL_SIZES[0];
    const newLabel: GeneratedLabel = {
      id: `LBL-${Date.now().toString().slice(-6)}`,
      patientId: activePat?.id || 0,
      patientName: activePat?.name || 'Patient',
      refNo: activePat?.refNo || 'N/A',
      labelType: activeTab,
      procedureOrSpecimen:
        activeTab === 'procedure'
          ? procedureType
          : activeTab === 'cryo'
          ? specimenType
          : activeTab === 'dish_tube'
          ? 'Culture Dish / Tube'
          : 'Patient ID Card',
      compactCode: compact,
      displayCode: compact,
      labelSize: sizeObj.key,
      sizeName: sizeObj.name,
      copies,
      date: procedureDate,
    };

    setCurrentLabel(newLabel);
    setLabelsHistory((prev) => [newLabel, ...prev]);
    setPrintSuccessMsg('Label generated successfully. Ready to print!');
  };

  const handlePrint = (lbl?: GeneratedLabel) => {
    const target = lbl || currentLabel;
    if (!target) return;

    window.print();
    setPrintSuccessMsg(`Printed ${target.copies} copies of ${target.compactCode}`);
    setLabelsHistory((prev) =>
      prev.map((item) =>
        item.id === target.id
          ? { ...item, printedAt: new Date().toLocaleTimeString() }
          : item
      )
    );
  };

  const currentSizeObj = LABEL_SIZES.find((s) => s.key === labelSize) || LABEL_SIZES[0];

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4.5 border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-[#6345A6] shadow-2xs">
            <span className="text-2xl">🏷️</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Barcode & QR Specimen Label Printing
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              High-resolution thermal printing for dishes, tubes, cryo straws & patient identity tags (ISO 15189 Witnessing)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePrint()}
            disabled={!currentLabel}
            className="flex items-center gap-2 rounded-xl bg-[#6345A6] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#52388c] transition disabled:opacity-50"
          >
            <span>🖨️</span>
            <span>Print Current Label</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Config Form + Live Preview */}
      <div className="grid gap-6 lg:grid-cols-12 print:hidden">
        
        {/* Left Column: Configuration Form (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          
          {/* Patient Selector Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Select Patient / Couple
              </label>
              {loadingPatients && (
                <span className="text-[10px] font-bold text-[#6345A6] animate-pulse">
                  Loading patient registry...
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedPatId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedPatId(id);
                  const p = patients.find((pat) => pat.id === id);
                  if (p) {
                    selectPatient({
                      id: p.id,
                      name: p.name,
                      uhid: p.refNo || '',
                      partner: p.husbandName || '',
                      age: 0,
                      gender: 'female',
                      aadhar: '',
                      satelliteId: 0,
                    });
                  }
                }}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Ref: {p.refNo || 'N/A'} {p.husbandName ? `(Spouse: ${p.husbandName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {activePat && (
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-purple-100 bg-purple-50/40 p-2.5 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Patient:</span>{' '}
                  <span className="font-bold text-slate-900">{activePat.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Ref No:</span>{' '}
                  <span className="font-bold text-[#6345A6]">{activePat.refNo || 'N/A'}</span>
                </div>
                {activePat.partner && (
                  <div>
                    <span className="text-slate-400 font-medium">Partner:</span>{' '}
                    <span className="font-bold text-slate-800">{activePat.partner}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-medium">ID:</span>{' '}
                  <span className="font-mono font-bold text-slate-700">#{activePat.id}</span>
                </div>
              </div>
            )}
          </div>

          {/* Label Type Tabs & Settings */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              2. Label Type & Procedure
            </label>

            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              {[
                { id: 'procedure', label: '🔬 Procedure Label', sub: 'HSA / IUI / IVF' },
                { id: 'cryo', label: '❄️ Cryo Straw & Vial', sub: 'Tanks & Canisters' },
                { id: 'dish_tube', label: '🧪 Dish & Tube', sub: 'Culture Falcon' },
                { id: 'patient_id', label: '👤 Patient Tag', sub: 'Wristband / Card' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as LabelType)}
                  className={`flex-1 rounded-lg py-2 text-center transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-[#6345A6] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className="font-bold">{tab.label}</div>
                </button>
              ))}
            </div>

            {/* Dynamic fields based on activeTab */}
            {activeTab === 'procedure' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Procedure Type</label>
                  <select
                    value={procedureType}
                    onChange={(e) => setProcedureType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                  >
                    <option value="IVF">IVF - In Vitro Fertilization</option>
                    <option value="ICSI">ICSI - Intracytoplasmic Sperm Inj.</option>
                    <option value="IUI">IUI - Intrauterine Insemination</option>
                    <option value="HSA">HSA - Semen Analysis</option>
                    <option value="OPU">OPU - Oocyte Pick-Up</option>
                    <option value="ET">ET - Embryo Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">Date of Procedure</label>
                  <input
                    type="date"
                    value={procedureDate}
                    onChange={(e) => setProcedureDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {activeTab === 'cryo' && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Specimen Unit</label>
                    <select
                      value={specimenType}
                      onChange={(e) => setSpecimenType(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                    >
                      <option value="Embryo Straw">Embryo Straw (Vitrification)</option>
                      <option value="Semen Vial">Semen Cryovial (Self)</option>
                      <option value="Donor Semen Vial">Donor Semen Cryovial</option>
                      <option value="Oocyte Straw">Oocyte Straw (Vitrification)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 mb-1 block">Freezing Date</label>
                    <input
                      type="date"
                      value={procedureDate}
                      onChange={(e) => setProcedureDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                    Cryo Tank Location Code (Slash Format)
                  </label>
                  <input
                    type="text"
                    value={cryoLocation}
                    onChange={(e) => setCryoLocation(e.target.value)}
                    placeholder="e.g. CC-BA52/C-9/GO-BL/VE-RD/VI-BL/ST-01"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 font-medium block mt-1">
                    Tank / Canister / Cane / Goblet / Visotube / Straw ID (Automated compact transformation per LabTag format)
                  </span>
                </div>
              </div>
            )}

            {/* Label Size & Printer Specification */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
              <div className="col-span-2">
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Label Roll / Dimensions</label>
                <select
                  value={labelSize}
                  onChange={(e) => setLabelSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                >
                  {LABEL_SIZES.map((size) => (
                    <option key={size.key} value={size.key}>
                      {size.name} ({size.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Copies</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGenerateLabel}
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>Generate Printable Barcode & QR</span>
              </button>
            </div>

            {printSuccessMsg && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center justify-between">
                <span>✓ {printSuccessMsg}</span>
                <button
                  type="button"
                  onClick={() => setPrintSuccessMsg(null)}
                  className="text-emerald-500 hover:text-emerald-700 font-black"
                >
                  ✕
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: Live Label Visual Preview (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>👁️ Live Label Preview</span>
              </h2>
              <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-[#6345A6] border border-purple-200">
                {currentSizeObj.name.split('(')[0]}
              </span>
            </div>

            {/* Physical Label Mockup Container */}
            <div className="flex items-center justify-center rounded-2xl bg-slate-100/70 p-6 border border-slate-200/60">
              
              {/* The Label Itself styled to physical proportion */}
              <div
                className="relative rounded-lg border-2 border-dashed border-slate-300 bg-white p-3.5 shadow-md flex flex-col justify-between"
                style={{
                  width: `${Math.min(320, currentSizeObj.widthMm * 6)}px`,
                  minHeight: `${Math.min(200, Math.max(100, currentSizeObj.heightMm * 5.5))}px`,
                }}
              >
                {/* Top header row on label */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-1.5">
                  <div>
                    <div className="text-[10px] font-black uppercase text-[#1d4ed8] tracking-tight leading-none">
                      FERTITRACE IVF
                    </div>
                    <div className="text-[8px] font-semibold text-slate-500 mt-0.5">
                      {activePat?.name || 'PATIENT NAME'}
                    </div>
                  </div>
                  <span className="text-[8px] font-mono font-bold text-slate-600 bg-slate-100 px-1 rounded">
                    {activePat?.refNo || 'REF-001'}
                  </span>
                </div>

                {/* Middle QR & Barcode Section */}
                <div className="my-2 flex items-center justify-between gap-3">
                  {/* Visual QR Code Representation */}
                  <div className="h-16 w-16 shrink-0 rounded-md border border-slate-800 bg-white p-1 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-full w-full text-slate-900 fill-current">
                      <rect x="0" y="0" width="30" height="30" rx="3" />
                      <rect x="5" y="5" width="20" height="20" fill="white" />
                      <rect x="10" y="10" width="10" height="10" />
                      
                      <rect x="70" y="0" width="30" height="30" rx="3" />
                      <rect x="75" y="5" width="20" height="20" fill="white" />
                      <rect x="80" y="10" width="10" height="10" />
                      
                      <rect x="0" y="70" width="30" height="30" rx="3" />
                      <rect x="5" y="75" width="20" height="20" fill="white" />
                      <rect x="10" y="80" width="10" height="10" />

                      <rect x="40" y="10" width="10" height="20" />
                      <rect x="55" y="5" width="10" height="10" />
                      <rect x="40" y="40" width="20" height="20" />
                      <rect x="15" y="45" width="15" height="10" />
                      <rect x="70" y="45" width="15" height="15" />
                      <rect x="40" y="70" width="15" height="15" />
                      <rect x="65" y="75" width="20" height="15" />
                    </svg>
                  </div>

                  {/* Specimen / Procedure details on label */}
                  <div className="flex-1 space-y-1 text-[9px] text-slate-700 leading-tight">
                    <div>
                      <span className="text-slate-400">Type:</span>{' '}
                      <strong className="text-slate-900">
                        {activeTab === 'procedure' ? procedureType : activeTab === 'cryo' ? specimenType : 'LAB TUBE'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Date:</span>{' '}
                      <span className="font-mono">{procedureDate}</span>
                    </div>
                    {activeTab === 'cryo' && (
                      <div className="truncate text-[8px] font-mono text-slate-500">
                        Loc: {cryoLocation}
                      </div>
                    )}
                    <div className="font-mono text-[7px] text-slate-400 truncate">
                      ID: #{activePat?.id} • ISO-15189
                    </div>
                  </div>
                </div>

                {/* Bottom Barcode String */}
                <div className="border-t border-slate-200 pt-1 text-center">
                  <div className="text-[8px] font-mono font-black tracking-wider text-slate-800 truncate">
                    *{currentLabel?.compactCode || generateCompactCode()}*
                  </div>
                </div>
              </div>

            </div>

            {/* Compact Code Payload Details */}
            <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Compact Barcode String (TSPL / ZPL Direct)
              </div>
              <div className="rounded-lg bg-white p-2.5 font-mono text-xs font-bold text-[#6345A6] border border-slate-200/80 break-all select-all">
                {currentLabel?.compactCode || generateCompactCode()}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Roll Size: {currentSizeObj.widthMm} x {currentSizeObj.heightMm} mm</span>
                <span>Copies: {copies}</span>
              </div>
            </div>

            {/* Print Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handlePrint()}
                className="flex-1 rounded-xl bg-[#6345A6] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#52388c] transition flex items-center justify-center gap-2"
              >
                <span>🖨️</span>
                <span>Send to Thermal Printer</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Label Printing History Table (print:hidden) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>📋 Batch Queue & Recently Generated Labels</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {labelsHistory.length} labels queued in session
          </span>
        </div>

        {labelsHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No labels generated in this session yet. Select a patient above and click "Generate Printable Barcode & QR".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2">Label ID</th>
                  <th className="px-3 py-2">Patient</th>
                  <th className="px-3 py-2">Type / Specimen</th>
                  <th className="px-3 py-2">Compact Code</th>
                  <th className="px-3 py-2">Roll Size</th>
                  <th className="px-3 py-2">Copies</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labelsHistory.map((lbl) => (
                  <tr key={lbl.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{lbl.id}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-900">{lbl.patientName}</div>
                      <div className="text-[10px] text-slate-400">Ref: {lbl.refNo}</div>
                    </td>
                    <td className="px-3 py-2.5 font-medium">{lbl.procedureOrSpecimen}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-[#6345A6] font-bold">
                      {lbl.compactCode}
                    </td>
                    <td className="px-3 py-2.5">{lbl.labelSize}</td>
                    <td className="px-3 py-2.5 font-bold">{lbl.copies}</td>
                    <td className="px-3 py-2.5">
                      {lbl.printedAt ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Printed ({lbl.printedAt})
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          Ready
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handlePrint(lbl)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-purple-50 hover:text-[#6345A6] hover:border-purple-200 transition shadow-2xs"
                      >
                        Reprint
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Area (visible only on print) */}
      <div className="hidden print:block font-sans">
        {currentLabel && (
          <div
            style={{
              width: `${currentSizeObj.widthMm}mm`,
              height: `${currentSizeObj.heightMm}mm`,
              padding: '2mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'monospace',
              fontSize: '8pt',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid black', paddingBottom: '1mm' }}>
              <strong>FERTITRACE</strong>
              <span>{currentLabel.refNo}</span>
            </div>
            <div>
              <div style={{ fontWeight: 'bold' }}>{currentLabel.patientName}</div>
              <div>{currentLabel.procedureOrSpecimen} - {currentLabel.date}</div>
              <div style={{ fontSize: '7pt', wordBreak: 'break-all' }}>{currentLabel.compactCode}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '6pt', borderTop: '1px solid black' }}>
              ISO 15189 WITNESS SYSTEM
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
