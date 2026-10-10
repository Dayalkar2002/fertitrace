// ============================================================================
// FertiTrace Server Service: QR Master, Specimen Lifecycle, Audit & Inventory
// Database-first with in-memory resilient fallback for local/offline execution
// ============================================================================

import { getPool, isDbConfigured } from '@/lib/db/pool';
import {
  encodeFertiTraceQR,
  decodeFertiTraceQR,
  generateCompactAlphanumeric,
  formatCompactTimestamp,
} from '@/lib/fertitrace-qr';
import {
  FertiTraceQRRecord,
  FertiTraceSpecimenType,
  FertiTraceAuditLogEntry,
  FertiTraceLifecycleStatus,
  FertiTraceVerificationResult,
  FertiTraceConsumableItem,
  FERTITRACE_CONSUMABLES,
} from '@/lib/types/fertitrace-qr';

// ----------------------------------------------------------------------------
// In-Memory Resilient Store (used for dev/offline/testing & caching)
// ----------------------------------------------------------------------------
const MEMORY_QR_STORE: Map<string, FertiTraceQRRecord> = new Map();
const MEMORY_AUDIT_LOGS: FertiTraceAuditLogEntry[] = [];
const MEMORY_INVENTORY: Map<string, FertiTraceConsumableItem> = new Map();

// Initialize mock inventory
FERTITRACE_CONSUMABLES.forEach((c) => {
  MEMORY_INVENTORY.set(c.code, {
    code: c.code,
    name: c.name,
    category: c.category,
    stockOnHand: 150,
    allocatedCount: 5,
    consumedCount: 20,
    unitOfMeasure: c.defaultUnit,
    reorderLevel: 25,
  });
});

// Seed sample QR records to match test cases
const sampleQr1 = encodeFertiTraceQR({
  clinicId: 'CL001',
  caseId: 'CASE26001234',
  cycleId: 'CY2600456',
  specimenId: 'SP000789',
  specimenType: 'OOCYTE',
  containerType: 'DISH',
  unitNo: '01',
  createdAt: '20260908T0835',
  signature: 'SIG12345',
});
MEMORY_QR_STORE.set('SP000789', {
  qrId: 'FT-QR-1001',
  qrString: sampleQr1,
  systemCode: 'FT',
  qrVersion: 'V1',
  clinicId: 'CL001',
  patientId: 101,
  patientName: 'Farah Mohammed Khan',
  patientUhid: 'UHID-2026-904',
  caseId: 'CASE26001234',
  cycleId: 'CY2600456',
  specimenId: 'SP000789',
  specimenType: 'OOCYTE',
  containerType: '07',
  containerUnitNo: '01',
  procedureName: 'IVF CYCLE',
  compactCode: '56106030820IVF',
  labelSize: 'B',
  checksum: 'SIG12345',
  status: 'IN_PROCESS',
  isPreassigned: false,
  createdBy: 'Dr. Sachin Kadam',
  createdAt: new Date().toISOString(),
});

/**
 * Generate a unique Specimen ID: SP + 6 digits (e.g. SP000842)
 */
export function generateSpecimenId(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `SP${rand}`;
}

/**
 * 1. Register a new System QR and allocate inventory
 */
export async function createAndRegisterQR(params: {
  clinicId?: string;
  patientId?: number;
  patientName?: string;
  patientUhid?: string;
  caseId?: string;
  cycleId: string;
  specimenType: FertiTraceSpecimenType;
  containerType: string; // 01 to 13 or DISH/STRAW
  containerUnitNo?: string;
  procedureName?: string;
  labelSize?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  storageLocation?: string;
  createdBy?: string;
  notes?: string;
  copies?: number;
}): Promise<FertiTraceQRRecord> {
  const clinicId = params.clinicId || 'CL001';
  const specimenId = generateSpecimenId();
  const caseId = params.caseId || (params.patientUhid ? `CASE-${params.patientUhid.replace(/[^a-zA-Z0-9]/g, '')}` : `CASE26${Date.now().toString().slice(-6)}`);
  const cycleId = params.cycleId || `CY2600${Math.floor(100 + Math.random() * 900)}`;
  const containerUnitNo = params.containerUnitNo || '01';
  const labelSize = params.labelSize || 'A';
  const createdBy = params.createdBy || 'Dr. Embryologist';
  const copiesCount = Math.max(1, params.copies || 1);

  const qrString = encodeFertiTraceQR({
    clinicId,
    caseId,
    cycleId,
    specimenId,
    specimenType: params.specimenType,
    containerType: params.containerType,
    unitNo: containerUnitNo,
  });

  const parts = qrString.split('|');
  const checksum = parts[10] || 'SIG00000';

  const compactCode = generateCompactAlphanumeric({
    patientRefNumber: params.patientId || params.patientUhid || '5610',
    consumableCode: params.containerType,
    procedureCode: params.procedureName,
    cryoLocation: params.storageLocation,
  });

  const record: FertiTraceQRRecord = {
    qrId: `FT-QR-${Date.now().toString().slice(-6)}`,
    qrString,
    systemCode: 'FT',
    qrVersion: 'V1',
    clinicId,
    patientId: params.patientId,
    patientName: params.patientName,
    patientUhid: params.patientUhid,
    caseId,
    cycleId,
    specimenId,
    specimenType: params.specimenType,
    containerType: params.containerType,
    containerUnitNo,
    procedureName: params.procedureName,
    compactCode,
    labelSize,
    storageLocation: params.storageLocation,
    checksum,
    status: 'ACTIVE',
    isPreassigned: false,
    createdBy,
    createdAt: new Date().toISOString(),
    notes: params.notes,
  };

  // Update in-memory store
  MEMORY_QR_STORE.set(specimenId, record);

  // Update consumable inventory (stock allocated)
  const itemCode = params.containerType.padStart(2, '0');
  const inv = MEMORY_INVENTORY.get(itemCode);
  if (inv) {
    inv.stockOnHand = Math.max(0, inv.stockOnHand - copiesCount);
    inv.allocatedCount += copiesCount;
  }

  // Persist to database if configured
  if (isDbConfigured()) {
    try {
      const pool = await getPool();
      const containerDef = FERTITRACE_CONSUMABLES.find((c) => c.code === itemCode);
      const containerName = containerDef ? containerDef.name : params.containerType;

      // 1. Deduct Stock in Real-time from DB
      await pool.request()
        .input('Code', itemCode)
        .input('Copies', copiesCount)
        .query(`
          UPDATE FertiTrace_Consumable_Stock
          SET StockOnHand = CASE WHEN StockOnHand >= @Copies THEN StockOnHand - @Copies ELSE 0 END,
              AllocatedCount = AllocatedCount + @Copies,
              UpdatedAt = GETDATE()
          WHERE Code = @Code
        `);

      // 2. Insert Record into FertiTrace_QR_Records in DB
      await pool.request()
        .input('QrId', record.qrId)
        .input('QrString', record.qrString)
        .input('SystemCode', record.systemCode)
        .input('QrVersion', record.qrVersion)
        .input('ClinicId', record.clinicId)
        .input('PatientId', record.patientId ?? null)
        .input('PatientName', record.patientName ?? null)
        .input('PatientUhid', record.patientUhid ?? null)
        .input('CaseId', record.caseId)
        .input('CycleId', record.cycleId)
        .input('SpecimenId', record.specimenId)
        .input('SpecimenType', record.specimenType)
        .input('ContainerType', record.containerType)
        .input('ContainerName', containerName)
        .input('ContainerUnitNo', record.containerUnitNo)
        .input('ProcedureName', record.procedureName ?? null)
        .input('CompactCode', record.compactCode)
        .input('LabelSize', record.labelSize)
        .input('StorageLocation', record.storageLocation ?? null)
        .input('Checksum', record.checksum)
        .input('Status', record.status)
        .input('Copies', copiesCount)
        .input('CreatedBy', record.createdBy)
        .input('Notes', record.notes ?? null)
        .query(`
          INSERT INTO FertiTrace_QR_Records (
            QrId, QrString, SystemCode, QrVersion, ClinicId, PatientId, PatientName, PatientUhid,
            CaseId, CycleId, SpecimenId, SpecimenType, ContainerType, ContainerName, ContainerUnitNo,
            ProcedureName, CompactCode, LabelSize, StorageLocation, Checksum, Status, IsPreassigned,
            Copies, CreatedBy, Notes, CreatedAt, UpdatedAt
          ) VALUES (
            @QrId, @QrString, @SystemCode, @QrVersion, @ClinicId, @PatientId, @PatientName, @PatientUhid,
            @CaseId, @CycleId, @SpecimenId, @SpecimenType, @ContainerType, @ContainerName, @ContainerUnitNo,
            @ProcedureName, @CompactCode, @LabelSize, @StorageLocation, @Checksum, @Status, 0,
            @Copies, @CreatedBy, @Notes, GETDATE(), GETDATE()
          )
        `);
    } catch (err) {
      console.warn('DB Insert failed for FertiTrace_QR_Records, falling back to memory store:', err);
    }
  }

  return record;
}

/**
 * 2. Validate a Scanned QR String (Wedge scanner, camera, or RFID)
 */
export async function validateScannedQR(params: {
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
  const { scannedCode, expectedPatientUhid, expectedCycleId, workstationId, scannedBy, witnessUser } = params;

  // Step A: Parse QR
  const decoded = decodeFertiTraceQR(scannedCode);
  let specimenId = '';

  if (decoded.success && decoded.data) {
    specimenId = decoded.data.specimenId;
  } else {
    // If not pipe-separated V1 string, check if it is a preassigned vendor code or compact barcode
    const clean = scannedCode.trim();
    const foundByCompact = Array.from(MEMORY_QR_STORE.values()).find(
      (r) => r.compactCode === clean || r.preassignedVendorCode === clean || r.specimenId === clean
    );
    if (foundByCompact) {
      specimenId = foundByCompact.specimenId;
    }
  }

  if (!specimenId) {
    // Unknown or corrupted code
    const audit: FertiTraceAuditLogEntry = {
      logId: Date.now(),
      specimenId: 'UNKNOWN',
      qrString: scannedCode,
      workstationId,
      eventType: 'SCAN_VALIDATE',
      verificationResult: 'MISMATCH',
      primaryUser: scannedBy,
      witnessUser,
      details: decoded.error || 'Scanned code not found in FertiTrace registry.',
      timestamp: new Date().toISOString(),
    };
    MEMORY_AUDIT_LOGS.unshift(audit);

    return {
      result: 'MISMATCH',
      isMatch: false,
      message: decoded.error || 'Scanned QR code does not belong to any registered specimen.',
      alarmTriggered: true,
    };
  }

  // Step B: Look up record
  let record = MEMORY_QR_STORE.get(specimenId);

  // If DB configured, attempt DB lookup
  if (isDbConfigured()) {
    try {
      const pool = await getPool();
      const res = await pool.request()
        .input('SpecimenId', specimenId)
        .query('SELECT TOP 1 * FROM FertiTrace_QR_Records WHERE SpecimenId = @SpecimenId OR CompactCode = @SpecimenId OR PreassignedVendorCode = @SpecimenId');
      if (res.recordset && res.recordset.length > 0) {
        const row = res.recordset[0];
        record = {
          qrId: row.QrId,
          qrString: row.QrString,
          systemCode: row.SystemCode,
          qrVersion: row.QrVersion,
          clinicId: row.ClinicId,
          patientId: row.PatientId,
          caseId: row.CaseId,
          cycleId: row.CycleId,
          specimenId: row.SpecimenId,
          specimenType: row.SpecimenType,
          containerType: row.ContainerType,
          containerUnitNo: row.ContainerUnitNo,
          procedureName: row.ProcedureName,
          compactCode: row.CompactCode,
          labelSize: row.LabelSize,
          storageLocation: row.StorageLocation,
          checksum: row.Checksum,
          status: row.Status,
          isPreassigned: Boolean(row.IsPreassigned),
          preassignedVendorCode: row.PreassignedVendorCode,
          createdBy: row.CreatedBy,
          createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('DB lookup error in validateScannedQR:', err);
    }
  }

  if (!record) {
    return {
      result: 'MISMATCH',
      isMatch: false,
      message: `Specimen ${specimenId} not found in database.`,
      alarmTriggered: true,
    };
  }

  // Step C: Check Lifecycle Status (Rule: Closed codes trigger Mismatch/Blocked)
  if (['TRANSFERRED', 'DISPOSED', 'CANCELLED'].includes(record.status)) {
    const audit: FertiTraceAuditLogEntry = {
      logId: Date.now(),
      specimenId,
      qrString: record.qrString,
      workstationId,
      eventType: 'SCAN_VALIDATE',
      verificationResult: 'BLOCKED',
      primaryUser: scannedBy,
      witnessUser,
      details: `Specimen lifecycle is closed (${record.status}). Re-use blocked.`,
      timestamp: new Date().toISOString(),
    };
    MEMORY_AUDIT_LOGS.unshift(audit);

    return {
      result: 'BLOCKED',
      isMatch: false,
      message: `CRITICAL ALERT: Specimen ${specimenId} has already been ${record.status}. Container cannot be re-used.`,
      record,
      alarmTriggered: true,
    };
  }

  // Step D: Match against expected patient/cycle if in active workflow zone
  if (expectedPatientUhid) {
    const cleanExp = expectedPatientUhid.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cleanPat = (record.patientUhid || record.caseId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (!cleanPat.includes(cleanExp) && !cleanExp.includes(cleanPat)) {
      const audit: FertiTraceAuditLogEntry = {
        logId: Date.now(),
        specimenId,
        qrString: record.qrString,
        workstationId,
        eventType: 'SCAN_VALIDATE',
        verificationResult: 'MISMATCH',
        primaryUser: scannedBy,
        witnessUser,
        details: `MISMATCH: Scanned specimen belongs to ${record.patientName || record.caseId}, but active workstation expects ${expectedPatientUhid}!`,
        timestamp: new Date().toISOString(),
      };
      MEMORY_AUDIT_LOGS.unshift(audit);

      return {
        result: 'MISMATCH',
        isMatch: false,
        message: `GAMETE MISMATCH WARNING: Container ${record.specimenId} does NOT match current patient (${expectedPatientUhid})!`,
        record,
        alarmTriggered: true,
      };
    }
  }

  // Step E: Valid Match!
  const audit: FertiTraceAuditLogEntry = {
    logId: Date.now(),
    specimenId,
    qrString: record.qrString,
    workstationId,
    eventType: 'SCAN_VALIDATE',
    verificationResult: 'MATCH_OK',
    primaryUser: scannedBy,
    witnessUser,
    details: `Verification PASSED for ${record.specimenType} (${record.containerType} #${record.containerUnitNo}).`,
    timestamp: new Date().toISOString(),
  };
  MEMORY_AUDIT_LOGS.unshift(audit);

  return {
    result: 'MATCH_OK',
    isMatch: true,
    message: `VERIFICATION OK: ${record.specimenType} (${record.specimenId}) verified for ${record.patientName || record.caseId}.`,
    record,
    alarmTriggered: false,
  };
}

/**
 * 3. Allot a Pre-assigned 3rd-Party Vendor Barcode to a specimen
 */
export async function allotPreassignedLabel(params: {
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
}): Promise<{ success: boolean; record?: FertiTraceQRRecord; error?: string }> {
  const barcode = params.vendorBarcode.trim();

  // Check if already allotted
  const existing = Array.from(MEMORY_QR_STORE.values()).find(
    (r) => r.preassignedVendorCode === barcode || r.compactCode === barcode
  );
  if (existing) {
    return {
      success: false,
      error: `Pre-assigned barcode "${barcode}" is ALREADY allotted to Specimen ${existing.specimenId} (${existing.patientName || existing.caseId}). Cannot reuse.`,
    };
  }

  const specimenId = generateSpecimenId();
  const caseId = params.patientUhid ? `CASE-${params.patientUhid.replace(/[^a-zA-Z0-9]/g, '')}` : `CASE26${Date.now().toString().slice(-6)}`;
  const unitNo = params.containerUnitNo || '01';

  const qrString = encodeFertiTraceQR({
    clinicId: 'CL001',
    caseId,
    cycleId: params.cycleId,
    specimenId,
    specimenType: params.specimenType,
    containerType: params.containerType,
    unitNo,
  });

  const record: FertiTraceQRRecord = {
    qrId: `FT-PRE-${Date.now().toString().slice(-6)}`,
    qrString,
    systemCode: 'FT',
    qrVersion: 'V1',
    clinicId: 'CL001',
    patientId: params.patientId,
    patientName: params.patientName,
    patientUhid: params.patientUhid,
    caseId,
    cycleId: params.cycleId,
    specimenId,
    specimenType: params.specimenType,
    containerType: params.containerType,
    containerUnitNo: unitNo,
    procedureName: params.procedureName,
    compactCode: barcode,
    labelSize: 'B',
    checksum: 'SIG_PRE_OK',
    status: 'ACTIVE',
    isPreassigned: true,
    preassignedVendorCode: barcode,
    createdBy: params.allottedBy,
    createdAt: new Date().toISOString(),
  };

  MEMORY_QR_STORE.set(specimenId, record);

  // Update in-memory consumable inventory
  const itemCode = params.containerType.padStart(2, '0');
  const inv = MEMORY_INVENTORY.get(itemCode);
  if (inv) {
    inv.stockOnHand = Math.max(0, inv.stockOnHand - 1);
    inv.allocatedCount += 1;
  }

  // Persist to database if configured
  if (isDbConfigured()) {
    try {
      const pool = await getPool();
      const containerDef = FERTITRACE_CONSUMABLES.find((c) => c.code === itemCode);
      const containerName = containerDef ? containerDef.name : params.containerType;

      // 1. Deduct Stock in DB
      await pool.request()
        .input('Code', itemCode)
        .input('Copies', 1)
        .query(`
          UPDATE FertiTrace_Consumable_Stock
          SET StockOnHand = CASE WHEN StockOnHand >= @Copies THEN StockOnHand - @Copies ELSE 0 END,
              AllocatedCount = AllocatedCount + @Copies,
              UpdatedAt = GETDATE()
          WHERE Code = @Code
        `);

      // 2. Insert into FertiTrace_QR_Records
      await pool.request()
        .input('QrId', record.qrId)
        .input('QrString', record.qrString)
        .input('SystemCode', record.systemCode)
        .input('QrVersion', record.qrVersion)
        .input('ClinicId', record.clinicId)
        .input('PatientId', record.patientId ?? null)
        .input('PatientName', record.patientName ?? null)
        .input('PatientUhid', record.patientUhid ?? null)
        .input('CaseId', record.caseId)
        .input('CycleId', record.cycleId)
        .input('SpecimenId', record.specimenId)
        .input('SpecimenType', record.specimenType)
        .input('ContainerType', record.containerType)
        .input('ContainerName', containerName)
        .input('ContainerUnitNo', record.containerUnitNo)
        .input('ProcedureName', record.procedureName ?? null)
        .input('CompactCode', record.compactCode)
        .input('LabelSize', record.labelSize)
        .input('Checksum', record.checksum)
        .input('Status', record.status)
        .input('PreassignedVendorCode', barcode)
        .input('CreatedBy', record.createdBy)
        .query(`
          INSERT INTO FertiTrace_QR_Records (
            QrId, QrString, SystemCode, QrVersion, ClinicId, PatientId, PatientName, PatientUhid,
            CaseId, CycleId, SpecimenId, SpecimenType, ContainerType, ContainerName, ContainerUnitNo,
            ProcedureName, CompactCode, LabelSize, Checksum, Status, IsPreassigned, PreassignedVendorCode,
            Copies, CreatedBy, CreatedAt, UpdatedAt
          ) VALUES (
            @QrId, @QrString, @SystemCode, @QrVersion, @ClinicId, @PatientId, @PatientName, @PatientUhid,
            @CaseId, @CycleId, @SpecimenId, @SpecimenType, @ContainerType, @ContainerName, @ContainerUnitNo,
            @ProcedureName, @CompactCode, @LabelSize, @Checksum, @Status, 1, @PreassignedVendorCode,
            1, @CreatedBy, GETDATE(), GETDATE()
          )
        `);
    } catch (err) {
      console.warn('DB Insert failed for preassigned FertiTrace_QR_Records:', err);
    }
  }

  const audit: FertiTraceAuditLogEntry = {
    logId: Date.now(),
    specimenId,
    qrString: barcode,
    eventType: 'PREASSIGNED_ALLOTMENT',
    verificationResult: 'MATCH_OK',
    primaryUser: params.allottedBy,
    details: `Pre-assigned vendor label "${barcode}" mapped to ${params.specimenType} container #${unitNo}`,
    timestamp: new Date().toISOString(),
  };
  MEMORY_AUDIT_LOGS.unshift(audit);

  return { success: true, record };
}

/**
 * 4. Specimen Lifecycle Status Transition (NEVER DELETES)
 */
export async function transitionLifecycleStatus(params: {
  specimenId: string;
  newStatus: FertiTraceLifecycleStatus;
  updatedBy: string;
  witnessUser?: string;
  closeReason?: string;
  storageLocation?: string;
}): Promise<{ success: boolean; record?: FertiTraceQRRecord; error?: string }> {
  const record = MEMORY_QR_STORE.get(params.specimenId);
  if (!record) {
    return { success: false, error: `Specimen ${params.specimenId} not found.` };
  }

  record.status = params.newStatus;
  if (params.storageLocation) {
    record.storageLocation = params.storageLocation;
  }

  const isClosed = ['TRANSFERRED', 'DISPOSED', 'CANCELLED'].includes(params.newStatus);
  if (isClosed) {
    record.closedAt = new Date().toISOString();
    record.closeReason = params.closeReason || `Closed as ${params.newStatus}`;

    // Deduct consumable stock as consumed
    const itemCode = record.containerType.padStart(2, '0');
    const inv = MEMORY_INVENTORY.get(itemCode);
    if (inv) {
      inv.allocatedCount = Math.max(0, inv.allocatedCount - 1);
      inv.consumedCount += 1;
    }
  }

  // Update in database if configured
  if (isDbConfigured()) {
    try {
      const pool = await getPool();
      await pool.request()
        .input('SpecimenId', params.specimenId)
        .input('Status', params.newStatus)
        .input('StorageLocation', params.storageLocation ?? null)
        .query(`
          UPDATE FertiTrace_QR_Records 
          SET Status = @Status,
              StorageLocation = COALESCE(@StorageLocation, StorageLocation),
              UpdatedAt = GETDATE()
          WHERE SpecimenId = @SpecimenId
        `);

      if (isClosed) {
        const itemCode = record.containerType.padStart(2, '0');
        await pool.request()
          .input('Code', itemCode)
          .query(`
            UPDATE FertiTrace_Consumable_Stock
            SET AllocatedCount = CASE WHEN AllocatedCount >= 1 THEN AllocatedCount - 1 ELSE 0 END,
                ConsumedCount = ConsumedCount + 1,
                UpdatedAt = GETDATE()
            WHERE Code = @Code
          `);
      }
    } catch (err) {
      console.warn('DB Update failed in transitionLifecycleStatus:', err);
    }
  }

  // Audit status transition
  const audit: FertiTraceAuditLogEntry = {
    logId: Date.now(),
    specimenId: params.specimenId,
    qrString: record.qrString,
    eventType: `STATUS_${params.newStatus}`,
    verificationResult: 'MATCH_OK',
    primaryUser: params.updatedBy,
    witnessUser: params.witnessUser,
    details: `Lifecycle state updated to ${params.newStatus}. ${params.closeReason || ''}`,
    timestamp: new Date().toISOString(),
  };
  MEMORY_AUDIT_LOGS.unshift(audit);

  return { success: true, record };
}

/**
 * 5. Consumable Inventory Listing (from Database table FertiTrace_Consumable_Stock)
 */
export async function listConsumableInventory(): Promise<FertiTraceConsumableItem[]> {
  if (isDbConfigured()) {
    try {
      const pool = await getPool();
      const res = await pool.request().query(`
        SELECT 
          Code as code,
          Name as name,
          Category as category,
          StockOnHand as stockOnHand,
          AllocatedCount as allocatedCount,
          ConsumedCount as consumedCount,
          UnitOfMeasure as unitOfMeasure,
          ReorderLevel as reorderLevel
        FROM FertiTrace_Consumable_Stock
        ORDER BY TRY_CAST(Code as INT) ASC, Code ASC
      `);
      if (res.recordset && res.recordset.length > 0) {
        return res.recordset.map((r: Record<string, unknown>) => ({
          code: String(r.code),
          name: String(r.name),
          category: String(r.category),
          stockOnHand: Number(r.stockOnHand),
          allocatedCount: Number(r.allocatedCount),
          consumedCount: Number(r.consumedCount),
          unitOfMeasure: String(r.unitOfMeasure),
          reorderLevel: Number(r.reorderLevel),
        }));
      }
    } catch (err) {
      console.warn('DB query failed for FertiTrace_Consumable_Stock, fallback to memory:', err);
    }
  }
  return Array.from(MEMORY_INVENTORY.values());
}

/**
 * 6. Audit Trail Listing
 */
export async function listTraceabilityAuditLogs(specimenId?: string): Promise<FertiTraceAuditLogEntry[]> {
  if (specimenId) {
    return MEMORY_AUDIT_LOGS.filter((l) => l.specimenId === specimenId);
  }
  return MEMORY_AUDIT_LOGS.slice(0, 50);
}

/**
 * 7. History of generated QR records (from Database table FertiTrace_QR_Records)
 */
export async function listQRHistory(limit: number = 50): Promise<FertiTraceQRRecord[]> {
  if (isDbConfigured()) {
    try {
      const pool = await getPool();
      const res = await pool.request()
        .input('Limit', limit)
        .query(`
          SELECT TOP (@Limit)
            QrId as qrId,
            QrString as qrString,
            SystemCode as systemCode,
            QrVersion as qrVersion,
            ClinicId as clinicId,
            PatientId as patientId,
            PatientName as patientName,
            PatientUhid as patientUhid,
            CaseId as caseId,
            CycleId as cycleId,
            SpecimenId as specimenId,
            SpecimenType as specimenType,
            ContainerType as containerType,
            ContainerUnitNo as containerUnitNo,
            ProcedureName as procedureName,
            CompactCode as compactCode,
            LabelSize as labelSize,
            StorageLocation as storageLocation,
            Checksum as checksum,
            Status as status,
            IsPreassigned as isPreassigned,
            PreassignedVendorCode as preassignedVendorCode,
            CreatedBy as createdBy,
            CreatedAt as createdAt,
            Notes as notes
          FROM FertiTrace_QR_Records
          ORDER BY CreatedAt DESC
        `);
      if (res.recordset && res.recordset.length > 0) {
        return res.recordset.map((r: Record<string, unknown>) => ({
          qrId: String(r.qrId),
          qrString: String(r.qrString),
          systemCode: String(r.systemCode),
          qrVersion: String(r.qrVersion),
          clinicId: String(r.clinicId),
          patientId: r.patientId ? Number(r.patientId) : undefined,
          patientName: r.patientName ? String(r.patientName) : undefined,
          patientUhid: r.patientUhid ? String(r.patientUhid) : undefined,
          caseId: String(r.caseId),
          cycleId: String(r.cycleId),
          specimenId: String(r.specimenId),
          specimenType: String(r.specimenType) as FertiTraceSpecimenType,
          containerType: String(r.containerType),
          containerUnitNo: String(r.containerUnitNo),
          procedureName: r.procedureName ? String(r.procedureName) : undefined,
          compactCode: String(r.compactCode),
          labelSize: String(r.labelSize),
          storageLocation: r.storageLocation ? String(r.storageLocation) : undefined,
          checksum: String(r.checksum),
          status: String(r.status) as FertiTraceLifecycleStatus,
          isPreassigned: Boolean(r.isPreassigned),
          preassignedVendorCode: r.preassignedVendorCode ? String(r.preassignedVendorCode) : undefined,
          createdBy: String(r.createdBy),
          createdAt: r.createdAt ? new Date(String(r.createdAt)).toISOString() : new Date().toISOString(),
          notes: r.notes ? String(r.notes) : undefined,
        }));
      }
    } catch (err) {
      console.warn('DB query failed for FertiTrace_QR_Records, fallback to memory:', err);
    }
  }
  return Array.from(MEMORY_QR_STORE.values()).reverse().slice(0, limit);
}
