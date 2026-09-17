import { buildParams, executeDRL, executeText } from '@/lib/db/spExecutor';
import { rowVal } from '@/lib/db/row';

export interface SpermIdOption {
  id: string;
  label: string;
  location: string;
}

export interface SpermLocationDetails {
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
  epith: string;
  round: string;
  recovery: string;
  hams: boolean;
  timeOfLiq: string;
  agglutination: string;
  antibodies: string;
  velocity: string;
  ph: string;
  normomorphs1: string;
  normomorphs2: string;
  linearity: string;
  appearanceId: string;
  colourId: string;
  viscosityId: string;
  liqId: string;
}

function isHusbandSperm(spermId: string) {
  return /husb/i.test(spermId);
}

function isDonorSperm(spermId: string) {
  return /donor/i.test(spermId) && !/husb/i.test(spermId);
}

export function needsFrozenIdList(spermId: string, semenType: string) {
  if (isDonorSperm(spermId)) return true;
  return isHusbandSperm(spermId) && /^frozen$/i.test(semenType);
}

export function idLocationQueryType(spermId: string, semenType: string) {
  if (isHusbandSperm(spermId) && /^frozen$/i.test(semenType)) return 'Husband Cryo';
  return spermId.trim();
}

function mapIdRows(rows: Record<string, unknown>[]): SpermIdOption[] {
  const seen = new Set<string>();
  const options: SpermIdOption[] = [];
  for (const row of rows) {
    const id = rowVal(row, 'Id', 'ID', 'CycSelfSemenFreezingID', 'DonorID').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const label = rowVal(row, 'IdLocation', 'IDLocation', 'Location').trim() || id;
    const location = label.startsWith(`${id}_`) ? label.slice(id.length + 1) : rowVal(row, 'CycSSLocation', 'Location');
    options.push({ id, label, location });
  }
  return options;
}

async function listHusbandFrozenIds(patId: number, satId: number): Promise<SpermIdOption[]> {
  const result = await executeText<Record<string, unknown>>(
    `SELECT LTRIM(RTRIM(ISNULL(f.CycSelfSemenFreezingID, ''))) AS Id,
            LTRIM(RTRIM(ISNULL(f.CycSelfSemenFreezingID, '')))
              + CASE WHEN LTRIM(RTRIM(ISNULL(f.CycSSLocation, ''))) <> ''
                     THEN '_' + LTRIM(RTRIM(f.CycSSLocation))
                     ELSE '' END AS IdLocation,
            LTRIM(RTRIM(ISNULL(f.CycSSLocation, ''))) AS CycSSLocation
     FROM CycSelfSemenFreezing f
     WHERE f.PatID = @PatID
       AND (@SatID = 0 OR f.SatID = @SatID)
       AND LTRIM(RTRIM(ISNULL(f.CycSelfSemenFreezingID, ''))) <> ''
     ORDER BY f.CycSSCreationDate DESC`,
    buildParams('@PatID,@SatID', [patId, satId])
  );
  return mapIdRows(result.recordset || []);
}

async function listFromGetIdLocation(
  spermType: string,
  patId: number,
  satId: number,
  thawId: string
): Promise<SpermIdOption[]> {
  try {
    const result = await executeDRL<Record<string, unknown>>(
      'getIDLoction',
      buildParams('@SpermID,@PatID,@SatId,@IUIThawID,@IUIAFreezingId', [
        spermType,
        patId,
        satId,
        thawId || 'New',
        '',
      ])
    );
    return mapIdRows(result.recordset || []);
  } catch {
    const result = await executeDRL<Record<string, unknown>>(
      'getIDLoction',
      buildParams('@SpermID,@PatID,@SatId,@IUIThawID', [spermType, patId, satId, thawId || 'New'])
    );
    return mapIdRows(result.recordset || []);
  }
}

export async function listSpermIdLocations(input: {
  spermId: string;
  semenType: string;
  patId: number;
  satId: number;
  thawId?: string;
}): Promise<SpermIdOption[]> {
  const spermId = input.spermId.trim();
  const semenType = input.semenType.trim() || 'Fresh';
  if (!needsFrozenIdList(spermId, semenType)) return [];
  if (isHusbandSperm(spermId) && /^frozen$/i.test(semenType)) {
    if (!input.patId) return [];
    return listHusbandFrozenIds(input.patId, input.satId);
  }
  return listFromGetIdLocation(idLocationQueryType(spermId, semenType) || 'Donor', input.patId, input.satId, input.thawId || 'New');
}

function truthyHams(value: string) {
  const text = value.trim().toLowerCase();
  return text === '1' || text === 'true' || text === 'yes';
}

export async function getSpermLocationDetails(id: string, spermType: string): Promise<SpermLocationDetails | null> {
  if (!id || id === '0' || /^select$/i.test(id) || !spermType) return null;
  const result = await executeDRL<Record<string, unknown>>(
    'getLoationDetails',
    buildParams('@IdLocation,@SpermType', [id, spermType])
  );
  const row = result.recordset?.[0];
  if (!row) return null;
  return {
    vol: rowVal(row, 'Vol'),
    sperms: rowVal(row, 'Sperms'),
    motility: rowVal(row, 'Motility'),
    progMotility: rowVal(row, 'ProgMotility'),
    grade1: rowVal(row, 'Grade1'),
    grade2: rowVal(row, 'Grade2'),
    grade3: rowVal(row, 'Grade3'),
    grade4: rowVal(row, 'Grade4'),
    wbc: rowVal(row, 'WBC'),
    rbc: rowVal(row, 'RBC'),
    epith: rowVal(row, 'ECell'),
    round: rowVal(row, 'RCell'),
    recovery: rowVal(row, 'Recovery'),
    hams: truthyHams(rowVal(row, 'Hams')),
    timeOfLiq: rowVal(row, 'TimeofLique', 'TimeOfLiq'),
    agglutination: rowVal(row, 'Agglutination'),
    antibodies: rowVal(row, 'Antibodies'),
    velocity: rowVal(row, 'Velocity'),
    ph: rowVal(row, 'pH', 'PH'),
    normomorphs1: rowVal(row, 'Normomorphs1'),
    normomorphs2: rowVal(row, 'Normomorphs2'),
    linearity: rowVal(row, 'Linerity', 'Linearity'),
    appearanceId: rowVal(row, 'AppID'),
    colourId: rowVal(row, 'ColID'),
    viscosityId: rowVal(row, 'ViscoID'),
    liqId: rowVal(row, 'LiqID'),
  };
}
