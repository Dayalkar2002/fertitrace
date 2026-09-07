import { apiFetch } from '@/lib/api';

export interface CommunicationMessagePayload {
  patientId: string | number;
  patientName: string;
  recipient: string;
  channel: 'WhatsApp' | 'SMS';
  messageType: string;
  messageText: string;
  templateId?: string;
  language?: string;
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

export async function sendCommunicationMessage(
  token: string,
  payload: CommunicationMessagePayload
): Promise<CommunicationLogItem> {
  const res = await apiFetch<{ success: boolean; message: string; data: CommunicationLogItem }>(
    '/communication/send',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
  return res.data;
}

export async function fetchCommunicationHistory(token?: string | null): Promise<CommunicationLogItem[]> {
  try {
    const res = await apiFetch<{ success: boolean; data: CommunicationLogItem[] }>(
      '/communication/history',
      {},
      token
    );
    return res.data || [];
  } catch (err) {
    console.warn('[Communication] Could not fetch remote history, using fallback:', err);
    return [];
  }
}
