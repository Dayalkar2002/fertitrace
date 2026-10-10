'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FertiTraceQRRecord, FERTITRACE_CONSUMABLES } from '@/lib/types/fertitrace-qr';
import { QRMasterItem } from '@/app/api/qr/masters/route';

interface MasterTableMeta {
  key: string;
  variableNo: number;
  name: string;
  docLabel: string;
  badge: string;
  description: string;
  example: string;
  codePlaceholder: string;
  namePlaceholder: string;
  secondaryLabel?: string;
  secondaryPlaceholder?: string;
}

const ALL_13_MASTER_DEFINITIONS: MasterTableMeta[] = [
  {
    key: 'system-code',
    variableNo: 1,
    name: 'System Code Master',
    docLabel: '1. System code:',
    badge: 'Core Identity',
    description: 'Defines system identification code in the QR code header (e.g., FT for FertiTrace, SMART).',
    example: 'FT',
    codePlaceholder: 'e.g. FT, SMART',
    namePlaceholder: 'System Name (e.g. FertiTrace Laboratory Witnessing)',
    secondaryLabel: 'Platform Tag',
    secondaryPlaceholder: 'e.g. Core Web / RFID Bridge',
  },
  {
    key: 'qr-version',
    variableNo: 2,
    name: 'QR Version Code Master',
    docLabel: '2. QR Version Code:',
    badge: 'Format Structure',
    description: 'Defines the QR code schema and parsing specification version.',
    example: 'V1',
    codePlaceholder: 'e.g. V1, V2',
    namePlaceholder: 'Version Title (e.g. V1 Pipe-Delimited 11-Field)',
    secondaryLabel: 'Release Tag',
    secondaryPlaceholder: 'e.g. Standard 2026',
  },
  {
    key: 'clinic-id',
    variableNo: 3,
    name: 'Clinic ID Master',
    docLabel: '3. CLINIC ID:',
    badge: 'Multi-Site / Satellite',
    description: 'Identifier for IVF main hospital and satellite center branches.',
    example: 'CL001',
    codePlaceholder: 'e.g. CL001, CL002',
    namePlaceholder: 'Clinic / Branch Name',
    secondaryLabel: 'Location / Branch',
    secondaryPlaceholder: 'e.g. Tower A, Floor 3',
  },
  {
    key: 'smart-id',
    variableNo: 4,
    name: 'SMART ID / FertiTrace ID Master',
    docLabel: '4. SMART ID / FertiTrace ID:',
    badge: 'Patient Identifier',
    description: 'Secure non-meaningful pseudonymized patient barcode format registry.',
    example: 'CASE26001234',
    codePlaceholder: 'e.g. CASE26001234, UHID-901',
    namePlaceholder: 'Identifier Schema Title',
    secondaryLabel: 'Format Rule',
    secondaryPlaceholder: 'e.g. CASE + YY + 6 Digits',
  },
  {
    key: 'cycle-id',
    variableNo: 5,
    name: 'Cycle ID Master',
    docLabel: '5. Cycle ID:',
    badge: 'Treatment Registry',
    description: 'Patient active treatment cycle identifiers linked to clinical history and retrieval.',
    example: 'CY2600456',
    codePlaceholder: 'e.g. CY2600456, C202600158',
    namePlaceholder: 'Cycle Protocol Title',
    secondaryLabel: 'Patient Reference',
    secondaryPlaceholder: 'e.g. Farah Khan (Fresh IVF)',
  },
  {
    key: 'specimen-id',
    variableNo: 6,
    name: 'Specimen ID Master',
    docLabel: '6. Specimen ID:',
    badge: 'Cell Level Witnessing',
    description: 'Unique primary traceability identifiers for oocyte dishes, embryos, and semen straws.',
    example: 'SP000789',
    codePlaceholder: 'e.g. SP000789, OO-26-01',
    namePlaceholder: 'Specimen Cohort Name',
    secondaryLabel: 'Stage / Type',
    secondaryPlaceholder: 'e.g. Day 5 Blastocyst',
  },
  {
    key: 'specimen-type',
    variableNo: 7,
    name: 'Specimen Type Master',
    docLabel: '7. Specimen Type: ADD IN MASTER (EMBRYO, SEMEN, OOCYTES)',
    badge: 'Biological Material',
    description: 'Biological specimen categories configured in master: EMBRYO, SEMEN, OOCYTES.',
    example: 'EMBRYO / SEMEN / OOCYTES',
    codePlaceholder: 'e.g. EMBRYO, SEMEN, OOCYTES',
    namePlaceholder: 'Material Display Name',
    secondaryLabel: 'Laboratory Section',
    secondaryPlaceholder: 'e.g. Clinical Embryology / Andrology',
  },
  {
    key: 'process-datetime',
    variableNo: 8,
    name: 'Start Process Date / Time Master',
    docLabel: '8. START PROCESS DATE / TIME: 04 12 20 14 46',
    badge: 'Timestamp Format',
    description: 'Format rules for encoding live process date and time (e.g. 04 12 20 14 46, last 2 digits of year).',
    example: '04 12 20 14 46 (DD MM YY HH mm)',
    codePlaceholder: 'e.g. DD MM YY HH mm',
    namePlaceholder: 'Format Specification Title',
    secondaryLabel: 'Sample Live Output',
    secondaryPlaceholder: 'e.g. 04 12 20 14 46',
  },
  {
    key: 'consumable-type',
    variableNo: 9,
    name: 'Consumable Type Master',
    docLabel: '9. CONSUMABLE TYPE: ADD IN MASTER (01 to 13)',
    badge: 'Labware Catalog',
    description: '01 Semen Jar, 02 Conical Tube, 03 Falcon 5ml, 04 Appendroff, 05 IUI Catheter, 06 Falcon 15ml, 07 Petri Dish, 08 Centre Well, 09 ICSI Dish, 10 Four Well, 11 ET Catheter, 12 Vitrification Straw, 13 Cryovial.',
    example: '01 to 13 Types',
    codePlaceholder: 'e.g. 01, 02, 12',
    namePlaceholder: 'Labware Item Name (e.g. PERTIDISH, VITRIFICATION STRAW)',
    secondaryLabel: 'Category',
    secondaryPlaceholder: 'e.g. Culture Dish / Cryopreservation / Catheter',
  },
  {
    key: 'procedure',
    variableNo: 10,
    name: 'Procedure Master',
    docLabel: '10. PROCEDURE: ADD IN MASTER (17 Procedures)',
    badge: 'Clinical Procedures',
    description: 'HSA, SQA, IUI Single/Double Husband, Thaw Husband Single/Double, Thaw Donor Single/Double, Self Husband Freezing, IVF Cycle, Embryo Freezing, FET, Oocyte Freezing, Thaw Oocyte, ED Cycle, ED Freezing, ED Thaw.',
    example: '17 Protocols (HSA, IVF, FET, etc.)',
    codePlaceholder: 'e.g. HSA, IVF, FET, THAW_H_S',
    namePlaceholder: 'Full Procedure Name',
    secondaryLabel: 'Clinical Classification',
    secondaryPlaceholder: 'e.g. Insemination / Embryology / Cryo',
  },
  {
    key: 'consumable-unit',
    variableNo: 11,
    name: 'Consumable / Unit No. Master',
    docLabel: '11. CONSUMNABLE / UNIT No.: 01/02/03 ADD IN MASTER',
    badge: 'Unit Counters',
    description: 'Specific sequential dish, vial, or straw unit number in the cohort (01, 02, 03...).',
    example: '01, 02, 03',
    codePlaceholder: 'e.g. 01, 02, 03',
    namePlaceholder: 'Unit Designation Title (e.g. Unit 01)',
    secondaryLabel: 'Batch Scope',
    secondaryPlaceholder: 'e.g. Cohort Sequence',
  },
  {
    key: 'label-size',
    variableNo: 12,
    name: 'Labels Size Master',
    docLabel: '12. LABELS SIZE: A / B / C / D / E / F ADD IN MASTER',
    badge: 'Thermal Roll Specifications',
    description: 'Roll sizes A (35x22mm Straws), B (50.8x25.4mm Dishes), C (50.8x6.4mm Flag), D (35x22mm Falcon), E (25x12mm Eppendorf), F (85.6x54mm Cards).',
    example: 'A / B / C / D / E / F',
    codePlaceholder: 'e.g. A, B, C, D, E, F',
    namePlaceholder: 'Dimensions (e.g. 50.8 x 25.4 mm)',
    secondaryLabel: 'Printer Roll Name',
    secondaryPlaceholder: 'e.g. Roll B (Petri Dishes/Plates)',
  },
  {
    key: 'signature-checksum',
    variableNo: 13,
    name: 'Signature / Checksum Master',
    docLabel: '13. Signature / checksum: ADD IN MASTER',
    badge: 'Tamper Verification',
    description: 'Cryptographic hash signatures (SIG12345) and embryologist operator digital verification keys.',
    example: 'SIG12345 / CRC32 / PIN Key',
    codePlaceholder: 'e.g. SIG12345, CRC32',
    namePlaceholder: 'Signature / Checksum Scheme Name',
    secondaryLabel: 'Security Level',
    secondaryPlaceholder: 'e.g. Standard FNV-1a / Certified Embryologist',
  },
];

const QR_DATA_FIELDS = [
  { seq: 1, name: 'System Code', example: 'FT', desc: 'Identifies FertiTrace system', table: 'Variable 1 Master' },
  { seq: 2, name: 'QR Version', example: 'V1', desc: 'Format structure version', table: 'Variable 2 Master' },
  { seq: 3, name: 'Clinic / Site ID', example: 'CL001', desc: 'IVF clinic / centre identifier', table: 'Variable 3 Master' },
  { seq: 4, name: 'Case / Patient ID', example: 'CASE26001234', desc: 'Secure patient identifier', table: 'Variable 4 Master' },
  { seq: 5, name: 'Cycle ID', example: 'CY2600456', desc: 'Active treatment cycle identifier', table: 'Variable 5 Master' },
  { seq: 6, name: 'Specimen ID', example: 'SP000789', desc: 'Primary traceability identifier', table: 'Variable 6 Master' },
  { seq: 7, name: 'Specimen Type', example: 'OOCYTE', desc: 'OOCYTE | EMBRYO | SEMEN', table: 'Variable 7 Master' },
  { seq: 8, name: 'Container Type', example: 'DISH (07)', desc: 'Labware/Consumable physical type (01-13)', table: 'Variable 9 Master' },
  { seq: 9, name: 'Container / Unit No.', example: '01', desc: 'Specific dish or vial number (01, 02, 03...)', table: 'Variable 11 Master' },
  { seq: 10, name: 'Creation Date/Time', example: '04 12 20 14 46', desc: 'Live timestamp e.g. 04 12 20 14 46 (DD MM YY HH mm)', table: 'Variable 8 Master' },
  { seq: 11, name: 'Signature / Checksum', example: 'SIG12345', desc: 'Tamper-evident verification hash', table: 'Variable 13 Master' },
];

export default function QrCodeMasterPage() {
  const [activeTab, setActiveTab] = useState<'tables' | 'fields' | 'consumables' | 'registry'>('tables');
  const [selectedTableKey, setSelectedTableKey] = useState<string>('consumable-type');
  const [searchQuery, setSearchQuery] = useState('');
  const [tableData, setTableData] = useState<Record<string, QRMasterItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<FertiTraceQRRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Modal State for CRUD
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<QRMasterItem | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formSecondary, setFormSecondary] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch all 13 tables on mount
  const loadTables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/qr/masters');
      const data = await res.json();
      if (data.success && data.tables) {
        setTableData(data.tables);
      }
    } catch (err) {
      console.warn('Failed to fetch QR master tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // Fetch live QR registry
  useEffect(() => {
    if (activeTab === 'registry') {
      setLoadingRecords(true);
      fetch('/api/qr/history')
        .then((res) => res.json())
        .then((data) => {
          if (data.records) setRecords(data.records);
        })
        .catch((err) => console.error('Failed to load QR history:', err))
        .finally(() => setLoadingRecords(false));
    }
  }, [activeTab]);

  const currentMeta = useMemo(() => {
    return ALL_13_MASTER_DEFINITIONS.find((d) => d.key === selectedTableKey) || ALL_13_MASTER_DEFINITIONS[8];
  }, [selectedTableKey]);

  const currentItems = useMemo(() => {
    const raw = tableData[selectedTableKey] || [];
    if (!searchQuery.trim()) return raw;
    const q = searchQuery.toLowerCase().trim();
    return raw.filter(
      (it) =>
        it.code.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        (it.secondary && it.secondary.toLowerCase().includes(q)) ||
        (it.description && it.description.toLowerCase().includes(q))
    );
  }, [tableData, selectedTableKey, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormCode('');
    setFormName('');
    setFormSecondary('');
    setFormDescription('');
    setFormIsActive(true);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: QRMasterItem) => {
    setEditingItem(item);
    setFormCode(item.code);
    setFormName(item.name);
    setFormSecondary(item.secondary || item.category || '');
    setFormDescription(item.description || '');
    setFormIsActive(item.isActive);
    setShowModal(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      setStatusMsg({ text: 'Code and Name are required fields.', type: 'error' });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      if (editingItem) {
        // PUT update
        const res = await fetch('/api/qr/masters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            tableKey: selectedTableKey,
            code: formCode.trim(),
            name: formName.trim(),
            secondary: formSecondary.trim(),
            category: formSecondary.trim(),
            description: formDescription.trim(),
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Update failed');

        setTableData((prev) => {
          const list = prev[selectedTableKey] || [];
          return {
            ...prev,
            [selectedTableKey]: list.map((it) => (it.id === editingItem.id ? data.item : it)),
          };
        });
        setStatusMsg({ text: `Successfully updated "${formCode}" in ${currentMeta.name}!`, type: 'success' });
      } else {
        // POST create
        const res = await fetch('/api/qr/masters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableKey: selectedTableKey,
            code: formCode.trim(),
            name: formName.trim(),
            secondary: formSecondary.trim(),
            category: formSecondary.trim(),
            description: formDescription.trim(),
            isActive: formIsActive,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Create failed');

        setTableData((prev) => {
          const list = prev[selectedTableKey] || [];
          return {
            ...prev,
            [selectedTableKey]: [data.item, ...list],
          };
        });
        setStatusMsg({ text: `Successfully created "${formCode}" in ${currentMeta.name}!`, type: 'success' });
      }

      setShowModal(false);
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setStatusMsg({ text: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (item: QRMasterItem) => {
    if (!confirm(`Are you sure you want to delete ${item.code} - ${item.name}?`)) return;

    try {
      const res = await fetch(`/api/qr/masters?id=${encodeURIComponent(item.id)}&tableKey=${encodeURIComponent(selectedTableKey)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');

      setTableData((prev) => {
        const list = prev[selectedTableKey] || [];
        return {
          ...prev,
          [selectedTableKey]: list.filter((it) => it.id !== item.id),
        };
      });
      setStatusMsg({ text: `Deleted "${item.code}" from ${currentMeta.name}`, type: 'success' });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      setStatusMsg({ text: msg, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-purple-50/40 to-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-black tracking-tight text-slate-900">
                  QR Code Master &amp; Traceability Tables
                </h1>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  13 Dedicated Master Tables (CRUD)
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Directly aligned with <span className="font-semibold text-slate-700">BAR CODE GENERATION VARIABLES.docx</span>. Create, Read, Update, and Delete entries across all 13 barcode variables.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/label-printing"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
            >
              <span>🖨️ Open QR Code Generator</span>
            </Link>
            <Link
              href="/cryonavigation"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <span>🔍 Scan &amp; Validate</span>
            </Link>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">QR Generation Variables</div>
            <div className="mt-1 text-xl font-black text-emerald-700">13 Tables</div>
            <div className="text-[10px] text-slate-400">Full CRUD operations enabled</div>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-white/90 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">QR String Sequence</div>
            <div className="mt-1 text-xl font-black text-purple-700">11 Data Fields</div>
            <div className="text-[10px] text-slate-400">Pipe-delimited standard format</div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Lab Consumable Types</div>
            <div className="mt-1 text-xl font-black text-blue-700">13 Types (01-13)</div>
            <div className="text-[10px] text-slate-400">Semen Jar to Vitrification Straws</div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white/90 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Clinical Procedures</div>
            <div className="mt-1 text-xl font-black text-amber-700">17 Protocols</div>
            <div className="text-[10px] text-slate-400">HSA, SQA, IVF, IUI, Cryo, Thaw</div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'tables'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>⚡ 13 Master Tables (CRUD)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'fields'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📋 11-Field QR String Breakdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('consumables')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'consumables'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>🧪 Consumables Catalog (01-13)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
              activeTab === 'registry'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>📜 Live QR Registry (FT_QR_Master)</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl border p-3 text-xs font-semibold flex items-center justify-between ${
            statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button type="button" onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* TAB 1: 13 MASTER TABLES WITH FULL CRUD */}
      {activeTab === 'tables' && (
        <div className="space-y-5">
          {/* 13 Table Selector Pills Grid */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Select Master Table to Manage ({ALL_13_MASTER_DEFINITIONS.length} Tables):
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Dynamic Database Active (SQL Server: FertiTrace_QR_Masters)
                </span>
                <span className="text-[10px] text-slate-400">Aligned with Variables 1 - 13</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {ALL_13_MASTER_DEFINITIONS.map((def) => {
                const isSelected = def.key === selectedTableKey;
                const count = (tableData[def.key] || []).length;
                return (
                  <button
                    key={def.key}
                    type="button"
                    onClick={() => {
                      setSelectedTableKey(def.key);
                      setSearchQuery('');
                    }}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                        #{def.variableNo}
                      </span>
                      <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {count} items
                      </span>
                    </div>
                    <span className={`mt-1 font-bold text-xs truncate w-full ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                      {def.name.replace(' Master', '')}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate w-full mt-0.5">
                      {def.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Master Table Card with Full CRUD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            {/* Table Header & Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-black">
                    {currentMeta.variableNo}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    {currentMeta.name}
                  </h2>
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {currentMeta.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {currentMeta.description}
                </p>
                <div className="mt-1 font-mono text-[10px] text-slate-400">
                  Docx Variable: <span className="font-semibold text-slate-600">{currentMeta.docLabel}</span> • Example: <span className="font-semibold text-emerald-700">{currentMeta.example}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Search ${currentMeta.name}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                >
                  <span>+</span>
                  <span>Add New</span>
                </button>
              </div>
            </div>

            {/* Table of Entries */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Code / ID</th>
                    <th className="py-2.5 px-3">Name / Title</th>
                    <th className="py-2.5 px-3">Category / Secondary</th>
                    <th className="py-2.5 px-3">Description / Specification</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        Loading master table entries...
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                        No entries found in {currentMeta.name}. Click &ldquo;+ Add New&rdquo; to create one.
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                            {item.code}
                          </span>
                          {item.isDefault && (
                            <span className="ml-1.5 rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-bold">
                              Default
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {item.secondary || item.category ? (
                            <span className="rounded bg-purple-50 text-purple-800 border border-purple-200/60 px-2 py-0.5 text-[10px] font-bold">
                              {item.secondary || item.category}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.description}>
                          {item.description || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              item.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 11-FIELD QR STRING BREAKDOWN */}
      {activeTab === 'fields' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Standard QR Code Data String Sequence
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pipe-delimited standard format: 11 fields ensuring tamper-proof laboratory traceability
            </p>
          </div>

          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 font-mono text-xs text-purple-900 break-all select-all">
            FT|V1|CL001|CASE26001234|CY2600456|SP000789|OOCYTE|DISH|01|20260908T0835|SIG12345
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Seq</th>
                  <th className="py-2.5 px-3">QR Field</th>
                  <th className="py-2.5 px-3">Example Value</th>
                  <th className="py-2.5 px-3">Meaning / Specification</th>
                  <th className="py-2.5 px-3">Feeding Master Table</th>
                  <th className="py-2.5 px-3 text-right">Configure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {QR_DATA_FIELDS.map((f) => (
                  <tr key={f.seq} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-400">{f.seq}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{f.name}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-emerald-700">{f.example}</td>
                    <td className="py-2.5 px-3 text-slate-600">{f.desc}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-800 border border-purple-200/60">
                        {f.table}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('tables');
                          if (f.seq === 1) setSelectedTableKey('system-code');
                          else if (f.seq === 2) setSelectedTableKey('qr-version');
                          else if (f.seq === 3) setSelectedTableKey('clinic-id');
                          else if (f.seq === 4) setSelectedTableKey('smart-id');
                          else if (f.seq === 5) setSelectedTableKey('cycle-id');
                          else if (f.seq === 6) setSelectedTableKey('specimen-id');
                          else if (f.seq === 7) setSelectedTableKey('specimen-type');
                          else if (f.seq === 8) setSelectedTableKey('consumable-type');
                          else if (f.seq === 9) setSelectedTableKey('consumable-unit');
                          else if (f.seq === 10) setSelectedTableKey('process-datetime');
                          else if (f.seq === 11) setSelectedTableKey('signature-checksum');
                        }}
                        className="font-bold text-emerald-700 hover:underline text-[11px]"
                      >
                        Open Master →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONSUMABLES CATALOG (01-13) */}
      {activeTab === 'consumables' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              IVF Consumable &amp; Labware Specifications (01 - 13)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured in Variable 9 Master as defined in BAR CODE GENERATION VARIABLES.docx
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {FERTITRACE_CONSUMABLES.map((c) => (
              <div
                key={c.code}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:bg-white hover:border-emerald-300 transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      {c.code}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {c.name}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500 capitalize">
                    {c.category} • Default Unit: {c.defaultUnit}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tables');
                    setSelectedTableKey('consumable-type');
                  }}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE QR REGISTRY */}
      {activeTab === 'registry' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Live QR Code Master Registry (FT_QR_Master)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently retained generated QR codes with specimen lifecycle traceability
              </p>
            </div>
            <Link
              href="/reports/qrcode-list"
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Open Full QR Report →
            </Link>
          </div>

          {loadingRecords ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading QR registry records...</div>
          ) : records.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No QR records found. Generate a label to view history.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">QR ID / Specimen</th>
                    <th className="py-2.5 px-3">Patient / UHID</th>
                    <th className="py-2.5 px-3">Cycle ID</th>
                    <th className="py-2.5 px-3">Type &amp; Container</th>
                    <th className="py-2.5 px-3">Procedure</th>
                    <th className="py-2.5 px-3">Lifecycle Status</th>
                    <th className="py-2.5 px-3">Created By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.qrId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{r.specimenId}</div>
                        <div className="font-mono text-[10px] text-slate-400">{r.qrId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{r.patientName || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{r.patientUhid || 'UHID-NA'}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{r.cycleId}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-purple-900">{r.specimenType}</span>
                        <div className="text-[10px] text-slate-500">Unit {r.containerUnitNo}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{r.procedureName || 'IVF CYCLE'}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            r.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'IN_PROCESS'
                              ? 'bg-blue-100 text-blue-800'
                              : r.status === 'CRYOPRESERVED'
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">{r.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CRUD MODAL: ADD / EDIT ITEM */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingItem ? 'Edit Master Entry' : 'Add New Master Entry'}
                </h3>
                <p className="text-xs text-slate-500">
                  Table #{currentMeta.variableNo}: {currentMeta.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Code / Abbreviation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentMeta.codePlaceholder}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Name / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={currentMeta.namePlaceholder}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  {currentMeta.secondaryLabel || 'Category / Group'}
                </label>
                <input
                  type="text"
                  placeholder={currentMeta.secondaryPlaceholder || 'Optional classification'}
                  value={formSecondary}
                  onChange={(e) => setFormSecondary(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Description / Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed notes or barcode rule specification..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-emerald-600"
                />
                <label htmlFor="formIsActive" className="text-xs font-semibold text-slate-700 select-none">
                  Active (Available for QR Code Generation)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
