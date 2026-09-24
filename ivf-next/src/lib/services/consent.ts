import { apiFetch } from '@/lib/api';
import type { Patient } from '@/lib/types/patient';

export interface ConsentPreset {
  id: string;
  title: string;
  art?: string;
  icmr?: string;
  pcpndt?: string;
  misc?: string;
  selected?: string[];
}

export interface ConsentFormGroup {
  id: string;
  label: string;
  forms: Array<{ id: string; label: string }>;
}

export interface ConsentCatalogForm {
  relativePath: string;
  displayName: string;
}

export interface ConsentCatalogCategory {
  title: string;
  letter: string;
  forms: ConsentCatalogForm[];
}

export interface ConsentCatalog {
  categories: ConsentCatalogCategory[];
  presets: Array<{ id: string; title: string; paths: string[] }>;
}

export interface ConsentPatientContext {
  patient: Patient & {
    mobile?: string;
    email?: string;
    address?: string;
    city?: string;
    maleAadhar?: string;
    dob?: string;
    registrationNo?: string;
    diagnosis?: string;
    referredBy?: string;
  };
  cycles: Array<{ id: string; date: string | null; type: string }>;
  clinic: {
    name: string;
    address: string;
    consultant1: string;
    consultant2: string;
    consultant1Reg?: string;
    consultant2Reg?: string;
    consultantAddress?: string;
    consultantReg?: string;
    facilityType?: string;
    artRegNo?: string;
    pcpndtRegNo?: string;
    witnessName?: string;
    witnessAddress?: string;
  };
}

export async function fetchConsentPresets(token: string): Promise<ConsentPreset[]> {
  const res = await apiFetch<{ success: boolean; data: ConsentPreset[] }>('/consent/presets', {}, token);
  return res.data;
}

export async function fetchConsentForms(token: string): Promise<ConsentFormGroup[]> {
  const res = await apiFetch<{ success: boolean; data: ConsentFormGroup[] }>('/consent/forms', {}, token);
  return res.data;
}

export async function fetchConsentPreset(token: string, id: string): Promise<ConsentPreset> {
  const res = await apiFetch<{ success: boolean; data: ConsentPreset }>(
    `/consent/presets/${id}`,
    {},
    token
  );
  return res.data;
}

export async function fetchConsentPatientContext(
  token: string,
  patId: number,
  satId: number
): Promise<ConsentPatientContext> {
  const res = await apiFetch<{ success: boolean; data: ConsentPatientContext }>(
    `/consent/patient-context?patId=${patId}&satId=${satId}`,
    {},
    token
  );
  return res.data;
}

export async function fetchConsentCatalog(token: string, moduleName: string): Promise<ConsentCatalog> {
  const res = await apiFetch<{ success: boolean; data: ConsentCatalog }>(
    `/consent/catalog?module=${encodeURIComponent(moduleName)}`,
    {},
    token
  );
  return res.data;
}

export async function downloadConsentBook(
  token: string,
  payload: { patId: number; satId: number; paths: string[]; patientName: string }
): Promise<void> {
  const res = await fetch('/api/consent/book', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      patId: payload.patId,
      satId: payload.satId,
      paths: payload.paths,
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || 'Could not build the consent book.');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Consent-${payload.patientName.replace(/[^\w.-]+/g, '_') || 'patient'}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
