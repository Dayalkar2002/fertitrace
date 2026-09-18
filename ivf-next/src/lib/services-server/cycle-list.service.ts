import { isDbConfigured } from '@/lib/db/pool';
import { buildParams, executeDRL, executeText } from '@/lib/db/spExecutor';
import { formatSmartDate, rowVal } from '@/lib/db/row';
import {
  getCycleTypeLabel,
  getMonitoringSheetLabel,
  normalizeCycleType,
  parseMonitoringSheet,
} from '@/lib/cycle-utils';
import type { PatientCycleRow } from '@/lib/types/cycle';

export async function listPatientCycles(patId: number, satId: number, userId = 0): Promise<PatientCycleRow[]> {
  if (!patId || !isDbConfigured()) return [];

  const result = await executeDRL<Record<string, unknown>>(
    'spCycOutComeExtDRL',
    buildParams('@PatID,@SatID,@QueryIndex,@UserId', [patId, satId || 0, 1, userId || 0])
  );
  const rows = result.recordset || [];
  if (!rows.length) return [];

  const commentsByCycle = new Map<string, string>();
  try {
    const history = await executeText<Record<string, unknown>>(
      `SELECT CycID, CycHComments
       FROM CycHistory
       WHERE PatID = @PatID AND SatID = @SatID`,
      [
        { name: '@PatID', value: patId },
        { name: '@SatID', value: satId || 0 },
      ]
    );
    for (const row of history.recordset || []) {
      const id = rowVal(row, 'CycID').trim();
      if (id) commentsByCycle.set(id, rowVal(row, 'CycHComments'));
    }
  } catch {
    /* history comments are optional */
  }

  return rows
    .map((row) => {
      const cycleId = rowVal(row, 'CycID', 'CycleID').trim();
      if (!cycleId) return null;
      const rawType = rowVal(row, 'CycOType', 'CycleType', 'CycType');
      const cycleType = normalizeCycleType(rawType);
      const monitoringSheet = parseMonitoringSheet(commentsByCycle.get(cycleId) || '');
      const monitoringLabel = getMonitoringSheetLabel(monitoringSheet);
      const typeLabel = monitoringLabel
        ? `${getCycleTypeLabel(cycleType)} - ${monitoringLabel}`
        : getCycleTypeLabel(cycleType) || rawType;
      const dateValue = row.CycODate ?? row.CycDate ?? row.CycleDate;
      return {
        cycleId,
        cycleType,
        typeLabel,
        cycleDate: formatSmartDate(dateValue),
        postTreatment: rowVal(row, 'CycOPostTreat', 'PostTreatment', 'CycOPostTreat'),
        advice: cycleType === 'FrozenOocytes' ? '' : rowVal(row, 'CycOAdvice', 'Advice'),
        monitoringSheet,
        sortKey: formatSmartDate(dateValue) ? String(dateValue) : '',
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ sortKey: _sortKey, ...row }) => row);
}
