import { executeDRL } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export interface SendMessagePayload {
  patientId: string | number;
  patientName: string;
  recipient: string;
  channel: 'WhatsApp' | 'SMS';
  messageType: string;
  messageText: string;
  templateId?: string;
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

export async function sendMessage(payload: SendMessagePayload): Promise<CommunicationLogItem> {
  const provider = process.env.SMS_PROVIDER || 'stpl';
  const senderId = process.env.SMS_SENDER_ID || 'IVCRFT';
  const entityId = process.env.DLT_PE_ID || '1701161718998728035';
  const gatewayUrl = process.env.SMS_GATEWAY_URL?.trim();
  const apiKey = process.env.SMS_API_KEY?.trim();
  const dltTemplateId = payload.templateId?.trim() || process.env.STPL_TEMPLATE_ID?.trim();

  let status: 'Delivered' | 'Failed' | 'Pending' = 'Delivered';
  let dispatchError: string | null = null;

  // 1. External Gateway Integration Logic (STPL / DLT Gateway)
  if (gatewayUrl && apiKey) {
    try {
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status === 'failed' || data.error) {
        status = 'Failed';
        dispatchError = data.message || data.error || 'Gateway dispatch failed.';
      }
    } catch (gatewayErr) {
      console.error('STPL Gateway dispatch error:', gatewayErr);
      status = 'Failed';
      dispatchError = gatewayErr instanceof Error ? gatewayErr.message : 'Gateway error';
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
