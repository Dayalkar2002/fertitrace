import { isDbConfigured } from '@/lib/db/pool';
import { buildParams, executeDRL, executeText } from '@/lib/db/spExecutor';
import { formatSmartDate, rowVal } from '@/lib/db/row';
import {
  getCycleTypeLabel,
  getMonitoringSheetLabel,
  normalizeCycleType,
  parseMonitoringSheet,
} from '@/lib/cycle-utils';
import type { PatientCycleRow, CryoStockSummary } from '@/lib/types/cycle';

export function stripHtmlTags(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (!text) return '';
  return text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\r?\n\s*\r?\n/g, '\n')
    .trim();
}

export function getDemoCyclesForPatient(patId: number): PatientCycleRow[] {
  if (patId === 4 || patId === 101) {
    return [
      {
        cycleId: 'CY2600456',
        cycleType: 'IVF',
        typeLabel: 'Fresh IVF Cycle',
        cycleDate: '08/09/2026',
        postTreatment: '',
        advice: 'Active stimulation cycle',
        monitoringSheet: 'IVF',
      },
      {
        cycleId: 'CY2600123',
        cycleType: 'ICSI',
        typeLabel: 'ICSI Cycle',
        cycleDate: '15/06/2026',
        postTreatment: 'Completed',
        advice: 'Previous completed cycle',
        monitoringSheet: 'ICSI',
      },
      {
        cycleId: 'CY2600321',
        cycleType: 'FrozenEmbryos',
        typeLabel: 'Frozen Embryo Transfer (FET)',
        cycleDate: '22/07/2026',
        postTreatment: 'Completed',
        advice: 'FET cycle',
        monitoringSheet: 'FET',
      },
    ];
  }
  if (patId === 102) {
    return [
      {
        cycleId: 'CY2600102',
        cycleType: 'IUI',
        typeLabel: 'IUI Cycle',
        cycleDate: '22/07/2026',
        postTreatment: '',
        advice: 'Active cycle',
        monitoringSheet: 'IUI',
      },
    ];
  }
  if (patId === 201) {
    return [
      {
        cycleId: 'CY2600201',
        cycleType: 'FrozenEmbryos',
        typeLabel: 'Frozen Embryo Transfer (FET)',
        cycleDate: '30/08/2026',
        postTreatment: '',
        advice: 'Active cycle',
        monitoringSheet: 'FET',
      },
    ];
  }
  return [
    {
      cycleId: `CY2600${String(patId).padStart(3, '0')}`,
      cycleType: 'IVF',
      typeLabel: 'Fresh IVF Cycle',
      cycleDate: 'Active',
      postTreatment: '',
      advice: 'Active treatment cycle',
      monitoringSheet: 'IVF',
    },
  ];
}

export async function listPatientCycles(patId: number, satId: number, userId = 0): Promise<PatientCycleRow[]> {
  if (!patId) return [];
  if (!isDbConfigured()) return getDemoCyclesForPatient(patId);

  let rows: Record<string, unknown>[] = [];
  try {
    const result = await executeDRL<Record<string, unknown>>(
      'spCycOutComeExtDRL',
      buildParams('@PatID,@SatID,@QueryIndex,@UserId', [patId, satId || 0, 1, userId || 0])
    );
    rows = result.recordset || [];
  } catch {
    return getDemoCyclesForPatient(patId);
  }

  if (!rows.length) {
    return getDemoCyclesForPatient(patId);
  }

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
        postTreatment: stripHtmlTags(rowVal(row, 'CycOPostTreat', 'PostTreatment', 'CycOPostTreat')),
        advice: cycleType === 'FrozenOocytes' ? '' : stripHtmlTags(rowVal(row, 'CycOAdvice', 'Advice')),
        monitoringSheet,
        sortKey: formatSmartDate(dateValue) ? String(dateValue) : '',
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map(({ sortKey: _sortKey, ...row }) => row);
}

export async function getCryoStockSummary(patId: number, satId: number): Promise<CryoStockSummary> {
  const empty: CryoStockSummary = {
    etFrozen: 0,
    btFrozen: 0,
    totalFrozenOocytes: 0,
    miiFrozen: 0,
    miFrozen: 0,
    gvFrozen: 0,
  };
  if (!patId || !isDbConfigured()) return empty;

  try {
    // 1. ET Frozen (mirrors SMART CycleGrid.aspx.cs spGetFETDetails)
    let etFrozen = 0;
    try {
      const etRes = await executeDRL<Record<string, unknown>>(
        'spGetFETDetails',
        buildParams('@PatID,@SatID,@ETEDThawCycleID', [patId, satId || 0, '0'])
      );
      etFrozen = (etRes.recordset || []).length;
    } catch {
      // fallback
    }

    // 2. BT Frozen (mirrors SMART CycleGrid.aspx.cs spGetFBTDetails)
    let btFrozen = 0;
    try {
      const btRes = await executeDRL<Record<string, unknown>>(
        'spGetFBTDetails',
        buildParams('@PatID,@SatID,@BTBDThawCycleID', [patId, satId || 0, '0'])
      );
      btFrozen = (btRes.recordset || []).length;
    } catch {
      // fallback
    }

    // 3-6. Frozen Oocytes: Total, MII, MI, GV (mirrors SMART CycleGrid.aspx.cs spUpdateCycOocytesLocation)
    let totalFrozenOocytes = 0;
    let miiFrozen = 0;
    let miFrozen = 0;
    let gvFrozen = 0;
    try {
      const oocyteRes = await executeDRL<Record<string, unknown>>(
        'spUpdateCycOocytesLocation',
        buildParams(
          '@PatId,@SatId,@CycId,@OocytesID,@QueryIndex,@PostThaw,@ThawAction,@ThawCycleId,@ThawProcDoneBy,@ThawMediaUsed,@ThawProtocolUsed,@Source',
          [patId, satId || 0, '0', 0, 2, 0, 0, '0', '', 0, 0, '']
        )
      );
      const rows = oocyteRes.recordset || [];
      totalFrozenOocytes = rows.length;
      for (const row of rows) {
        const src = String(rowVal(row, 'Source', 'source')).trim().toLowerCase();
        if (src === 'metaphase ii' || src === 'mii') {
          miiFrozen++;
        } else if (src === 'metaphase i' || src === 'mi') {
          miFrozen++;
        } else if (src === 'gv') {
          gvFrozen++;
        }
      }
    } catch {
      // fallback
    }

    return {
      etFrozen,
      btFrozen,
      totalFrozenOocytes,
      miiFrozen,
      miFrozen,
      gvFrozen,
    };
  } catch {
    return empty;
  }
}
