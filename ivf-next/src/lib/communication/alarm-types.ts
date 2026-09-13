import type { AlarmMasterItem, AlarmSeverity } from '@/lib/communication/alarms-master';

export type AlarmStatus = 'Open' | 'Acknowledged' | 'Forwarded' | 'Queued' | 'Failed';

export interface AlarmEvent {
  id: string;
  eventId: string;
  title: string;
  severity: AlarmSeverity;
  dateTime: string;
  source: string;
  patientId?: string;
  patientName?: string;
  sampleId?: string;
  detail: string;
  raisedBy: string;
  status: AlarmStatus;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  forwardToSmart: AlarmMasterItem['forwardToSmart'];
  smartForwardStatus: 'sent' | 'queued' | 'failed' | 'skipped';
  externalSms: boolean;
  externalWhatsApp: boolean;
  emailAudit: boolean;
  escalationNote?: string;
}

export interface RaiseAlarmPayload {
  eventId: string;
  source?: string;
  patientId?: string;
  patientName?: string;
  sampleId?: string;
  detail: string;
  raisedBy: string;
}
