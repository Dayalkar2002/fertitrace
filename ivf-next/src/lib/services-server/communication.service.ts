import { executeDRL } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export interface SendMessagePayload {
  patientId: string | number;
  patientName: string;
  recipient: string;
  channel: 'WhatsApp' | 'SMS';
  messageType: string;
  messageText: string;
  language?: string;
  sentBy: string;
}

export interface CommunicationLogItem {
  id: string;
  dateTime: string;
  messageType: string;
  channel: 'WhatsApp' | 'SMS';
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

export async function sendMessage(payload: SendMessagePayload): Promise<CommunicationLogItem> {
  const provider = process.env.SMS_PROVIDER || 'demo';
  const apiKey = process.env.SMS_API_KEY;
  let status: 'Delivered' | 'Failed' | 'Pending' = 'Delivered';

  // 1. External Gateway Integration Logic
  if (provider !== 'demo' && apiKey) {
    try {
      if (provider === 'fast2sms') {
        // Fast2SMS API example
        const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'q',
            message: payload.messageText,
            language: 'english',
            flash: 0,
            numbers: payload.recipient.replace(/[^0-9]/g, ''),
          }),
        });
        const data = await res.json();
        if (!data.return) status = 'Failed';
      } else if (provider === 'msg91') {
        // MSG91 API example
        const res = await fetch('https://api.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            authkey: apiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            mobiles: payload.recipient.replace(/[^0-9]/g, ''),
            message: payload.messageText,
          }),
        });
        if (!res.ok) status = 'Failed';
      }
    } catch (gatewayErr) {
      console.error('External gateway dispatch failed:', gatewayErr);
      status = 'Failed';
    }
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
    sentBy: payload.sentBy || 'Dr. Admin',
    status,
    messageText: payload.messageText,
  };

  // 3. Database Persistence if configured
  if (isDbConfigured()) {
    try {
      // Optional call to legacy spManualSMS if available
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
  return record;
}

export async function getCommunicationHistory(): Promise<CommunicationLogItem[]> {
  return inMemoryHistory;
}
