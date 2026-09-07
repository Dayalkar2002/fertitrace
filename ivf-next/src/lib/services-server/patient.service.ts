import { executeDRL, buildParams, executeText } from '@/lib/db/spExecutor';

const SATELLITE_SP = 'spSatelliteMasterExtDRL';
const PATIENT_SP = 'spPatientMasterExtDRL';
const PATIENT_SEARCH_SP = 'spPatientMasterSearch';

export interface PatientListItem {
  id: number;
  uhid: string;
  name: string;
  partner: string;
  age: number | null;
  gender: string;
  aadhar: string;
  satelliteId: number | null;
  category: string;
  mobile?: string;
  phone?: string;
  raw?: Record<string, unknown>;
}

export interface PatientDetailItem extends PatientListItem {
  email: string;
  mobile: string;
  phone: string;
  address: string;
  city: string;
}

function mapPatientListRow(row: Record<string, unknown>): PatientListItem {
  const name = [row.Name ?? row.PatName, row.PatCategory].filter(Boolean).join(' ').trim();
  const age = row.PatAge ?? row.patage ?? row.Age ?? null;
  const mobile = String(
    row.patmobileno ??
    row.PatMobileNo ??
    row.PatMobile ??
    row.MobileNo ??
    row.mobile ??
    row.PatPhoneNo ??
    row.patphoneno ??
    row.PhoneNo ??
    ''
  ).trim();
  const phone = String(
    row.PatPhoneNo ??
    row.patphoneno ??
    row.PhoneNo ??
    row.patmobileno ??
    row.PatMobileNo ??
    ''
  ).trim();

  return {
    id: Number(row.ID ?? row.PatID),
    uhid: String(row.PatRefNo ?? row.RefNo ?? row.PatID ?? '').trim(),
    name,
    partner: String(row.PatHusbName ?? row.HusbName ?? ''),
    age: age !== null && age !== undefined && age !== '' ? Number(age) : null,
    gender: String(row.PatGender ?? row.Patcategory ?? row.Gender ?? ''),
    aadhar: String(row.PatAdhar ?? row.PatAadh ?? ''),
    satelliteId: row.SatID ?? row.SatId ? Number(row.SatID ?? row.SatId) : null,
    category: String(row.PatCategory ?? ''),
    mobile,
    phone,
    raw: row,
  };
}

function mapPatientDetailRow(row: Record<string, unknown>): PatientDetailItem {
  const age = row.PatAge ?? row.patage ?? row.Age ?? null;
  const mobile = String(
    row.patmobileno ??
    row.PatMobileNo ??
    row.PatMobile ??
    row.MobileNo ??
    row.mobile ??
    row.PatPhoneNo ??
    row.patphoneno ??
    row.PhoneNo ??
    ''
  ).trim();
  const phone = String(
    row.PatPhoneNo ??
    row.patphoneno ??
    row.PhoneNo ??
    row.patmobileno ??
    row.PatMobileNo ??
    ''
  ).trim();

  return {
    id: Number(row.PatID ?? row.ID),
    uhid: String(row.PatRefNo ?? row.RefNo ?? row.PatID ?? '').trim(),
    name: [row.PatName ?? row.Name, row.PatCategory].filter(Boolean).join(' ').trim(),
    partner: String(row.PatHusbName ?? row.HusbName ?? ''),
    age: age !== null && age !== undefined && age !== '' ? Number(age) : null,
    gender: String(row.PatGender ?? row.Patcategory ?? ''),
    aadhar: String(row.PatAdhar ?? ''),
    satelliteId: row.SatID ?? row.SatId ? Number(row.SatID ?? row.SatId) : null,
    email: String(row.PatEmail ?? ''),
    mobile,
    phone,
    address: String(row.PatAddress ?? ''),
    city: String(row.PatCity ?? ''),
    category: String(row.PatCategory ?? ''),
    raw: row,
  };
}

export async function getSatellites() {
  const params = buildParams('@SatID,@QueryIndex', [0, 1]);
  const result = await executeDRL<Record<string, unknown>>(SATELLITE_SP, params);
  const rows = result.recordset || [];

  return rows.map((row) => ({
    id: Number(row.ID ?? row.SatID),
    name: String(row.Name ?? row.SatName ?? ''),
    shortName: String(row.SatShortName ?? ''),
    raw: row,
  }));
}

export async function listPatientsBySatellite(satelliteId: number): Promise<PatientListItem[]> {
  const params = buildParams('@PatID,@SatID,@QueryIndex', [0, Number(satelliteId), 3]);
  const result = await executeDRL<Record<string, unknown>>(PATIENT_SP, params);
  const rows = result.recordset || [];
  return rows.map(mapPatientListRow);
}

export async function getPatientById(patientId: number, satelliteId: number): Promise<PatientDetailItem | null> {
  const params = buildParams('@PatID,@SatID,@QueryIndex', [Number(patientId), Number(satelliteId), 2]);
  const result = await executeDRL<Record<string, unknown>>(PATIENT_SP, params);
  const rows = result.recordset || [];

  if (!rows.length) {
    return null;
  }

  return mapPatientDetailRow(rows[0]);
}

export async function searchPatients({ search = '', satelliteId = 0, refId = 0 }: { search?: string; satelliteId?: number; refId?: number }) {
  const term = search.trim();
  const params = buildParams('@PatName,@PatHusbName,@PatAadh,@SatID,@RefID', [
    term,
    term,
    term,
    Number(satelliteId) || 0,
    Number(refId) || 0,
  ]);

  const result = await executeDRL<Record<string, unknown>>(PATIENT_SEARCH_SP, params);
  const rows = result.recordset || [];
  return rows.map(mapPatientDetailRow);
}

export async function getPatientAadhar(patientId: number): Promise<string> {
  if (!patientId) return '';
  const result = await executeText<Record<string, unknown>>(
    "SELECT LTRIM(RTRIM(ISNULL(PatAdhar, ''))) AS PatAdhar FROM PatientMaster WHERE PatID = @PatID",
    [{ name: '@PatID', value: Number(patientId) }]
  );
  return String(result.recordset?.[0]?.PatAdhar ?? '').trim();
}

export async function getDonorLockedRecipientPatId(donorPatId: number): Promise<number> {
  const donorAadhar = await getPatientAadhar(donorPatId);
  if (!donorAadhar) return 0;

  const result = await executeText<Record<string, unknown>>(
    `SELECT TOP 1 r.CycRURcptPatID
     FROM CycRetrieval r
     INNER JOIN PatientMaster donor ON r.PatID = donor.PatID
     WHERE r.CycRUToRcpt = 1
       AND r.CycRURcptPatID IS NOT NULL
       AND r.CycRURcptPatID > 0
       AND LTRIM(RTRIM(ISNULL(donor.PatAdhar, ''))) = @DonorAadhar
     ORDER BY r.CycDateOfCreation DESC`,
    [{ name: '@DonorAadhar', value: donorAadhar }]
  );

  return Number(result.recordset?.[0]?.CycRURcptPatID) || 0;
}

export async function checkOocyteDonorAadhar({ donorPatId, recipientPatId, excludeCycId = '' }: { donorPatId: number; recipientPatId: number; excludeCycId?: string }) {
  const params = buildParams('@DonorPatID,@RecipientPatID,@ExcludeCycID', [
    Number(donorPatId),
    Number(recipientPatId),
    excludeCycId || '',
  ]);
  const result = await executeDRL<Record<string, unknown>>('spCheckOocyteDonorAadhar', params);
  const row = result.recordset?.[0] || {};
  const allowedValue = String(row.IsAllowed ?? '1');
  return {
    isAllowed: allowedValue === '1' || allowedValue.toLowerCase() === 'true',
    message: String(row.Message ?? ''),
    donorAadhar: String(row.DonorAadhar ?? ''),
    recipientAadhar: String(row.RecipientAadhar ?? ''),
    mappedRecipientName: String(row.MappedRecipientName ?? ''),
  };
}
