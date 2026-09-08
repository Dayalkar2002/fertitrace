import { executeDRL, executeDML, buildParams, executeText } from '@/lib/db/spExecutor';
import { getCommonMasterByCatId } from './master-registry';

const COMMON_SP = 'spCommonMaster';
const PATIENT_SP = 'spPatientMaster';
const DOCTOR_SP = 'spDoctorMaster';
const DOCTOR_EXT_SP = 'spDoctorMasterExtDRL';
const SATELLITE_SP = 'spSatelliteMaster';
const SATELLITE_EXT_SP = 'spSatelliteMasterExtDRL';
const USER_SP = 'spUserMaster';

function mapLookupRow(row: Record<string, unknown>) {
  return {
    id: Number(row.ID ?? row.CommID ?? row.DocID ?? row.SatID ?? row.UserID),
    name: String(row.Name ?? row.CommName ?? row.DocName ?? row.SatName ?? row.UserName ?? ''),
    raw: row,
  };
}

function mapCommonRow(row: Record<string, unknown>) {
  return {
    id: Number(row.ID ?? row.CommID),
    name: String(row.Name ?? row.CommName ?? ''),
    raw: row,
  };
}

export async function listCommonMaster(catId: number) {
  const params = buildParams('@CommID,@commName,@CatID,@QueryIndex', [0, '', Number(catId), 1]);
  const result = await executeDRL<Record<string, unknown>>(COMMON_SP, params);
  return (result.recordset || []).map(mapCommonRow);
}

export async function saveCommonMaster(catId: number, { id = 0, name, action = 'insert' }: { id?: number; name?: string; action?: 'insert' | 'update' | 'delete' }) {
  const queryIndexMap = { insert: 11, update: 12, delete: 13 };
  const queryIndex = queryIndexMap[action];
  if (!queryIndex) {
    throw new Error('Invalid action. Use insert, update, or delete.');
  }

  const params = buildParams('@CommID,@commName,@CatID,@QueryIndex', [
    Number(id) || 0,
    name ?? '',
    Number(catId),
    queryIndex,
  ]);

  await executeDML(COMMON_SP, params);
  return listCommonMaster(catId);
}

export async function getPatMaritalStatus(patId: number): Promise<string> {
  if (!patId) return 'Married';
  try {
    const result = await executeText<Record<string, unknown>>(
      "SELECT LTRIM(RTRIM(ISNULL(PatMaritalStatus, 'Married'))) AS PatMaritalStatus FROM PatientMaster WHERE PatID = @PatID",
      [{ name: '@PatID', value: Number(patId) }]
    );
    return String(result.recordset?.[0]?.PatMaritalStatus ?? 'Married').trim() || 'Married';
  } catch {
    return 'Married';
  }
}

export async function savePatMaritalStatus(patId: number, maritalStatus: string) {
  if (!patId || !maritalStatus) return;
  await executeText(
    'UPDATE PatientMaster SET PatMaritalStatus = @PatMaritalStatus WHERE PatID = @PatID',
    [
      { name: '@PatMaritalStatus', value: maritalStatus },
      { name: '@PatID', value: Number(patId) },
    ]
  );
}

export async function getPatSmartFields(patId: number) {
  if (!patId) return { nationality: 'Indian', passport: '', husbandPassport: '' };
  try {
    const result = await executeText<Record<string, unknown>>(
      "SELECT ISNULL(PatNationality, 'Indian') AS PatNationality, ISNULL(PatPassport, '') AS PatPassport, ISNULL(HusbandPassport, '') AS HusbandPassport FROM PatientMaster WHERE PatID = @PatID",
      [{ name: '@PatID', value: Number(patId) }]
    );
    const row = result.recordset?.[0];
    return {
      nationality: String(row?.PatNationality ?? 'Indian').trim() || 'Indian',
      passport: String(row?.PatPassport ?? '').trim(),
      husbandPassport: String(row?.HusbandPassport ?? '').trim(),
    };
  } catch {
    return { nationality: 'Indian', passport: '', husbandPassport: '' };
  }
}

export async function savePatSmartFields(patId: number, { nationality, passport, husbandPassport }: { nationality?: string; passport?: string; husbandPassport?: string }) {
  if (!patId) return;
  try {
    await executeText(
      'UPDATE PatientMaster SET PatNationality = @PatNationality, PatPassport = @PatPassport, HusbandPassport = @HusbandPassport WHERE PatID = @PatID',
      [
        { name: '@PatNationality', value: nationality || 'Indian' },
        { name: '@PatPassport', value: passport || '' },
        { name: '@HusbandPassport', value: husbandPassport || '' },
        { name: '@PatID', value: Number(patId) },
      ]
    );
  } catch (e) {
    console.error('savePatSmartFields error:', e);
  }
}


export async function getPatientLookups() {
  const [satellites, doctors, diagnosis, refBy] = await Promise.all([
    executeDRL<Record<string, unknown>>(SATELLITE_EXT_SP, buildParams('@SatID,@QueryIndex', [0, 1])),
    executeDRL<Record<string, unknown>>(DOCTOR_EXT_SP, buildParams('@DocID,@QueryIndex', [0, 1])),
    listCommonMaster(20),
    listCommonMaster(21),
  ]);

  return {
    satellites: (satellites.recordset || []).map(mapLookupRow),
    doctors: (doctors.recordset || []).map(mapLookupRow),
    diagnosis,
    refBy,
  };
}

function defaultPatientPayload(overrides: Record<string, unknown> = {}) {
  const today = new Date();
  return {
    patId: 0,
    refNo: '',
    dateOfCreation: today,
    name: '',
    category: '',
    age: 0,
    dob: today,
    address: '',
    city: '',
    phone: '',
    mobile: '',
    email: '',
    docId: 0,
    diagId: 0,
    husbandName: '',
    husbandAge: 0,
    husbandDob: today,
    satId: 0,
    refId: 0,
    panCard: '',
    aadhar: '',
    husbandAadhar: '',
    husbandPan: '',
    husbandEmail: '',
    photo: '',
    ...overrides,
  };
}

function buildPatientParams(payload: Record<string, unknown>, queryIndex: number) {
  return buildParams(
    '@PatID,@PatRefNo,@PatDateOfCreation,@PatName,@Patcategory,@PatAge,@PatDob,@PatAddress,@PatCity,@PatPhoneNo,@PatMobileNo,@PatEmail,@DocID,@DiagID,@PatHusbName,@PatHusbAge,@PatHusbDob,@SatID,@RefID,@QueryIndex,@PatPancard,@PatAdhar,@HusbandAdhar,@HusbandPan,@HusbandEmail,@patPhoto',
    [
      Number(payload.patId) || 0,
      payload.refNo ?? '',
      payload.dateOfCreation ?? new Date(),
      payload.name ?? '',
      payload.category ?? '',
      Number(payload.age) || 0,
      payload.dob ?? new Date(),
      payload.address ?? '',
      payload.city ?? '',
      payload.phone ?? '',
      payload.mobile ?? '',
      payload.email ?? '',
      Number(payload.docId) || 0,
      Number(payload.diagId) || 0,
      payload.husbandName ?? '',
      Number(payload.husbandAge) || 0,
      payload.husbandDob ?? new Date(),
      Number(payload.satId) || 0,
      Number(payload.refId) || 0,
      queryIndex,
      payload.panCard ?? '',
      payload.aadhar ?? '',
      payload.husbandAadhar ?? '',
      payload.husbandPan ?? '',
      payload.husbandEmail ?? '',
      payload.photo ?? '',
    ]
  );
}

function mapPatientRow(row: Record<string, unknown>) {
  return {
    id: Number(row.PatID ?? row.ID),
    refNo: String(row.PatRefNo ?? ''),
    name: String(row.PatName ?? row.Name ?? ''),
    category: String(row.PatCategory ?? row.Patcategory ?? ''),
    husbandName: String(row.PatHusbName ?? ''),
    address: String(row.PatAddress ?? ''),
    dateOfCreation: row.PatDateOfCreation ?? null,
    raw: row,
  };
}

function mapPatientDetail(row: Record<string, unknown>) {
  return {
    id: Number(row.PatID),
    refNo: String(row.PatRefNo ?? ''),
    dateOfCreation: row.PatDateOfCreation ?? null,
    name: String(row.PatName ?? ''),
    category: String(row.PatCategory ?? row.Patcategory ?? ''),
    age: Number(row.PatAge ?? 0),
    dob: row.PatDob ?? null,
    address: String(row.PatAddress ?? ''),
    city: String(row.PatCity ?? ''),
    phone: String(row.PatPhoneNo ?? ''),
    mobile: String(row.PatMobileNo ?? ''),
    email: String(row.PatEmail ?? ''),
    docId: Number(row.DocID ?? 0),
    diagId: Number(row.DiagID ?? 0),
    husbandName: String(row.PatHusbName ?? ''),
    husbandAge: Number(row.PatHusbAge ?? 0),
    husbandDob: row.PatHusbDob ?? null,
    satId: Number(row.SatID ?? 0),
    refId: Number(row.RefID ?? 0),
    panCard: String(row.PatPancard ?? ''),
    aadhar: String(row.PatAdhar ?? ''),
    husbandAadhar: String(row.HusbandAdhar ?? ''),
    husbandPan: String(row.HusbandPan ?? ''),
    husbandEmail: String(row.HusbandEmail ?? ''),
    photo: String(row.patPhoto ?? ''),
    maritalStatus: String(row.PatMaritalStatus ?? 'Married'),
    raw: row,
  };
}

export async function listPatients(payload: Record<string, unknown> = {}) {
  const params = buildPatientParams(defaultPatientPayload(payload), 1);
  const result = await executeDRL<Record<string, unknown>>(PATIENT_SP, params);
  return (result.recordset || []).map(mapPatientRow);
}

export async function getPatientById(patId: number) {
  const params = buildPatientParams(defaultPatientPayload({ patId: Number(patId) }), 2);
  const result = await executeDRL<Record<string, unknown>>(PATIENT_SP, params);
  const rows = result.recordset || [];
  if (!rows.length) return null;

  const detail = mapPatientDetail(rows[0]);
  detail.maritalStatus = await getPatMaritalStatus(detail.id);
  const smart = await getPatSmartFields(detail.id);
  return {
    ...detail,
    nationality: smart.nationality,
    passport: smart.passport,
    husbandPassport: smart.husbandPassport,
  };
}

export async function savePatient(payload: Record<string, unknown>, action = 'insert') {
  const maritalStatus = String(payload.maritalStatus || 'Married');
  const normalized: Record<string, unknown> = { ...payload, category: '', maritalStatus };
  const queryIndex = action === 'update' ? 12 : 11;
  const params = buildPatientParams(defaultPatientPayload(normalized), queryIndex);

  if (action === 'insert') {
    const dupParams = buildPatientParams(defaultPatientPayload(normalized), 10);
    const dupCheck = await executeDRL<Record<string, unknown>>(PATIENT_SP, dupParams);
    if ((dupCheck.recordset || []).length > 0) {
      const err = new Error('Patient Aadhar already exists.') as Error & { status?: number };
      err.status = 409;
      throw err;
    }
  }

  const result = await executeDML<Record<string, unknown>>(PATIENT_SP, params);
  const savedPatId =
    action === 'update'
      ? Number(normalized['patId']) || 0
      : Number(result.returnValue) || Number(normalized['patId']) || 0;

  if (savedPatId > 0) {
    if (maritalStatus) {
      await savePatMaritalStatus(savedPatId, maritalStatus);
    }
    await savePatSmartFields(savedPatId, {
      nationality: String(payload.nationality || 'Indian'),
      passport: String(payload.passport || ''),
      husbandPassport: String(payload.husbandPassport || ''),
    });
  }

  return listPatients({ satId: normalized['satId'] });
}

export async function deletePatient(patId: number) {
  const params = buildPatientParams(defaultPatientPayload({ patId: Number(patId) }), 13);
  await executeDML(PATIENT_SP, params);
  return { success: true };
}

function buildDoctorParams(payload: Record<string, unknown>, queryIndex: number) {
  return buildParams(
    '@DocID,@DocName,@DocAddress1,@DocAddress2,@DocAddress3,@DocCity,@DocPhone,@DocMobile,@DocPager,@DocEmail,@DocDegree,@DocSpeciality,@DocStartTime,@DocEndTime,@QueryIndex',
    [
      Number(payload.docId) || 0,
      payload.name ?? '',
      payload.address1 ?? '',
      payload.address2 ?? '',
      payload.address3 ?? '',
      payload.city ?? '',
      payload.phone ?? '',
      payload.mobile ?? '',
      payload.pager ?? '',
      payload.email ?? '',
      payload.degree ?? '',
      payload.speciality ?? '',
      payload.startTime ?? '1900-01-01T00:00:00',
      payload.endTime ?? '1900-01-01T23:45:00',
      queryIndex,
    ]
  );
}

export async function listDoctors() {
  const params = buildDoctorParams({}, 1);
  const result = await executeDRL<Record<string, unknown>>(DOCTOR_SP, params);
  return (result.recordset || []).map((row) => ({
    id: Number(row.DocID ?? row.ID),
    name: String(row.DocName ?? row.Name ?? ''),
    city: String(row.DocCity ?? ''),
    phone: String(row.DocPhone ?? ''),
    mobile: String(row.DocMobile ?? ''),
    email: String(row.DocEmail ?? ''),
    raw: row,
  }));
}

export async function saveDoctor(payload: Record<string, unknown>, action = 'insert') {
  const queryIndex = action === 'update' ? 12 : 11;
  const params = buildDoctorParams(payload, queryIndex);
  await executeDML(DOCTOR_SP, params);
  return listDoctors();
}

function buildSatelliteParams(payload: Record<string, unknown>, queryIndex: number) {
  return buildParams(
    '@SatID,@SatName,@SatShortName,@SatAddress1,@SatAddress2,@SatCity,@SatDrOne,@SatDrOneDeg,@SatDrTwo,@SatDrTwoDeg,@SatPhoneNo,@SatMobileNo,@SatFax,@SatEmail,@QueryIndex',
    [
      Number(payload.satId) || 0,
      payload.name ?? '',
      payload.shortName ?? '',
      payload.address1 ?? '',
      payload.address2 ?? '',
      payload.city ?? '',
      payload.drOne ?? '',
      payload.drOneDeg ?? '',
      payload.drTwo ?? '',
      payload.drTwoDeg ?? '',
      payload.phone ?? '',
      payload.mobile ?? '',
      payload.fax ?? '',
      payload.email ?? '',
      queryIndex,
    ]
  );
}

export async function listSatellitesMaster() {
  const params = buildSatelliteParams({}, 3);
  const result = await executeDRL<Record<string, unknown>>(SATELLITE_SP, params);
  return (result.recordset || []).map((row) => ({
    id: Number(row.SatID ?? row.ID),
    name: String(row.SatName ?? row.Name ?? ''),
    shortName: String(row.SatShortName ?? ''),
    city: String(row.SatCity ?? ''),
    phone: String(row.SatPhoneNo ?? ''),
    raw: row,
  }));
}

export async function saveSatellite(payload: Record<string, unknown>, action = 'insert') {
  const queryIndex = action === 'update' ? 12 : 11;
  const params = buildSatelliteParams(payload, queryIndex);
  await executeDML(SATELLITE_SP, params);
  return listSatellitesMaster();
}

export async function listUsers() {
  const params = buildParams(
    '@UserID,@UserName,@UserLoginName,@UserPassword,@UserRitID,@AppointMentSchedule,@BT,@Cycle,@DoctorMaster,@ET,@ICSI,@IUI,@IVF,@Master,@Media,@OutComeDrugMaster,@PatientMaster,@RptConsentForms,@RptEmbryosPictures,@RptHSASummary,@RptIUISummary,@RptIVFSummary,@SatelliteMaster,@UserMaster,@QueryIndex',
    [0, '', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
  );
  const result = await executeDRL<Record<string, unknown>>(USER_SP, params);
  return (result.recordset || []).map((row) => ({
    id: Number(row.UserID ?? row.ID),
    name: String(row.UserName ?? ''),
    loginName: String(row.UserLoginName ?? ''),
    roleId: Number(row.UserRitID ?? 0),
    raw: row,
  }));
}
