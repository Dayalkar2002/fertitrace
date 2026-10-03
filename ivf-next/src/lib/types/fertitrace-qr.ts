// ============================================================================
// FertiTrace QR Code & Witnessing System Data Types
// Reference: Downloads/qrcodefile & docs/fertitrace-qr-requirement-plan.md
// ============================================================================

export type FertiTraceSpecimenType = 'EMBRYO' | 'SEMEN' | 'OOCYTES' | 'OOCYTE';

export type FertiTraceLifecycleStatus =
  | 'ACTIVE'
  | 'IN_PROCESS'
  | 'CRYOPRESERVED'
  | 'THAWED'
  | 'TRANSFERRED'
  | 'DISPOSED'
  | 'CANCELLED';

export type FertiTraceVerificationResult =
  | 'MATCH_OK'
  | 'MISMATCH'
  | 'BLOCKED'
  | 'OVERRIDE';

export interface FertiTraceConsumableDef {
  code: string;
  name: string;
  category: string;
  defaultUnit: string;
}

export const FERTITRACE_CONSUMABLES: FertiTraceConsumableDef[] = [
  { code: '01', name: 'SEMEN CONTAINER JAR', category: 'Andrology', defaultUnit: 'JAR' },
  { code: '02', name: 'CONICAL TUBE', category: 'General Lab', defaultUnit: 'TUBE' },
  { code: '03', name: 'FALCON TUBE 5ML', category: 'General Lab', defaultUnit: 'TUBE' },
  { code: '04', name: 'APPENDROFF (EPPENDORF)', category: 'General Lab', defaultUnit: 'TUBE' },
  { code: '05', name: 'IUI CATHETER', category: 'Clinical Transfer', defaultUnit: 'CATHETER' },
  { code: '06', name: 'FALCON TUBE 15ML', category: 'General Lab', defaultUnit: 'TUBE' },
  { code: '07', name: 'PETRIDISH', category: 'Culture', defaultUnit: 'DISH' },
  { code: '08', name: 'CENTRE WELL', category: 'Culture', defaultUnit: 'DISH' },
  { code: '09', name: 'ICSI DISH', category: 'Micromanipulation', defaultUnit: 'DISH' },
  { code: '10', name: 'FOUR WELL', category: 'Culture', defaultUnit: 'DISH' },
  { code: '11', name: 'EMBRYO TRANSFER CATHETER', category: 'Clinical Transfer', defaultUnit: 'CATHETER' },
  { code: '12', name: 'VITRIFICATION STRAW', category: 'Cryopreservation', defaultUnit: 'STRAW' },
  { code: '13', name: 'VITRIFICATION CRYOVIAL', category: 'Cryopreservation', defaultUnit: 'VIAL' },
];

export const FERTITRACE_PROCEDURES = [
  'HSA',
  'SQA',
  'IUI SINGLE HUSBAND',
  'IUI DOUBLE HUSBAND',
  'THAW HUSBAND SINGLE',
  'THAW HUSBAND DOUBLE',
  'THAW DONOR SINGLE',
  'THAW DONOR DOUBLE',
  'SELF HUSBAND FREEZING',
  'IVF CYCLE',
  'EMBRYO FREEZING',
  'FET CYCLE',
  'OCCYTE FREEZING',
  'THAW OCCYTE CYCLE',
  'ED CYCLE',
  'ED FREEZING CYCLE',
  'ED THAW CYCLE',
] as const;

export type FertiTraceProcedure = typeof FERTITRACE_PROCEDURES[number];

export interface FertiTraceLabelSizeDef {
  key: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  code: string;
  name: string;
  widthMm: number;
  heightMm: number;
  desc: string;
  rollName: string;
}

export const FERTITRACE_LABEL_SIZES: FertiTraceLabelSizeDef[] = [
  { key: 'A', code: 'CST 79N0T', name: 'A - 35 x 22 mm', widthMm: 35, heightMm: 22, desc: 'Cryo Straws & Vials', rollName: 'Roll A (Cryo Straws/Vials)' },
  { key: 'B', code: 'CST 28N0T', name: 'B - 50.8 x 25.4 mm', widthMm: 50.8, heightMm: 25.4, desc: 'Petri Dishes & Culture Plates', rollName: 'Roll B (Petri Dishes/Plates)' },
  { key: 'C', code: 'AMA 227NP', name: 'C - 50.8 x 6.4 mm', widthMm: 50.8, heightMm: 6.4, desc: 'Ultra-thin Straw Flag', rollName: 'Roll C (Straw Flags)' },
  { key: 'D', code: 'CRF 510NP', name: 'D - 35 x 22 mm', widthMm: 35, heightMm: 22, desc: 'Standard Falcon Tubes (5ml & 15ml)', rollName: 'Roll D (Falcon Tubes)' },
  { key: 'E', code: 'SMP 140NP', name: 'E - 25 x 12 mm', widthMm: 25, heightMm: 12, desc: 'Microcentrifuge / Eppendorf Tubes', rollName: 'Roll E (Eppendorf)' },
  { key: 'F', code: 'PID 855NP', name: 'F - 85.6 x 54 mm', widthMm: 85.6, heightMm: 54, desc: 'Patient Smartcard / ID Card Tag', rollName: 'Roll F (Patient Cards)' },
];

/**
 * 11 Mandatory fields of FertiTrace V1 QR Code:
 * FT|V1|CL001|CASE26001234|CY2600456|SP000789|OOCYTE|DISH|01|20260908T0835|SIG12345
 */
export interface FertiTraceQRPayload {
  systemCode: 'FT';
  qrVersion: 'V1';
  clinicId: string;
  caseId: string;
  cycleId: string;
  specimenId: string;
  specimenType: FertiTraceSpecimenType;
  containerType: string;
  unitNo: string;
  createdAt: string;       // YYYYMMDDTHHmm
  signature: string;       // Verification hash
}

export interface FertiTraceQRRecord {
  qrId: string;
  qrString: string;
  systemCode: string;
  qrVersion: string;
  clinicId: string;
  patientId?: number;
  patientName?: string;
  patientUhid?: string;
  caseId: string;
  cycleId: string;
  specimenId: string;
  specimenType: FertiTraceSpecimenType;
  containerType: string;
  containerUnitNo: string;
  procedureName?: string;
  compactCode: string;
  labelSize: string;
  storageLocation?: string;
  checksum: string;
  status: FertiTraceLifecycleStatus;
  isPreassigned: boolean;
  preassignedVendorCode?: string;
  createdBy: string;
  createdAt: string;
  closedAt?: string;
  closeReason?: string;
  notes?: string;
}

export interface FertiTraceAuditLogEntry {
  logId: number;
  specimenId: string;
  qrString?: string;
  workstationId?: string;
  eventType: string;
  verificationResult: FertiTraceVerificationResult;
  primaryUser: string;
  witnessUser?: string;
  details?: string;
  timestamp: string;
  digitalSignature?: string;
}

export interface FertiTraceConsumableItem {
  code: string;
  name: string;
  category: string;
  stockOnHand: number;
  allocatedCount: number;
  consumedCount: number;
  unitOfMeasure: string;
  reorderLevel: number;
}
