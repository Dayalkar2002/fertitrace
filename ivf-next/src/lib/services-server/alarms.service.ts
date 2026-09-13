import { ALARM_MASTER, getAlarmMaster, type AlarmMasterItem } from '@/lib/communication/alarms-master';
import type { AlarmEvent, RaiseAlarmPayload } from '@/lib/communication/alarm-types';
import { sendMessage, type CommunicationChannel } from '@/lib/services-server/communication.service';

export type { AlarmEvent, RaiseAlarmPayload } from '@/lib/communication/alarm-types';

const events: AlarmEvent[] = [
  {
    id: 'ALM-1043',
    eventId: 'FT-E01',
    title: 'Patient/sample identity mismatch',
    severity: 'Critical',
    dateTime: '13 Sep 2026  10:18 AM',
    source: 'Sperm Witnessing',
    patientId: 'PT-00245',
    patientName: 'Mrs. Neha Sharma',
    sampleId: 'SEM-26-18492011',
    detail: 'Scanned RFID did not match the selected patient / sample pair.',
    raisedBy: 'System',
    status: 'Open',
    forwardToSmart: 'yes',
    smartForwardStatus: 'sent',
    externalSms: true,
    externalWhatsApp: true,
    emailAudit: true,
    escalationNote: 'Staff SMS / WhatsApp eligible per alarm master.',
  },
  {
    id: 'ALM-1042',
    eventId: 'FT-E08',
    title: 'Duplicate witnessing attempt',
    severity: 'Warning',
    dateTime: '13 Sep 2026  09:42 AM',
    source: 'Witness System',
    sampleId: 'SEM-26-18492011',
    detail: 'Second scan received after the witnessing step was already completed.',
    raisedBy: 'System',
    status: 'Acknowledged',
    acknowledgedBy: 'Embryologist',
    acknowledgedAt: '13 Sep 2026  09:50 AM',
    forwardToSmart: 'yes',
    smartForwardStatus: 'sent',
    externalSms: false,
    externalWhatsApp: false,
    emailAudit: true,
  },
  {
    id: 'ALM-1041',
    eventId: 'FT-E25',
    title: 'Sample expiry/validity warning',
    severity: 'Warning',
    dateTime: '12 Sep 2026  06:15 PM',
    source: 'Cryostorage',
    sampleId: 'CRYO-H-4412',
    detail: 'Husband frozen straw approaches validity window.',
    raisedBy: 'System',
    status: 'Open',
    forwardToSmart: 'yes',
    smartForwardStatus: 'sent',
    externalSms: false,
    externalWhatsApp: true,
    emailAudit: true,
  },
  {
    id: 'ALM-1040',
    eventId: 'FT-E41',
    title: 'SMART IVF/API connection failure',
    severity: 'Warning',
    dateTime: '12 Sep 2026  04:02 PM',
    source: 'SMART Forwarder',
    detail: 'Outbound SMART IVF endpoint timed out. Event queued for retry.',
    raisedBy: 'System',
    status: 'Queued',
    forwardToSmart: 'yes',
    smartForwardStatus: 'queued',
    externalSms: false,
    externalWhatsApp: false,
    emailAudit: true,
  },
  {
    id: 'ALM-1039',
    eventId: 'FT-E50',
    title: 'Critical traceability event completed successfully',
    severity: 'Informational',
    dateTime: '12 Sep 2026  11:20 AM',
    source: 'IUI Witnessing',
    sampleId: 'SEM-26-17711008',
    detail: 'Two-person witnessing completed for IUI wash.',
    raisedBy: 'System',
    status: 'Forwarded',
    forwardToSmart: 'yes',
    smartForwardStatus: 'sent',
    externalSms: false,
    externalWhatsApp: false,
    emailAudit: true,
  },
];

function nowStamp(): string {
  const now = new Date();
  return `${now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })}  ${now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })}`;
}

async function forwardToSmartIvf(event: AlarmEvent): Promise<AlarmEvent['smartForwardStatus']> {
  const endpoint = process.env.SMART_IVF_EVENT_URL?.trim();
  if (!endpoint) {
    return event.forwardToSmart === 'retry_queue' ? 'queued' : 'sent';
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.SMART_IVF_EVENT_KEY ? `Bearer ${process.env.SMART_IVF_EVENT_KEY}` : '',
      },
      body: JSON.stringify({
        eventId: event.eventId,
        title: event.title,
        severity: event.severity,
        source: event.source,
        patientId: event.patientId,
        sampleId: event.sampleId,
        detail: event.detail,
        raisedAt: event.dateTime,
      }),
    });
    if (!res.ok) {
      return event.forwardToSmart === 'retry_queue' ? 'queued' : 'failed';
    }
    return 'sent';
  } catch {
    return event.forwardToSmart === 'retry_queue' ? 'queued' : 'failed';
  }
}

async function escalateExternally(event: AlarmEvent, master: AlarmMasterItem): Promise<string | undefined> {
  const staffMobile = process.env.ALARM_ESCALATION_MOBILE?.trim();
  if (!staffMobile) return undefined;

  const text = `FERTITRACE ${event.severity} ${event.eventId}: ${event.title}. ${event.detail}`;
  const channels: CommunicationChannel[] = [];
  if (master.externalSms) channels.push('SMS');
  if (master.externalWhatsApp) channels.push('WhatsApp');

  for (const channel of channels) {
    try {
      await sendMessage({
        patientId: event.patientId || 0,
        patientName: event.patientName || 'Lab staff',
        recipient: staffMobile,
        channel,
        messageType: `Alarm ${event.eventId}`,
        messageText: text,
        sentBy: 'FERTITRACE Alarms',
      });
    } catch {
      // Keep the alarm even if staff escalation fails.
    }
  }

  return channels.length ? `Escalated via ${channels.join(' + ')} to duty number.` : undefined;
}

export function listAlarmMaster(): AlarmMasterItem[] {
  return ALARM_MASTER;
}

export function listAlarmEvents(): AlarmEvent[] {
  return events;
}

export async function raiseAlarm(payload: RaiseAlarmPayload): Promise<AlarmEvent> {
  const master = getAlarmMaster(payload.eventId);
  if (!master) {
    throw new Error(`Unknown alarm event ${payload.eventId}`);
  }

  const event: AlarmEvent = {
    id: `ALM-${Date.now().toString().slice(-6)}`,
    eventId: master.eventId,
    title: master.title,
    severity: master.severity,
    dateTime: nowStamp(),
    source: payload.source || 'FERTITRACE',
    patientId: payload.patientId,
    patientName: payload.patientName,
    sampleId: payload.sampleId,
    detail: payload.detail,
    raisedBy: payload.raisedBy,
    status: 'Open',
    forwardToSmart: master.forwardToSmart,
    smartForwardStatus: 'queued',
    externalSms: master.externalSms,
    externalWhatsApp: master.externalWhatsApp,
    emailAudit: master.emailAudit,
  };

  event.smartForwardStatus = await forwardToSmartIvf(event);
  if (event.smartForwardStatus === 'sent') event.status = 'Forwarded';
  if (event.smartForwardStatus === 'queued') event.status = 'Queued';
  if (event.smartForwardStatus === 'failed') event.status = 'Failed';

  event.escalationNote = await escalateExternally(event, master);

  if (event.smartForwardStatus === 'failed' && master.eventId !== 'FT-E42') {
    events.unshift({
      ...event,
      id: `ALM-${(Date.now() + 1).toString().slice(-6)}`,
      eventId: 'FT-E42',
      title: 'Event could not be forwarded to SMART IVF',
      severity: 'Critical',
      detail: `Original ${event.eventId} could not be forwarded. Held in retry queue.`,
      forwardToSmart: 'retry_queue',
      smartForwardStatus: 'queued',
      status: 'Queued',
      externalSms: false,
      externalWhatsApp: false,
    });
  }

  events.unshift(event);
  return event;
}

export function acknowledgeAlarm(id: string, acknowledgedBy: string): AlarmEvent {
  const event = events.find((row) => row.id === id);
  if (!event) {
    throw new Error('Alarm not found.');
  }
  event.status = 'Acknowledged';
  event.acknowledgedBy = acknowledgedBy;
  event.acknowledgedAt = nowStamp();
  return event;
}
