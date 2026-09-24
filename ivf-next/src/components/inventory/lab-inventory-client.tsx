'use client';

import React, { useState, useMemo } from 'react';
import { usePatientIds } from '@/components/clinical/clinical-shared';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Media & Solutions' | 'Plastics & Needles' | 'Cryo Consumables' | 'Gases & Cryogens';
  brand: string;
  lotNumber: string;
  expiryDate: string; // YYYY-MM-DD
  storageTemp: string; // e.g. 2-8°C, -20°C, Room Temp
  currentStock: number;
  minThreshold: number;
  unit: string;
  coaAttached: boolean; // Certificate of Analysis
  status: 'In Stock' | 'Low Stock' | 'Expiring Soon' | 'Quarantined';
}

export interface StockTransaction {
  id: string;
  timestamp: string;
  type: 'DISPENSE_CYCLE' | 'GOODS_RECEIPT' | 'ADJUSTMENT' | 'DISCARD';
  itemSku: string;
  itemName: string;
  lotNumber: string;
  quantity: number;
  patientUhid?: string;
  patientName?: string;
  cycleId?: string;
  operator: string;
  notes?: string;
}

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'MED-CSCM-01',
    name: 'Continuous Single Culture Media (CSCM-C) w/ HAS',
    category: 'Media & Solutions',
    brand: 'Irvine Scientific / FUJIFILM',
    lotNumber: 'LOT-2026-CS881',
    expiryDate: '2026-11-20',
    storageTemp: '2-8°C',
    currentStock: 14,
    minThreshold: 8,
    unit: 'bottles (20ml)',
    coaAttached: true,
    status: 'In Stock',
  },
  {
    id: 'inv-2',
    sku: 'MED-HYAL-02',
    name: 'Hyaluronidase in HTF (80 IU/ml)',
    category: 'Media & Solutions',
    brand: 'Vitrolife',
    lotNumber: 'LOT-2026-HY449',
    expiryDate: '2026-10-10', // < 30 days
    storageTemp: '2-8°C',
    currentStock: 4,
    minThreshold: 6,
    unit: 'vials (1ml)',
    coaAttached: true,
    status: 'Expiring Soon',
  },
  {
    id: 'inv-3',
    sku: 'MED-PVP-03',
    name: 'PVP Clinical Solution 7% for ICSI',
    category: 'Media & Solutions',
    brand: 'Origio / CooperSurgical',
    lotNumber: 'LOT-2026-PV102',
    expiryDate: '2026-12-15',
    storageTemp: '2-8°C',
    currentStock: 9,
    minThreshold: 5,
    unit: 'vials (0.5ml)',
    coaAttached: true,
    status: 'In Stock',
  },
  {
    id: 'inv-4',
    sku: 'MED-OIL-04',
    name: 'OVOIL Heavy Mineral Oil Overlay',
    category: 'Media & Solutions',
    brand: 'Vitrolife',
    lotNumber: 'LOT-2026-OL993',
    expiryDate: '2027-02-28',
    storageTemp: '15-25°C Room Temp',
    currentStock: 18,
    minThreshold: 10,
    unit: 'bottles (100ml)',
    coaAttached: true,
    status: 'In Stock',
  },
  {
    id: 'inv-5',
    sku: 'MED-VIT-FREEZE',
    name: 'Vitrification Freeze Kit (VS1 + VS2 + ES)',
    category: 'Media & Solutions',
    brand: 'Kitazato',
    lotNumber: 'LOT-2026-KT772',
    expiryDate: '2026-10-05',
    storageTemp: '2-8°C',
    currentStock: 3,
    minThreshold: 5,
    unit: 'kits',
    coaAttached: true,
    status: 'Low Stock',
  },
  {
    id: 'inv-6',
    sku: 'PLS-OPU-17G',
    name: 'OPU Follicle Aspiration Needle (Single Lumen 17G x 35cm)',
    category: 'Plastics & Needles',
    brand: 'Cook Medical',
    lotNumber: 'LOT-2026-CK551',
    expiryDate: '2028-06-30',
    storageTemp: 'Room Temp',
    currentStock: 45,
    minThreshold: 20,
    unit: 'sterile pcs',
    coaAttached: true,
    status: 'In Stock',
  },
  {
    id: 'inv-7',
    sku: 'PLS-ICSI-PIP',
    name: 'ICSI Injection Micropipettes (30° Angle, 4.5µm ID)',
    category: 'Plastics & Needles',
    brand: 'Sunlight Medical',
    lotNumber: 'LOT-2026-SL091',
    expiryDate: '2027-11-15',
    storageTemp: 'Room Temp',
    currentStock: 2,
    minThreshold: 10,
    unit: 'boxes (10 pcs)',
    coaAttached: true,
    status: 'Low Stock',
  },
  {
    id: 'inv-8',
    sku: 'PLS-DISH-GPS',
    name: '4-Well Embryo GPS Culture Dishes with Lid',
    category: 'Plastics & Needles',
    brand: 'Thermo Scientific / Nunc',
    lotNumber: 'LOT-2026-NC442',
    expiryDate: '2028-01-31',
    storageTemp: 'Room Temp',
    currentStock: 80,
    minThreshold: 30,
    unit: 'dishes',
    coaAttached: true,
    status: 'In Stock',
  },
  {
    id: 'inv-9',
    sku: 'CRYO-STRAW-TOP',
    name: 'Cryotop Vitrification Straws (Open System - Green)',
    category: 'Cryo Consumables',
    brand: 'Kitazato',
    lotNumber: 'LOT-2026-KT889',
    expiryDate: '2028-09-01',
    storageTemp: 'Room Temp',
    currentStock: 120,
    minThreshold: 50,
    unit: 'straws',
    coaAttached: true,
    status: 'In Stock',
  },
  {
    id: 'inv-10',
    sku: 'GAS-TRIGAS-50L',
    name: 'Premixed Tri-Gas Cylinder (6% CO2, 5% O2, 89% N2)',
    category: 'Gases & Cryogens',
    brand: 'Inox Air Products',
    lotNumber: 'LOT-2026-TG201',
    expiryDate: '2027-04-30',
    storageTemp: 'Manifold Bank A',
    currentStock: 4,
    minThreshold: 2,
    unit: 'cylinders (50L)',
    coaAttached: true,
    status: 'In Stock',
  },
];

const INITIAL_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'TX-901',
    timestamp: 'Today, 10:45 AM',
    type: 'DISPENSE_CYCLE',
    itemSku: 'MED-CSCM-01',
    itemName: 'Continuous Single Culture Media (CSCM-C) w/ HAS',
    lotNumber: 'LOT-2026-CS881',
    quantity: 1,
    patientUhid: 'PT-004',
    patientName: 'Farah Mohammed Khan',
    cycleId: 'CYC-2026-0881',
    operator: 'Dr. Sachin Kadam',
    notes: 'Dispensed for Day 0 OPU drop preparation',
  },
  {
    id: 'TX-900',
    timestamp: 'Today, 09:30 AM',
    type: 'DISPENSE_CYCLE',
    itemSku: 'PLS-OPU-17G',
    itemName: 'OPU Follicle Aspiration Needle (17G)',
    lotNumber: 'LOT-2026-CK551',
    quantity: 1,
    patientUhid: 'PT-004',
    patientName: 'Farah Mohammed Khan',
    cycleId: 'CYC-2026-0881',
    operator: 'Nurse Sunita P.',
    notes: 'Used in OT-1 OPU procedure',
  },
  {
    id: 'TX-899',
    timestamp: 'Yesterday, 02:15 PM',
    type: 'GOODS_RECEIPT',
    itemSku: 'CRYO-STRAW-TOP',
    itemName: 'Cryotop Vitrification Straws',
    lotNumber: 'LOT-2026-KT889',
    quantity: 50,
    operator: 'Rahul Verma',
    notes: 'GRN received from Kitazato India Pvt Ltd',
  },
];

export function LabInventoryClient() {
  const { selectedPatient, patientName } = usePatientIds();

  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [transactions, setTransactions] = useState<StockTransaction[]>(INITIAL_TRANSACTIONS);
  const [activeTab, setActiveTab] = useState<'catalog' | 'transactions' | 'coldchain'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dispense Form state
  const [dispenseItemSku, setDispenseItemSku] = useState(INITIAL_ITEMS[0].sku);
  const [dispenseQty, setDispenseQty] = useState('1');
  const [dispensePatName, setDispensePatName] = useState(patientName || 'Farah Mohammed Khan');
  const [dispensePatUhid, setDispensePatUhid] = useState(selectedPatient?.uhid || 'PT-004');
  const [dispenseCycleId, setDispenseCycleId] = useState('CYC-2026-0881');
  const [dispenseNotes, setDispenseNotes] = useState('Routine OPU / ICSI culture dish prep');

  // New Stock Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemCat, setNewItemCat] = useState<InventoryItem['category']>('Media & Solutions');
  const [newItemBrand, setNewItemBrand] = useState('Vitrolife');
  const [newItemLot, setNewItemLot] = useState(`LOT-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [newItemExpiry, setNewItemExpiry] = useState('2027-06-30');
  const [newItemTemp, setNewItemTemp] = useState('2-8°C');
  const [newItemQty, setNewItemQty] = useState('10');
  const [newItemThreshold, setNewItemThreshold] = useState('5');
  const [newItemUnit, setNewItemUnit] = useState('vials');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.lotNumber.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [items, selectedCategory, searchQuery]);

  // Handle Dispense to Cycle
  const handleDispenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = items.find((i) => i.sku === dispenseItemSku);
    if (!targetItem) return;

    const qty = parseInt(dispenseQty, 10) || 1;
    if (targetItem.currentStock < qty) {
      alert(`Cannot dispense: only ${targetItem.currentStock} ${targetItem.unit} remaining in stock!`);
      return;
    }

    // Deduct stock
    setItems((prev) =>
      prev.map((item) => {
        if (item.sku !== dispenseItemSku) return item;
        const updatedStock = item.currentStock - qty;
        const newStatus: InventoryItem['status'] =
          updatedStock <= item.minThreshold ? 'Low Stock' : item.status;
        return {
          ...item,
          currentStock: updatedStock,
          status: newStatus,
        };
      })
    );

    // Create immutable traceability record
    const newTx: StockTransaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      type: 'DISPENSE_CYCLE',
      itemSku: targetItem.sku,
      itemName: targetItem.name,
      lotNumber: targetItem.lotNumber,
      quantity: qty,
      patientUhid: dispensePatUhid,
      patientName: dispensePatName,
      cycleId: dispenseCycleId,
      operator: 'Dr. Sachin Kadam',
      notes: dispenseNotes,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setShowDispenseModal(false);
    showToast(`✓ Dispensed ${qty} ${targetItem.unit} of Lot [${targetItem.lotNumber}] to ${dispensePatName} (${dispensePatUhid})`);
  };

  // Handle Stock In / GRN
  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemSku.trim()) {
      alert('Item name and SKU code are required.');
      return;
    }

    const qty = parseInt(newItemQty, 10) || 1;
    const threshold = parseInt(newItemThreshold, 10) || 1;

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku: newItemSku.toUpperCase(),
      name: newItemName,
      category: newItemCat,
      brand: newItemBrand,
      lotNumber: newItemLot.toUpperCase(),
      expiryDate: newItemExpiry,
      storageTemp: newItemTemp,
      currentStock: qty,
      minThreshold: threshold,
      unit: newItemUnit,
      coaAttached: true,
      status: qty <= threshold ? 'Low Stock' : 'In Stock',
    };

    setItems((prev) => [newItem, ...prev]);

    const newTx: StockTransaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: 'Just now',
      type: 'GOODS_RECEIPT',
      itemSku: newItem.sku,
      itemName: newItem.name,
      lotNumber: newItem.lotNumber,
      quantity: qty,
      operator: 'Dr. Sachin Kadam',
      notes: `Goods received from ${newItem.brand}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setShowAddStockModal(false);
    showToast(`✓ Received ${qty} ${newItem.unit} of [${newItem.name}] into inventory`);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
          <span className="text-xs font-bold text-slate-800">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-xs">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2" />
              <path d="M8.5 4h7" />
              <path d="M9.5 16h5" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                IVF Laboratory Inventory & Reagents
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cold-Chain 2-8°C Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Batch & lot traceability, sterile culture media tracking, and cycle-to-vial automated linkage
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setDispensePatName(patientName || 'Farah Mohammed Khan');
              setDispensePatUhid(selectedPatient?.uhid || 'PT-004');
              setShowDispenseModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 px-3.5 py-1.5 text-xs font-bold text-indigo-700 transition active:scale-[0.98]"
          >
            <span>⚡</span>
            <span>Dispense to Cycle</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddStockModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
          >
            <span>+</span>
            <span>Receive Stock (GRN)</span>
          </button>
        </div>
      </div>

      {/* 2. Cold Chain Live Sensor Bar */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-3.5 text-white shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          <span>Continuous Cold-Chain Telemetry & Gas Pressure</span>
          <span className="text-[10px] text-emerald-400 font-mono">Sensors Live (Updated 10s ago)</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
            <span className="block text-[10px] text-slate-300">Refrigerator 1 (Media 2-8°C)</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-base font-bold text-emerald-300">3.8 °C</span>
              <span className="text-[10px] text-emerald-400 font-medium">✓ Normal</span>
            </div>
          </div>

          <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
            <span className="block text-[10px] text-slate-300">Refrigerator 2 (Enzymes 2-8°C)</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-base font-bold text-emerald-300">4.2 °C</span>
              <span className="text-[10px] text-emerald-400 font-medium">✓ Normal</span>
            </div>
          </div>

          <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
            <span className="block text-[10px] text-slate-300">Liquid Nitrogen Tank (LN2)</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-base font-bold text-cyan-300">-195.8 °C</span>
              <span className="text-[10px] text-cyan-400 font-medium">94% Level</span>
            </div>
          </div>

          <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
            <span className="block text-[10px] text-slate-300">Tri-Gas Manifold Line</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-base font-bold text-indigo-300">55.2 PSI</span>
              <span className="text-[10px] text-indigo-400 font-medium">✓ Regulated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Metrics KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active SKUs</span>
            <span className="text-base">📦</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">{items.length}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 font-medium">Across 4 lab categories</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock SKUs</span>
            <span className="text-base">⚠️</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-amber-700">
            {items.filter((i) => i.currentStock <= i.minThreshold).length}
          </p>
          <p className="mt-0.5 text-[10px] text-amber-600 font-medium">Needs reorder soon</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Expiring &lt; 30 Days</span>
            <span className="text-base">⏳</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-rose-700">
            {items.filter((i) => i.status === 'Expiring Soon').length}
          </p>
          <p className="mt-0.5 text-[10px] text-rose-600 font-medium">Prioritize use or discard</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cycle Linkage Rate</span>
            <span className="text-base">🔗</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-900">100%</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">Zero untracked dispatches</p>
        </div>
      </div>

      {/* 4. Tab Switcher & Filter Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === 'catalog' ? 'bg-white text-cyan-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory Catalog ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`rounded-lg px-3.5 py-1.5 transition ${
              activeTab === 'transactions' ? 'bg-white text-cyan-800 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cycle Traceability Ledger ({transactions.length})
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            {['All', 'Media & Solutions', 'Plastics & Needles', 'Cryo Consumables', 'Gases & Cryogens'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-cyan-800 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Tab 1: Catalog Table */}
      {activeTab === 'catalog' && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reagent name, SKU, Lot number, or brand..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-1 focus:ring-cyan-600 shadow-2xs"
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600">
                  <th className="py-3 px-3.5">SKU & Item Name</th>
                  <th className="py-3 px-3">Brand / Supplier</th>
                  <th className="py-3 px-3">Lot Number</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3">Storage Temp</th>
                  <th className="py-3 px-3 text-center">Stock Level</th>
                  <th className="py-3 px-3 text-center">CoA</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredItems.map((item) => {
                  const isLow = item.currentStock <= item.minThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span className="font-mono text-cyan-800 font-bold">{item.sku}</span>
                          <span>•</span>
                          <span>{item.category}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium">{item.brand}</td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.lotNumber}</td>

                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            item.status === 'Expiring Soon'
                              ? 'bg-rose-100 text-rose-800'
                              : 'text-slate-700'
                          }`}
                        >
                          {item.expiryDate}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 font-medium">{item.storageTemp}</td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block font-mono font-bold text-xs ${
                            isLow ? 'text-amber-700' : 'text-slate-800'
                          }`}
                        >
                          {item.currentStock} {item.unit}
                        </span>
                        {isLow && (
                          <span className="block text-[9px] font-bold text-amber-600">Low (Min: {item.minThreshold})</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            item.coaAttached ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.coaAttached ? '✓ Verified' : 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setDispenseItemSku(item.sku);
                            setShowDispenseModal(true);
                          }}
                          className="rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 text-[11px] font-bold transition mr-1"
                        >
                          Dispense
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Tab 2: Cycle Traceability Ledger */}
      {activeTab === 'transactions' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Cycle-to-Batch Traceability Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Complete regulatory record proving which media and consumable lots were utilized in every patient cycle
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600">
                <th className="py-2.5 px-3">Tx ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Item Dispensed</th>
                <th className="py-2.5 px-3">Lot Number</th>
                <th className="py-2.5 px-3">Patient & Cycle ID</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-800">{tx.id}</td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{tx.timestamp}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {tx.itemName} <span className="font-mono text-[10px] text-slate-500">({tx.quantity} pcs)</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{tx.lotNumber}</td>
                  <td className="py-2.5 px-3">
                    {tx.patientName ? (
                      <div>
                        <span className="font-bold text-slate-900">{tx.patientName}</span>
                        <span className="block font-mono text-[10px] text-indigo-700">
                          {tx.patientUhid} • {tx.cycleId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{tx.operator}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[10px] max-w-[200px] truncate">{tx.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 7. Dispense to Cycle Modal */}
      {showDispenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleDispenseSubmit}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="text-sm font-bold text-slate-900">Dispense Reagent / Consumable to Cycle</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDispenseModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Inventory Item</label>
                <select
                  value={dispenseItemSku}
                  onChange={(e) => setDispenseItemSku(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.sku}>
                      {i.name} — Lot: {i.lotNumber} ({i.currentStock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity Dispensed</label>
                  <input
                    type="number"
                    min="1"
                    value={dispenseQty}
                    onChange={(e) => setDispenseQty(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cycle ID</label>
                  <input
                    type="text"
                    value={dispenseCycleId}
                    onChange={(e) => setDispenseCycleId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={dispensePatName}
                    onChange={(e) => setDispensePatName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient UHID</label>
                  <input
                    type="text"
                    value={dispensePatUhid}
                    onChange={(e) => setDispensePatUhid(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Procedure Notes</label>
                <input
                  type="text"
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  placeholder="e.g. Day 0 OPU dish preparation or ICSI droplet"
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDispenseModal(false)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-xs"
              >
                Deduct & Record Linkage
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 8. Goods Received (GRN) Add Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleAddStockSubmit}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📦</span>
                <h3 className="text-sm font-bold text-slate-900">Goods Receipt Note (GRN) — New Stock Intake</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item Category</label>
                  <select
                    value={newItemCat}
                    onChange={(e) => setNewItemCat(e.target.value as InventoryItem['category'])}
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                  >
                    <option value="Media & Solutions">Media & Solutions</option>
                    <option value="Plastics & Needles">Plastics & Needles</option>
                    <option value="Cryo Consumables">Cryo Consumables</option>
                    <option value="Gases & Cryogens">Gases & Cryogens</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MED-CSCM-02"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Full Name & Specification</label>
                <input
                  type="text"
                  placeholder="e.g. G-1 PLUS Cleavage Medium w/ Gentamicin"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Manufacturer / Brand</label>
                  <input
                    type="text"
                    value={newItemBrand}
                    onChange={(e) => setNewItemBrand(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lot / Batch Number</label>
                  <input
                    type="text"
                    value={newItemLot}
                    onChange={(e) => setNewItemLot(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold text-cyan-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newItemExpiry}
                    onChange={(e) => setNewItemExpiry(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Storage Temperature</label>
                  <input
                    type="text"
                    value={newItemTemp}
                    onChange={(e) => setNewItemTemp(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Received Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-cyan-700 hover:bg-cyan-800 px-5 py-2 text-xs font-bold text-white shadow-xs"
              >
                Accept GRN into Stock
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
