import { executeDRL, executeText, buildParams } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export interface CryoMatchRow {
  patId: number;
  patName: string;
  cycId: string;
  cycleType: string;
  location: string;
  compactBarcode: string;
  itemTypeCode: string;
  sourceKey: string;
  isPrinted: boolean;
  printable: string;
  processDate: string;
}

export interface CryoScanValidationResult {
  ok: boolean;
  status: 'OK' | 'MISMATCH' | 'SELECT';
  message: string;
  scannedCode: string;
  matches: CryoMatchRow[];
  verifiedMatch?: CryoMatchRow;
}

/**
 * Compact location encoder matching SMART BarcodeQrEncoder:
 * CC-BA52/C-9/GO-BL/VE-RD/VI-BL/ST-BR -> BA52C9GOBLVERDVIBLSTBR
 */
export function compactLocation(slashLocation: string): string {
  if (!slashLocation) return '';
  let s = slashLocation.trim().toUpperCase();
  if (s.startsWith('CC-')) s = s.substring(3);
  s = s.replace(/\/CV-/gi, '/').replace(/^CV-/gi, '');
  return s.replace(/[\/\-\s]/g, '');
}

/**
 * Build compact QR code string: PatID + TypeCode(2) + Date(ddMMyy) + CompactLocation
 */
export function buildCryoBarcode(
  patId: number,
  typeCode: string,
  processDate: Date | string,
  slashLocation: string
): string {
  const compact = compactLocation(slashLocation);
  if (!compact) return '';
  const dateObj = processDate instanceof Date ? processDate : new Date(processDate);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yy = String(dateObj.getFullYear()).slice(-2);
  const type = typeCode.padStart(2, '0').slice(-2);
  return `${Math.max(0, patId)}${type}${dd}${mm}${yy}${compact}`;
}

export function resolveTypeCode(cycleOrItemType: string): string {
  if (!cycleOrItemType) return '02';
  const t = cycleOrItemType.trim().toUpperCase();
  if (t.includes('HSA')) return '04';
  if (t.includes('IUI')) return '05';
  if (t.startsWith('IVF') || t.includes('IVF ')) return '06';
  if (t.includes('OOCYTE') || t.includes('OCCYTE') || t.includes('FZO') || t.includes('THO')) return '03';
  if (t.includes('EMBRYO') || t.includes('BLAST') || t.includes('FET') || t.includes('ET') || t.includes('BT')) return '01';
  return '02'; // Semen default
}

export function normalizeBarcode(raw: string): string {
  return (raw || '').trim().replace(/[\r\n]/g, '').toUpperCase();
}

export function isScanMatch(scannedNorm: string, row: CryoMatchRow): boolean {
  if (!row || !scannedNorm) return false;
  const compact = normalizeBarcode(row.compactBarcode);
  const location = normalizeBarcode(row.location);
  const locCompact = normalizeBarcode(compactLocation(row.location));

  if (compact && scannedNorm === compact) return true;
  if (location && scannedNorm === location) return true;
  if (locCompact && (scannedNorm.endsWith(locCompact) || scannedNorm === locCompact)) return true;

  const locNoDelim = location.replace(/[\/\-\s]/g, '');
  if (locNoDelim && scannedNorm.includes(locNoDelim)) return true;

  return false;
}

/**
 * Fetch cryo barcode inventory via dbo.Barcode SP
 */
export async function getCryoBarcodeInventory(
  patId = -1,
  filterBarcode = '',
  isPrintable = '-1'
): Promise<CryoMatchRow[]> {
  if (!isDbConfigured()) return getMockCryoRows();

  try {
    const result = await executeDRL<Record<string, unknown>>(
      'dbo.Barcode',
      buildParams('@PatID,@Barcode,@IsPRintable,@QueryIndex', [patId, filterBarcode, isPrintable, 0])
    );

    const rows = result.recordset || [];
    return rows.map((r) => {
      const pId = Number(r.PatID || 0);
      const cycleType = String(r.CycleType || '').trim();
      const location = String(r.location || r.Location || '').trim();
      const itemTypeCode = String(r.ItemTypeCode || '').trim() || resolveTypeCode(cycleType);
      const pDate = r.ProcessDate ? String(r.ProcessDate) : new Date().toISOString();
      const compact = String(r.CompactBarcode || '').trim() || buildCryoBarcode(pId, itemTypeCode, pDate, location);

      return {
        patId: pId,
        patName: String(r.PatName || '').trim(),
        cycId: String(r.CycID || '').trim(),
        cycleType,
        location,
        compactBarcode: compact,
        itemTypeCode,
        sourceKey: String(r.SourceKey || '').trim(),
        isPrinted: Boolean(r.IsPrinted),
        printable: String(r.Printable || 'Non Printed').trim(),
        processDate: pDate,
      };
    });
  } catch (err) {
    console.error('Error in getCryoBarcodeInventory:', err);
    return getMockCryoRows();
  }
}

/**
 * Validate a scanned barcode/QR against all registered cryo items
 */
export async function validateCryoScan(
  scannedRaw: string,
  expectedPatId?: number
): Promise<CryoScanValidationResult> {
  const scanned = normalizeBarcode(scannedRaw);
  if (!scanned) {
    return {
      ok: false,
      status: 'MISMATCH',
      message: 'Empty scan. Point the scanner at a label and try again.',
      scannedCode: '',
      matches: [],
    };
  }

  const allRows = await getCryoBarcodeInventory(-1, '');
  if (!allRows.length) {
    return {
      ok: false,
      status: 'MISMATCH',
      message: 'No barcode records found in database to validate against.',
      scannedCode: scanned,
      matches: [],
    };
  }

  let matches = allRows.filter((r) => isScanMatch(scanned, r));

  // If no match found directly, check if it matches a printed HSA/IUI/IVF procedure barcode format
  if (!matches.length) {
    // Check procedure suffix
    if (scanned.endsWith('HSA') || scanned.endsWith('IUI') || scanned.endsWith('IVF')) {
      const suffix = scanned.slice(-3);
      matches = allRows.filter((r) => r.cycleType.toUpperCase().includes(suffix));
    }
  }

  if (!matches.length) {
    await logScanResult(scanned, false, 'MISMATCH', 'Scanned code was not found in the database.', expectedPatId);
    return {
      ok: false,
      status: 'MISMATCH',
      message: `Scanned code "${scanned}" was not found in the database.`,
      scannedCode: scanned,
      matches: [],
    };
  }

  // Active patient enforcement check
  if (expectedPatId && expectedPatId > 0) {
    const forPatient = matches.filter((m) => m.patId === expectedPatId);
    if (!forPatient.length) {
      const owner = matches[0];
      const msg = `CRITICAL MISMATCH: Scanned specimen belongs to ${owner.patName} (ID: ${owner.patId}), NOT the active patient (ID: ${expectedPatId})!`;
      await logScanResult(scanned, false, 'MISMATCH', msg, expectedPatId);
      return {
        ok: false,
        status: 'MISMATCH',
        message: msg,
        scannedCode: scanned,
        matches,
      };
    }
    matches = forPatient;
  }

  if (matches.length === 1) {
    const verified = matches[0];
    const msg = `MATCH VERIFIED: ${verified.patName} · ${verified.cycleType} (${verified.cycId}) · Location: ${verified.location}`;
    await logScanResult(scanned, true, 'OK', msg, expectedPatId || verified.patId);
    return {
      ok: true,
      status: 'OK',
      message: msg,
      scannedCode: scanned,
      matches,
      verifiedMatch: verified,
    };
  }

  // Multiple matching straws in the same goblet/cane
  const selectMsg = `Found ${matches.length} matching specimens. Confirm selected straw / vial below.`;
  await logScanResult(scanned, true, 'SELECT', selectMsg, expectedPatId || matches[0].patId);
  return {
    ok: true,
    status: 'SELECT',
    message: selectMsg,
    scannedCode: scanned,
    matches,
  };
}

async function logScanResult(
  code: string,
  isOk: boolean,
  status: string,
  message: string,
  patId?: number
): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await executeText(`
      IF OBJECT_ID('dbo.BarcodeScanLog', 'U') IS NOT NULL
      BEGIN
        INSERT INTO dbo.BarcodeScanLog (ScannedCode, IsOk, StatusText, MessageText, PatID, UserName, ScannedOn)
        VALUES (@code, @isOk, @status, @message, @patId, 'FertiTrace', GETDATE())
      END
    `, [
      { name: '@code', value: code },
      { name: '@isOk', value: isOk ? 1 : 0 },
      { name: '@status', value: status },
      { name: '@message', value: message },
      { name: '@patId', value: patId || null },
    ]);
  } catch {
    // ignore if table does not exist
  }
}

function getMockCryoRows(): CryoMatchRow[] {
  return [
    {
      patId: 2,
      patName: 'Riya Prathamesh Shukla',
      cycId: 'C215',
      cycleType: 'Oocyte Freezing',
      location: 'CC-BA24/C-6/GO-BL/VE-PK/VI-BK/ST-BR',
      compactBarcode: '203260926BA24C6GOBLVEPKVIBKSTBR',
      itemTypeCode: '03',
      sourceKey: 'Oocyte:C215',
      isPrinted: true,
      printable: 'Printed',
      processDate: '2026-09-26T00:00:00.000Z',
    },
    {
      patId: 4,
      patName: 'Farah Mohammed Khan',
      cycId: 'C416',
      cycleType: 'Frozen Oocytes',
      location: 'CC-BA24/C-6/GO-BL/VE-PK/VI-BK/ST-YL',
      compactBarcode: '403260926BA24C6GOBLVEPKVIBKSTYL',
      itemTypeCode: '03',
      sourceKey: 'Oocyte:C416',
      isPrinted: true,
      printable: 'Printed',
      processDate: '2026-09-26T00:00:00.000Z',
    },
    {
      patId: 5,
      patName: 'Asha Pratap Ramraje',
      cycId: 'SS511',
      cycleType: 'Semen Freezing',
      location: 'CC-BA57/C-7/CH-R/CV-L1-BL',
      compactBarcode: '502031026BA57C7CHRL1BL',
      itemTypeCode: '02',
      sourceKey: 'SemenSelf:SS511',
      isPrinted: false,
      printable: 'Non Printed',
      processDate: '2026-10-03T00:00:00.000Z',
    },
  ];
}
