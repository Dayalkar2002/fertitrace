import { apiFetch } from '@/lib/api';

export interface IuiListRow {
  IUIID: string;
  Indication?: string;
  IUIODateOfCreation?: string;
  IUIIDOff?: string | number;
  IUIOPostTreat?: string;
  IUIOAdvice?: string;
  IUIOID?: number;
  IsLock?: boolean | number | string;
  [key: string]: unknown;
}

export async function listIui(token: string, patId: number, satId: number): Promise<IuiListRow[]> {
  const res = await apiFetch<{ success: boolean; data: IuiListRow[] }>(
    `/iui?patId=${patId}&satId=${satId}`,
    {},
    token
  );
  return res.data || [];
}

export async function loadIuiOutcome(
  token: string,
  iuiId: string,
  iuiOId: number,
  patId: number,
  satId: number
) {
  const res = await apiFetch<{ success: boolean; data: Record<string, unknown> }>(
    `/iui/${encodeURIComponent(iuiId)}?patId=${patId}&satId=${satId}&iuiOId=${iuiOId}`,
    {},
    token
  );
  return res.data;
}

export async function saveIui(token: string, payload: Record<string, unknown>) {
  return apiFetch<{ success: boolean; message: string; data: unknown }>(
    '/iui',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export async function unlockIui(
  token: string,
  payload: { patId: number; cycleId: string; patName?: string }
) {
  return apiFetch<{ success: boolean; message: string }>(
    '/iui/unlock',
    { method: 'POST', body: JSON.stringify(payload) },
    token
  );
}

export const ET_CELLER_OPTIONS = [
  { id: 0, name: 'Select' },
  { id: 1, name: '2 Celler' },
  { id: 2, name: '3 Celler' },
  { id: 3, name: '4 Celler' },
  { id: 4, name: '5 Celler' },
  { id: 5, name: '6 Celler' },
  { id: 6, name: '7 Celler' },
  { id: 7, name: '8 Celler' },
  { id: 8, name: '9 Celler' },
  { id: 9, name: '10 Celler' },
  { id: 10, name: 'Multi Celler' },
];

export const BT_EXPANSION_OPTIONS = [
  { id: 0, name: 'Select' },
  { id: 1, name: '1 Blastocoel cavity less than half the volume of the embryo.' },
  { id: 2, name: '2 Blastocoel cavity more than half the volume of the embryo.' },
  { id: 3, name: '3 Full blastocyst, cavity completely filling the embryo.' },
  { id: 4, name: '4 Expanded blastocyst, cavity larger than the embryo, with thinning of the shell.' },
  { id: 5, name: '5 Hatching out of the shell.' },
  { id: 6, name: '6 Hatched out of the shell' },
];

export const BT_ICM_OPTIONS = [
  { id: 0, name: 'Select' },
  { id: 1, name: 'Grade A, Many Cells, tightly packed' },
  { id: 2, name: 'Grade B, Several Cells, loosely grouped' },
  { id: 3, name: 'Grade C, Very few cells' },
];

export const BT_TE_OPTIONS = [
  { id: 0, name: 'Select' },
  { id: 1, name: 'Grade A, Many cells, forming a cohesive layer' },
  { id: 2, name: 'Grade B, Few Cells, forming a loose epithelium' },
  { id: 3, name: 'Grade C, Very few large cells' },
];

export const ET_GRADE_OPTIONS = [
  { id: 0, name: 'Select' },
  { id: 1, name: 'Grade I' },
  { id: 2, name: 'Grade II' },
  { id: 3, name: 'Grade III' },
  { id: 4, name: 'Grade IV' },
];

/** SMART ET.aspx Action list (ET Entry + ICSI location grid). */
export const ET_ACTION_OPTIONS = [
  { id: 0, name: 'Select' },
  { id: 1, name: 'Transfer' },
  { id: 2, name: 'Freeze' },
  { id: 3, name: 'Stuck' },
  { id: 4, name: 'KeepForBlast' },
  { id: 5, name: 'Discard' },
  { id: 6, name: 'Donated' },
  { id: 7, name: 'DonatedForResearch' },
];

export const MEDIA_OPTIONS = [
  { id: 1, name: 'Kitazato' },
  { id: 2, name: 'Origio' },
  { id: 3, name: 'Cook' },
];

export const PROTOCOL_OPTIONS = [
  { id: 1, name: 'Slow Freezing' },
  { id: 2, name: 'Rapid Freezing' },
  { id: 3, name: 'Vitrification' },
];

export interface EmbryoRow {
  etEdId?: number;
  btBdId?: number;
  source?: string;
  celler?: number;
  grade?: number;
  teGrade?: number;
  action?: number;
  remark?: string;
  location?: string;
  isNew?: boolean;
}
