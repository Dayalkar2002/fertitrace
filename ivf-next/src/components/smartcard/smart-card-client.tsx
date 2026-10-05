'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePatientIds } from '@/components/clinical/clinical-shared';
import { FertiTraceQRCode } from '@/components/common/fertitrace-qr-code';

export interface SmartCardRecord {
  id: string;
  cardUid: string;
  holderName: string;
  holderType: 'Patient Couple' | 'Embryologist' | 'Doctor' | 'Lab Technician' | 'Donor';
  identifierId: string; // UHID or Staff ID
  secondaryName?: string; // Partner Name for Couples
  gender?: string; // Female | Male | Couple
  dob?: string; // e.g. 14/05/1992
  age?: string; // e.g. 34 Y
  bloodGroup?: string; // e.g. B +ve
  registeredDate?: string; // e.g. 01/09/2026
  doctorName?: string; // e.g. Dr. Aarti Sharma
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

export type CardTemplateType = 'lifetime-clinical' | 'preprinted-overlay' | 'cleanroom-tech';

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
    gender: 'Female',
    dob: '14/05/1992',
    age: '34 Y',
    bloodGroup: 'B +ve',
    registeredDate: '2026-09-01',
    doctorName: 'Dr. Aarti Sharma',
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
    cardUid: 'FT-RFID-9102-3341',
    holderName: 'Anita Rajesh Patel',
    secondaryName: 'Rajesh Patel',
    holderType: 'Patient Couple',
    identifierId: 'PT-001',
    gender: 'Female',
    dob: '22/08/1990',
    age: '36 Y',
    bloodGroup: 'O +ve',
    registeredDate: '2026-08-15',
    doctorName: 'Dr. Aarti Sharma',
    zones: ['Patient Check-in & Witness Gate', 'OPU & ET Operating Theaters'],
    issueDate: '2026-08-15',
    expiryDate: '2027-08-15',
    status: 'Active',
    photoGradient: 'from-violet-500 to-indigo-600',
    avatarInitials: 'AP',
    lastTapTime: 'Yesterday, 11:20 AM',
    lastTapZone: 'Patient Check-in & Witness Gate',
  },
  {
    id: 'sc-3',
    cardUid: 'FT-EMB-1001-A94F',
    holderName: 'Dr. Sachin Kadam',
    holderType: 'Embryologist',
    identifierId: 'EMB-01',
    gender: 'Male',
    doctorName: 'Chief Clinical Embryologist',
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
    id: 'sc-4',
    cardUid: 'FT-DOC-2004-C81B',
    holderName: 'Dr. Aarti Sharma',
    holderType: 'Doctor',
    identifierId: 'DOC-03',
    gender: 'Female',
    doctorName: 'Senior IVF Specialist & Director',
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
    id: 'sc-5',
    cardUid: 'FT-LAB-3008-E45D',
    holderName: 'Rahul Verma',
    holderType: 'Lab Technician',
    identifierId: 'LAB-05',
    gender: 'Male',
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
    id: 'sc-6',
    cardUid: 'FT-DNR-4091-889A',
    holderName: 'Donor D-902',
    holderType: 'Donor',
    identifierId: 'OD-902',
    gender: 'Female',
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
  const searchParams = useSearchParams();
  const { selectedPatient, patientName } = usePatientIds();
  const partnerName = selectedPatient?.partner ?? '';

  const [cards, setCards] = useState<SmartCardRecord[]>(INITIAL_CARDS);
  const [logs, setLogs] = useState<AccessLogItem[]>(INITIAL_LOGS);
  const [selectedCardId, setSelectedCardId] = useState<string>(INITIAL_CARDS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'directory' | 'logs' | 'matrix'>('directory');

  // Card Template & View Controls
  const [cardTemplate, setCardTemplate] = useState<CardTemplateType>('lifetime-clinical');
  const [cardSideView, setCardSideView] = useState<'front' | 'back' | 'both'>('front');
  const [showPreprintedShell, setShowPreprintedShell] = useState<boolean>(true);

  // Modals & simulation
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showTapModal, setShowTapModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Print Modal Configuration
  const [printSides, setPrintSides] = useState<'both' | 'front' | 'back'>('both');
  const [printPreset, setPrintPreset] = useState<'zc300' | 'zd611r' | 'a4'>('zc300');
  const [ribbonType, setRibbonType] = useState<'ymcko' | 'resin-black'>('ymcko');

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
  const [newCardUid, setNewCardUid] = useState(`FT-RFID-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newSelectedZones, setNewSelectedZones] = useState<string[]>([AVAILABLE_ZONES[0].name, AVAILABLE_ZONES[4].name]);
  const [newValidityMonths, setNewValidityMonths] = useState('12');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize URL search params (e.g. from Patient Master "💳 Card" navigation)
  useEffect(() => {
    const uhidParam = searchParams.get('uhid');
    const nameParam = searchParams.get('name');
    const partnerParam = searchParams.get('partner');
    const uidParam = searchParams.get('uid');

    if (uhidParam) {
      // Find if this patient already has a card
      const existing = cards.find(
        (c) => c.identifierId.toLowerCase() === uhidParam.toLowerCase() || (uidParam && c.cardUid === uidParam)
      );

      if (existing) {
        setSelectedCardId(existing.id);
        setCardTemplate('lifetime-clinical');
      } else if (nameParam) {
        // Synthesize and auto-register card for this patient
        const newUid = uidParam || `FT-RFID-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const autoCard: SmartCardRecord = {
          id: `sc-auto-${Date.now()}`,
          cardUid: newUid,
          holderName: nameParam,
          secondaryName: partnerParam || undefined,
          holderType: 'Patient Couple',
          identifierId: uhidParam,
          gender: 'Female',
          dob: '14/05/1992',
          age: '34 Y',
          bloodGroup: 'B +ve',
          registeredDate: new Date().toISOString().split('T')[0],
          doctorName: 'Dr. Aarti Sharma',
          zones: ['Patient Check-in & Witness Gate', 'OPU & ET Operating Theaters'],
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Active',
          photoGradient: 'from-rose-500 to-indigo-600',
          avatarInitials: nameParam.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          lastTapTime: 'Just Registered',
          lastTapZone: 'Patient Master',
        };
        setCards((prev) => [autoCard, ...prev]);
        setSelectedCardId(autoCard.id);
        setCardTemplate('lifetime-clinical');
        showToast(`Loaded Lifetime Patient Card for ${nameParam} (${uhidParam})`);
      }
    }
  }, [searchParams]);

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
      gender: newHolderType === 'Patient Couple' ? 'Female' : 'Staff',
      dob: '15/06/1993',
      age: '33 Y',
      bloodGroup: 'A +ve',
      registeredDate: today.toISOString().split('T')[0],
      doctorName: 'Dr. Aarti Sharma',
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

  // Trigger Native Print Dialog
  const handleTriggerPrint = () => {
    window.print();
  };

  // FertiTrace Witnessing QR String Payload
  const qrString = `FT-WITNESS|UHID:${selectedCard.identifierId}|NAME:${encodeURIComponent(selectedCard.holderName)}|PARTNER:${encodeURIComponent(selectedCard.secondaryName || '')}|UID:${selectedCard.cardUid}|EXP:${selectedCard.expiryDate}`;

  return (
    <div className="space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
          <span className="text-xs font-bold text-slate-800">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner & Template Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-md shadow-indigo-500/20">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Smart Card & RFID Witnessing Studio
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                CR-80 ISO Print Engine Ready
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ISO/IEC 7810 ID-1 (85.60 &times; 53.98 mm) lifetime patient cards, pre-printed blank overlays & cleanroom RFID access tokens
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPrintModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition active:scale-[0.98]"
            title="Open Print to CR-80 ISO Card Dialog"
          >
            <span>🖨️</span>
            <span>Print to CR-80 Card</span>
          </button>
          <button
            type="button"
            onClick={() => setShowTapModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 px-3.5 py-2 text-xs font-bold text-indigo-700 transition active:scale-[0.98]"
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
          >
            <span>+</span>
            <span>Issue New Card</span>
          </button>
        </div>
      </div>

      {/* 2. Template Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50 p-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1.5">Card Template:</span>
          
          <button
            type="button"
            onClick={() => setCardTemplate('lifetime-clinical')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              cardTemplate === 'lifetime-clinical'
                ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>💳</span>
            <span>Lifetime Patient Card (CR-80 ISO)</span>
            <span className="rounded bg-indigo-400/30 px-1 py-0.2 text-[9px] font-medium text-white">Recommended</span>
          </button>

          <button
            type="button"
            onClick={() => setCardTemplate('preprinted-overlay')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              cardTemplate === 'preprinted-overlay'
                ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🏷️</span>
            <span>Pre-Printed Shell Overlay (Black Resin)</span>
          </button>

          <button
            type="button"
            onClick={() => setCardTemplate('cleanroom-tech')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
              cardTemplate === 'cleanroom-tech'
                ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>🔬</span>
            <span>Cleanroom Technical Token</span>
          </button>
        </div>

        {/* View Side Controller */}
        <div className="flex items-center gap-1 rounded-lg bg-white p-1 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCardSideView('front')}
            className={`rounded px-2.5 py-1 transition ${
              cardSideView === 'front' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Front Side
          </button>
          <button
            type="button"
            onClick={() => setCardSideView('back')}
            className={`rounded px-2.5 py-1 transition ${
              cardSideView === 'back' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Back Side
          </button>
          <button
            type="button"
            onClick={() => setCardSideView('both')}
            className={`rounded px-2.5 py-1 transition ${
              cardSideView === 'both' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dual View (CR-80)
          </button>
        </div>
      </div>

      {/* 3. Top Metric KPI Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Lifetime Cards</span>
            <span className="text-base">💳</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">{cards.length}</p>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">● {cards.filter((c) => c.status === 'Active').length} Active & Validated</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Patient Couple Cards</span>
            <span className="text-base">👥</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-purple-900">
            {cards.filter((c) => c.holderType === 'Patient Couple').length}
          </p>
          <p className="mt-0.5 text-[10px] text-purple-600 font-medium">One Card • Lifetime Identity</p>
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
            <span className="text-[11px] font-semibold uppercase tracking-wider">Access Events Today</span>
            <span className="text-base">🛡️</span>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-900">{logs.length}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 font-medium">
            {logs.filter((l) => l.result === 'Granted').length} Approved / {logs.filter((l) => l.result !== 'Granted').length} Denied
          </p>
        </div>
      </div>

      {/* 4. Main Center Split View: Realistic CR-80 Card Visualizer + Patient Management */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Left Column (Col 6): Visualizer & Direct Controls */}
        <div className="lg:col-span-6 space-y-3">
          {/* Card Dimensions & Spec Label */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-slate-700">ISO/IEC 7810 ID-1 (CR-80)</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600">
                85.60 mm &times; 53.98 mm (3.37&quot; &times; 2.125&quot;)
              </span>
            </div>
            {cardTemplate === 'preprinted-overlay' && (
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-indigo-700">
                <input
                  type="checkbox"
                  checked={showPreprintedShell}
                  onChange={(e) => setShowPreprintedShell(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Show Pre-Printed Shell</span>
              </label>
            )}
          </div>

          {/* Visual Plastic Smart Card Container */}
          <div className="space-y-4">
            {/* FRONT SIDE (Rendered when side is 'front' or 'both') */}
            {(cardSideView === 'front' || cardSideView === 'both') && (
              <div className="relative group">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                  <span>Front Side (Obverse)</span>
                  <span className="font-mono text-slate-500">Zebra ZC300 / ZC100 Compatible</span>
                </div>

                {/* CR-80 CARD CANVAS (Aspect ratio 1.58577) */}
                <div
                  className={`relative select-none overflow-hidden rounded-[14px] shadow-xl transition-all duration-300 ${
                    cardTemplate === 'lifetime-clinical'
                      ? 'bg-gradient-to-tr from-[#091122] via-[#0d1b38] to-[#11244d] text-white ring-1 ring-amber-400/30'
                      : cardTemplate === 'preprinted-overlay'
                      ? showPreprintedShell
                        ? 'bg-gradient-to-tr from-slate-100 via-white to-slate-100 text-slate-900 border-2 border-slate-300 shadow-md'
                        : 'bg-white text-slate-900 border border-dashed border-slate-400'
                      : 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white ring-1 ring-cyan-400/30'
                  }`}
                  style={{
                    aspectRatio: '85.6 / 53.98',
                    minHeight: '260px',
                  }}
                >
                  {/* Hologram / Gloss reflection sheen */}
                  {cardTemplate !== 'preprinted-overlay' && (
                    <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-400/20 via-purple-300/10 to-transparent blur-2xl group-hover:scale-125 transition-transform duration-700" />
                  )}

                  {/* LIFETIME PATIENT CARD TEMPLATE (CR-80 ISO Standard, FertiTrace ART Centre) */}
                  {cardTemplate === 'lifetime-clinical' && (
                    <div className="flex flex-col justify-between h-full p-4 relative z-10">
                      {/* 1. Header Banner */}
                      <div className="flex items-start justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-slate-950 font-black text-sm shadow-md">
                            FT
                          </div>
                          <div>
                            <h2 className="text-xs font-black tracking-wider uppercase text-white leading-none">
                              FERTITRACE ART CENTRE
                            </h2>
                            <p className="text-[8px] font-mono tracking-widest text-indigo-300 mt-0.5">
                              ADVANCED IVF & GENETICS • LIFETIME PATIENT CARD
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-amber-400/15 border border-amber-400/40 px-2 py-0.5 text-[8.5px] font-bold text-amber-300 tracking-wider">
                            LIFETIME ID
                          </div>
                          {/* RFID Wave Icon */}
                          <svg className="h-4 w-4 text-cyan-300/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M8.5 16.5a5 5 0 0 1 0-7" />
                            <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                            <path d="M15.5 21.5a12 12 0 0 0 0-19" />
                          </svg>
                        </div>
                      </div>

                      {/* Philosophy Tagline */}
                      <div className="text-[7.5px] tracking-wider uppercase text-indigo-200/80 font-medium italic -mt-1">
                        Science • Care • Success &nbsp;|&nbsp; One Patient – One Card – Lifetime Identity
                      </div>

                      {/* 2. Middle Body: Photo + Demographic Details + Witness QR */}
                      <div className="grid grid-cols-12 gap-2.5 items-center my-auto">
                        {/* Patient Photo Box */}
                        <div className="col-span-3 flex flex-col items-center">
                          <div className="relative h-24 w-20 rounded-lg overflow-hidden border-2 border-amber-400/50 bg-slate-800 shadow-md flex items-center justify-center">
                            <div className={`h-full w-full bg-gradient-to-tr ${selectedCard.photoGradient} flex flex-col items-center justify-center text-white`}>
                              <span className="text-xl font-black">{selectedCard.avatarInitials}</span>
                              <span className="text-[7px] font-mono tracking-tighter opacity-80 mt-1">SECURE PHOTO</span>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/85 py-0.5 text-center text-[6px] font-bold text-emerald-400 tracking-wider">
                              VERIFIED ID
                            </div>
                          </div>
                        </div>

                        {/* Patient & Couple Info */}
                        <div className="col-span-6 space-y-1">
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-amber-300 font-bold">
                              Cardholder Name
                            </span>
                            <h3 className="text-sm font-black text-white tracking-tight leading-tight truncate">
                              {selectedCard.holderName}
                            </h3>
                            {selectedCard.secondaryName && (
                              <p className="text-[9.5px] text-indigo-200 font-semibold truncate">
                                Spouse: <span className="text-white">{selectedCard.secondaryName}</span>
                              </p>
                            )}
                          </div>

                          {/* ID Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="font-mono text-[9px] font-bold bg-cyan-950/80 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                              UHID: {selectedCard.identifierId}
                            </span>
                            <span className="font-mono text-[9px] font-bold bg-amber-950/80 text-amber-300 px-1.5 py-0.2 rounded border border-amber-800">
                              RFID: {selectedCard.cardUid}
                            </span>
                          </div>

                          {/* Demographics row */}
                          <div className="grid grid-cols-2 gap-x-2 text-[8px] text-slate-300 pt-0.5 font-medium">
                            <div>DOB: {selectedCard.dob || '14/05/1992'} ({selectedCard.age || '34 Y'})</div>
                            <div>Gender: {selectedCard.gender || 'Female'}</div>
                            <div>Reg Date: {selectedCard.registeredDate || selectedCard.issueDate}</div>
                            <div>Dr: {selectedCard.doctorName || 'Dr. Aarti Sharma'}</div>
                          </div>
                        </div>

                        {/* High Density Witness 2D QR Code */}
                        <div className="col-span-3 flex flex-col items-center justify-center">
                          <div className="p-1 rounded-lg bg-white shadow-md border border-white/20">
                            <FertiTraceQRCode value={qrString} size={72} />
                          </div>
                          <span className="text-[6.5px] font-mono text-center text-slate-300 tracking-tighter mt-1 block">
                            WITNESS TOKEN
                          </span>
                        </div>
                      </div>

                      {/* 3. Footer Row: Microchip Graphic + Legal Notice + Status */}
                      <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[8px]">
                        <div className="flex items-center gap-2">
                          {/* Metallic Smart Chip */}
                          <div className="h-5 w-7 rounded bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 border border-amber-500/60 shadow-inner flex items-center justify-center">
                            <div className="h-3 w-5 border-y border-amber-700/60 flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full border border-amber-800/60" />
                            </div>
                          </div>
                          <span className="font-mono text-slate-400 text-[7.5px]">ISO/IEC 7810 ID-1 • CR-80</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[7.5px] text-indigo-300 font-medium">Cycles Linked Dynamically</span>
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.2 rounded text-[7.5px]">
                            ● ACTIVE & ENCODED
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PRE-PRINTED BLANK OVERLAY TEMPLATE (Monochrome black thermal printing on pre-printed cards) */}
                  {cardTemplate === 'preprinted-overlay' && (
                    <div className="flex flex-col justify-between h-full p-4 relative z-10">
                      {/* Ghosted preprinted header */}
                      {showPreprintedShell && (
                        <div className="flex items-start justify-between border-b border-slate-300 pb-2 opacity-50">
                          <div>
                            <h2 className="text-xs font-black uppercase text-slate-700">FERTITRACE ART CENTRE</h2>
                            <p className="text-[8px] font-mono text-slate-500">[PRE-PRINTED OFFSET ARTWORK]</p>
                          </div>
                          <span className="text-[8px] font-bold text-slate-400">CR-80 PRE-PRINTED SHELL</span>
                        </div>
                      )}

                      {/* Pure Black Resin Variable Data */}
                      <div className="grid grid-cols-12 gap-2.5 items-center my-auto">
                        <div className="col-span-3 flex flex-col items-center">
                          <div className="h-24 w-20 rounded border border-black bg-slate-200 flex flex-col items-center justify-center p-1">
                            <span className="text-xs font-bold text-black">{selectedCard.avatarInitials}</span>
                            <span className="text-[6.5px] font-mono text-black mt-1">PHOTO (K-RESIN)</span>
                          </div>
                        </div>

                        <div className="col-span-6 space-y-1 text-black font-sans">
                          <div>
                            <span className="block text-[7.5px] uppercase font-bold text-slate-600">PATIENT NAME</span>
                            <h3 className="text-sm font-black text-black leading-tight truncate">{selectedCard.holderName}</h3>
                            {selectedCard.secondaryName && (
                              <p className="text-[9px] font-bold text-slate-800 truncate">Spouse: {selectedCard.secondaryName}</p>
                            )}
                          </div>

                          <div className="font-mono text-[9px] font-bold space-y-0.5">
                            <div>UHID: <span className="font-black">{selectedCard.identifierId}</span></div>
                            <div>RFID UID: <span className="font-black">{selectedCard.cardUid}</span></div>
                          </div>

                          <div className="text-[8px] font-medium text-slate-800">
                            DOB: {selectedCard.dob || '14/05/1992'} &bull; Gender: {selectedCard.gender || 'Female'}
                          </div>
                        </div>

                        <div className="col-span-3 flex flex-col items-center justify-center">
                          <div className="p-1 border border-black bg-white rounded">
                            <FertiTraceQRCode value={qrString} size={72} />
                          </div>
                          <span className="text-[6.5px] font-mono text-black font-bold mt-1">RESIN QR</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-slate-300 pt-1 text-[8px] font-mono text-black">
                        <span>PRINTED: {new Date().toISOString().split('T')[0]}</span>
                        <span>ZEBRA ZC100 / ZC300 K-RIBBON</span>
                      </div>
                    </div>
                  )}

                  {/* CLEANROOM TECHNICAL TOKEN TEMPLATE */}
                  {cardTemplate === 'cleanroom-tech' && (
                    <div className="flex flex-col justify-between h-full p-4 relative z-10">
                      <div className="flex items-start justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔬</span>
                          <div>
                            <h2 className="text-xs font-black uppercase text-white">FERTITRACE CLEANROOM TOKEN</h2>
                            <p className="text-[8px] font-mono text-cyan-300">MIFARE / ISO 14443A SECURE SECTORS</p>
                          </div>
                        </div>
                        <span className="rounded bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 text-[8.5px] font-bold text-cyan-300">
                          {selectedCard.holderType}
                        </span>
                      </div>

                      <div className="space-y-1.5 my-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white">{selectedCard.holderName}</span>
                          <span className="font-mono text-xs text-cyan-300 font-bold">{selectedCard.identifierId}</span>
                        </div>

                        {/* Sectors Matrix preview */}
                        <div className="grid grid-cols-4 gap-1 text-[7.5px] font-mono text-slate-300">
                          <div className="p-1 rounded bg-slate-800/80 border border-slate-700">Sec 0: UID</div>
                          <div className="p-1 rounded bg-slate-800/80 border border-slate-700">Sec 1: BioHash</div>
                          <div className="p-1 rounded bg-slate-800/80 border border-slate-700">Sec 2: Witness</div>
                          <div className="p-1 rounded bg-slate-800/80 border border-slate-700">Sec 3: OT Keys</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-[8px]">
                        <span className="font-mono text-indigo-300">{selectedCard.cardUid}</span>
                        <span className="text-emerald-400 font-bold font-mono">ENCODED & VALIDATED</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BACK SIDE (Rendered when side is 'back' or 'both') */}
            {(cardSideView === 'back' || cardSideView === 'both') && (
              <div className="relative group">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                  <span>Back Side (Reverse)</span>
                  <span className="font-mono text-slate-500">Legal Compliance & Barcode</span>
                </div>

                {/* CR-80 CARD CANVAS - BACK */}
                <div
                  className="relative select-none overflow-hidden rounded-[14px] bg-gradient-to-tr from-[#0b1325] via-[#0f1d3b] to-[#122346] text-white ring-1 ring-white/10 shadow-xl p-4 flex flex-col justify-between"
                  style={{
                    aspectRatio: '85.6 / 53.98',
                    minHeight: '260px',
                  }}
                >
                  {/* 1. Magnetic Stripe Band */}
                  <div className="-mx-4 -mt-4 h-9 bg-black border-b border-white/15 flex items-center justify-between px-4 text-[7px] font-mono text-slate-500 tracking-widest">
                    <span>TRACK 1: BFT-LIFETIME-CARD-ISO7810</span>
                    <span>HiCo 2750 Oe</span>
                  </div>

                  {/* 2. Middle Content: Instructions + Legal Compliance ART Act 2022 */}
                  <div className="space-y-1.5 my-auto">
                    {/* Legal ART Notice Box */}
                    <div className="rounded border border-amber-400/20 bg-amber-400/5 p-2 text-[7.5px] text-amber-200/90 leading-tight space-y-1">
                      <div className="flex items-center gap-1 font-bold text-amber-300 uppercase tracking-wide">
                        <span>⚖️</span>
                        <span>ART Regulation Act, 2021/2022 Statutory Compliance</span>
                      </div>
                      <p>
                        This card is the permanent clinical property of <strong>FERTITRACE ART CENTRE</strong>. Mandatory for electronic witnessing, gamete/embryo verification, and custody verification at all workstations. Non-transferable.
                      </p>
                    </div>

                    {/* Cardholder Instructions */}
                    <ul className="text-[7px] text-slate-300 space-y-0.5 pl-3 list-disc">
                      <li>Present this card at all consultations, ultrasound scans, OPU, and embryo transfer procedures.</li>
                      <li>Tap at laminar flow hoods, witness gates, and specimen handover counters.</li>
                      <li>In case of loss, notify the ART Registry Desk immediately: <strong>+91 (0) 22 4900 8800</strong>.</li>
                    </ul>

                    {/* 1D Code 128 Barcode Simulation */}
                    <div className="flex flex-col items-center justify-center pt-1">
                      <div className="h-6 w-52 flex items-center justify-center gap-[1.5px] bg-white p-1 rounded">
                        {/* Barcode lines */}
                        {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 3, 1, 2, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 1, 2].map((w, i) => (
                          <div
                            key={i}
                            className="h-full bg-black"
                            style={{ width: `${w * 1.5}px` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[8px] font-bold text-slate-300 mt-0.5">
                        *{selectedCard.cardUid}*
                      </span>
                    </div>
                  </div>

                  {/* 3. Footer row: Clinic Helpline & Signatory Seal */}
                  <div className="flex items-end justify-between border-t border-white/10 pt-1 text-[7px] text-slate-400">
                    <div>
                      <div className="font-bold text-slate-300">FERTITRACE ART CENTRE</div>
                      <div>Helpline: +91 (0) 22 4900 8800 &bull; support@fertitrace.com</div>
                    </div>
                    <div className="text-right">
                      <div className="border-b border-slate-500 w-24 mb-0.5" />
                      <div className="text-[6.5px] uppercase tracking-wider text-slate-400">Medical Director & Embryologist</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Control Strip */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
            >
              🖨️ Print Card (Zebra CR-80)
            </button>
            <button
              type="button"
              onClick={() => handleExecuteTap(selectedCard, AVAILABLE_ZONES[0].name)}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-[0.98]"
            >
              ⚡ Test RFID Tap
            </button>
            <button
              type="button"
              onClick={() => handleToggleStatus(selectedCard.id)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition border shadow-xs ${
                selectedCard.status === 'Active'
                  ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {selectedCard.status === 'Active' ? '⏸ Suspend' : '▶ Activate'}
            </button>
          </div>
        </div>

        {/* Right Column (Col 6): Directory, Logs, Security Matrix */}
        <div className="lg:col-span-6 space-y-3">
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
                Security Matrix
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
                  placeholder="Search card by holder name, UHID, or RFID UID..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                />
              </div>

              {/* Cards List Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100">
                  {filteredCards.map((card) => {
                    const isSelected = card.id === selectedCardId;
                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id)}
                        className={`flex items-center justify-between p-3 cursor-pointer transition ${
                          isSelected ? 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-500/20' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${card.photoGradient} text-white font-bold text-xs shadow-xs`}
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
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono font-bold text-slate-700">{card.identifierId}</span>
                              <span>&bull;</span>
                              <span className="font-mono text-indigo-600">{card.cardUid}</span>
                              {card.secondaryName && (
                                <>
                                  <span>&bull;</span>
                                  <span className="truncate text-slate-500">Spouse: {card.secondaryName}</span>
                                </>
                              )}
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
              <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-100">
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

      {/* 5. Print to CR-80 ISO Card Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-lg">🖨️</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Print to CR-80 ISO Card</h3>
                  <p className="text-[11px] text-slate-500">Zebra ZC300 / ZC100 & ZD611R Direct Card Printing Engine</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Print Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Printer Preset</label>
                <select
                  value={printPreset}
                  onChange={(e) => setPrintPreset(e.target.value as 'zc300' | 'zd611r' | 'a4')}
                  className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                >
                  <option value="zc300">Zebra ZC300 (CR-80 Card)</option>
                  <option value="zd611r">Zebra ZD611R (RFID Tag)</option>
                  <option value="a4">Standard A4 Sheet (2x Cards)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Card Sides</label>
                <select
                  value={printSides}
                  onChange={(e) => setPrintSides(e.target.value as 'both' | 'front' | 'back')}
                  className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                >
                  <option value="both">Both Sides (Duplex / 2-Page)</option>
                  <option value="front">Front Side Only</option>
                  <option value="back">Back Side Only</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thermal Ribbon Type</label>
                <select
                  value={ribbonType}
                  onChange={(e) => setRibbonType(e.target.value as 'ymcko' | 'resin-black')}
                  className="w-full rounded-lg border border-slate-300 p-2 font-medium"
                >
                  <option value="ymcko">YMCKO Full Color Ribbon</option>
                  <option value="resin-black">Monochrome Resin Black (KrO)</option>
                </select>
              </div>
            </div>

            {/* CR-80 Dimension Specification Banner */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 text-xs text-indigo-950 space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>Standard: ISO/IEC 7810 ID-1 (CR-80)</span>
                <span className="font-mono text-indigo-700">85.60 mm &times; 53.98 mm</span>
              </div>
              <p className="text-[11px] text-indigo-800/80">
                Card stock: 30 mil (0.76 mm) PVC. Print driver will calibrate with 0 mm margins and 300 DPI resolution.
              </p>
            </div>

            {/* Print Preview Card */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Print Preview Queue:</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center justify-center">
                <div
                  className="w-full max-w-sm rounded-[10px] overflow-hidden shadow-md border border-slate-300 bg-white"
                  style={{ aspectRatio: '85.6 / 53.98' }}
                >
                  <div className="p-3 h-full flex flex-col justify-between text-[9px]">
                    <div className="flex items-center justify-between border-b pb-1 font-bold text-slate-900">
                      <span>FERTITRACE ART CENTRE</span>
                      <span className="font-mono text-indigo-600">CR-80 READY</span>
                    </div>
                    <div className="flex items-center justify-between my-auto">
                      <div>
                        <div className="text-xs font-black text-slate-900">{selectedCard.holderName}</div>
                        <div className="font-mono text-slate-600 font-bold">{selectedCard.identifierId} &bull; {selectedCard.cardUid}</div>
                      </div>
                      <div className="p-0.5 border rounded bg-white">
                        <FertiTraceQRCode value={qrString} size={48} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t pt-1 text-[8px] text-slate-500 font-mono">
                      <span>Print Sides: {printSides.toUpperCase()}</span>
                      <span>300 DPI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  setTimeout(() => handleTriggerPrint(), 300);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-xs"
              >
                <span>🖨️</span>
                <span>Send to Zebra Card Printer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. RFID Tap Simulator Modal */}
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

      {/* 7. Issue New Smart Card Modal */}
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

      {/* 8. Dedicated Hidden CR-80 Print Layout (Visible strictly during window.print()) */}
      <div id="cr80-print-container" className="hidden print:block">
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #cr80-print-container, #cr80-print-container * {
                visibility: visible !important;
              }
              #cr80-print-container {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 85.6mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: transparent !important;
              }
              .cr80-page {
                width: 85.60mm !important;
                height: 53.98mm !important;
                page-break-after: always !important;
                break-after: page !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                margin: 0 !important;
                padding: 3mm !important;
                border-radius: 3.18mm !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
            @page {
              size: 85.60mm 53.98mm;
              margin: 0mm;
            }
          `
        }} />

        {/* Print Page 1: Front Side */}
        {(printSides === 'both' || printSides === 'front') && (
          <div className="cr80-page bg-slate-900 text-white flex flex-col justify-between font-sans">
            <div className="flex items-start justify-between border-b border-white/20 pb-1">
              <div>
                <div className="text-[10px] font-black uppercase text-white leading-none">FERTITRACE ART CENTRE</div>
                <div className="text-[6.5px] font-mono text-indigo-300">LIFETIME PATIENT IDENTITY CARD</div>
              </div>
              <div className="text-[7px] font-bold text-amber-300 border border-amber-300 px-1 rounded">
                CR-80
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 items-center my-auto">
              <div className="col-span-3 flex flex-col items-center">
                <div className="h-16 w-14 rounded border border-amber-400 bg-slate-800 flex items-center justify-center font-bold text-sm">
                  {selectedCard.avatarInitials}
                </div>
              </div>
              <div className="col-span-6 space-y-0.5">
                <div className="text-[10.5px] font-black text-white leading-tight">{selectedCard.holderName}</div>
                {selectedCard.secondaryName && (
                  <div className="text-[7.5px] text-indigo-200">Spouse: {selectedCard.secondaryName}</div>
                )}
                <div className="font-mono text-[7.5px] font-bold text-cyan-300">UHID: {selectedCard.identifierId}</div>
                <div className="font-mono text-[7.5px] font-bold text-amber-300">RFID: {selectedCard.cardUid}</div>
                <div className="text-[6.5px] text-slate-300">DOB: {selectedCard.dob || '14/05/1992'} &bull; {selectedCard.gender || 'Female'}</div>
              </div>
              <div className="col-span-3 flex flex-col items-center justify-center">
                <div className="bg-white p-0.5 rounded">
                  <FertiTraceQRCode value={qrString} size={54} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/20 pt-0.5 text-[6.5px] text-slate-400 font-mono">
              <span>ONE PATIENT &bull; ONE CARD &bull; LIFETIME IDENTITY</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>
          </div>
        )}

        {/* Print Page 2: Back Side */}
        {(printSides === 'both' || printSides === 'back') && (
          <div className="cr80-page bg-slate-950 text-white flex flex-col justify-between font-sans">
            <div className="-mx-[3mm] -mt-[3mm] h-6 bg-black border-b border-white/20 flex items-center justify-between px-2 text-[6px] font-mono text-slate-500">
              <span>TRACK 1/2 ENCODED</span>
              <span>HiCo 2750 Oe</span>
            </div>

            <div className="space-y-1 my-auto text-[6.5px] text-slate-300 leading-tight">
              <div className="font-bold text-amber-300">ART REGULATION ACT 2021/2022 COMPLIANT</div>
              <p>
                Permanent property of FERTITRACE ART CENTRE. Mandatory for electronic witnessing at all workstations. Non-transferable.
              </p>
              <div className="text-[6px] text-slate-400">
                Helpline: +91 (0) 22 4900 8800 &bull; support@fertitrace.com
              </div>
            </div>

            <div className="flex items-end justify-between border-t border-white/20 pt-1 text-[6.5px] font-mono">
              <span>*{selectedCard.cardUid}*</span>
              <span>AUTH SIGNATURE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
