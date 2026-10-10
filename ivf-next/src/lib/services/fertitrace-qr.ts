import {
  FertiTraceQRRecord,
  FertiTraceAuditLogEntry,
  FertiTraceConsumableItem,
  FertiTraceLifecycleStatus,
  FertiTraceVerificationResult,
  FertiTraceSpecimenType,
} from '@/lib/types/fertitrace-qr';

export async function apiGenerateQR(payload: {
  clinicId?: string;
  patientId?: number;
  patientName?: string;
  patientUhid?: string;
  caseId?: string;
  cycleId: string;
  specimenType: FertiTraceSpecimenType;
  containerType: string;
  containerUnitNo?: string;
  procedureName?: string;
  labelSize?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  storageLocation?: string;
  createdBy?: string;
  notes?: string;
  copies?: number;
}): Promise<FertiTraceQRRecord> {
  const res = await fetch('/api/qr/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to generate QR');
  return data.record;
}

export async function apiValidateQRScan(params: {
  scannedCode: string;
  expectedPatientUhid?: string;
  expectedCycleId?: string;
  workstationId?: string;
  scannedBy: string;
  witnessUser?: string;
}): Promise<{
  result: FertiTraceVerificationResult;
  isMatch: boolean;
  message: string;
  record?: FertiTraceQRRecord;
  alarmTriggered: boolean;
}> {
  const res = await fetch('/api/qr/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Validation request failed');
  return data;
}

export async function apiAllotPreassignedLabel(params: {
  vendorBarcode: string;
  patientId?: number;
  patientName?: string;
  patientUhid?: string;
  cycleId: string;
  specimenType: FertiTraceSpecimenType;
  containerType: string;
  containerUnitNo?: string;
  procedureName?: string;
  allottedBy: string;
}): Promise<FertiTraceQRRecord> {
  const res = await fetch('/api/qr/preassigned', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Preassigned allotment failed');
  return data.record;
}

export async function apiTransitionStatus(params: {
  specimenId: string;
  newStatus: FertiTraceLifecycleStatus;
  updatedBy: string;
  witnessUser?: string;
  closeReason?: string;
  storageLocation?: string;
}): Promise<FertiTraceQRRecord> {
  const res = await fetch('/api/qr/transition', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Status transition failed');
  return data.record;
}

export async function apiListConsumableInventory(): Promise<FertiTraceConsumableItem[]> {
  const res = await fetch('/api/qr/inventory');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch inventory');
  return data.items;
}

export async function apiListAuditLogs(specimenId?: string): Promise<FertiTraceAuditLogEntry[]> {
  const url = specimenId
    ? `/api/qr/history?type=audit&specimenId=${encodeURIComponent(specimenId)}`
    : '/api/qr/history?type=audit';
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch audit logs');
  return data.audits;
}

export async function apiListQRHistory(): Promise<FertiTraceQRRecord[]> {
  const res = await fetch('/api/qr/history?type=qr');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch QR history');
  return data.records;
}
