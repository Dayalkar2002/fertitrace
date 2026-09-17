import { buildParams, executeDRL, executeText } from '@/lib/db/spExecutor';
import { formatSmartDate, parseFormDate, rowNum, rowVal, toInputDate } from '@/lib/db/row';
import type { SemenDonorDetail, SemenDonorLab, SemenDonorListRow, SemenDonorSaveInput } from '@/lib/types/cryo';

export type { SemenDonorDetail, SemenDonorLab, SemenDonorListRow, SemenDonorSaveInput };

const SEMEN_DONOR_SP = 'spSemenDonor';
const DONOR_LAB_SP = 'spDonorLabMasterExtDRL';
const SEMEN_DONOR_PARAMS =
  '@DonorIDSrNo,@DonorID,@Date,@SemenQty,@SemenCount,@SemenMotility,@SemenProgMotility,@SemenWBC,@SemenRBC,@BloodGroup,@Age,@Looks,@Weight,@Height,@FacialFeature,@HairColor,@EyesColor,@SkinTone,@CongenitalDeformities,@GeneticallyAcquiredDisease,@ChronicIllness,@DiseaseRelative,@DiseaseFamily,@Habits,@Qualification,@MaritalStatus,@WorkingStatus,@BloodChemistryPanel,@CBC,@Urinalysis,@Karytyping,@HIV,@VDRL,@HCV,@Thalesemia,@QuarantinedPeriod,@Remarks,@Location,@HbsAg,@DonorLabID,@QueryIndex';

function emptyDonorValues(queryIndex: number, donorIdSrNo = 0, date = new Date()): unknown[] {
  return [
    donorIdSrNo,
    '',
    date,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'NO',
    'NO',
    'NO',
    'NO',
    'NO',
    'NO',
    '',
    '',
    '',
    'WNL',
    'WNL',
    'WNL',
    'Normal Chromosome Complements',
    'Negative',
    'Negative',
    'Negative',
    'Negative',
    '> 6 Months',
    '',
    '',
    'Negative',
    0,
    queryIndex,
  ];
}

function saveValues(input: SemenDonorSaveInput, queryIndex: number): unknown[] {
  return [
    input.donorIdSrNo || 0,
    input.donorId ?? '',
    parseFormDate(input.date),
    input.semenQty ?? '',
    input.semenCount ?? '',
    input.semenMotility ?? '',
    input.semenProgMotility ?? '',
    input.semenWbc ?? '',
    input.semenRbc ?? '',
    input.bloodGroup ?? '',
    input.age ?? '',
    input.looks ?? '',
    input.weight ?? '',
    input.height ?? '',
    input.facialFeature ?? '',
    input.hairColor ?? '',
    input.eyesColor ?? '',
    input.skinTone ?? '',
    input.congenitalDeformities ?? 'NO',
    input.geneticallyAcquiredDisease ?? 'NO',
    input.chronicIllness ?? 'NO',
    input.diseaseRelative ?? 'NO',
    input.diseaseFamily ?? 'NO',
    input.habits ?? 'NO',
    input.qualification ?? '',
    input.maritalStatus ?? '',
    input.workingStatus ?? '',
    input.bloodChemistryPanel ?? 'WNL',
    input.cbc ?? 'WNL',
    input.urinalysis ?? 'WNL',
    input.karytyping ?? 'Normal Chromosome Complements',
    input.hiv ?? 'Negative',
    input.vdrl ?? 'Negative',
    input.hcv ?? 'Negative',
    input.thalesemia ?? 'Negative',
    input.quarantinedPeriod ?? '> 6 Months',
    input.remarks ?? '',
    input.location ?? '',
    input.hbsAg ?? 'Negative',
    input.donorLabId || 0,
    queryIndex,
  ];
}

function mapListRow(row: Record<string, unknown>): SemenDonorListRow {
  const dateRaw = row.sdDate ?? row.SdDate ?? row.sddate;
  return {
    donorIdSrNo: rowNum(row, 'sdDonorIDSrno', 'sdDonorIDSrNo', 'DonorIDSrNo'),
    donorId: rowVal(row, 'sdDonorID', 'DonorID'),
    date: formatSmartDate(dateRaw),
    thawId: rowVal(row, 'IUIThawID', 'iuiThawID'),
    location: rowVal(row, 'sdLocation', 'Location', 'sdlocation'),
  };
}

function mapDetail(row: Record<string, unknown>): SemenDonorDetail {
  const dateRaw = row.sdDate ?? row.SdDate ?? row.sddate;
  return {
    donorIdSrNo: rowNum(row, 'sdDonorIDSrno', 'sdDonorIDSrNo', 'DonorIDSrNo'),
    donorId: rowVal(row, 'sdDonorID', 'DonorID'),
    date: toInputDate(dateRaw),
    dateDisplay: formatSmartDate(dateRaw),
    semenQty: rowVal(row, 'sdSemenQty'),
    semenCount: rowVal(row, 'sdSemenCount'),
    semenMotility: rowVal(row, 'sdSemenMotility'),
    semenProgMotility: rowVal(row, 'sdSemenProgMotility'),
    grade1: rowVal(row, 'sdGrade1'),
    grade2: rowVal(row, 'sdGrade2'),
    grade3: rowVal(row, 'sdGrade3'),
    grade4: rowVal(row, 'sdGrade4'),
    semenWbc: rowVal(row, 'sdSemenWBC'),
    semenRbc: rowVal(row, 'sdSemenRBC'),
    bloodGroup: rowVal(row, 'sdBloodGroup'),
    age: rowVal(row, 'sdAge'),
    looks: rowVal(row, 'sdLooks'),
    weight: rowVal(row, 'sdWeight'),
    height: rowVal(row, 'sdHeight'),
    facialFeature: rowVal(row, 'sdFacialFeature'),
    hairColor: rowVal(row, 'sdHairColor'),
    eyesColor: rowVal(row, 'sdEyesColor'),
    skinTone: rowVal(row, 'sdSkinTone'),
    congenitalDeformities: rowVal(row, 'sdCongenitalDeformities'),
    geneticallyAcquiredDisease: rowVal(row, 'sdGeneticallyAcquiredDisease'),
    chronicIllness: rowVal(row, 'sdChronicIllness'),
    diseaseRelative: rowVal(row, 'sdDiseaseRelative'),
    diseaseFamily: rowVal(row, 'sdDiseaseFamily'),
    habits: rowVal(row, 'sdHabits'),
    qualification: rowVal(row, 'sdQualification'),
    maritalStatus: rowVal(row, 'sdMaritalStatus'),
    workingStatus: rowVal(row, 'sdWorkingStatus'),
    bloodChemistryPanel: rowVal(row, 'sdBloodChemistryPanel'),
    cbc: rowVal(row, 'sdCBC'),
    urinalysis: rowVal(row, 'sdUrinalysis'),
    karytyping: rowVal(row, 'sdKarytyping'),
    hiv: rowVal(row, 'sdHIV'),
    vdrl: rowVal(row, 'sdVDRL'),
    hcv: rowVal(row, 'sdHCV'),
    thalesemia: rowVal(row, 'sdThalesemia'),
    quarantinedPeriod: rowVal(row, 'sdQuarantinedPeriod'),
    remarks: rowVal(row, 'sdRemarks'),
    location: rowVal(row, 'sdLocation'),
    hbsAg: rowVal(row, 'sdHbsAg'),
    donorLabId: rowNum(row, 'sdDonorLabID', 'DonorLabID'),
    aadhar: rowVal(row, 'sdAadhar', 'sdAdhar'),
    thawId: rowVal(row, 'IUIThawID'),
  };
}

async function enrichGradeAadhar(row: Record<string, unknown>, donorSrNo: number): Promise<void> {
  if (donorSrNo <= 0) return;
  try {
    const extra = await executeText<Record<string, unknown>>(
      `SELECT sdGrade1, sdGrade2, sdGrade3, sdGrade4, sdAadhar, sdSemenProgMotility
       FROM SemenDonor WHERE sdDonorIDSrno = @SrNo`,
      [{ name: '@SrNo', value: donorSrNo }]
    );
    const src = extra.recordset?.[0];
    if (!src) return;
    for (const key of ['sdGrade1', 'sdGrade2', 'sdGrade3', 'sdGrade4', 'sdAadhar', 'sdSemenProgMotility']) {
      const value = src[key];
      if (value !== undefined && value !== null && value !== '') {
        row[key] = value;
      }
    }
  } catch {
    // Extra grade/aadhar columns are not present on every database.
  }
}

export async function listDonorLabs(): Promise<SemenDonorLab[]> {
  const result = await executeDRL<Record<string, unknown>>(
    DONOR_LAB_SP,
    buildParams('@SatID,@QueryIndex', [0, 1])
  );
  return (result.recordset || []).map((row) => ({
    id: rowNum(row, 'ID', 'id', 'DonorLabID'),
    name: rowVal(row, 'Name', 'name', 'DonorLabName'),
  }));
}

export async function listSemenDonors(): Promise<SemenDonorListRow[]> {
  const result = await executeDRL<Record<string, unknown>>(
    SEMEN_DONOR_SP,
    buildParams(SEMEN_DONOR_PARAMS, emptyDonorValues(1))
  );
  return (result.recordset || []).map(mapListRow);
}

export async function getSemenDonor(donorIdSrNo: number): Promise<SemenDonorDetail | null> {
  if (!donorIdSrNo) return null;
  const result = await executeDRL<Record<string, unknown>>(
    SEMEN_DONOR_SP,
    buildParams(SEMEN_DONOR_PARAMS, emptyDonorValues(2, donorIdSrNo))
  );
  const row = result.recordset?.[0];
  if (!row) return null;
  await enrichGradeAadhar(row, donorIdSrNo);
  return mapDetail(row);
}

export async function findDonorSrNoByAadhar(aadhar: string, excludeSrNo = 0): Promise<number> {
  const trimmed = aadhar.trim();
  if (!trimmed) return 0;
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 sdDonorIDSrno
       FROM SemenDonor
       WHERE LTRIM(RTRIM(ISNULL(sdAadhar, ''))) = @Aadhar
         AND (@ExcludeSrNo = 0 OR sdDonorIDSrno <> @ExcludeSrNo)`,
      [
        { name: '@Aadhar', value: trimmed },
        { name: '@ExcludeSrNo', value: excludeSrNo },
      ]
    );
    return rowNum(result.recordset?.[0] || {}, 'sdDonorIDSrno');
  } catch {
    return 0;
  }
}

export async function searchSemenDonorByAadhar(aadhar: string): Promise<SemenDonorDetail | null> {
  const trimmed = aadhar.trim();
  if (!trimmed) return null;
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 sdDonorIDSrno
       FROM SemenDonor
       WHERE LTRIM(RTRIM(ISNULL(sdAadhar, ''))) = @Aadhar
          OR LTRIM(RTRIM(ISNULL(sdAadhar, ''))) LIKE '%' + @Aadhar + '%'
       ORDER BY sdDonorIDSrno DESC`,
      [{ name: '@Aadhar', value: trimmed }]
    );
    const srNo = rowNum(result.recordset?.[0] || {}, 'sdDonorIDSrno');
    if (!srNo) return null;
    return getSemenDonor(srNo);
  } catch {
    return null;
  }
}

async function resolveDonorSrNoAfterSave(donorId: string, existingSrNo: number): Promise<number> {
  if (existingSrNo > 0) return existingSrNo;
  if (!donorId.trim()) return 0;
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT TOP 1 sdDonorIDSrno FROM SemenDonor WHERE sdDonorID = @DonorID ORDER BY sdDonorIDSrno DESC`,
      [{ name: '@DonorID', value: donorId.trim() }]
    );
    return rowNum(result.recordset?.[0] || {}, 'sdDonorIDSrno');
  } catch {
    return 0;
  }
}

async function saveGradeAndAadhar(input: SemenDonorSaveInput, donorSrNo: number, isUpdate: boolean): Promise<void> {
  if (donorSrNo <= 0) return;
  try {
    const aadhar = isUpdate ? input.aadhar : input.aadhar.trim();
    await executeText(
      `UPDATE SemenDonor
       SET sdGrade1 = @G1, sdGrade2 = @G2, sdGrade3 = @G3, sdGrade4 = @G4,
           sdAadhar = @Aadhar, sdSemenProgMotility = @ProgMotility
       WHERE sdDonorIDSrno = @SrNo`,
      [
        { name: '@G1', value: input.grade1 ?? '0' },
        { name: '@G2', value: input.grade2 ?? '0' },
        { name: '@G3', value: input.grade3 ?? '0' },
        { name: '@G4', value: input.grade4 ?? '0' },
        { name: '@Aadhar', value: aadhar },
        { name: '@ProgMotility', value: input.semenProgMotility ?? '' },
        { name: '@SrNo', value: donorSrNo },
      ]
    );
  } catch {
    // Grade/aadhar columns may be missing on older databases.
  }
}

export async function saveSemenDonor(input: SemenDonorSaveInput): Promise<{
  duplicate?: boolean;
  detail: SemenDonorDetail | null;
  list: SemenDonorListRow[];
}> {
  const aadhar = (input.aadhar || '').trim();
  if (!aadhar) {
    throw Object.assign(new Error('Enter Donor Aadhar first.'), { status: 400 });
  }
  if (!(input.location || '').trim()) {
    throw Object.assign(new Error('Please enter Location.'), { status: 400 });
  }

  const isUpdate = (input.donorIdSrNo || 0) > 0;
  if (!isUpdate) {
    const existingSrNo = await findDonorSrNoByAadhar(aadhar, 0);
    if (existingSrNo > 0) {
      const detail = await getSemenDonor(existingSrNo);
      return { duplicate: true, detail, list: await listSemenDonors() };
    }
  }

  const queryIndex = isUpdate ? 12 : 11;
  await executeDRL(SEMEN_DONOR_SP, buildParams(SEMEN_DONOR_PARAMS, saveValues(input, queryIndex)));
  const donorSrNo = await resolveDonorSrNoAfterSave(input.donorId, input.donorIdSrNo || 0);
  await saveGradeAndAadhar({ ...input, aadhar }, donorSrNo, isUpdate);
  const detail = donorSrNo > 0 ? await getSemenDonor(donorSrNo) : null;
  return { detail, list: await listSemenDonors() };
}

export async function deleteSemenDonor(donorIdSrNo: number): Promise<SemenDonorListRow[]> {
  if (!donorIdSrNo) {
    throw Object.assign(new Error('Donor Id SrNo is required.'), { status: 400 });
  }
  await executeDRL(SEMEN_DONOR_SP, buildParams(SEMEN_DONOR_PARAMS, emptyDonorValues(13, donorIdSrNo)));
  return listSemenDonors();
}
