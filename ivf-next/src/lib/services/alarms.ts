import { apiFetch } from '@/lib/api';
import type { AlarmMasterItem } from '@/lib/communication/alarms-master';
import type { AlarmEvent, RaiseAlarmPayload } from '@/lib/communication/alarm-types';

export type { AlarmEvent, AlarmMasterItem, RaiseAlarmPayload };

export async function fetchAlarmMaster(token?: string | null): Promise<AlarmMasterItem[]> {
  const res = await apiFetch<{ success: boolean; data: AlarmMasterItem[] }>(
    '/communication/alarms/master',
    {},
    token
  );
  return res.data || [];
}

export async function fetchAlarmEvents(token?: string | null): Promise<AlarmEvent[]> {
  const res = await apiFetch<{ success: boolean; data: AlarmEvent[] }>(
    '/communication/alarms',
    {},
    token
  );
  return res.data || [];
}

export async function raiseAlarmEvent(
  token: string | null | undefined,
  payload: Omit<RaiseAlarmPayload, 'raisedBy'> & { raisedBy?: string }
): Promise<AlarmEvent> {
  const res = await apiFetch<{ success: boolean; data: AlarmEvent }>(
    '/communication/alarms',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    token
  );
  return res.data;
}

export async function acknowledgeAlarmEvent(
  token: string | null | undefined,
  id: string
): Promise<AlarmEvent> {
  const res = await apiFetch<{ success: boolean; data: AlarmEvent }>(
    '/communication/alarms/acknowledge',
    {
      method: 'POST',
      body: JSON.stringify({ id }),
    },
    token
  );
  return res.data;
}
