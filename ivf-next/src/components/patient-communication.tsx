'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';
import {
  sendCommunicationMessage,
  fetchCommunicationHistory,
  CommunicationLogItem,
} from '@/lib/services/communication';

type CommunicationRecord = CommunicationLogItem;

const INITIAL_HISTORY: CommunicationRecord[] = [
  {
    id: 'MSG-101',
    dateTime: '01 Sep 2026  10:20 AM',
    messageType: 'Appointment Reminder',
    channel: 'WhatsApp',
    recipient: '+91 98765 43210',
    sentBy: 'Embryologist',
    status: 'Delivered',
    messageText:
      'Dear Neha Sharma,\nYour appointment is scheduled on 01 Sep 2026 at 10:30 AM.\nPlease contact the IVF centre for any clarification.\nThank you.',
  },
  {
    id: 'MSG-102',
    dateTime: '30 Aug 2026  03:40 PM',
    messageType: 'Procedure Reminder',
    channel: 'SMS',
    recipient: '+91 98765 43210',
    sentBy: 'Embryologist',
    status: 'Delivered',
    messageText:
      'Dear Neha Sharma,\nPlease arrive fasting for your Oocyte Pick-Up procedure tomorrow at 08:30 AM.\nRegards, FERTITRACE Lab.',
  },
  {
    id: 'MSG-103',
    dateTime: '28 Aug 2026  09:10 AM',
    messageType: 'Payment Reminder',
    channel: 'SMS',
    recipient: '+91 98765 43210',
    sentBy: 'Reception',
    status: 'Failed',
    messageText:
      'Dear Neha Sharma,\nThis is a gentle reminder regarding the pending invoice for Cycle IVF-03.\nKindly clear dues at desk.',
  },
];

const TEMPLATES: Record<string, string> = {
  'Appointment Reminder - 01': `Dear [Patient Name],\nYour appointment is scheduled on [Date] at [Time].\nPlease contact the IVF centre for any clarification.\nThank you.`,
  'Appointment Reminder - 02': `Dear [Patient Name],\nReminder: You have a clinical consultation with [Doctor Name] tomorrow on [Date] at [Time].\nFERTITRACE Centre.`,
  'Procedure Reminder - 01': `Dear [Patient Name],\nYour OPU/ICSI procedure is scheduled for [Date] at [Time]. Please adhere to fasting instructions.\nBest regards.`,
  'Payment Reminder - 01': `Dear [Patient Name],\nKindly find invoice details for Cycle [Cycle No]. Please complete payment at the front desk.\nThank you.`,
  'Embryo Update - 01': `Dear [Patient Name],\nLab update for Cycle [Cycle No]: Culturing progress is advancing smoothly at Day 3. Next update on [Date].`,
};

export function PatientCommunication() {
  const { token, user } = useAuth();
  const { selectedPatient } = usePatient();

  // Patient Demographic details (matches mockup defaults or active selected patient)
  const patientId = selectedPatient?.uhid || selectedPatient?.id ? `PT-00${selectedPatient.id}` : 'PT-00245';
  const patientName = selectedPatient?.name || 'Mrs. Neha Sharma';
  const patientAge = selectedPatient?.age ? `${selectedPatient.age} Y / Female` : '32 Y / Female';
  const cycleNo = 'IVF-03';
  const mobileNo = selectedPatient?.aadhar ? `+91 ${selectedPatient.aadhar.slice(0, 10)}` : '+91 98765 43210';

  const [messageType, setMessageType] = useState('Appointment Reminder');
  const [channel, setChannel] = useState<'WhatsApp' | 'SMS'>('WhatsApp');
  const [templateKey, setTemplateKey] = useState('Appointment Reminder - 01');
  const [language, setLanguage] = useState('English');
  const [message, setMessage] = useState(TEMPLATES['Appointment Reminder - 01']);
  const [history, setHistory] = useState<CommunicationRecord[]>(INITIAL_HISTORY);
  const [sending, setSending] = useState(false);
  const [showVariablesDropdown, setShowVariablesDropdown] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CommunicationRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load history from API if token exists
  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const records = await fetchCommunicationHistory(token);
      if (records && records.length > 0) {
        setHistory(records);
      }
    } catch (err) {
      console.error('Failed to load communication history from API:', err);
    }
  }, [token]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Compute live preview text by replacing template tags
  const previewText = message
    .replace(/\[Patient Name\]/g, patientName.replace('Mrs. ', ''))
    .replace(/\[Date\]/g, '02 Sep 2026')
    .replace(/\[Time\]/g, '11:00 AM')
    .replace(/\[Doctor Name\]/g, 'Dr. Admin')
    .replace(/\[Clinic Name\]/g, 'FERTITRACE Centre')
    .replace(/\[Cycle No\]/g, cycleNo);

  const charCount = message.length;
  const maxChars = 480;

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    if (TEMPLATES[key]) {
      setMessage(TEMPLATES[key]);
    }
  }

  function handleInsertVariable(variable: string) {
    setMessage((prev) => `${prev} ${variable}`);
    setShowVariablesDropdown(false);
  }

  async function handleSendMessage() {
    if (!message.trim()) return;
    setSending(true);

    try {
      if (token) {
        const record = await sendCommunicationMessage(token, {
          patientId,
          patientName,
          recipient: mobileNo,
          channel,
          messageType,
          messageText: previewText,
          language,
        });
        setHistory((prev) => [record, ...prev]);
        setToastMessage(`Message dispatched via ${channel} to ${mobileNo}!`);
      } else {
        // Local simulation if unauthenticated
        const now = new Date();
        const dateStr = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}  ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        const localRecord: CommunicationRecord = {
          id: `MSG-${Date.now().toString().slice(-4)}`,
          dateTime: dateStr,
          messageType,
          channel,
          recipient: mobileNo,
          sentBy: user?.roleName || user?.userName || 'Embryologist',
          status: 'Delivered',
          messageText: previewText,
        };
        setHistory((prev) => [localRecord, ...prev]);
        setToastMessage(`Message dispatched via ${channel} to ${mobileNo}!`);
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Failed to send message:', err);
      setToastMessage(err instanceof Error ? err.message : 'Failed to send message.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-5 font-sans text-slate-800 selection:bg-pink-500 selection:text-white pb-10">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800">{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase">
          PATIENT COMMUNICATION
        </h1>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span>API Status : Connected</span>
        </div>
      </div>

      {/* 1. Patient Context Strip Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Avatar & Patient ID */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-500 border border-pink-200">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <path d="M6 11c0-2.5 2-4 6-4s6 1.5 6 4" strokeDasharray="1 1" />
              </svg>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patient ID</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{patientId}</div>
            </div>
          </div>

          {/* Patient Name */}
          <div className="border-l border-slate-100 pl-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patient Name</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{patientName}</div>
          </div>

          {/* Age / Gender */}
          <div className="border-l border-slate-100 pl-4 hidden sm:block">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Age / Gender</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{patientAge}</div>
          </div>

          {/* Cycle No. */}
          <div className="border-l border-slate-100 pl-4 hidden md:block">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cycle No.</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{cycleNo}</div>
          </div>

          {/* Mobile No. with WhatsApp Icon */}
          <div className="border-l border-slate-100 pl-4 flex items-center gap-3">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mobile No.</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">{mobileNo}</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
            </div>
          </div>

        </div>
      </div>

      {/* 2. SEND MESSAGE Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          SEND MESSAGE
        </h2>

        {/* Row 1: Message Type & Channel */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Message Type */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Message Type
            </label>
            <select
              value={messageType}
              onChange={(e) => {
                setMessageType(e.target.value);
                if (e.target.value === 'Appointment Reminder') handleTemplateChange('Appointment Reminder - 01');
                if (e.target.value === 'Procedure Reminder') handleTemplateChange('Procedure Reminder - 01');
                if (e.target.value === 'Payment Reminder') handleTemplateChange('Payment Reminder - 01');
                if (e.target.value === 'Embryo Update') handleTemplateChange('Embryo Update - 01');
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10"
            >
              <option value="Appointment Reminder">Appointment Reminder</option>
              <option value="Procedure Reminder">Procedure Reminder</option>
              <option value="Payment Reminder">Payment Reminder</option>
              <option value="Medication Schedule">Medication Schedule</option>
              <option value="Embryo Update">Embryo Update</option>
              <option value="Custom Message">Custom Message</option>
            </select>
          </div>

          {/* Channel Radio Group */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Channel
            </label>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="channel"
                  value="SMS"
                  checked={channel === 'SMS'}
                  onChange={() => setChannel('SMS')}
                  className="h-4 w-4 text-pink-600 border-slate-300 focus:ring-pink-500"
                />
                <span className="text-xs font-medium text-slate-700">SMS</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="channel"
                  value="WhatsApp"
                  checked={channel === 'WhatsApp'}
                  onChange={() => setChannel('WhatsApp')}
                  className="h-4 w-4 text-pink-600 border-slate-300 focus:ring-pink-500"
                />
                <span className="text-xs font-medium text-slate-700">WhatsApp</span>
              </label>
            </div>
          </div>
        </div>

        {/* Row 2: Message Template & Language */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Template with Insert Variables */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Message Template
            </label>
            <div className="flex items-center gap-2">
              <select
                value={templateKey}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10"
              >
                <option value="Appointment Reminder - 01">Appointment Reminder - 01</option>
                <option value="Appointment Reminder - 02">Appointment Reminder - 02</option>
                <option value="Procedure Reminder - 01">Procedure Reminder - 01</option>
                <option value="Payment Reminder - 01">Payment Reminder - 01</option>
                <option value="Embryo Update - 01">Embryo Update - 01</option>
              </select>

              {/* Insert Variables Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowVariablesDropdown(!showVariablesDropdown)}
                  className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>Insert Variables</span>
                  <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showVariablesDropdown && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-30">
                    {['[Patient Name]', '[Date]', '[Time]', '[Doctor Name]', '[Clinic Name]', '[Cycle No]'].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleInsertVariable(v)}
                        className="w-full px-3.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-pink-50 hover:text-pink-600 transition"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
              <option value="Gujarati">Gujarati</option>
            </select>
          </div>
        </div>

        {/* Row 3: Message Textarea & Live Preview Chat Bubble */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left: Message Textarea */}
          <div className="lg:col-span-8">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Message
            </label>
            <div className="relative">
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={maxChars}
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 font-mono"
              />
              <div className="mt-1 text-right text-[11px] font-medium text-slate-400">
                Characters : {charCount} / {maxChars}
              </div>
            </div>
          </div>

          {/* Right: Live Realistic Chat Bubble Preview */}
          <div className="lg:col-span-4 flex flex-col justify-start">
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Live {channel} Preview
            </span>
            <div className="relative rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 min-h-[140px] flex items-center justify-center">
              
              {/* WhatsApp or SMS Bubble */}
              <div className={`relative max-w-xs rounded-2xl p-3.5 text-xs shadow-xs transition-all ${
                channel === 'WhatsApp'
                  ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-xs border border-[#c6e9a9]'
                  : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200'
              }`}>
                <p className="whitespace-pre-line leading-relaxed text-[11px] text-slate-800 font-normal">
                  {previewText}
                </p>
                <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                  <span>10:30 AM</span>
                  {channel === 'WhatsApp' && (
                    <span className="text-[#34b7f1] font-bold">✓✓</span>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Row 4: Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setToastMessage('Live Preview is updated in real-time on the right.');
              setTimeout(() => setToastMessage(null), 3000);
            }}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 hover:bg-slate-50 transition active:scale-[0.99]"
          >
            PREVIEW
          </button>

          <button
            type="button"
            disabled={sending}
            onClick={handleSendMessage}
            className="flex items-center gap-2 rounded-xl bg-[#e11d48] hover:bg-[#be123c] px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-pink-600/20 transition active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="h-4 w-4 fill-current -rotate-45" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            <span>{sending ? 'SENDING...' : 'SEND MESSAGE'}</span>
          </button>
        </div>

      </div>

      {/* 3. COMMUNICATION HISTORY Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            COMMUNICATION HISTORY
          </h2>
          <button
            type="button"
            onClick={() => {
              setToastMessage('Showing all sent messages for this cycle.');
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className="flex items-center gap-1 text-xs font-bold text-[#6345A6] hover:underline"
          >
            <span>View All History</span>
            <span>→</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Message Type</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Sent By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                  {/* Date / Time */}
                  <td className="px-4 py-3.5 font-medium text-slate-700">
                    {rec.dateTime}
                  </td>

                  {/* Message Type */}
                  <td className="px-4 py-3.5 font-bold text-slate-900">
                    {rec.messageType}
                  </td>

                  {/* Channel */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      {rec.channel === 'WhatsApp' ? (
                        <>
                          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px]">
                            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                            </svg>
                          </span>
                          <span>WhatsApp</span>
                        </>
                      ) : (
                        <>
                          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-500 text-white text-[9px]">
                            💬
                          </span>
                          <span>SMS</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Recipient */}
                  <td className="px-4 py-3.5 font-medium text-slate-700">
                    {rec.recipient}
                  </td>

                  {/* Sent By */}
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {rec.sentBy}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    {rec.status === 'Delivered' && (
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500 text-[10px]">✓</span>
                        <span>Delivered</span>
                      </span>
                    )}
                    {rec.status === 'Failed' && (
                      <span className="inline-flex items-center gap-1.5 font-bold text-red-500">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-red-500 text-[10px]">✕</span>
                        <span>Failed</span>
                      </span>
                    )}
                    {rec.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1.5 font-bold text-amber-500">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full border border-amber-500 text-[10px]">◷</span>
                        <span>Pending</span>
                      </span>
                    )}
                  </td>

                  {/* Details Eye Button */}
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(rec)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                      aria-label="View message details"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Info Note */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pt-1">
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-[10px]">
            i
          </div>
          <span>Messages are sent through API integration. Delivery status may take a few minutes to update.</span>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs" onClick={() => setSelectedRecord(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Message Details ({selectedRecord.id})</h3>
              <button type="button" onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-400 block text-[10px] uppercase">Date & Time</span>
                <span className="font-bold text-slate-800">{selectedRecord.dateTime}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block text-[10px] uppercase">Channel & Recipient</span>
                <span className="font-bold text-slate-800">{selectedRecord.channel} • {selectedRecord.recipient}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block text-[10px] uppercase">Delivered Message Content</span>
                <div className="mt-1 rounded-xl bg-slate-50 p-3 font-mono text-[11px] whitespace-pre-line text-slate-800 border border-slate-200">
                  {selectedRecord.messageText}
                </div>
              </div>
            </div>
            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
