'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FertiTraceQRRecord, FERTITRACE_CONSUMABLES, FertiTraceLifecycleStatus } from '@/lib/types/fertitrace-qr';

interface MasterTableCard {
  id: string;
  name: string;
  qrField: string;
  qrFieldName: string;
  role: string;
  route: string;
  category: 'clinical' | 'labware' | 'identity' | 'cryo';
  tag: string;
  description: string;
}

const QR_MASTER_TABLES: MasterTableCard[] = [
  {
    id: 'lab-oper',
    name: 'Lab Oper. Master',
    qrField: 'Field 8',
    qrFieldName: 'Container & Consumable Type',
    role: 'Defines 11 of the 13 primary labware types (01 Semen Jar, 02 Conical Tube, 03 Falcon 5ml, 04 Appendroff, 06 Falcon 15ml, 07 Petri Dish, 08 Centre Well, 09 ICSI Dish, 10 Four Well, 12 Vitrification Straw, 13 Cryovial)',
    route: '/masters/common/2',
    category: 'labware',
    tag: 'Consumables (01-13)',
    description: 'CatId: 2 • Feeds standard dish, vial and tube codes into QR generator.',
  },
  {
    id: 'catheter',
    name: 'Catheter Master',
    qrField: 'Field 8',
    qrFieldName: 'Catheter Consumable Type',
    role: 'Defines catheter consumables: 05 IUI Catheter and 11 Embryo Transfer Catheter for clinical procedure witnessing.',
    route: '/masters/common/9',
    category: 'labware',
    tag: 'Catheters (05, 11)',
    description: 'CatId: 9 • Ensures correct catheter batch and specification are linked to QR code.',
  },
  {
    id: 'method',
    name: 'Method Master',
    qrField: 'Field 10',
    qrFieldName: 'Procedure Name & Code',
    role: 'Feeds ART Procedure types into QR: HSA, SQA, IUI Single/Double, Thaw Husband/Donor, IVF Cycle, Embryo Freezing, FET, Oocyte Freezing, ED Cycle.',
    route: '/masters/common/3',
    category: 'clinical',
    tag: 'Procedures',
    description: 'CatId: 3 • Maps protocol abbreviations to the compact and pipe QR format.',
  },
  {
    id: 'sperm-id',
    name: 'Sperm Id / Specimen Master',
    qrField: 'Fields 6 & 7',
    qrFieldName: 'Specimen ID & Specimen Type',
    role: 'Specimen types: OOCYTE, EMBRYO, SEMEN. Generates unique specimen traceability ID (SP000000) that follows cells through all lab stages.',
    route: '/masters/common/22',
    category: 'clinical',
    tag: 'Specimen Types',
    description: 'CatId: 22 • Foundation of cell-level witnessing from OPU to Embryo Transfer.',
  },
  {
    id: 'patient',
    name: 'Patient Management',
    qrField: 'Field 4',
    qrFieldName: 'Patient / Case ID & FertiTrace ID',
    role: 'Stores Patient Demographics, UHID, Partner ID, and Unique Smart/FertiTrace ID encoded into QR.',
    route: '/masters/patient',
    category: 'identity',
    tag: 'Patient ID',
    description: 'Patient Registry • Prevents sample mix-up by encoding non-meaningful secure Case IDs.',
  },
  {
    id: 'satellite',
    name: 'Satellite / Clinic Master',
    qrField: 'Field 3',
    qrFieldName: 'Clinic / Site Identifier',
    role: 'Feeds Clinic/Site code (e.g., CL001) for multi-centre IVF hospital groups and satellite clinics.',
    route: '/masters/satellite',
    category: 'identity',
    tag: 'Clinic ID',
    description: 'Site Registry • Ensures multi-site chain of custody and facility isolation.',
  },
  {
    id: 'user',
    name: 'User Master',
    qrField: 'Field 11',
    qrFieldName: 'Operator Signature & Checksum',
    role: 'Authenticated embryologist/nurse who generated the QR code, stored with tamper-evident checksum (SIG12345).',
    route: '/masters/user',
    category: 'identity',
    tag: 'Signature',
    description: 'User Registry • Verifies authorized operator and logs digital sign-off.',
  },
  {
    id: 'colour',
    name: 'Colour Master',
    qrField: 'Cryo Label',
    qrFieldName: 'Straw, Goblet & Visotube Colors',
    role: 'Cryo alphanumeric coding (e.g. BA52 C9 GOBL VERD VIBL STBR) for visual and electronic tank inventory.',
    route: '/masters/common/5',
    category: 'cryo',
    tag: 'Cryo Colors',
    description: 'CatId: 5 • Color codes for straws, visotubes, goblets, and canes.',
  },
  {
    id: 'indication',
    name: 'Indication Master',
    qrField: 'Validation',
    qrFieldName: 'Clinical Indication',
    role: 'Validation of clinical indication for cycle protocols (e.g. Male Factor, Tubal, Unexplained, PGT-A).',
    route: '/masters/common/23',
    category: 'clinical',
    tag: 'Indications',
    description: 'CatId: 23 • Used in automated mismatch rules during witnessing verification.',
  },
  {
    id: 'incubator',
    name: 'Incubator Used',
    qrField: 'Dish Trace',
    qrFieldName: 'Culture Incubator Location',
    role: 'Tracks which benchtop or tri-gas incubator chamber the labeled dish is assigned to.',
    route: '/masters/common/30',
    category: 'labware',
    tag: 'Incubators',
    description: 'CatId: 30 • Maps physical dish placement in time-lapse and benchtop incubators.',
  },
  {
    id: 'doctor',
    name: 'Doctor Master',
    qrField: 'Cycle Record',
    qrFieldName: 'Consultant In-Charge',
    role: 'Consultant gynecologist/reproductive endocrinologist managing the patient cycle.',
    route: '/masters/doctor',
    category: 'identity',
    tag: 'Consultant',
    description: 'Doctor Registry • Links primary clinical consultant to specimen traceability chain.',
  },
  {
    id: 'personnel',
    name: 'Personnel Master',
    qrField: 'Witnessing',
    qrFieldName: 'Double-Witness Personnel',
    role: 'Registered lab personnel eligible to serve as primary or second witness during critical handovers.',
    route: '/masters/common/16',
    category: 'identity',
    tag: 'Witnesses',
    description: 'CatId: 16 • Controls witness authentication during double-check confirmation.',
  },
];

const QR_DATA_FIELDS = [
  { seq: 1, name: 'System Code', example: 'FT', desc: 'Identifies FertiTrace system', table: 'System Constant', route: '#' },
  { seq: 2, name: 'QR Version', example: 'V1', desc: 'Format structure version', table: 'System Constant', route: '#' },
  { seq: 3, name: 'Clinic / Site ID', example: 'CL001', desc: 'IVF clinic / centre identifier', table: 'Satellite Master', route: '/masters/satellite' },
  { seq: 4, name: 'Case / Patient ID', example: 'CASE26001234', desc: 'Secure patient identifier', table: 'Patient Management', route: '/masters/patient' },
  { seq: 5, name: 'Cycle ID', example: 'CY2600456', desc: 'Active treatment cycle identifier', table: 'Patient Cycle Registry', route: '/cycle' },
  { seq: 6, name: 'Specimen ID', example: 'SP000789', desc: 'Primary traceability identifier', table: 'Sperm Id / Specimen Master', route: '/masters/common/22' },
  { seq: 7, name: 'Specimen Type', example: 'OOCYTE', desc: 'OOCYTE | EMBRYO | SEMEN', table: 'Sperm Id / Specimen Master', route: '/masters/common/22' },
  { seq: 8, name: 'Container Type', example: 'DISH (07)', desc: 'Labware/Consumable physical type', table: 'Lab Oper. & Catheter Master', route: '/masters/common/2' },
  { seq: 9, name: 'Container / Unit No.', example: '01', desc: 'Specific dish or vial number (01-99)', table: 'Consumable Unit Table', route: '/masters/common/2' },
  { seq: 10, name: 'Creation Date/Time', example: '20260908T0835', desc: 'Timestamp format YYYYMMDDTHHMM', table: 'System Timestamp', route: '#' },
  { seq: 11, name: 'Signature / Checksum', example: 'SIG12345', desc: 'Tamper-evident verification hash', table: 'User Master', route: '/masters/user' },
];

export default function QrCodeMasterPage() {
  const [activeTab, setActiveTab] = useState<'tables' | 'fields' | 'consumables' | 'registry'>('tables');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'clinical' | 'labware' | 'identity' | 'cryo'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<FertiTraceQRRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

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

  const filteredTables = useMemo(() => {
    return QR_MASTER_TABLES.filter((t) => {
      const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || t.name.toLowerCase().includes(q) || t.role.toLowerCase().includes(q) || t.qrFieldName.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [categoryFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 via-purple-50/40 to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-black tracking-tight text-slate-900">
                  QR Code Master & Traceability Tables
                </h1>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  13 Active Master Tables
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Central configuration and data dictionary highlighting all underlying database tables used in FertiTrace QR generation & witnessing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/label-printing"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <span>🖨️ Print New QR Label</span>
            </Link>
            <Link
              href="/cryonavigation"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <span>🔍 Scan & Validate</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Linked Master Tables</div>
            <div className="mt-1 text-xl font-black text-emerald-700">13 Tables</div>
            <div className="text-[10px] text-slate-400">All 4 Navigation Columns</div>
          </div>
          <div className="rounded-2xl border border-purple-100 bg-white/90 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">QR Data Fields</div>
            <div className="mt-1 text-xl font-black text-purple-700">11 Fields</div>
            <div className="text-[10px] text-slate-400">Pipe-delimited standard string</div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white/90 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Labware & Consumables</div>
            <div className="mt-1 text-xl font-black text-blue-700">13 Types</div>
            <div className="text-[10px] text-slate-400">Dishes, Tubes, Straws, Catheters</div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white/90 p-3 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500">Specimen Lifecycle States</div>
            <div className="mt-1 text-xl font-black text-amber-700">7 States</div>
            <div className="text-[10px] text-slate-400">Never delete traceability history</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
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
            <span>⚡ QR Master Tables (13)</span>
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
            <span>📋 11-Field QR Data Breakdown</span>
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

        {activeTab === 'tables' && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter master tables..."
              className="w-48 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* Tab 1: 13 Master Tables Grid */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-bold text-slate-400 mr-1 text-[11px] uppercase tracking-wider">Category:</span>
            {[
              { id: 'all', label: 'All Tables (13)' },
              { id: 'labware', label: '🧪 Labware & Consumables' },
              { id: 'clinical', label: '🔬 Clinical & Procedures' },
              { id: 'identity', label: '👤 Patient & Personnel' },
              { id: 'cryo', label: '❄️ Cryo & Colors' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {table.name}
                        </h3>
                      </div>
                      <div className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                        {table.qrField}: {table.qrFieldName}
                      </div>
                    </div>
                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                      {table.tag}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs text-slate-600 line-clamp-3">
                    {table.role}
                  </p>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {table.description}
                  </span>
                  <Link
                    href={table.route}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    <span>Edit Table</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: 11-Field QR Data Breakdown */}
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
                  <th className="py-2.5 px-3 text-right">Action</th>
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
                      {f.route !== '#' ? (
                        <Link
                          href={f.route}
                          className="font-bold text-emerald-700 hover:underline text-[11px]"
                        >
                          Configure →
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[11px]">System</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Consumables Catalog (01-13) */}
      {activeTab === 'consumables' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              IVF Consumable & Labware Specifications (01 - 13)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configured in <span className="font-semibold text-slate-700">Lab Oper. Master</span> and <span className="font-semibold text-slate-700">Catheter Master</span> as per requirement specification
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
                <Link
                  href={c.category === 'catheter' ? '/masters/common/9' : '/masters/common/2'}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Live QR Registry */}
      {activeTab === 'registry' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Live QR Code Master Registry (FT_QR_Master)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every generated QR code is permanently retained with full specimen lifecycle traceability
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
                    <th className="py-2.5 px-3">Type & Container</th>
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
    </div>
  );
}
