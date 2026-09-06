import { apiFetch } from '@/lib/api';

export interface CommunicationMessagePayload {
  patientId: string | number;
  patientName: string;
  recipient: string;
  channel: 'WhatsApp' | 'SMS';
  messageType: string;
  messageText: string;
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

export async function fetchCommunicationHistory(token: string): Promise<CommunicationLogItem[]> {
  const res = await apiFetch<{ success: boolean; data: CommunicationLogItem[] }>(
    '/communication/history',
    {},
    token
  );
  return res.data || [];
}
