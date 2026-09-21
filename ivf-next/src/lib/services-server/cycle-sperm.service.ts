import { buildParams, executeText } from '@/lib/db/spExecutor';
import { rowVal } from '@/lib/db/row';

export interface CycleAnalysisSemenDetails {
  analysisId: string;
  spermTypeName: string;
  freezingId: string;
  vol: string;
  sperms: string;
  motility: string;
  progMotility: string;
  grade1: string;
  grade2: string;
  grade3: string;
  grade4: string;
  wbc: string;
  rbc: string;
  source: 'analysis';
}

function pick(row: Record<string, unknown>, afterKey: string, beforeKey: string) {
  return rowVal(row, afterKey) || rowVal(row, beforeKey);
}

function isMeaningful(row: Record<string, unknown>) {
  const keys = [
    'CycAAVol',
    'CycAASperms',
    'CycAAMotility',
    'CycAAProgMotility',
    'CycABVol',
    'CycABSperms',
    'CycABMotility',
    'CycABProgMotility',
    'CycAFreezingId',
  ];
  return keys.some((key) => {
    const value = rowVal(row, key).trim();
    return value !== '' && value !== '0';
  });
}

export async function getLatestCycleAnalysisSemen(
  patId: number,
  cycleId: string
): Promise<CycleAnalysisSemenDetails | null> {
  if (!patId || !cycleId) return null;
  const result = await executeText<Record<string, unknown>>(
    `SELECT TOP 1 a.*,
            LTRIM(RTRIM(ISNULL(s.CommName, ''))) AS SpermTypeName
     FROM CycAnalysis a
     LEFT JOIN CommonMaster s ON a.CycASpermID = s.CommID
     WHERE a.CycID = @CycID AND a.PatID = @PatID
     ORDER BY a.CycAID DESC`,
    buildParams('@CycID,@PatID', [cycleId.trim(), patId])
  );
  const row = result.recordset?.[0];
  if (!row || !isMeaningful(row)) return null;
  return {
    analysisId: rowVal(row, 'CycAID'),
    spermTypeName: rowVal(row, 'SpermTypeName'),
    freezingId: rowVal(row, 'CycAFreezingId') || 'Fresh',
    vol: pick(row, 'CycAAVol', 'CycABVol'),
    sperms: pick(row, 'CycAASperms', 'CycABSperms'),
    motility: pick(row, 'CycAAMotility', 'CycABMotility'),
    progMotility: pick(row, 'CycAAProgMotility', 'CycABProgMotility'),
    grade1: pick(row, 'CycAAGrade1', 'CycABGrade1'),
    grade2: pick(row, 'CycAAGrade2', 'CycABGrade2'),
    grade3: pick(row, 'CycAAGrade3', 'CycABGrade3'),
    grade4: pick(row, 'CycAAGrade4', 'CycABGrade4'),
    wbc: pick(row, 'CycAAWBC', 'CycABWBC'),
    rbc: pick(row, 'CycAARBC', 'CycABRBC'),
    source: 'analysis',
  };
}
