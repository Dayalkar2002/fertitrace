'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';
import { apiFetch } from '@/lib/api';
import {
  sendCommunicationMessage,
  fetchCommunicationHistory,
  CommunicationLogItem,
  CommunicationChannel,
} from '@/lib/services/communication';
import { DEFAULT_TEMPLATE_LABEL, SMS_TEMPLATES } from '@/lib/communication/sms-templates';
import { isWhatsAppTemplateApproved } from '@/lib/communication/whatsapp-templates';

type CommunicationRecord = CommunicationLogItem;

const INITIAL_HISTORY: CommunicationRecord[] = [
  {
    id: 'MSG-101',
    dateTime: '01 Sep 2026  10:20 AM',
    messageType: 'Appointment',
    channel: 'SMS',
    recipient: '+91 98765 43210',
    sentBy: 'IVCRFT',
    status: 'Delivered',
    messageText:
      'Dear Farah Mohammed Shaikh, Your appointment has been booked with Dr. Sanjay Kumar Pagare for Consultation at IVF Craft Clinic at Andheri on 10 Sep 2026 at 11:00 AM. Team IVF Craft.',
  },
  {
    id: 'MSG-102',
    dateTime: '30 Aug 2026  03:40 PM',
    messageType: 'ET Procedure',
    channel: 'SMS',
    recipient: '+91 98765 43210',
    sentBy: 'IVCRFT',
    status: 'Delivered',
    messageText:
      'Dear Farah Mohammed Shaikh, Your Embryo Transfer (ET) Procedure is scheduled on 02 Sep 2026 at 09:00 AM at IVF Craft Clinic at Andheri. Team IVF Craft.',
  },
  {
    id: 'MSG-103',
    dateTime: '28 Aug 2026  09:10 AM',
    messageType: 'IUI Appointment',
    channel: 'SMS',
    recipient: '+91 98765 43210',
    sentBy: 'IVCRFT',
    status: 'Failed',
    messageText:
      'Dear Farah Mohammed Shaikh, Your IUI Appointment is scheduled on 29 Aug 2026 at 10:30 AM at IVF Craft Clinic at Andheri. Team IVF Craft.',
  },
];

export interface DltTemplateItem {
  id: string;
  name: string;
  templateId: string;
  refNo: string;
  category: string;
  content: string;
  variables: string[];
  whatsappTemplateName?: string;
  whatsappApproved?: boolean;
}

export const DLT_TEMPLATES: Record<string, DltTemplateItem> = Object.fromEntries(
  SMS_TEMPLATES.map((item) => [
    item.label,
    {
      id: item.id,
      name: item.messageType,
      templateId: item.dltTemplateId || '',
      refNo: item.dltRef || '',
      category: item.activity,
      content: item.content,
      variables: item.variables,
      whatsappTemplateName: item.whatsappTemplateName || '',
      whatsappApproved: isWhatsAppTemplateApproved(item.whatsappTemplateName),
    },
  ])
);

const TEMPLATES: Record<string, string> = Object.fromEntries(
  Object.entries(DLT_TEMPLATES).map(([key, item]) => [key, item.content])
);

export function PatientCommunication() {
  const { token, user } = useAuth();
  const { selectedPatient, patients, loadPatients, selectPatient, selectedSatellite } = usePatient();
  const [smsPhone, setSmsPhone] = useState('');

  const [patientDetail, setPatientDetail] = useState<{
    mobile?: string;
    phone?: string;
    age?: number;
    uhid?: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedPatient?.id) {
      setPatientDetail(null);
      return;
    }

    if (selectedPatient.mobile || selectedPatient.phone) {
      setPatientDetail({
        mobile: selectedPatient.mobile || selectedPatient.phone,
        phone: selectedPatient.phone,
        age: selectedPatient.age,
        uhid: selectedPatient.uhid,
      });
      return;
    }

    apiFetch<{ success: boolean; data: Record<string, unknown> }>(
      `/masters/patient/${selectedPatient.id}`,
      {},
      token
    )
      .then((res) => {
        if (res && res.data) {
          const d = res.data;
          let calcAge = selectedPatient.age;
          if ((!calcAge || calcAge === 0) && d.dob) {
            const birthYear = new Date(String(d.dob)).getFullYear();
            if (birthYear > 1900) {
              calcAge = new Date().getFullYear() - birthYear;
            }
          }
          setPatientDetail({
            mobile: String(d.mobile || d.phone || ''),
            phone: String(d.phone || ''),
            age: Number(calcAge || d.age || 0),
            uhid: String(d.refNo || ''),
          });
        }
      })
      .catch(() => {});
  }, [selectedPatient?.id, selectedPatient?.mobile, selectedPatient?.phone, selectedPatient?.age, selectedPatient?.uhid, token]);

  // Patient Demographic details (matches mockup defaults or active selected patient)
  const patientId =
    selectedPatient?.uhid ||
    patientDetail?.uhid ||
    (selectedPatient?.id ? `PT-00${selectedPatient.id}` : 'PT-00245');

  const patientName = selectedPatient?.name || 'Mrs. Neha Sharma';
  const effectiveAge = patientDetail?.age || selectedPatient?.age;
  const patientAge = effectiveAge
    ? `${effectiveAge} Y / Female`
    : (selectedPatient ? 'Female' : '32 Y / Female');
  const cycleNo = 'IVF-03';

  const rawMobile =
    selectedPatient?.mobile ||
    selectedPatient?.phone ||
    patientDetail?.mobile ||
    patientDetail?.phone ||
    '';

  function formatMobileDisplay(num: string): string {
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      const ten = cleaned.slice(2);
      return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
    }
    if (num.trim()) {
      return num.startsWith('+') ? num : `+91 ${num}`;
    }
    return '+91 98765 43210';
  }

  const mobileNo = formatMobileDisplay(rawMobile);
  const smsDigits = (smsPhone || rawMobile).replace(/\D/g, '').slice(-10);

  useEffect(() => {
    const digits = rawMobile.replace(/\D/g, '').slice(-10);
    if (digits) setSmsPhone(digits);
  }, [rawMobile]);

  const [messageType, setMessageType] = useState('Appointment');
  const [channel, setChannel] = useState<CommunicationChannel>('WhatsApp');
  const [templateKey, setTemplateKey] = useState(DEFAULT_TEMPLATE_LABEL);
  const [language, setLanguage] = useState('English');
  const [message, setMessage] = useState(DLT_TEMPLATES[DEFAULT_TEMPLATE_LABEL].content);
  const [history, setHistory] = useState<CommunicationRecord[]>(INITIAL_HISTORY);
  const [sending, setSending] = useState(false);
  const [showVariablesDropdown, setShowVariablesDropdown] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CommunicationRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedMobile, setCopiedMobile] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Delivered' | 'Failed' | 'Pending'>('All');

  useEffect(() => {
    if (channel !== 'SMS') return;
    const satId = selectedSatellite?.id || selectedPatient?.satelliteId;
    if (satId) void loadPatients(satId);
  }, [channel, selectedSatellite?.id, selectedPatient?.satelliteId, loadPatients]);

  // Load history from API
  const loadHistory = useCallback(async () => {
    try {
      const records = await fetchCommunicationHistory(token);
      if (records && records.length > 0) {
        setHistory(records);
      }
    } catch {
      // Gracefully maintain local fallback history
    }
  }, [token]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  // Compute live preview text by replacing template tags
  const previewText = message
    .replace(/\[Patient Name\]/g, patientName.replace(/^Mrs\.\s+/i, ''))
    .replace(/\[Doctor Name\]/g, 'Dr. Sanjay Kumar Pagare')
    .replace(/\[Procedure\]/g, 'Consultation & Scan')
    .replace(/\[Date & Time\]/g, '10 Sep 2026 at 11:00 AM')
    .replace(/\[Date\]/g, '10 Sep 2026')
    .replace(/\[Time\]/g, '11:00 AM')
    .replace(/\[Month\]/g, 'September 2026')
    .replace(/\[Clinic Name\]/g, 'IVF Craft Clinic at Andheri')
    .replace(/\[Cycle No\]/g, cycleNo);

  const charCount = message.length;
  const maxChars = 480;
  const smsCredits = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  const filteredHistory = useMemo(() => {
    return history.filter((rec) => {
      const matchStatus = statusFilter === 'All' || rec.status === statusFilter;
      const q = historySearch.trim().toLowerCase();
      const matchQuery =
        !q ||
        rec.recipient.toLowerCase().includes(q) ||
        rec.messageType.toLowerCase().includes(q) ||
        rec.messageText.toLowerCase().includes(q) ||
        rec.sentBy.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [history, statusFilter, historySearch]);

  function handleTemplateChange(key: string) {
    setTemplateKey(key);
    const item = DLT_TEMPLATES[key];
    if (item) {
      setMessage(item.content);
      setMessageType(item.name);
    } else if (TEMPLATES[key]) {
      setMessage(TEMPLATES[key]);
    }
  }

  function handleInsertVariable(variable: string) {
    setMessage((prev) => `${prev} ${variable}`);
    setShowVariablesDropdown(false);
  }

  const activeTemplate = DLT_TEMPLATES[templateKey];
  const whatsappReady = Boolean(activeTemplate?.whatsappApproved);

  async function handleSendMessage() {
    if (!message.trim()) return;
    if (channel === 'SMS' && smsDigits.length < 10) {
      setToastMessage('Enter the patient phone number before sending SMS.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    if (channel === 'WhatsApp' && !whatsappReady) {
      setToastMessage(
        `WhatsApp template "${activeTemplate?.whatsappTemplateName || 'this template'}" is still pending Meta approval.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }
    setSending(true);

    const activeDlt = activeTemplate;

    try {
      if (token) {
        const record = await sendCommunicationMessage(token, {
          patientId: selectedPatient?.id || patientId,
          patientName,
          recipient: channel === 'SMS' ? smsDigits : smsDigits.length === 10 ? `91${smsDigits}` : mobileNo.replace(/\D/g, ''),
          channel,
          messageType,
          messageText: previewText,
          templateId: activeDlt?.templateId,
          whatsappTemplate: activeDlt?.whatsappTemplateName,
          language,
        });
        setHistory((prev) => [record, ...prev]);
        setToastMessage(
          channel === 'SMS'
            ? `SMS submitted for ${smsDigits}. It can take a minute to reach the phone.`
            : `Message dispatched via ${channel} to ${mobileNo}!`
        );
      } else {
        // Local simulation if unauthenticated
        const now = new Date();
        const dateStr = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}  ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
        const localRecord: CommunicationRecord = {
          id: `MSG-${Date.now().toString().slice(-4)}`,
          dateTime: dateStr,
          messageType,
          channel,
          recipient: channel === 'SMS' ? smsDigits : mobileNo,
          sentBy: user?.roleName || user?.userName || 'Embryologist',
          status: 'Delivered',
          messageText: previewText,
        };
        setHistory((prev) => [localRecord, ...prev]);
        setToastMessage(`Message dispatched via ${channel} to ${channel === 'SMS' ? smsDigits : mobileNo}!`);
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

      {/* Top Header Row - Sleek & Compact */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 uppercase">
            PATIENT COMMUNICATION
          </h1>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {channel} Dispatch
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs" />
          <span>API Connected · Header <strong className="text-slate-900">IVCRFT</strong></span>
        </div>
      </div>

      {/* Recipient & Contact Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recipient:</span>
            <span className="font-bold text-slate-900">{patientName}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-600 border border-slate-200">
              {patientId}
            </span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mobile:</span>
            <span className="font-bold text-slate-900">{mobileNo}</span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(mobileNo);
                setCopiedMobile(true);
                setTimeout(() => setCopiedMobile(false), 1800);
              }}
              className="rounded bg-slate-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-600 border border-slate-200 hover:bg-blue-50 transition"
              title="Copy phone number"
            >
              {copiedMobile ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4 hidden sm:flex">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Cycle:</span>
            <span className="font-bold text-slate-900">{cycleNo}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
          <span>Verified Phone</span>
        </div>
      </div>

      {/* 2. SEND MESSAGE Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {channel === 'SMS' ? 'MANUAL SMS' : 'SEND MESSAGE'}
        </h2>

        {channel === 'SMS' && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
            <p className="sm:col-span-2 text-[11px] text-slate-500">
              Same fields as SMART Manual SMS: patient name, phone number, and message. SMS is sent on the SMART gateway.
            </p>
            <label className="block text-xs font-medium text-slate-600">
              Name
              <select
                value={selectedPatient?.id || ''}
                onChange={(e) => {
                  const next = patients.find((item) => String(item.id) === e.target.value);
                  if (!next) return;
                  selectPatient(next);
                  const digits = (next.mobile || next.phone || '').replace(/\D/g, '').slice(-10);
                  if (digits) setSmsPhone(digits);
                }}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
              >
                <option value="">Select patient</option>
                {(patients.length ? patients : selectedPatient ? [selectedPatient] : []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Patient Phone No
              <input
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                inputMode="numeric"
                placeholder="10 digit mobile"
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800"
              />
            </label>
          </div>
        )}

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
                const val = e.target.value;
                setMessageType(val);
                const matchedKey = Object.keys(DLT_TEMPLATES).find((k) =>
                  k.toLowerCase().startsWith(val.toLowerCase()) ||
                  DLT_TEMPLATES[k].name.toLowerCase() === val.toLowerCase()
                );
                if (matchedKey) handleTemplateChange(matchedKey);
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10"
            >
              {Array.from(new Map(SMS_TEMPLATES.map((t) => [t.messageType, t])).values()).map((t) => (
                <option key={t.id} value={t.messageType}>
                  {t.activity}
                </option>
              ))}
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

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="radio"
                  name="channel"
                  value="Email"
                  checked={channel === 'Email'}
                  onChange={() => setChannel('Email')}
                  className="h-4 w-4 text-pink-600 border-slate-300 focus:ring-pink-500"
                />
                <span className="text-xs font-medium text-slate-700">Email</span>
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
                {Object.entries(DLT_TEMPLATES).map(([key, item]) => (
                  <option key={key} value={key}>
                    {item.whatsappApproved ? `${key} · WhatsApp approved` : key}
                  </option>
                ))}
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
                  <div className="absolute right-0 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-30">
                    {[
                      '[Patient Name]',
                      '[Doctor Name]',
                      '[Procedure]',
                      '[Date & Time]',
                      '[Date]',
                      '[Time]',
                      '[Month]',
                      '[Clinic Name]',
                    ].map((v) => (
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-600">
                Message
              </label>
              <span className="text-[11px] text-slate-400">
                Press <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 border border-slate-200">Ctrl+Enter</kbd> to send
              </span>
            </div>
            <div className="relative">
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    void handleSendMessage();
                  }
                }}
                maxLength={maxChars}
                placeholder="Type your message or choose a template..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs leading-relaxed text-slate-800 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/10 font-mono"
              />

              {/* Quick One-Click Variable Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Quick Add:</span>
                {[
                  '[Patient Name]',
                  '[Doctor Name]',
                  '[Date & Time]',
                  '[Clinic Name]',
                  '[Procedure]',
                ].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleInsertVariable(v)}
                    className="inline-flex items-center gap-1 rounded-full border border-pink-200 bg-pink-50/60 px-2.5 py-0.5 text-[10px] font-medium text-pink-700 hover:bg-pink-100 transition active:scale-95"
                    title={`Insert ${v}`}
                  >
                    <span>+</span>
                    <span>{v}</span>
                  </button>
                ))}
              </div>

              {/* Character & SMS Credit Counter */}
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-slate-400">
                <div>
                  {channel === 'SMS' && (
                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold">
                      <span>⚡</span>
                      <span>{smsCredits} SMS Credit{smsCredits > 1 ? 's' : ''}</span>
                      <span className="text-slate-400 font-normal">
                        ({charCount <= 160 ? `${160 - charCount} chars left in 1st credit` : `${charCount} chars total`})
                      </span>
                    </span>
                  )}
                </div>
                <div>
                  Characters : <strong className={charCount > maxChars * 0.9 ? 'text-amber-600' : 'text-slate-700'}>{charCount}</strong> / {maxChars}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Realistic Chat Bubble Preview */}
          <div className="lg:col-span-4 flex flex-col justify-start">
            <div className="flex items-center justify-between mb-1">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Live {channel} Preview
              </span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(previewText);
                  setCopiedPreview(true);
                  setTimeout(() => setCopiedPreview(false), 1800);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                title="Copy preview text"
              >
                {copiedPreview ? '✓ Copied!' : '📋 Copy Text'}
              </button>
            </div>
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
            disabled={sending || (channel === 'WhatsApp' && !whatsappReady) || (channel === 'SMS' && smsDigits.length < 10)}
            onClick={handleSendMessage}
            title="Press Ctrl+Enter to send"
            className="flex items-center gap-2 rounded-xl bg-[#e11d48] hover:bg-[#be123c] px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-pink-600/20 transition active:scale-[0.99] disabled:opacity-60"
          >
            <svg className="h-4 w-4 fill-current -rotate-45" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            <span>{sending ? 'SENDING...' : channel === 'SMS' ? 'SEND SMS' : 'SEND MESSAGE'}</span>
            <kbd className="hidden sm:inline-block rounded bg-pink-700/60 px-1.5 py-0.5 text-[9px] font-mono text-pink-100">
              Ctrl+↵
            </kbd>
          </button>
        </div>

      </div>

      {/* 3. COMMUNICATION HISTORY Table Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              COMMUNICATION HISTORY
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {filteredHistory.length} of {history.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Chips */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
              {(['All', 'Delivered', 'Failed', 'Pending'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2 py-0.5 transition ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Quick Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="h-7 w-36 sm:w-44 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-800 placeholder-slate-400 outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/10"
              />
              {historySearch && (
                <button
                  type="button"
                  onClick={() => setHistorySearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setHistorySearch('');
                setToastMessage('Showing all sent messages for this cycle.');
                setTimeout(() => setToastMessage(null), 2500);
              }}
              className="flex items-center gap-1 text-xs font-bold text-[#6345A6] hover:underline"
            >
              <span>Reset</span>
            </button>
          </div>
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
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                    No communication records matching your filter or search.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((rec) => (
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
                      {rec.channel === 'Email' ? (
                        <>
                          <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-violet-500 text-white text-[9px]">
                            @
                          </span>
                          <span>Email</span>
                        </>
                      ) : rec.channel === 'WhatsApp' ? (
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
              )))}
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
