'use client';

import React, { useState, useMemo } from 'react';
import { usePatientIds } from '@/components/clinical/clinical-shared';

export interface SmartCardRecord {
  id: string;
  cardUid: string;
  holderName: string;
  holderType: 'Patient Couple' | 'Embryologist' | 'Doctor' | 'Lab Technician' | 'Donor';
  identifierId: string; // UHID or Staff ID
  secondaryName?: string; // Partner Name for Couples
  zones: string[];
  issueDate: string;
  expiryDate: string;
  status: 'Active' | 'Suspended' | 'Revoked' | 'Expired';
  photoGradient: string;
  avatarInitials: string;
  lastTapTime?: string;
  lastTapZone?: string;
}

export interface AccessLogItem {
  id: string;
  timestamp: string;
  cardUid: string;
  holderName: string;
  holderType: string;
  zone: string;
  result: 'Granted' | 'Denied - Unauthorized Zone' | 'Denied - Card Suspended' | 'Mismatch Alert';
  doorName: string;
}

const AVAILABLE_ZONES = [
  { id: 'cleanroom', name: 'Class 10,000 IVF Cleanroom', icon: '🔬', level: 'High' },
  { id: 'embryo_lab', name: 'Embryo Culture Suite (Incubators)', icon: '🧫', level: 'Critical' },
  { id: 'cryo_vault', name: 'Cryobank & Nitrogen (LN2) Vault', icon: '❄️', level: 'Critical' },
  { id: 'andrology', name: 'Andrology & Semen Processing', icon: '🧪', level: 'Medium' },
  { id: 'opu_ot', name: 'OPU & ET Operating Theaters', icon: '🏥', level: 'High' },
  { id: 'patient_gate', name: 'Patient Check-in & Witness Gate', icon: '🚪', level: 'Standard' },
];

const INITIAL_CARDS: SmartCardRecord[] = [
  {
    id: 'sc-1',
    cardUid: 'FT-RFID-8842-9901',
    holderName: 'Farah Mohammed Khan',
    secondaryName: 'Mohammed Shaikh',
    holderType: 'Patient Couple',
    identifierId: 'PT-004',
    zones: ['Patient Check-in & Witness Gate', 'OPU & ET Operating Theaters'],
    issueDate: '2026-09-01',
    expiryDate: '2027-09-01',
    status: 'Active',
    photoGradient: 'from-pink-500 to-purple-600',
    avatarInitials: 'FK',
    lastTapTime: 'Today, 09:14 AM',
    lastTapZone: 'OPU & ET Operating Theaters',
  },
  {
    id: 'sc-2',
    cardUid: 'FT-EMB-1001-A94F',
    holderName: 'Dr. Sachin Kadam',
    holderType: 'Embryologist',
    identifierId: 'EMB-01',
    zones: [
      'Class 10,000 IVF Cleanroom',
      'Embryo Culture Suite (Incubators)',
      'Cryobank & Nitrogen (LN2) Vault',
      'Andrology & Semen Processing',
      'OPU & ET Operating Theaters',
    ],
    issueDate: '2026-01-15',
    expiryDate: '2027-01-15',
    status: 'Active',
    photoGradient: 'from-blue-600 to-indigo-800',
    avatarInitials: 'SK',
    lastTapTime: 'Today, 10:45 AM',
    lastTapZone: 'Class 10,000 IVF Cleanroom',
  },
  {
    id: 'sc-3',
    cardUid: 'FT-DOC-2004-C81B',
    holderName: 'Dr. Aarti Sharma',
    holderType: 'Doctor',
    identifierId: 'DOC-03',
    zones: ['OPU & ET Operating Theaters', 'Patient Check-in & Witness Gate'],
    issueDate: '2026-03-10',
    expiryDate: '2027-03-10',
    status: 'Active',
    photoGradient: 'from-purple-600 to-violet-900',
    avatarInitials: 'AS',
    lastTapTime: 'Today, 08:30 AM',
    lastTapZone: 'OPU & ET Operating Theaters',
  },
  {
    id: 'sc-4',
    cardUid: 'FT-LAB-3008-E45D',
    holderName: 'Rahul Verma',
    holderType: 'Lab Technician',
    identifierId: 'LAB-05',
    zones: ['Andrology & Semen Processing', 'Cryobank & Nitrogen (LN2) Vault'],
    issueDate: '2026-04-01',
    expiryDate: '2027-04-01',
    status: 'Active',
    photoGradient: 'from-emerald-600 to-teal-800',
    avatarInitials: 'RV',
    lastTapTime: 'Yesterday, 04:12 PM',
    lastTapZone: 'Cryobank & Nitrogen (LN2) Vault',
  },
  {
    id: 'sc-5',
    cardUid: 'FT-DNR-4091-889A',
    holderName: 'Donor D-902',
    holderType: 'Donor',
    identifierId: 'OD-902',
    zones: ['Patient Check-in & Witness Gate'],
    issueDate: '2026-09-10',
    expiryDate: '2026-09-28',
    status: 'Suspended',
    photoGradient: 'from-amber-500 to-orange-700',
    avatarInitials: 'DN',
    lastTapTime: '3 days ago',
    lastTapZone: 'Patient Check-in & Witness Gate',
  },
];

const INITIAL_LOGS: AccessLogItem[] = [
  {
    id: 'log-1',
    timestamp: 'Today, 10:45:12 AM',
    cardUid: 'FT-EMB-1001-A94F',
    holderName: 'Dr. Sachin Kadam',
    holderType: 'Embryologist',
    zone: 'Class 10,000 IVF Cleanroom',
    doorName: 'Cleanroom Airlock Door #1',
    result: 'Granted',
  },
  {
    id: 'log-2',
    timestamp: 'Today, 09:14:03 AM',
    cardUid: 'FT-RFID-8842-9901',
    holderName: 'Farah Mohammed Khan',
    holderType: 'Patient Couple',
    zone: 'OPU & ET Operating Theaters',
    doorName: 'OT Bay 2 Patient Ingress',
    result: 'Granted',
  },
  {
    id: 'log-3',
    timestamp: 'Today, 08:52:19 AM',
    cardUid: 'FT-DNR-4091-889A',
    holderName: 'Donor D-902',
    holderType: 'Donor',
    zone: 'Class 10,000 IVF Cleanroom',
    doorName: 'Cleanroom Airlock Door #1',
    result: 'Denied - Unauthorized Zone',
  },
  {
    id: 'log-4',
    timestamp: 'Today, 08:30:45 AM',
    cardUid: 'FT-DOC-2004-C81B',
    holderName: 'Dr. Aarti Sharma',
    holderType: 'Doctor',
    zone: 'OPU & ET Operating Theaters',
    doorName: 'OT Doctors Scrub Entry',
    result: 'Granted',
  },
];

// Play pleasant web audio synth beep on tap
function playBeep(success: boolean) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (success) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(196, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio context restrictions
  }
}

export function SmartCardClient() {
  const { selectedPatient, patientName } = usePatientIds();
  const partnerName = selectedPatient?.partner ?? '';

  const [cards, setCards] = useState<SmartCardRecord[]>(INITIAL_CARDS);
  const [logs, setLogs] = useState<AccessLogItem[]>(INITIAL_LOGS);
  const [selectedCardId, setSelectedCardId] = useState<string>(INITIAL_CARDS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'directory' | 'logs' | 'matrix'>('directory');
  const [isFlipped, setIsFlipped] = useState(false);

  // Modals & simulation
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showTapModal, setShowTapModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tap simulation state
  const [simDoor, setSimDoor] = useState(AVAILABLE_ZONES[0].name);
  const [tapFeedback, setTapFeedback] = useState<{
    success: boolean;
    text: string;
    holder: string;
    zone: string;
  } | null>(null);

  // New Card Form state
  const [newHolderType, setNewHolderType] = useState<SmartCardRecord['holderType']>('Patient Couple');
  const [newHolderName, setNewHolderName] = useState(patientName || '');
  const [newPartnerName, setNewPartnerName] = useState(partnerName || '');
  const [newIdNumber, setNewIdNumber] = useState(selectedPatient?.uhid || 'PT-AUTO');
  const [newCardUid, setNewCardUid] = useState(`FT-NFC-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newSelectedZones, setNewSelectedZones] = useState<string[]>([AVAILABLE_ZONES[0].name, AVAILABLE_ZONES[4].name]);
  const [newValidityMonths, setNewValidityMonths] = useState('12');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedCard = useMemo(() => {
    return cards.find((c) => c.id === selectedCardId) || cards[0];
  }, [cards, selectedCardId]);

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchType =
        filterType === 'All' ||
        (filterType === 'Staff' && ['Embryologist', 'Doctor', 'Lab Technician'].includes(c.holderType)) ||
        (filterType === 'Couples' && c.holderType === 'Patient Couple') ||
        (filterType === 'Donors' && c.holderType === 'Donor') ||
        (filterType === 'Suspended' && c.status !== 'Active');

      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        c.holderName.toLowerCase().includes(q) ||
        c.cardUid.toLowerCase().includes(q) ||
        c.identifierId.toLowerCase().includes(q) ||
        (c.secondaryName && c.secondaryName.toLowerCase().includes(q));

      return matchType && matchQuery;
    });
  }, [cards, filterType, searchQuery]);

  // Handle Tap Simulation
  const handleExecuteTap = (cardToTap: SmartCardRecord, door: string) => {
    const isSuspended = cardToTap.status !== 'Active';
    const hasPermission = cardToTap.zones.includes(door);
    const success = !isSuspended && hasPermission;

    playBeep(success);

    const resultStatus: AccessLogItem['result'] = isSuspended
      ? 'Denied - Card Suspended'
      : !hasPermission
      ? 'Denied - Unauthorized Zone'
      : 'Granted';

    const newLog: AccessLogItem = {
      id: `log-${Date.now()}`,
      timestamp: 'Just now',
      cardUid: cardToTap.cardUid,
      holderName: cardToTap.holderName,
      holderType: cardToTap.holderType,
      zone: door,
      doorName: `${door} Access Reader`,
      result: resultStatus,
    };

    setLogs((prev) => [newLog, ...prev]);

    // Update last tap in card
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardToTap.id
          ? {
              ...c,
              lastTapTime: 'Just now',
              lastTapZone: door,
            }
          : c
      )
    );

    setTapFeedback({
      success,
      text: success
        ? `Access Granted! Door unlocked for ${cardToTap.holderName}`
        : isSuspended
        ? `Access Denied: Card is currently ${cardToTap.status}`
        : `Access Denied: ${cardToTap.holderName} does not have clearance for ${door}`,
      holder: cardToTap.holderName,
      zone: door,
    });
  };

  // Toggle Card Status (Active / Suspended / Revoked)
  const handleToggleStatus = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const nextStatus: SmartCardRecord['status'] = c.status === 'Active' ? 'Suspended' : 'Active';
        showToast(`Card ${c.cardUid} is now ${nextStatus}`);
        return { ...c, status: nextStatus };
      })
    );
  };

  // Issue New Card
  const handleIssueCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolderName.trim()) {
      alert('Holder name is required');
      return;
    }

    const today = new Date();
    const expiry = new Date();
    expiry.setMonth(today.getMonth() + parseInt(newValidityMonths, 10));

    const newRecord: SmartCardRecord = {
      id: `sc-${Date.now()}`,
      cardUid: newCardUid,
      holderName: newHolderName,
      secondaryName: newHolderType === 'Patient Couple' ? newPartnerName : undefined,
      holderType: newHolderType,
      identifierId: newIdNumber,
      zones: newSelectedZones,
      issueDate: today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'Active',
      photoGradient:
        newHolderType === 'Patient Couple'
          ? 'from-rose-500 to-indigo-600'
          : newHolderType === 'Embryologist'
          ? 'from-blue-600 to-violet-800'
          : 'from-emerald-600 to-cyan-700',
      avatarInitials: newHolderName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      lastTapTime: 'Not yet tapped',
      lastTapZone: '-',
    };

    setCards((prev) => [newRecord, ...prev]);
    setSelectedCardId(newRecord.id);
    setShowIssueModal(false);
    showToast(`Smart Card successfully issued for ${newHolderName}`);
    playBeep(true);
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Smart Card & Access Management</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                RFID / NFC Reader Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cleanroom biometric identity, patient couple electronic tokens & high-security lab zone authorization
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowTapModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 px-3.5 py-1.5 text-xs font-bold text-indigo-700 transition active:scale-[0.98]"
          >
            <span>📶</span>
            <span>Simulate RFID Tap</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNewHolderName(patientName || '');
              setNewPartnerName(partnerName || '');
              setNewIdNumber(selectedPatient?.uhid || 'PT-AUTO');
              setShowIssueModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
          >
            <span>+</span>
            <span>Issue New Smart Card</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Issued Cards</span>
            <span className="text-base">💳</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">{cards.length}</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">● {cards.filter((c) => c.status === 'Active').length} Active & Valid</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cleanroom Personnel</span>
            <span className="text-base">🔬</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-indigo-900">
            {cards.filter((c) => c.zones.includes('Class 10,000 IVF Cleanroom')).length}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500 font-medium">Class 10k airlock certified</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Patient Couple Tokens</span>
            <span className="text-base">👥</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-purple-900">
            {cards.filter((c) => c.holderType === 'Patient Couple').length}
          </p>
          <p className="mt-0.5 text-[10px] text-purple-600 font-medium">Paired with OPU/ET beds</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Access Events Today</span>
            <span className="text-base">🛡️</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-900">{logs.length}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 font-medium">
            {logs.filter((l) => l.result === 'Granted').length} Approved / {logs.filter((l) => l.result !== 'Granted').length} Denied
          </p>
        </div>
      </div>

      {/* 3. Main Center Split View: Interactive 3D Card Visualizer + Controls */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column (Col 5): Realistic Trending Smart Card UI */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Card Simulator</span>
            <button
              type="button"
              onClick={() => setIsFlipped(!isFlipped)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              🔄 Flip Card ({isFlipped ? 'View Front' : 'View Back'})
            </button>
          </div>

          {/* Visual Plastic Smart Card (Aspect Ratio 1.58:1 Standard ID-1) */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="group relative cursor-pointer select-none overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl ring-1 ring-white/10 transition-all hover:scale-[1.01] hover:shadow-2xl min-h-[220px]"
          >
            {/* Hologram / Gloss reflection effect */}
            <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-gradient-to-br from-indigo-400/20 via-purple-300/10 to-transparent blur-2xl group-hover:scale-125 transition-transform" />

            {!isFlipped ? (
              /* CARD FRONT */
              <div className="flex flex-col justify-between h-full space-y-4">
                {/* Header row: Clinic branding & Contactless Chip */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                      <span className="text-base font-black text-indigo-300">FT</span>
                    </div>
                    <div>
                      <h2 className="text-xs font-black tracking-widest uppercase text-white/90">FERTITRACE ACCESS</h2>
                      <p className="text-[9px] font-mono tracking-wider text-indigo-300">SECURE IVF SMART TOKEN</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Metallic Smart Chip */}
                    <div className="h-7 w-9 rounded bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-500/40 shadow-inner flex items-center justify-center">
                      <div className="h-4 w-6 border-y border-amber-600/60 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full border border-amber-700/60" />
                      </div>
                    </div>
                    {/* Contactless waves */}
                    <svg className="h-5 w-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                      <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                      <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                    </svg>
                  </div>
                </div>

                {/* Cardholder Information */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                        selectedCard.holderType === 'Embryologist'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                          : selectedCard.holderType === 'Patient Couple'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {selectedCard.holderType}
                    </span>
                    <span className="font-mono text-[10px] text-white/60">{selectedCard.identifierId}</span>
                  </div>

                  <h3 className="text-base font-bold tracking-wide text-white drop-shadow-sm">
                    {selectedCard.holderName}
                  </h3>
                  {selectedCard.secondaryName && (
                    <p className="text-[11px] text-indigo-200">
                      Partner: <span className="font-semibold text-white">{selectedCard.secondaryName}</span>
                    </p>
                  )}
                </div>

                {/* Footer row: UID, Valid Dates & Status */}
                <div className="flex items-end justify-between border-t border-white/10 pt-2 text-[10px]">
                  <div>
                    <span className="block text-[8px] uppercase tracking-wider text-white/50">Card UID</span>
                    <span className="font-mono font-bold tracking-wider text-indigo-200">{selectedCard.cardUid}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] uppercase tracking-wider text-white/50">Valid Thru</span>
                    <span className="font-mono font-semibold text-white/80">{selectedCard.expiryDate}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* CARD BACK */
              <div className="flex flex-col justify-between h-full space-y-3">
                {/* Magnetic Stripe */}
                <div className="-mx-6 -mt-2 h-9 bg-black/80 border-y border-white/10" />

                <div className="grid grid-cols-3 gap-2 items-center">
                  <div className="col-span-2 space-y-1 text-[10px]">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Authorized Zones:</span>
                    <ul className="space-y-0.5 text-[9px] text-indigo-200">
                      {selectedCard.zones.slice(0, 3).map((z, idx) => (
                        <li key={idx} className="truncate">✓ {z}</li>
                      ))}
                      {selectedCard.zones.length > 3 && (
                        <li className="text-white/60">+{selectedCard.zones.length - 3} more zones</li>
                      )}
                    </ul>
                  </div>

                  {/* QR Code Graphic */}
                  <div className="flex flex-col items-center justify-center p-1 bg-white rounded-lg shadow-sm">
                    <div className="grid grid-cols-4 gap-0.5 w-12 h-12 bg-slate-900 p-1 rounded">
                      <div className="bg-white rounded-xs" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-transparent" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-white rounded-xs" />
                      <div className="bg-white rounded-xs" />
                    </div>
                    <span className="text-[7px] font-mono text-slate-800 font-bold mt-0.5">SCAN RFID</span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-1 text-[8px] text-white/50 text-center">
                  Property of IVF Laboratory. If found, return to Cleanroom Security Admin.
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons for Selected Card */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <button
              type="button"
              onClick={() => handleExecuteTap(selectedCard, AVAILABLE_ZONES[0].name)}
              className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
            >
              ⚡ Test Tap at Cleanroom
            </button>
            <button
              type="button"
              onClick={() => handleToggleStatus(selectedCard.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border shadow-xs ${
                selectedCard.status === 'Active'
                  ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {selectedCard.status === 'Active' ? '⏸ Suspend' : '▶ Activate'}
            </button>
          </div>
        </div>

        {/* Right Column (Col 7): Cards List & Search */}
        <div className="lg:col-span-7 space-y-3">
          {/* Tabs Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'directory' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Issued Cards ({cards.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'logs' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Live Access Log ({logs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('matrix')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  activeTab === 'matrix' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Security Zones Matrix
              </button>
            </div>

            {/* Filter Pills */}
            {activeTab === 'directory' && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                {['All', 'Couples', 'Staff', 'Suspended'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`rounded-md px-2 py-0.5 transition ${
                      filterType === t ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'directory' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search card by holder name, UHID, or Card UID..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              {/* Cards List Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                  {filteredCards.map((card) => {
                    const isSelected = card.id === selectedCardId;
                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id)}
                        className={`flex items-center justify-between p-3 cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-500/20' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${card.photoGradient} text-white font-bold text-xs shadow-xs`}
                          >
                            {card.avatarInitials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{card.holderName}</h4>
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${
                                  card.holderType === 'Embryologist'
                                    ? 'bg-blue-100 text-blue-800'
                                    : card.holderType === 'Patient Couple'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {card.holderType}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono">{card.identifierId}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-600">{card.cardUid}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                card.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {card.status}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{card.lastTapTime || 'No taps'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredCards.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">No smart cards match your search criteria.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {logs.map((log) => (
                  <div key={log.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                          log.result === 'Granted' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {log.result === 'Granted' ? '✓' : '✕'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{log.holderName}</span>
                          <span className="text-[10px] font-mono text-slate-500">({log.cardUid})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{log.doorName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                          log.result === 'Granted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.result}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs p-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">High-Security Lab Access Matrix</h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-500">
                    <th className="py-2 font-bold">Zone / Room</th>
                    <th className="py-2 font-bold text-center">Embryologist</th>
                    <th className="py-2 font-bold text-center">Doctor</th>
                    <th className="py-2 font-bold text-center">Technician</th>
                    <th className="py-2 font-bold text-center">Patient Couple</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {AVAILABLE_ZONES.map((zone) => (
                    <tr key={zone.id} className="hover:bg-slate-50">
                      <td className="py-2.5 font-medium text-slate-800 flex items-center gap-1.5">
                        <span>{zone.icon}</span>
                        <span>{zone.name}</span>
                      </td>
                      <td className="py-2.5 text-center text-emerald-600 font-bold">✓ Full</td>
                      <td className="py-2.5 text-center font-semibold text-slate-600">
                        {zone.id === 'opu_ot' || zone.id === 'patient_gate' ? '✓ Full' : '—'}
                      </td>
                      <td className="py-2.5 text-center font-semibold text-slate-600">
                        {zone.id === 'andrology' || zone.id === 'cryo_vault' ? '✓ Full' : '—'}
                      </td>
                      <td className="py-2.5 text-center font-semibold text-purple-700">
                        {zone.id === 'patient_gate' || zone.id === 'opu_ot' ? '✓ Escorted' : '🔒 Restricted'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 4. Tap Simulator Modal */}
      {showTapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📶</span>
                <h3 className="text-sm font-bold text-slate-900">NFC / RFID Reader Simulator</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTapModal(false);
                  setTapFeedback(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Access Station Door</label>
                <select
                  value={simDoor}
                  onChange={(e) => setSimDoor(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                >
                  {AVAILABLE_ZONES.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.icon} {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Card to Tap</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-1">
                  {cards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleExecuteTap(c, simDoor)}
                      className="w-full flex items-center justify-between rounded p-2 text-left text-xs hover:bg-indigo-50 transition border border-transparent hover:border-indigo-200"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{c.holderName}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">{c.cardUid}</span>
                      </div>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600">
                        Tap →
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {tapFeedback && (
                <div
                  className={`rounded-xl p-3 text-xs border ${
                    tapFeedback.success
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  <p className="font-bold">{tapFeedback.success ? '✓ ACCESS GRANTED' : '⚠️ ACCESS DENIED'}</p>
                  <p className="mt-0.5 text-[11px]">{tapFeedback.text}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowTapModal(false);
                  setTapFeedback(null);
                }}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Issue New Smart Card Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleIssueCardSubmit}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <h3 className="text-sm font-bold text-slate-900">Issue New Electronic Smart Card</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cardholder Category</label>
                  <select
                    value={newHolderType}
                    onChange={(e) => setNewHolderType(e.target.value as SmartCardRecord['holderType'])}
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                  >
                    <option value="Patient Couple">Patient Couple</option>
                    <option value="Embryologist">Embryologist</option>
                    <option value="Doctor">Doctor / Clinician</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Donor">Oocyte / Sperm Donor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">ID Number (UHID / Emp ID)</label>
                  <input
                    type="text"
                    value={newIdNumber}
                    onChange={(e) => setNewIdNumber(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cardholder Full Name</label>
                <input
                  type="text"
                  value={newHolderName}
                  onChange={(e) => setNewHolderName(e.target.value)}
                  placeholder="e.g. Farah Mohammed Khan"
                  required
                  className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                />
              </div>

              {newHolderType === 'Patient Couple' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Husband / Partner Name</label>
                  <input
                    type="text"
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    placeholder="e.g. Mohammed Shaikh"
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned RFID / NFC UID</label>
                  <input
                    type="text"
                    value={newCardUid}
                    onChange={(e) => setNewCardUid(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono text-indigo-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Validity Period</label>
                  <select
                    value={newValidityMonths}
                    onChange={(e) => setNewValidityMonths(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                  >
                    <option value="1">1 Month (Donor / Short-term)</option>
                    <option value="6">6 Months (Cycle Duration)</option>
                    <option value="12">12 Months (Standard Staff)</option>
                    <option value="24">24 Months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clearance Access Zones</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-slate-200 rounded-lg p-2.5 max-h-36 overflow-y-auto">
                  {AVAILABLE_ZONES.map((z) => {
                    const checked = newSelectedZones.includes(z.name);
                    return (
                      <label key={z.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSelectedZones((prev) => [...prev, z.name]);
                            } else {
                              setNewSelectedZones((prev) => prev.filter((item) => item !== z.name));
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-medium text-slate-700 truncate">{z.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-xs"
              >
                Issue & Encode Card
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
