'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import { listMasterPatients } from '@/lib/services/masters';
import type { PatientMasterRow } from '@/lib/types/master';
import {
  FERTITRACE_CONSUMABLES,
  FERTITRACE_PROCEDURES,
  FERTITRACE_LABEL_SIZES,
  FertiTraceSpecimenType,
  FertiTraceQRRecord,
  FertiTraceConsumableItem,
} from '@/lib/types/fertitrace-qr';
import {
  encodeFertiTraceQR,
  generateCompactAlphanumeric,
  formatCompactCryoLocation,
  formatCompactTimestamp,
} from '@/lib/fertitrace-qr';
import {
  apiGenerateQR,
  apiAllotPreassignedLabel,
  apiListConsumableInventory,
  apiListQRHistory,
} from '@/lib/services/fertitrace-qr';
import { FertiTraceQRCode } from '@/components/common/fertitrace-qr-code';
import type { PatientCycleRow } from '@/lib/types/cycle';
import Link from 'next/link';

function formatDocxDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd} ${mm} ${yy} ${hh}:${min}:${ss}`;
}

export default function LabelPrintingPage() {
  const { token, user } = useAuth();
  const { selectedPatient, selectPatient } = usePatient();

  // Live Clock (Real-time ticking date and time for QR Code generation)
  const [liveClock, setLiveClock] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setLiveClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mode: System Generated QR vs Pre-assigned Market Barcode
  const [generationMode, setGenerationMode] = useState<'system' | 'preassigned'>('system');

  // Patients
  const [patients, setPatients] = useState<PatientMasterRow[]>([]);
  const [selectedPatId, setSelectedPatId] = useState<number>(selectedPatient?.id ?? 0);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Existing cycles for patient
  const [patientCycles, setPatientCycles] = useState<PatientCycleRow[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);

  // Form Fields - Master-aligned
  const [specimenType, setSpecimenType] = useState<FertiTraceSpecimenType>('EMBRYO');
  const [consumableCode, setConsumableCode] = useState<string>('07'); // Default 07: Petri Dish
  const [unitNo, setUnitNo] = useState<string>('01');
  const [procedureName, setProcedureName] = useState<string>('IVF CYCLE');
  const [cycleId, setCycleId] = useState<string>('');
  const [labelSizeKey, setLabelSizeKey] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('B');
  const [copies, setCopies] = useState<number>(2);
  const [cryoLocation, setCryoLocation] = useState<string>('CC-BA52/C-9/GO-BLUE/VE-RED/VI-BLACK/ST-BROWN');
  const [notes, setNotes] = useState<string>('');

  // Pre-assigned market barcode field
  const [preassignedBarcode, setPreassignedBarcode] = useState<string>('');
  const [preassignedError, setPreassignedError] = useState<string | null>(null);

  // Roll change banner notification
  const [previousSizeKey, setPreviousSizeKey] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'F'>('B');
  const [showRollAlert, setShowRollAlert] = useState<boolean>(false);

  // Queue & Inventory
  const [currentRecord, setCurrentRecord] = useState<FertiTraceQRRecord | null>(null);
  const [batchQueue, setBatchQueue] = useState<FertiTraceQRRecord[]>([]);
  const [inventory, setInventory] = useState<FertiTraceConsumableItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTableTab, setActiveTableTab] = useState<'both' | 'records' | 'stock'>('both');
  const [recordSearch, setRecordSearch] = useState<string>('');
  const [stockSearch, setStockSearch] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Print ref
  const printableAreaRef = useRef<HTMLDivElement>(null);

  // Refresh DB Tables
  const refreshDbTables = async () => {
    setIsRefreshing(true);
    try {
      const [items, records] = await Promise.all([
        apiListConsumableInventory(),
        apiListQRHistory(),
      ]);
      setInventory(items);
      setBatchQueue(records);
      setStatusMessage({ text: 'Data refreshed dynamically from SQL Server DemoART22.', type: 'info' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load patients
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

  // Load inventory & history
  useEffect(() => {
    apiListConsumableInventory()
      .then((items) => setInventory(items))
      .catch((err) => console.warn('Could not load inventory:', err));

    apiListQRHistory()
      .then((records) => {
        if (records.length > 0) {
          setBatchQueue(records);
          setCurrentRecord(records[0]);
        }
      })
      .catch((err) => console.warn('Could not load QR history:', err));
  }, []);

  // Sync selectedPatId with patient context
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
        refNo: found.refNo || `UHID-${found.id}`,
        partner: found.husbandName || '',
      };
    }
    if (selectedPatient) {
      return {
        id: selectedPatient.id,
        name: selectedPatient.name,
        refNo: selectedPatient.uhid || `UHID-${selectedPatient.id}`,
        partner: selectedPatient.partner || '',
      };
    }
    return {
      id: 101,
      name: 'Farah Mohammed Khan',
      refNo: 'CASE26001234',
      partner: 'Mohammed Shaikh',
    };
  }, [patients, selectedPatId, selectedPatient]);

  // Handle label size change with roll change alert
  const handleLabelSizeChange = (newKey: 'A' | 'B' | 'C' | 'D' | 'E' | 'F') => {
    if (newKey !== labelSizeKey) {
      setPreviousSizeKey(labelSizeKey);
      setLabelSizeKey(newKey);
      setShowRollAlert(true);
    }
  };

  const currentSizeObj = useMemo(() => {
    return FERTITRACE_LABEL_SIZES.find((s) => s.key === labelSizeKey) || FERTITRACE_LABEL_SIZES[1];
  }, [labelSizeKey]);

  const currentConsumableObj = useMemo(() => {
    return FERTITRACE_CONSUMABLES.find((c) => c.code === consumableCode) || FERTITRACE_CONSUMABLES[6];
  }, [consumableCode]);

  // Fetch existing cycles for the selected patient (do not create new IDs in QR sections)
  useEffect(() => {
    const pid = activePat.id || selectedPatId;
    if (!pid) return;
    setLoadingCycles(true);
    fetch(`/api/cycles/list?patId=${pid}&satId=0`)
      .then((res) => res.json())
      .then((data) => {
        const rows: PatientCycleRow[] = data.data || [];
        setPatientCycles(rows);
        if (rows.length > 0) {
          setCycleId(rows[0].cycleId);
        } else {
          setCycleId('');
        }
      })
      .catch((err) => console.warn('Failed to load cycles for patient:', err))
      .finally(() => setLoadingCycles(false));
  }, [activePat.id, selectedPatId]);

  // Live preview QR string
  const livePreviewQRString = useMemo(() => {
    return encodeFertiTraceQR({
      clinicId: 'CL001',
      caseId: activePat.refNo,
      cycleId: cycleId || 'NO_CYCLE',
      specimenId: currentRecord?.specimenId || 'SP000789',
      specimenType,
      containerType: currentConsumableObj.name,
      unitNo,
      createdAt: formatCompactTimestamp(liveClock),
    });
  }, [activePat, cycleId, specimenType, currentConsumableObj, unitNo, currentRecord, liveClock]);

  // Live preview Alphanumeric code
  const livePreviewCompactCode = useMemo(() => {
    const isCryo = ['12', '13'].includes(consumableCode) || procedureName.includes('FREEZING');
    return generateCompactAlphanumeric({
      patientRefNumber: activePat.refNo,
      consumableCode,
      procedureCode: procedureName,
      cryoLocation: isCryo ? cryoLocation : undefined,
    });
  }, [activePat, consumableCode, procedureName, cryoLocation]);

  // Generate new System QR
  const handleGenerateSystemQR = async () => {
    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const isCryo = ['12', '13'].includes(consumableCode) || procedureName.includes('FREEZING');
      const record = await apiGenerateQR({
        clinicId: 'CL001',
        patientId: activePat.id,
        patientName: activePat.name,
        patientUhid: activePat.refNo,
        cycleId,
        specimenType,
        containerType: consumableCode,
        containerUnitNo: unitNo,
        procedureName,
        labelSize: labelSizeKey,
        storageLocation: isCryo ? cryoLocation : undefined,
        createdBy: user?.userName || 'Dr. Embryologist',
        notes,
        copies,
      });

      setCurrentRecord(record);
      setStatusMessage({
        text: `V1 QR generated successfully! Specimen ID: ${record.specimenId}. ${copies} unit(s) deducted from stock.`,
        type: 'success',
      });

      // Refresh inventory & history dynamically from database
      const [updatedInventory, updatedHistory] = await Promise.all([
        apiListConsumableInventory(),
        apiListQRHistory(),
      ]);
      setInventory(updatedInventory);
      if (updatedHistory.length > 0) {
        setBatchQueue(updatedHistory);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate QR';
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Allot Pre-assigned Vendor Barcode
  const handleAllotPreassigned = async () => {
    if (!preassignedBarcode.trim()) {
      setPreassignedError('Please scan or enter a pre-assigned vendor barcode.');
      return;
    }

    setIsSubmitting(true);
    setPreassignedError(null);
    setStatusMessage(null);

    try {
      const record = await apiAllotPreassignedLabel({
        vendorBarcode: preassignedBarcode.trim(),
        patientId: activePat.id,
        patientName: activePat.name,
        patientUhid: activePat.refNo,
        cycleId,
        specimenType,
        containerType: consumableCode,
        containerUnitNo: unitNo,
        procedureName,
        allottedBy: user?.userName || 'Dr. Embryologist',
      });

      setCurrentRecord(record);
      setPreassignedBarcode('');
      setStatusMessage({
        text: `Pre-assigned barcode successfully bound to Specimen ${record.specimenId}! Stock deducted.`,
        type: 'success',
      });

      // Refresh inventory & history dynamically from database
      const [updatedInventory, updatedHistory] = await Promise.all([
        apiListConsumableInventory(),
        apiListQRHistory(),
      ]);
      setInventory(updatedInventory);
      if (updatedHistory.length > 0) {
        setBatchQueue(updatedHistory);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Allotment failed';
      setPreassignedError(msg);
      setStatusMessage({ text: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger Thermal Print
  const handlePrint = (recordToPrint?: FertiTraceQRRecord) => {
    const target = recordToPrint || currentRecord;
    if (!target) return;

    window.print();
    setStatusMessage({
      text: `Sent ${copies} copies of Specimen ${target.specimenId} to thermal printer.`,
      type: 'info',
    });

    // Refresh inventory in background
    apiListConsumableInventory().then((items) => setInventory(items)).catch(() => {});
  };

  const filteredRecords = useMemo(() => {
    if (!recordSearch.trim()) return batchQueue;
    const q = recordSearch.toLowerCase();
    return batchQueue.filter(
      (r) =>
        r.specimenId.toLowerCase().includes(q) ||
        (r.patientName && r.patientName.toLowerCase().includes(q)) ||
        r.caseId.toLowerCase().includes(q) ||
        r.cycleId.toLowerCase().includes(q) ||
        r.compactCode.toLowerCase().includes(q)
    );
  }, [batchQueue, recordSearch]);

  const filteredStock = useMemo(() => {
    if (!stockSearch.trim()) return inventory;
    const q = stockSearch.toLowerCase();
    return inventory.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
    );
  }, [inventory, stockSearch]);

  return (
    <div className="space-y-6 font-sans text-slate-800">
      
      {/* Roll Change Alert Banner */}
      {showRollAlert && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Thermal Printer Roll Change Required
                </h4>
                <p className="text-xs text-amber-800 font-medium">
                  Switched to <strong className="font-bold">{currentSizeObj.name}</strong> ({currentSizeObj.widthMm} x {currentSizeObj.heightMm} mm).
                  Please ensure <strong className="underline decoration-amber-500">{currentSizeObj.rollName}</strong> is loaded into the printer before sending print jobs.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRollAlert(false)}
              className="rounded-lg bg-amber-200/60 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-300 transition"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white p-4.5 border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-[#6345A6] shadow-2xs">
            <span className="text-2xl">🏷️</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>FERTITRACE Barcode & V1 QR Generator</span>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-[#6345A6] uppercase tracking-wider">
                ISO 15189 / ART Act 2022
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              High-resolution thermal printing with 11-field V1 QR payload & compact location barcode
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Toggle Generation Mode */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setGenerationMode('system')}
              className={`flex-1 sm:flex-initial text-center rounded-lg px-3 py-1.5 transition ${
                generationMode === 'system'
                  ? 'bg-white text-[#6345A6] shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              System V1 QR
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('preassigned')}
              className={`flex-1 sm:flex-initial text-center rounded-lg px-3 py-1.5 transition ${
                generationMode === 'preassigned'
                  ? 'bg-white text-[#6345A6] shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Pre-assigned Labels
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePrint()}
            disabled={!currentRecord}
            className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-[#6345A6] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#52388c] transition disabled:opacity-50"
          >
            <span>🖨️</span>
            <span>Print Current Label</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`rounded-xl p-3 text-xs font-bold border print:hidden ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Main Grid: Config Form + Live Label Preview */}
      <div className="grid gap-6 lg:grid-cols-12 print:hidden">
        
        {/* Left Form: Configuration (7 cols) */}
        <div className="space-y-5 lg:col-span-7">
          
          {/* Patient / Cycle Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Patient & Cycle Selection
              </label>
              {loadingPatients && (
                <span className="text-[10px] font-bold text-[#6345A6] animate-pulse">
                  Loading patients...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Patient / Couple</label>
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.husbandName ? `& ${p.husbandName}` : ''} ({p.refNo || `ID-${p.id}`})
                    </option>
                  ))}
                  {patients.length === 0 && (
                    <option value="101">Farah Mohammed Khan & Mohammed Shaikh (CASE26001234)</option>
                  )}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Existing Treatment Cycle ID</label>
                  {loadingCycles && (
                    <span className="text-[10px] font-bold text-[#6345A6] animate-pulse">Loading cycles...</span>
                  )}
                </div>
                {patientCycles.length > 0 ? (
                  <select
                    value={cycleId}
                    onChange={(e) => setCycleId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                  >
                    {patientCycles.map((cyc) => (
                      <option key={cyc.cycleId} value={cyc.cycleId}>
                        {cyc.cycleId} — {cyc.typeLabel || 'Cycle'} ({cyc.cycleDate || 'Active'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 flex items-center justify-between gap-1">
                    <span>No cycles found for this patient</span>
                    <Link
                      href="/cycle/creation"
                      className="font-bold underline text-amber-900 shrink-0"
                    >
                      + Create Cycle
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Process Date / Time Card (Field 8 in BAR CODE GENERATION VARIABLES.docx) */}
          <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Live Process Date / Time (Field 8)
                  </div>
                  <div className="font-mono text-base font-black text-slate-900">
                    {formatDocxDate(liveClock)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-white border border-emerald-200 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-800 shadow-2xs">
                  ISO: {formatCompactTimestamp(liveClock)}
                </span>
                <span className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-black text-white uppercase tracking-wider">
                  Live Sync
                </span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-500">
              Only last two digits of year (e.g. 2026 &rarr; 26) with live ticking 24-hr time as specified in <span className="font-semibold text-slate-700">BAR CODE GENERATION VARIABLES.docx</span>. Real-time encoded into QR payload.
            </p>
          </div>

          {/* Master Variables Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Master Variables (Specimen & Consumables)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                13 Master Consumables Loaded
              </span>
            </div>

            {/* Specimen Type, Container, Unit No */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Specimen Type</label>
                <select
                  value={specimenType}
                  onChange={(e) => setSpecimenType(e.target.value as FertiTraceSpecimenType)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                >
                  <option value="EMBRYO">EMBRYO</option>
                  <option value="SEMEN">SEMEN</option>
                  <option value="OOCYTES">OOCYTES</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Consumable Type</label>
                <select
                  value={consumableCode}
                  onChange={(e) => setConsumableCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                >
                  {FERTITRACE_CONSUMABLES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Unit / Dish No.</label>
                <input
                  type="text"
                  value={unitNo}
                  onChange={(e) => setUnitNo(e.target.value)}
                  placeholder="01"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden text-center"
                />
              </div>
            </div>

            {/* Procedure & Roll Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Clinical Procedure</label>
                <select
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                >
                  {FERTITRACE_PROCEDURES.map((proc) => (
                    <option key={proc} value={proc}>
                      {proc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">
                  Label Roll / Dimension (A–F)
                </label>
                <select
                  value={labelSizeKey}
                  onChange={(e) => handleLabelSizeChange(e.target.value as 'A' | 'B' | 'C' | 'D' | 'E' | 'F')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                >
                  {FERTITRACE_LABEL_SIZES.map((size) => (
                    <option key={size.key} value={size.key}>
                      {size.name} ({size.desc})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cryo Location (if straw, cryovial, or freezing procedure) */}
            {(['12', '13'].includes(consumableCode) || procedureName.includes('FREEZING')) && (
              <div className="rounded-xl bg-purple-50/60 p-3.5 border border-purple-100 space-y-2">
                <label className="text-[11px] font-bold text-[#6345A6] flex items-center justify-between">
                  <span>❄️ Cryo Tank Coordinate String (Slash Format)</span>
                  <span className="text-[10px] font-mono text-purple-600">
                    Compact: {formatCompactCryoLocation(cryoLocation)}
                  </span>
                </label>
                <input
                  type="text"
                  value={cryoLocation}
                  onChange={(e) => setCryoLocation(e.target.value)}
                  placeholder="CC-BA52/C-9/GO-BLUE/VE-RED/VI-BLACK/ST-BROWN"
                  className="w-full rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:border-[#6345A6] focus:outline-hidden"
                />
                <span className="text-[10px] text-purple-700 block">
                  Tank (BA) • Canister (C) • Goblet (GO) • Visotube (VE) • Visor (VI) • Straw (ST)
                </span>
              </div>
            )}

            {/* Pre-assigned Barcode Input Mode */}
            {generationMode === 'preassigned' && (
              <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-900">
                    Scan Pre-printed Vendor Barcode
                  </label>
                  <span className="text-[10px] text-amber-700 font-medium">
                    Barcode Wedge Reader Supported
                  </span>
                </div>
                <input
                  type="text"
                  value={preassignedBarcode}
                  onChange={(e) => setPreassignedBarcode(e.target.value)}
                  placeholder="Scan pre-printed dish/straw barcode here..."
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-amber-500 focus:outline-hidden"
                  autoFocus
                />
                {preassignedError && (
                  <p className="text-[11px] text-red-600 font-bold">{preassignedError}</p>
                )}
              </div>
            )}

            {/* Copies & Action Button */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-24">
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Copies</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-800 text-center"
                />
              </div>

              <div className="flex-1 pt-5">
                {generationMode === 'system' ? (
                  <button
                    type="button"
                    onClick={handleGenerateSystemQR}
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-[#6345A6] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#52388c] transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>⚡</span>
                    <span>{isSubmitting ? 'Registering V1 QR...' : 'Generate Printable Barcode & V1 QR'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAllotPreassigned}
                    disabled={isSubmitting || !preassignedBarcode.trim()}
                    className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>🔗</span>
                    <span>{isSubmitting ? 'Allotting...' : 'Allot Pre-assigned Label to Database'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Consumable Inventory Live Stock Widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <span>📦 Real-time Consumable Stock Deductions</span>
              </h3>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Auto-Deducted on Print/Procedure
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {inventory.slice(0, 4).map((item) => (
                <div key={item.code} className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
                  <div className="text-[10px] font-bold text-slate-400 truncate">{item.name}</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-base font-black text-slate-800">{item.stockOnHand}</span>
                    <span className="text-[10px] text-purple-700 font-semibold">{item.allocatedCount} in use</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Printable Label Preview (5 cols) */}
        <div className="space-y-5 lg:col-span-5">
          
          <div className="sticky top-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                  Label Preview ({currentSizeObj.name})
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  {currentRecord?.specimenId ? `Specimen: ${currentRecord.specimenId}` : 'Preview Mode'}
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                {currentSizeObj.widthMm} x {currentSizeObj.heightMm} mm
              </span>
            </div>

            {/* Physical Label Mockup Box */}
            <div className="flex justify-center p-3 bg-slate-100/70 rounded-2xl border border-slate-200/60">
              
              <div
                className="bg-white rounded-lg p-3 shadow-md border border-slate-300 flex flex-col justify-between"
                style={{
                  width: `${Math.min(340, currentSizeObj.widthMm * 6)}px`,
                  minHeight: `${Math.min(220, currentSizeObj.heightMm * 6)}px`,
                }}
              >
                {/* Header line on label */}
                <div className="flex items-center justify-between border-b border-slate-900 pb-1 text-[9px] font-mono font-black text-slate-900">
                  <span>FERTITRACE • {currentRecord?.clinicId || 'CL001'}</span>
                  <span>{activePat.refNo}</span>
                </div>

                {/* Center Content: QR + Details */}
                <div className="flex items-center gap-3 py-2">
                  {/* High-res QR code */}
                  <div className="shrink-0 rounded-sm bg-white p-1 border border-slate-200 flex items-center justify-center">
                    <FertiTraceQRCode
                      value={currentRecord?.qrString || livePreviewQRString}
                      size={currentSizeObj.heightMm > 20 ? 80 : 54}
                    />
                  </div>

                  {/* Biological & Procedure Text */}
                  <div className="flex-1 space-y-0.5 text-[9px] text-slate-800 leading-tight">
                    <div className="font-bold text-slate-950 text-[10px] truncate">
                      {activePat.name}
                    </div>
                    <div className="text-[8px] text-slate-600">
                      Sp: <strong className="text-slate-950">{specimenType}</strong> ({currentConsumableObj.name} #{unitNo})
                    </div>
                    <div className="text-[8px] text-slate-600">
                      Proc: <strong>{procedureName}</strong>
                    </div>
                    <div className="text-[8px] font-mono text-purple-900 font-bold">
                      {currentRecord?.specimenId || 'SP000789'} • Cycle: {cycleId}
                    </div>
                  </div>
                </div>

                {/* Secondary Alphanumeric Location / Barcode String */}
                <div className="border-t border-slate-900 pt-1 text-center font-mono">
                  <div className="text-[8px] font-black tracking-widest text-slate-900 truncate">
                    *{currentRecord?.compactCode || livePreviewCompactCode}*
                  </div>
                  <div className="text-[6px] text-slate-500 uppercase tracking-tighter">
                    ISO 15189 ELECTRONIC WITNESSING
                  </div>
                </div>

              </div>

            </div>

            {/* Technical Payload Inspector */}
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                11-Field V1 QR String Payload
              </div>
              <div className="rounded-lg bg-white p-2 font-mono text-[10px] font-bold text-[#6345A6] border border-slate-200 break-all select-all">
                {currentRecord?.qrString || livePreviewQRString}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Alphanumeric Secondary Line: <strong className="text-slate-700 font-mono">{currentRecord?.compactCode || livePreviewCompactCode}</strong>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handlePrint()}
                disabled={!currentRecord}
                className="flex-1 rounded-xl bg-[#6345A6] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#52388c] transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>🖨️</span>
                <span>Send to Thermal Printer ({copies} Copies)</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Dynamic Database Tables Section (print:hidden) */}
      <div className="space-y-6 print:hidden">

        {/* Tab Navigation & Database Sync Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTableTab('both')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTableTab === 'both'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📑</span>
              <span>Both Tables</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('records')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTableTab === 'records'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋</span>
              <span>Generated QR Records</span>
              <span className="rounded-full bg-purple-100 px-1.5 py-0.2 text-[10px] text-purple-800 font-bold">
                {batchQueue.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTableTab('stock')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTableTab === 'stock'
                  ? 'bg-white text-purple-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📦</span>
              <span>Consumable Stock Deductions</span>
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[10px] text-emerald-800 font-bold">
                {inventory.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live DB Synced (DemoART22)</span>
            </span>
            <button
              type="button"
              onClick={refreshDbTables}
              disabled={isRefreshing}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh DB'}</span>
            </button>
          </div>
        </div>

        {/* 1. Generated QR Records Table */}
        {(activeTableTab === 'both' || activeTableTab === 'records') && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📋 Generated QR Records & Batch Queue</span>
                  <span className="text-xs text-slate-400 font-normal">
                    (Table: <code className="text-purple-700 font-mono">FertiTrace_QR_Records</code>)
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Live specimen QR labels registered dynamically in database. Click Preview to view thermal label or Print to reprint.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search QR records..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#6345A6] focus:outline-hidden w-48 sm:w-60"
                />
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                  {filteredRecords.length} / {batchQueue.length} records
                </span>
              </div>
            </div>

            {filteredRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {batchQueue.length === 0
                  ? 'No QR records in database yet. Generate a label above to create your first record.'
                  : 'No records match your search filter.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">Specimen ID</th>
                      <th className="px-3 py-2.5">Patient / Case</th>
                      <th className="px-3 py-2.5">Material / Container</th>
                      <th className="px-3 py-2.5">Compact Code</th>
                      <th className="px-3 py-2.5">Roll</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Created At</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((item) => {
                      const isCurrent = currentRecord?.specimenId === item.specimenId;
                      return (
                        <tr
                          key={item.specimenId}
                          className={`transition ${
                            isCurrent ? 'bg-purple-50/60 font-semibold' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="px-3 py-2.5 font-mono font-bold text-[#6345A6]">
                            {item.specimenId}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-slate-900">{item.patientName || item.caseId}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Cycle: {item.cycleId || '—'} {item.patientUhid ? `• UHID: ${item.patientUhid}` : ''}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-slate-800">{item.specimenType}</span>
                            <span className="text-slate-400">
                              {' '}• {item.containerType} #{item.containerUnitNo}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-slate-700">
                            {item.compactCode}
                          </td>
                          <td className="px-3 py-2.5 font-bold">{item.labelSize}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.status === 'IN_PROCESS'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-500 font-mono">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setCurrentRecord(item)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                            >
                              {isCurrent ? 'Viewing' : 'Preview'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrint(item)}
                              className="rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-[#6345A6] border border-purple-200 hover:bg-purple-100 shadow-2xs"
                            >
                              Print
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

        {/* 2. Real-time Consumable Stock Deductions Table */}
        {(activeTableTab === 'both' || activeTableTab === 'stock') && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📦 Real-time Consumable Stock Deductions Table</span>
                  <span className="text-xs text-slate-400 font-normal">
                    (Table: <code className="text-emerald-700 font-mono">FertiTrace_Consumable_Stock</code>)
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Stock is automatically deducted in real time from SQL Server when QR labels are printed or specimens are allocated.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search consumables..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#6345A6] focus:outline-hidden w-48 sm:w-60"
                />
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                  {filteredStock.length} / {inventory.length} items
                </span>
              </div>
            </div>

            {filteredStock.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No consumable items match your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">Code</th>
                      <th className="px-3 py-2.5">Consumable Name</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Stock On Hand</th>
                      <th className="px-3 py-2.5">In Use (Allocated)</th>
                      <th className="px-3 py-2.5">Total Consumed</th>
                      <th className="px-3 py-2.5">Unit</th>
                      <th className="px-3 py-2.5">Reorder Level</th>
                      <th className="px-3 py-2.5 text-right">Stock Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStock.map((item) => {
                      const isLow = item.stockOnHand <= item.reorderLevel;
                      const isSelected = item.code === consumableCode;
                      return (
                        <tr
                          key={item.code}
                          className={`transition ${
                            isSelected ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                            {item.code}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {isSelected && (
                                <span className="rounded-full bg-purple-100 text-[#6345A6] px-1.5 py-0.2 text-[9px] font-bold">
                                  Selected
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 font-medium">
                            {item.category}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-sm font-black">
                            <span
                              className={
                                item.stockOnHand === 0
                                  ? 'text-red-600'
                                  : isLow
                                  ? 'text-amber-600'
                                  : 'text-emerald-700'
                              }
                            >
                              {item.stockOnHand}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-purple-700">
                            {item.allocatedCount} in use
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">
                            {item.consumedCount}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-slate-500">
                            {item.unitOfMeasure}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-500">
                            {item.reorderLevel}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                                item.stockOnHand === 0
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : isLow
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {item.stockOnHand === 0
                                ? 'Out of Stock'
                                : isLow
                                ? 'Low Stock'
                                : 'Optimal'}
                            </span>
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

      </div>

      {/* Hidden Printable Area for @media print Thermal Output */}
      <div className="hidden print:block font-mono" ref={printableAreaRef}>
        {currentRecord && (
          <div
            style={{
              width: `${currentSizeObj.widthMm}mm`,
              height: `${currentSizeObj.heightMm}mm`,
              padding: '2mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontSize: '7pt',
              lineHeight: 1.1,
              color: 'black',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid black', paddingBottom: '1mm' }}>
              <strong>FERTITRACE</strong>
              <span>{currentRecord.caseId}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', margin: '1mm 0' }}>
              <div style={{ width: '18mm', height: '18mm' }}>
                <FertiTraceQRCode value={currentRecord.qrString} size={68} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '8pt' }}>{currentRecord.patientName || currentRecord.caseId}</div>
                <div>{currentRecord.specimenType} • #{currentRecord.containerUnitNo}</div>
                <div>Proc: {currentRecord.procedureName || 'IVF'}</div>
                <div style={{ fontSize: '6pt' }}>ID: {currentRecord.specimenId}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid black', paddingTop: '1mm', textAlign: 'center', fontSize: '6.5pt', fontWeight: 'bold' }}>
              *{currentRecord.compactCode}*
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
