import { executeDRL, executeText, buildParams } from '@/lib/db/spExecutor';
import * as patientService from './patient.service';

const PRESETS = [
  { id: '1', title: 'Self Oocytes + Husband Sample + Self ET + Embryo Freezing', art: '6,9,12,14B,18', icmr: 'I', pcpndt: 'D' },
  { id: '2', title: 'Self Oocytes + Husband Sample + NO ET + Freeze All', art: '6,9,12,14B,18', icmr: 'I', pcpndt: 'D' },
  { id: '3', title: 'Self Oocytes + Husband Sample + FET', art: '6,9,12,14B,18', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
  { id: '4', title: 'Self Oocyte Freezing', art: '6,10,12', icmr: 'I', pcpndt: 'D' },
  { id: '5', title: 'Self Oocyte Thaw + Husband Sample + Self ET', art: '6', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
  { id: '6', title: 'Self Oocytes Thaw + Donor Sample + ET', art: '6,8', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
  { id: '7', title: 'Oocyte Donor', art: '12,13', icmr: 'I', pcpndt: 'D' },
  { id: '8', title: 'Donor Oocyte Freezing', art: '6,10', icmr: 'I', pcpndt: 'D' },
  { id: '9', title: 'Oocyte Recipient', art: '6,9,AFFIDAVIT', icmr: 'I', pcpndt: 'D' },
  { id: '10', title: 'Donor Oocyte Thaw + Donor Sample + ET Recipient', art: '6,8', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
  { id: '11', title: 'Donor Oocyte Thaw + Husband Sample + ET Recipient', art: '6,8', icmr: 'I', pcpndt: 'D', misc: 'Thaw Sheet' },
];

const FORM_GROUPS = [
  {
    id: 'art',
    label: 'ART Act Forms',
    forms: [
      { id: '6', label: 'Form 6 – Consent for ART' },
      { id: '8', label: 'Form 8 – Donor Semen Consent' },
      { id: '9', label: 'Form 9 – Embryo Transfer' },
      { id: '10', label: 'Form 10 – Oocyte Freezing' },
      { id: '12', label: 'Form 12 – Cryopreservation' },
      { id: '13', label: 'Form 13 – Oocyte Donor' },
      { id: '14B', label: 'Form 14B – Embryo Freezing' },
      { id: '18', label: 'Form 18 – Additional Consent' },
      { id: 'AFFIDAVIT', label: 'Affidavit' },
    ],
  },
  {
    id: 'icmr',
    label: 'ICMR Forms',
    forms: [{ id: 'I', label: 'ICMR Consent Pack' }],
  },
  {
    id: 'pcpndt',
    label: 'PCPNDT Forms',
    forms: [{ id: 'D', label: 'PCPNDT Form D' }],
  },
  {
    id: 'misc',
    label: 'Additional',
    forms: [{ id: 'Thaw Sheet', label: 'Thaw Sheet' }],
  },
];

export function clinicProfile() {
  return {
    name: process.env.CONSENT_CLINIC_NAME || 'IVF CRAAFT India Pvt. Ltd.',
    address:
      process.env.CONSENT_CLINIC_ADDRESS ||
      '301, Krimson Park, Near Corporation Bank, S.V.Road, Amboli Naka Andheri(W), Mumbai-400058',
    consultant1: process.env.CONSENT_CONSULTANT1 || 'Dr. Sanjay Kumar Pagare',
    consultant2: process.env.CONSENT_CONSULTANT2 || 'Dr. Satish Kumar Sharma',
    consultant1Reg: process.env.CONSENT_CONSULTANT1_REG || 'MMC/8765',
    consultant2Reg: process.env.CONSENT_CONSULTANT2_REG || 'MMC/63291',
    consultantAddress:
      process.env.CONSENT_CONSULTANT_ADDRESS ||
      '301, Krimson Park, Near Corporation Bank, S.V.Road, Amboli Naka Andheri(W), Mumbai-400058',
    consultantReg: process.env.CONSENT_CONSULTANT_REG || 'MMC/8765',
    facilityType: process.env.CONSENT_FACILITY_TYPE || 'ART CLINIC Level 2',
    artRegNo: process.env.CONSENT_ART_REG_NO || 'MH/AC/2022/12195/L2/Andheri/97',
    pcpndtRegNo: process.env.CONSENT_PCPNDT_REG_NO || 'AMC/Health/PCPNDT/3234/2024',
    ...witnessParts(),
  };
}

function witnessParts() {
  const name = process.env.CONSENT_WITNESS_NAME?.trim() || '';
  const address = process.env.CONSENT_WITNESS_ADDRESS?.trim() || '';
  if (name || address) return { witnessName: name, witnessAddress: address };
  const combined =
    process.env.CONSENT_WITNESS_NAME_ADDRESS ||
    'Mr./Mrs./Ms: Hetal Jayesh Marfatia, Room No9, Suresh Nagar, Seven Hills Road, Chatrapati Sambhajinagar, Maharashtra, India';
  const comma = combined.indexOf(',');
  if (comma < 0) return { witnessName: combined.trim(), witnessAddress: '' };
  return {
    witnessName: combined.slice(0, comma).trim(),
    witnessAddress: combined.slice(comma + 1).trim(),
  };
}

export function getPresets() {
  return PRESETS;
}

export function getFormGroups() {
  return FORM_GROUPS;
}

export function resolvePreset(presetId: string | number) {
  const preset = PRESETS.find((p) => p.id === String(presetId));
  if (!preset) return null;
  const selected = [
    ...(preset.art || '').split(',').map((s) => s.trim()).filter(Boolean),
    ...(preset.icmr || '').split(',').map((s) => s.trim()).filter(Boolean),
    ...(preset.pcpndt || '').split(',').map((s) => s.trim()).filter(Boolean),
    ...(preset.misc || '').split(',').map((s) => s.trim()).filter(Boolean),
  ];
  return { ...preset, selected };
}

async function loadConsentIdentity(patId: number) {
  const empty = { uhid: '', aadhar: '', maleAadhar: '', dob: '', registrationNo: '', diagnosis: '', referredBy: '' };
  if (!patId) return empty;
  try {
    const result = await executeText<Record<string, unknown>>(
      `SELECT TOP 1
          p.PatRefNo,
          CONVERT(varchar(10), p.PatDob, 103) AS PatDob,
          LTRIM(RTRIM(ISNULL(p.PatAdhar, ''))) AS PatAdhar,
          LTRIM(RTRIM(ISNULL(p.PatHusbAdhar, ''))) AS PatHusbAdhar,
          LTRIM(RTRIM(ISNULL(diag.CommName, ''))) AS DiagName,
          LTRIM(RTRIM(ISNULL(refBy.CommName, ''))) AS RefName
        FROM PatientMaster p
        LEFT JOIN CommonMaster diag ON diag.CommID = p.DiagID
        LEFT JOIN CommonMaster refBy ON refBy.CommID = p.RefID
        WHERE p.PatID = @PatID`,
      [{ name: '@PatID', value: patId }]
    );
    const row = result.recordset?.[0];
    if (!row) return empty;
    return {
      uhid: `IVF${patId}`,
      aadhar: String(row.PatAdhar || ''),
      maleAadhar: String(row.PatHusbAdhar || ''),
      dob: String(row.PatDob || ''),
      registrationNo: String(row.PatRefNo || ''),
      diagnosis: String(row.DiagName || ''),
      referredBy: String(row.RefName || ''),
    };
  } catch {
    return { ...empty, uhid: `IVF${patId}` };
  }
}

export async function searchConsentPatients({ search = '', satelliteId = 0 }: { search?: string; satelliteId?: number }) {
  return patientService.searchPatients({ search, satelliteId });
}

export async function getPatientConsentContext({ patId, satId }: { patId: number; satId: number }) {
  const patient = await patientService.getPatientById(Number(patId), Number(satId));
  if (!patient) return null;

  let cycles: Array<{ id: string; date: unknown; type: string }> = [];
  try {
    const result = await executeDRL<Record<string, unknown>>(
      'spCycOutComeExtDRL',
      buildParams('@PatID,@SatID,@QueryIndex,@UserId', [Number(patId), Number(satId), 1, 0])
    );
    cycles = (result.recordset || []).slice(0, 20).map((row) => ({
      id: String(row.CycID ?? row.CycleID ?? ''),
      date: row.CycDateOfCreation ?? row.CycDate ?? null,
      type: String(row.CycType ?? row.CycleType ?? ''),
    }));
  } catch {
    cycles = [];
  }

  const identity = await loadConsentIdentity(Number(patId));
  return {
    patient: {
      id: patient.id,
      name: patient.name,
      partner: patient.partner,
      uhid: identity.uhid || `IVF${patient.id}`,
      age: patient.age,
      aadhar: identity.aadhar || patient.aadhar,
      maleAadhar: identity.maleAadhar,
      mobile: patient.mobile,
      email: patient.email,
      address: patient.address,
      city: patient.city,
      category: patient.category,
      satelliteId: patient.satelliteId,
      dob: identity.dob,
      registrationNo: identity.registrationNo,
      diagnosis: identity.diagnosis,
      referredBy: identity.referredBy,
    },
    cycles,
    clinic: clinicProfile(),
  };
}
