import { executeDRL, executeText, buildParams } from '@/lib/db/spExecutor';

async function safeCount(sql: string, parameters: { name: string; value: unknown }[] = []): Promise<number> {
  try {
    const result = await executeText<Record<string, unknown>>(sql, parameters);
    return Number(result.recordset?.[0]?.cnt ?? 0) || 0;
  } catch {
    return 0;
  }
}

async function safeSpRows(procName: string, paramNames: string, values: unknown[]): Promise<Record<string, unknown>[]> {
  try {
    const result = await executeDRL<Record<string, unknown>>(procName, buildParams(paramNames, values));
    return result.recordset || [];
  } catch {
    return [];
  }
}

export async function getDashboardSummary({ patId = 0, satId = 0, userId = 0 } = {}) {
  const [
    patients,
    satellites,
    cycles,
    iui,
    ivf,
    et,
    bt,
    oocytes,
    embryos,
    cryo,
    witness,
    satelliteRows,
    recentCycles,
    recentIui,
  ] = await Promise.all([
    safeCount('SELECT COUNT(*) AS cnt FROM PatientMaster'),
    safeCount('SELECT COUNT(*) AS cnt FROM SatelliteMaster'),
    safeCount('SELECT COUNT(*) AS cnt FROM CycOutCome'),
    safeCount('SELECT COUNT(*) AS cnt FROM IUIOutCome'),
    safeCount('SELECT COUNT(*) AS cnt FROM IVFOutCome'),
    safeCount('SELECT COUNT(*) AS cnt FROM ETOutCome'),
    safeCount('SELECT COUNT(*) AS cnt FROM BTOutCome'),
    safeCount('SELECT ISNULL(SUM(ISNULL(CycMCRDFTLeft, 0) + ISNULL(CycMCRDFTRight, 0)), 0) AS cnt FROM CycMonitoringChartRemDay'),
    safeCount('SELECT (SELECT COUNT(*) FROM CycSurvivalReport) + (SELECT COUNT(*) FROM CycAnalysis) AS cnt'),
    safeCount('SELECT (SELECT COUNT(*) FROM CycSelfSemenFreezing) + (SELECT COUNT(*) FROM SemenDonor) AS cnt'),
    safeCount('SELECT (SELECT COUNT(*) FROM ConsentDownloadLog) + (SELECT COUNT(*) FROM CycOutCome) + (SELECT COUNT(*) FROM CycAnalysis) AS cnt'),
    safeSpRows('spSatelliteMasterExtDRL', '@SatID,@QueryIndex', [0, 1]),
    patId
      ? safeSpRows('spCycOutComeExtDRL', '@PatID,@SatID,@QueryIndex,@UserId', [
          Number(patId),
          Number(satId) || 0,
          1,
          Number(userId) || 0,
        ])
      : Promise.resolve([]),
    patId
      ? safeSpRows('spIUIOutComeExtDRL', '@PatID,@SatID,@QueryIndex,@UserId', [
          Number(patId),
          Number(satId) || 0,
          1,
          Number(userId) || 0,
        ])
      : Promise.resolve([]),
  ]);

  const satelliteCount = satellites || satelliteRows.length;

  return {
    kpis: {
      patients,
      satellites: satelliteCount,
      cycles,
      iui,
      ivf,
      et,
      bt,
      oocytes,
      embryos,
      cryo,
      witness,
    },
    recentCycles: recentCycles.slice(0, 8).map((row) => ({
      id: String(row.CycID ?? row.CycleID ?? row.ID ?? ''),
      date: row.CycDateOfCreation ?? row.CycDate ?? row.DateOfCreation ?? null,
      type: String(row.CycType ?? row.CycleType ?? row.Type ?? 'Cycle'),
      outcome: String(row.CycOutCome ?? row.Outcome ?? ''),
      raw: row,
    })),
    recentIui: recentIui.slice(0, 8).map((row) => ({
      id: String(row.IUIID ?? row.IuiID ?? row.ID ?? ''),
      date: row.IUIODateOfCreation ?? row.IUIODate ?? row.DateOfCreation ?? null,
      outcome: String(row.IUIOOutcome ?? row.Outcome ?? ''),
      raw: row,
    })),
    modules: [
      { key: 'iui', label: 'IUI', href: '/iui', count: iui },
      { key: 'cycle', label: 'Cycles', href: '/cycle/entry', count: cycles },
      { key: 'ivf', label: 'IVF', href: '/ivf', count: ivf },
      { key: 'icsi', label: 'ICSI', href: '/icsi', count: 0 },
      { key: 'et', label: 'ET', href: '/et', count: et },
      { key: 'bt', label: 'BT', href: '/bt', count: bt },
    ],
  };
}
