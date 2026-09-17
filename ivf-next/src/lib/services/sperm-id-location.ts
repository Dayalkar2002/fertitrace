import { apiFetch } from '@/lib/api';
import type { SmartAnalysisValues } from '@/lib/sperm-analysis';

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
}

export function isHusbandSperm(spermId: string) {
  return /husb/i.test(spermId);
}

export function isDonorSperm(spermId: string) {
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

export async function listSpermIdLocations(
  token: string,
  input: { spermId: string; semenType: string; patId: number; satId: number; thawId?: string }
): Promise<SpermIdOption[]> {
  const params = new URLSearchParams({
    spermId: input.spermId,
    type: input.semenType,
    patId: String(input.patId || 0),
    satId: String(input.satId || 0),
    thawId: input.thawId || 'New',
  });
  const res = await apiFetch<{ success: boolean; data: SpermIdOption[] }>(
    `/sperm/id-locations?${params.toString()}`,
    {},
    token
  );
  return res.data || [];
}

export async function loadSpermLocationDetails(
  token: string,
  id: string,
  spermType: string
): Promise<SpermLocationDetails | null> {
  const params = new URLSearchParams({ id, spermType });
  const res = await apiFetch<{ success: boolean; data: SpermLocationDetails | null }>(
    `/sperm/location-details?${params.toString()}`,
    {},
    token
  );
  return res.data ?? null;
}

export function applyLocationDetails(
  values: SmartAnalysisValues,
  details: SpermLocationDetails,
  donor: boolean
): SmartAnalysisValues {
  return {
    ...values,
    beforeVol: details.vol || values.beforeVol,
    beforeSperms: details.sperms || values.beforeSperms,
    beforeMotility: details.motility || values.beforeMotility,
    beforeProgMotility: details.progMotility || values.beforeProgMotility,
    beforeGrade1: donor ? '0' : details.grade1 || values.beforeGrade1,
    beforeGrade2: donor ? '0' : details.grade2 || values.beforeGrade2,
    beforeGrade3: donor ? '0' : details.grade3 || values.beforeGrade3,
    beforeGrade4: donor ? '0' : details.grade4 || values.beforeGrade4,
    beforeEpith: donor ? '0' : details.epith || values.beforeEpith,
    beforeRound: donor ? '0' : details.round || values.beforeRound,
    beforeWbc: details.wbc || values.beforeWbc,
    beforeRbc: details.rbc || values.beforeRbc,
    recovery: details.recovery || values.recovery,
    hams: donor ? false : details.hams,
    timeOfLiq: donor ? values.timeOfLiq : details.timeOfLiq || values.timeOfLiq,
    agglutination: donor ? values.agglutination : details.agglutination || values.agglutination,
    antibodies: donor ? values.antibodies : details.antibodies || values.antibodies,
    velocity: donor ? values.velocity : details.velocity || values.velocity,
    ph: donor ? values.ph : details.ph || values.ph,
    normomorphs1: donor ? values.normomorphs1 : details.normomorphs1 || values.normomorphs1,
    normomorphs2: donor ? values.normomorphs2 : details.normomorphs2 || values.normomorphs2,
    linearity: donor ? values.linearity : details.linearity || values.linearity,
  };
}
