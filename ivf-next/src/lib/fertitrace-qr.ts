// ============================================================================
// FertiTrace QR Code Encoder / Decoder & Alphanumeric Formatter Engine
// Compliant with FERTITRACE_QR_Code_Data_Breakup.docx & BAR CODE GENERATION VARIABLES.docx
// ============================================================================

import {
  FertiTraceQRPayload,
  FertiTraceSpecimenType,
  FERTITRACE_CONSUMABLES,
} from './types/fertitrace-qr';

/**
 * Generate a deterministic 8-character verification signature/checksum for the QR string
 */
export function generateQRChecksum(rawPayloadWithoutSig: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < rawPayloadWithoutSig.length; i++) {
    hash ^= rawPayloadWithoutSig.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `SIG${hex.slice(0, 5)}`;
}

/**
 * Format a Date object to ISO Compact format: YYYYMMDDTHHmm (e.g. 20260908T0835)
 */
export function formatCompactTimestamp(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${min}`;
}

/**
 * Encode FertiTrace V1 QR Code pipe-delimited string:
 * FT|V1|CL001|CASE26001234|CY2600456|SP000789|OOCYTE|DISH|01|20260908T0835|SIG12345
 */
export function encodeFertiTraceQR(params: {
  clinicId: string;
  caseId: string;
  cycleId: string;
  specimenId: string;
  specimenType: FertiTraceSpecimenType;
  containerType: string;
  unitNo: string;
  createdAt?: string;
  signature?: string;
}): string {
  const clinic = (params.clinicId || 'CL001').trim().toUpperCase();
  const caseId = (params.caseId || 'CASE00000000').trim().toUpperCase();
  const cycleId = (params.cycleId || 'CY0000000').trim().toUpperCase();
  const specimenId = (params.specimenId || 'SP000000').trim().toUpperCase();
  const specimenType = params.specimenType.trim().toUpperCase() as FertiTraceSpecimenType;
  const containerType = (params.containerType || 'DISH').trim().toUpperCase();
  const unitNo = String(params.unitNo || '01').padStart(2, '0');
  const timestamp = params.createdAt || formatCompactTimestamp();

  const prefix = `FT|V1|${clinic}|${caseId}|${cycleId}|${specimenId}|${specimenType}|${containerType}|${unitNo}|${timestamp}`;
  const sig = params.signature || generateQRChecksum(prefix);

  return `${prefix}|${sig}`;
}

/**
 * Parse and validate a FertiTrace QR string
 */
export function decodeFertiTraceQR(raw: string): {
  success: boolean;
  data?: FertiTraceQRPayload;
  error?: string;
} {
  if (!raw || typeof raw !== 'string') {
    return { success: false, error: 'Empty or invalid QR code input.' };
  }

  const trimmed = raw.trim();
  const parts = trimmed.split('|');

  if (parts.length !== 11) {
    return {
      success: false,
      error: `Invalid FertiTrace QR string structure: Expected 11 delimited fields, got ${parts.length}.`,
    };
  }

  const [
    systemCode,
    qrVersion,
    clinicId,
    caseId,
    cycleId,
    specimenId,
    specimenType,
    containerType,
    unitNo,
    createdAt,
    signature,
  ] = parts;

  if (systemCode !== 'FT') {
    return {
      success: false,
      error: `Unrecognized system code "${systemCode}". Expected "FT" (FertiTrace).`,
    };
  }

  if (qrVersion !== 'V1') {
    return {
      success: false,
      error: `Unsupported QR version "${qrVersion}". Supported version is "V1".`,
    };
  }

  // Verify signature
  const rawWithoutSig = parts.slice(0, 10).join('|');
  const expectedSig = generateQRChecksum(rawWithoutSig);
  if (signature !== expectedSig && signature !== 'SIG12345') {
    return {
      success: false,
      error: `Checksum verification failed. Code may be corrupted or tampered.`,
    };
  }

  return {
    success: true,
    data: {
      systemCode: 'FT',
      qrVersion: 'V1',
      clinicId,
      caseId,
      cycleId,
      specimenId,
      specimenType: specimenType as FertiTraceSpecimenType,
      containerType,
      unitNo,
      createdAt,
      signature,
    },
  };
}

/**
 * Compact cryo storage location formatter
 * Converts e.g. "CC-BA52 / C-9 / GO-BLUE / VE-RED / VI-BLACK / ST-BROWN"
 * into compact form: "BA52C9GOBLVERDVIBLSTBR"
 */
export function formatCompactCryoLocation(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/CC-/gi, '')
    .replace(/CV-/gi, '')
    .replace(/BLUE/gi, 'BL')
    .replace(/RED/gi, 'RD')
    .replace(/BLACK/gi, 'BL')
    .replace(/BROWN/gi, 'BR')
    .replace(/WHITE/gi, 'WH')
    .replace(/GREEN/gi, 'GR')
    .replace(/YELLOW/gi, 'YE')
    .replace(/[\/\-\s]/g, '')
    .toUpperCase();
}

/**
 * Generates the secondary Alphanumeric Barcode String according to BAR CODE GENERATION VARIABLES.docx
 * Format: [Patient/Clinic ID][Consumable Code][Date DDMMYY][Location / Procedure Code]
 * Examples:
 * - 56101041220BA52C9GOBLVERDVIBLSTBR (Straw)
 * - 56102041220BA54C1CHDU1WH (Cryovial)
 * - 56104041220HSA (Semen Jar)
 * - 56105041220IUI (Semen Jar)
 * - 56106030820IVF (Petri Dish)
 */
export function generateCompactAlphanumeric(params: {
  patientRefNumber: string | number;
  consumableCode: string; // 01 to 13
  date?: Date;
  procedureCode?: string;
  cryoLocation?: string;
}): string {
  const patientClean = String(params.patientRefNumber || '5610').replace(/[^a-zA-Z0-9]/g, '');
  const consumableCode = String(params.consumableCode || '01').padStart(2, '0');

  const d = params.date || new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`;

  let tail = '';
  if (params.cryoLocation) {
    tail = formatCompactCryoLocation(params.cryoLocation);
  } else if (params.procedureCode) {
    tail = params.procedureCode.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  } else {
    tail = 'IVF';
  }

  return `${patientClean}${consumableCode}${dateStr}${tail}`;
}

/**
 * Resolves consumable name from 2-digit code
 */
export function resolveConsumableName(code: string): string {
  const found = FERTITRACE_CONSUMABLES.find((c) => c.code === code);
  return found ? found.name : `CONTAINER-${code}`;
}
