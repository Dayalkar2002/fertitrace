import { isDbConfigured } from '@/lib/db/pool';
import { buildParams, executeDRL, executeText } from '@/lib/db/spExecutor';
import { formatSmartDate, rowVal } from '@/lib/db/row';
import type { LookupItem } from '@/lib/types/master';

export interface ClinicalCycleDate {
  cycId: string;
  cycleDate: string;
  label: string;
}

/**
 * Fetch dynamic cycle dates for a patient via spCycOutComeExtDRL
 * Matches SMART: QueryIndex = 1 returns CycID and CycODate
 */
export async function getClinicalCycleDates(patId: number, satId: number): Promise<ClinicalCycleDate[]> {
  if (!patId || !isDbConfigured()) return [];

  try {
    const result = await executeDRL<Record<string, unknown>>(
      'spCycOutComeExtDRL',
      buildParams('@PatID,@SatID,@QueryIndex', [patId, satId || 0, 1])
    );

    const rows = result.recordset || [];
    return rows
      .map((r) => {
        const cycId = rowVal(r, 'CycID', 'CycleID').trim();
        const rawDate = r.CycODate ?? r.CycDate;
        const cycleDate = formatSmartDate(rawDate);
        return {
          cycId,
          cycleDate,
          label: cycleDate ? `${cycId} (${cycleDate})` : cycId,
        };
      })
      .filter((c) => Boolean(c.cycId));
  } catch (err) {
    console.error('Error in getClinicalCycleDates:', err);
    return [];
  }
}

/**
 * Fetch doctors / surgeons for clinical modules from DoctorMaster or login_master
 */
export async function getClinicalDoctors(): Promise<LookupItem[]> {
  if (!isDbConfigured()) {
    return [
      { id: 1, name: 'Dr. Satish Sharma' },
      { id: 2, name: 'Dr. Anjali Mehta' },
    ];
  }

  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT DocID AS ID, DocName AS Name FROM DoctorMaster ORDER BY DocName`
    );
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset.map((r) => ({
        id: Number(r.ID),
        name: String(r.Name || '').trim(),
      }));
    }
  } catch {
    // fallback to login_master
  }

  try {
    const res = await executeText<Record<string, unknown>>(
      `SELECT ID, UserName AS Name FROM login_master WHERE UserStatus = 1 ORDER BY UserName`
    );
    return (res.recordset || []).map((r) => ({
      id: Number(r.ID),
      name: String(r.Name || '').trim(),
    }));
  } catch {
    return [
      { id: 1, name: 'Dr. Satish Sharma' },
      { id: 2, name: 'Dr. Anjali Mehta' },
    ];
  }
}
