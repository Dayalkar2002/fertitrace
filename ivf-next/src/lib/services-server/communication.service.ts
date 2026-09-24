import { executeDRL } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';
import { dispatchNukeliteWhatsApp } from '@/lib/services-server/nukelite-whatsapp';

export type CommunicationChannel = 'WhatsApp' | 'SMS' | 'Email';

export interface SendMessagePayload {
  patientId: string | number;
  patientName: string;
  recipient: string;
  channel: CommunicationChannel;
  messageType: string;
  messageText: string;
  templateId?: string;
  whatsappTemplate?: string;
  language?: string;
  sentBy: string;
}

export interface CommunicationLogItem {
  id: string;
  dateTime: string;
  messageType: string;
  channel: CommunicationChannel;
  recipient: string;
  sentBy: string;
  status: 'Delivered' | 'Failed' | 'Pending';
  messageText: string;
}

// In-memory fallback history for session/demo persistence
const inMemoryHistory: CommunicationLogItem[] = [
  {
    id: 'MSG-101',
    dateTime: '01 Sep 2026  10:20 AM',
    messageType: 'Appointment Reminder',
    channel: 'WhatsApp',
    recipient: '+91 98765 43210',
    sentBy: 'IVCRFT',
    status: 'Delivered',
    messageText:
      'Dear Neha Sharma, Your appointment has been booked with Dr. Sanjay Kumar Pagare for Consultation & Scan at IVF Craft Clinic at Andheri on 10 Sep 2026 at 11:00 AM. Team IVF Craft.',
  },
  {
    id: 'MSG-102',
    dateTime: '30 Aug 2026  03:40 PM',
    messageType: 'Procedure Reminder',
    channel: 'SMS',
    recipient: '+91 98765 43210',
    sentBy: 'IVCRFT',
    status: 'Delivered',
    messageText:
      'Dear Neha Sharma, Your OPU / ICSI Procedure is scheduled for tomorrow at 08:30 AM at IVF Craft Clinic at Andheri. Please adhere to fasting instructions. Team IVF Craft.',
  },
  {
    id: 'MSG-103',
    dateTime: '28 Aug 2026  09:10 AM',
    messageType: 'Payment Reminder',
    channel: 'SMS',
    recipient: '+91 98765 43210',
    sentBy: 'IVCRFT',
    status: 'Delivered',
    messageText:
      'Dear Neha Sharma, This is a gentle reminder regarding the pending invoice for Cycle IVF-03. Kindly clear dues at desk. Team IVF Craft.',
  },
];

function gatewayConfigured(): boolean {
  const provider = (process.env.SMS_PROVIDER || 'stpl').toLowerCase();
  if (provider === 'smartping') {
    return Boolean(process.env.SMARTPING_API_URL && process.env.SMARTPING_USERNAME && process.env.SMARTPING_PASSWORD);
  }
  return Boolean(process.env.SMS_GATEWAY_URL?.trim() && process.env.SMS_API_KEY?.trim());
}

async function dispatchSmartping(payload: SendMessagePayload, dltTemplateId: string): Promise<void> {
  const endpoint = process.env.SMARTPING_API_URL!.trim();
  const username = process.env.SMARTPING_USERNAME!.trim();
  const password = process.env.SMARTPING_PASSWORD!.trim();
  const senderId = process.env.SMS_SENDER_ID || 'IVCRFT';
  const entityId = process.env.DLT_PE_ID || '1701161718998728035';
  const rawDigits = payload.recipient.replace(/\D/g, '').slice(-10);
  const url = new URL(endpoint);
  url.searchParams.set('username', username);
  url.searchParams.set('password', password);
  url.searchParams.set('from', senderId);
  url.searchParams.set('to', `91${rawDigits}`);
  url.searchParams.set('text', payload.messageText);
  url.searchParams.set('entity_id', entityId);
  if (dltTemplateId) url.searchParams.set('template_id', dltTemplateId);
  if (payload.channel === 'WhatsApp') url.searchParams.set('channel', 'whatsapp');

  const res = await fetch(url.toString(), { method: 'GET' });
  const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string; message?: string };
  if (!res.ok || data.status === 'failed' || data.error) {
    throw new Error(data.message || data.error || 'Smartping dispatch failed.');
  }
}

async function dispatchGenericGateway(payload: SendMessagePayload, dltTemplateId: string): Promise<void> {
  const gatewayUrl = process.env.SMS_GATEWAY_URL!.trim();
  const apiKey = process.env.SMS_API_KEY!.trim();
  const senderId = process.env.SMS_SENDER_ID || 'IVCRFT';
  const entityId = process.env.DLT_PE_ID || '1701161718998728035';
  const rawDigits = payload.recipient.replace(/\D/g, '').slice(-10);
  const res = await fetch(gatewayUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      entity_id: entityId,
      sender: senderId,
      template_id: dltTemplateId || '',
      mobile: rawDigits,
      message: payload.messageText,
      channel: payload.channel,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string; message?: string };
  if (!res.ok || data.status === 'failed' || data.error) {
    throw new Error(data.message || data.error || 'Gateway dispatch failed.');
  }
}

function interpretSmartSms(body: string): { ok: boolean; pending: boolean; message: string; jobId: string } {
  const text = body.trim();
  try {
    const json = JSON.parse(text) as { ErrorCode?: string; ErrorMessage?: string; Message?: string; JobId?: string | null };
    if (json.ErrorCode !== undefined) {
      const ok = json.ErrorCode === '000';
      return {
        ok,
        pending: ok,
        message: ok ? 'SMS submitted to the gateway.' : json.ErrorMessage || 'SMS failed',
        jobId: json.JobId ? String(json.JobId) : '',
      };
    }
    if (json.Message) return { ok: false, pending: false, message: json.Message, jobId: '' };
  } catch {
    /* SMART legacy replies are plain text */
  }
  if (text.includes('1|')) {
    const status = text.split('|')[0];
    if (status === '1') return { ok: true, pending: true, message: 'SMS submitted to the gateway.', jobId: '' };
  }
  if (text === '2') return { ok: false, pending: false, message: 'SMS Service Invalid Credentials', jobId: '' };
  if (text === '3') return { ok: false, pending: false, message: 'Insufficient SMS Balance', jobId: '' };
  if (text === '4') return { ok: true, pending: true, message: 'SMS Pending', jobId: '' };
  if (text === '5') return { ok: false, pending: false, message: 'Invalid SenderId', jobId: '' };
  if (!text) return { ok: false, pending: false, message: 'Empty SMS gateway response', jobId: '' };
  return { ok: false, pending: false, message: text.slice(0, 180), jobId: '' };
}

async function readGatewayDelivery(origin: string, apiKey: string, jobId: string): Promise<string> {
  const report = new URL('/api/mt/GetDelivery', origin);
  report.searchParams.set('APIKey', apiKey);
  report.searchParams.set('jobid', jobId);
  const res = await fetch(report.toString(), { method: 'GET' });
  const body = await res.text();
  try {
    const json = JSON.parse(body) as { DeliveryReports?: { DeliveryStatus?: string }[] };
    return json.DeliveryReports?.[0]?.DeliveryStatus || '';
  } catch {
    return '';
  }
}

function gatewayMessage(body: string): string {
  const text = body.trim();
  try {
    const json = JSON.parse(text) as { Message?: string; message?: string };
    return String(json.Message || json.message || text).slice(0, 180);
  } catch {
    return text.slice(0, 180);
  }
}

/** SMART sends a GET with the mobile on `number`, the wording on `text`, and `route=31`. */
async function dispatchLegacySmartSms(payload: SendMessagePayload, baseUrl: string): Promise<{ pending: boolean }> {
  const mobile = payload.recipient.replace(/\D/g, '').slice(-10);
  if (mobile.length < 10) throw new Error('Enter a 10 digit patient phone number.');

  const url = new URL(baseUrl);
  if (!url.searchParams.get('APIKey') && !url.searchParams.get('apikey') && !url.searchParams.get('username')) {
    throw new Error('SMART SMS URL is missing the API key.');
  }
  url.searchParams.set('number', mobile);
  url.searchParams.set('text', payload.messageText);
  url.searchParams.set('route', '31');
  const templateId =
    payload.templateId?.trim() ||
    (payload.messageText.includes('Semen Analysis') ? '1707161788814128413' : '');
  if (templateId) url.searchParams.set('DLTtemplateid', templateId);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(gatewayMessage(body) || 'SMART SMS gateway failed.');
  const parsed = interpretSmartSms(body);
  if (!parsed.ok) throw new Error(parsed.message);
  const apiKey = url.searchParams.get('APIKey') || url.searchParams.get('apikey') || '';
  if (!parsed.jobId || !apiKey) return { pending: true };

  let delivery = '';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    delivery = await readGatewayDelivery(url.origin, apiKey, parsed.jobId);
    if (delivery && delivery !== 'Pending' && delivery !== 'Submitted') break;
  }
  if (delivery === 'Delivered') return { pending: false };
  if (delivery === 'Undelivered' || delivery === 'Failed' || delivery === 'NDNC') {
    throw new Error(
      `The operator marked this SMS ${delivery}. It will not reach the phone. Sender IVCRFT on this SMS account needs to be checked with the gateway provider.`
    );
  }
  return { pending: true };
}

async function dispatchEmail(payload: SendMessagePayload): Promise<void> {
  const emailUrl = process.env.EMAIL_GATEWAY_URL?.trim();
  if (!emailUrl) return;
  const res = await fetch(emailUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.EMAIL_API_KEY ? `Bearer ${process.env.EMAIL_API_KEY}` : '',
    },
    body: JSON.stringify({
      to: payload.recipient,
      subject: payload.messageType,
      text: payload.messageText,
      patientName: payload.patientName,
    }),
  });
  if (!res.ok) {
    throw new Error('Email gateway dispatch failed.');
  }
}

export async function sendMessage(payload: SendMessagePayload): Promise<CommunicationLogItem> {
  const provider = (process.env.SMS_PROVIDER || 'stpl').toLowerCase();
  const senderId = process.env.SMS_SENDER_ID || 'IVCRFT';
  const dltTemplateId = payload.templateId?.trim() || process.env.STPL_TEMPLATE_ID?.trim() || '';

  let status: 'Delivered' | 'Failed' | 'Pending' = 'Delivered';
  let dispatchError: string | null = null;

  try {
    if (payload.channel === 'Email') {
      await dispatchEmail(payload);
    } else if (payload.channel === 'WhatsApp') {
      await dispatchNukeliteWhatsApp(payload);
    } else {
      const smartSmsUrl = process.env.SMART_SMS_URL?.trim();
      if (smartSmsUrl) {
        const result = await dispatchLegacySmartSms(payload, smartSmsUrl);
        if (result.pending) status = 'Pending';
      } else if (provider === 'smartping' && gatewayConfigured()) {
        await dispatchSmartping(payload, dltTemplateId);
      } else if (gatewayConfigured()) {
        await dispatchGenericGateway(payload, dltTemplateId);
      } else {
        throw new Error('SMART SMS is not configured. Set SMART_SMS_URL to the same gateway SMART uses.');
      }
    }
  } catch (gatewayErr) {
    console.error('Communication dispatch error:', gatewayErr);
    status = 'Failed';
    dispatchError = gatewayErr instanceof Error ? gatewayErr.message : 'Gateway error';
  }

  // 2. Prepare Log Record
  const now = new Date();
  const dateStr = `${now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}  ${now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}`;

  const record: CommunicationLogItem = {
    id: `MSG-${Date.now().toString().slice(-4)}`,
    dateTime: dateStr,
    messageType: payload.messageType,
    channel: payload.channel,
    recipient: payload.recipient,
    sentBy: senderId,
    status,
    messageText: payload.messageText,
  };

  // 3. Database Audit / Tracking if configured
  if (isDbConfigured()) {
    try {
      await executeDRL('spManualSMS', [
        { name: '@PatID', value: Number(payload.patientId) || 0 },
        { name: '@SatID', value: 1 },
        { name: '@QueryIndex', value: 1 },
      ]);
    } catch {
      // Gracefully continue with in-memory tracking
    }
  }

  inMemoryHistory.unshift(record);

  if (dispatchError) {
    throw new Error(dispatchError);
  }

  return record;
}

export async function getCommunicationHistory(): Promise<CommunicationLogItem[]> {
  return inMemoryHistory;
}
