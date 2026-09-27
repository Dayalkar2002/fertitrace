import type { MonitoringSheetOption } from '@/lib/cycle-utils';

export interface MonitoringColumn {
  key: string;
  label: string;
  group?: string;
}

export interface MonitoringRowDef {
  key: string;
  label: string;
  kind: 'text' | 'number' | 'date';
}

export interface MonitoringSheetLayout {
  option: MonitoringSheetOption;
  title: string;
  hint: string;
  columns: MonitoringColumn[];
  rows: MonitoringRowDef[];
  /** IUI sheet lists one row per visit day. Other sheets list parameters down the side. */
  orientation?: 'parameters' | 'day-rows';
  dayCount?: number;
}

export type MonitoringChartValues = Record<string, Record<string, string>>;

/** Assignment Excel: Agonist / Antagonist / HRT use Day 0, 1, 6, 9 — not a 21-day strip. */
const DAY_0_9: MonitoringColumn[] = [
  { key: 'd0', label: 'Day 0' },
  { key: 'd1', label: 'Day 1' },
  { key: 'd6', label: 'Day 6' },
  { key: 'd9', label: 'Day 9' },
];

const STIM_ROWS: MonitoringRowDef[] = [
  { key: 'date', label: 'Date', kind: 'date' },
  { key: 'drugDose', label: 'Drug / Dose', kind: 'text' },
  { key: 'frequency', label: 'Frequency', kind: 'text' },
  { key: 'lh', label: 'S.E. LH', kind: 'number' },
  { key: 'fsh', label: 'S.E. FSH', kind: 'number' },
  { key: 'e2', label: 'S.E. Estradiol', kind: 'number' },
  { key: 'prolactin', label: 'S.E. Prolactin', kind: 'number' },
  { key: 'endo', label: 'Endo. Thickness', kind: 'text' },
  { key: 'folRt', label: 'Follicle Count (Rt)', kind: 'number' },
  { key: 'folLt', label: 'Follicle Count (Lt)', kind: 'number' },
  { key: 'rhcg', label: 'r.HCG', kind: 'text' },
  { key: 'time', label: 'Date / Time', kind: 'text' },
];

const LAYOUTS: Record<MonitoringSheetOption, MonitoringSheetLayout> = {
  Agonist: {
    option: 'Agonist',
    title: 'Agonist Cycle Monitoring Chart',
    hint: 'Days across the top, same layout as the assignment Excel. Fill this on Cycle Creation after the protocol is selected.',
    columns: [...DAY_0_9, { key: 'trigger', label: 'Day of Trigger' }, { key: 'opu', label: 'Day of OPU' }],
    rows: [...STIM_ROWS, { key: 'gnrh', label: 'GnRH Agonist', kind: 'text' }],
  },
  Antagonist: {
    option: 'Antagonist',
    title: 'Antagonist Cycle Monitoring Chart',
    hint: 'Antagonist start is tracked beside the standard stim days.',
    columns: [...DAY_0_9, { key: 'trigger', label: 'Day of Trigger' }, { key: 'opu', label: 'Day of OPU' }],
    rows: [...STIM_ROWS, { key: 'antagonist', label: 'Antagonist', kind: 'text' }, { key: 'gnrh', label: 'GnRH Agonist', kind: 'text' }],
  },
  HRT: {
    option: 'HRT',
    title: 'HRT Cycle Monitoring Chart',
    hint: 'Estrogen build-up through progesterone conversion. Used for FET / recipient lining.',
    columns: [...DAY_0_9, { key: 'prog', label: 'Prog. Conversion Day' }],
    rows: [
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'drugDose', label: 'Drug / Dose', kind: 'text' },
      { key: 'frequency', label: 'Frequency', kind: 'text' },
      { key: 'lh', label: 'S.E. LH', kind: 'number' },
      { key: 'fsh', label: 'S.E. FSH', kind: 'number' },
      { key: 'e2', label: 'S.E. Estradiol', kind: 'number' },
      { key: 'prolactin', label: 'S.E. Prolactin', kind: 'number' },
      { key: 'endo', label: 'Endo. Thickness', kind: 'text' },
      { key: 'drug2', label: 'Drug / Dose', kind: 'text' },
      { key: 'pessary', label: '200mg Vaginal Pessary', kind: 'text' },
      { key: 'time', label: 'Date / Time', kind: 'text' },
    ],
  },
  ModifiedHRT: {
    option: 'ModifiedHRT',
    title: 'Modified Natural Cycle Monitoring Chart',
    hint: 'Assignment Excel: Day 0, Day 1, Day 9, Day of Trigger, then Prog. Conversion.',
    columns: [
      { key: 'd0', label: 'Day 0' },
      { key: 'd1', label: 'Day 1' },
      { key: 'd9', label: 'Day 9' },
      { key: 'trigger', label: 'Day of Trigger' },
      { key: 'prog', label: 'Prog. Conversion Day' },
    ],
    rows: [
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'drug1', label: 'Drug / Dose 1', kind: 'text' },
      { key: 'drug2', label: 'Drug / Dose 2', kind: 'text' },
      { key: 'drug3', label: 'Drug / Dose 3', kind: 'text' },
      { key: 'drug4', label: 'Drug / Dose 4', kind: 'text' },
      { key: 'frequency', label: 'Frequency', kind: 'text' },
      { key: 'lh', label: 'S.E. LH', kind: 'number' },
      { key: 'fsh', label: 'S.E. FSH', kind: 'number' },
      { key: 'e2', label: 'S.E. Estradiol', kind: 'number' },
      { key: 'prolactin', label: 'S.E. Prolactin', kind: 'number' },
      { key: 'endo', label: 'Endo. Thickness', kind: 'text' },
      { key: 'follicle', label: 'Follicle Count', kind: 'text' },
      { key: 'rhcg', label: 'r.HCG', kind: 'text' },
      { key: 'antagonist', label: 'Antagonist', kind: 'text' },
      { key: 'gnrh', label: 'GnRH Agonist', kind: 'text' },
      { key: 'time', label: 'Date / Time', kind: 'text' },
    ],
  },
  IUI: {
    option: 'IUI',
    title: 'IUI Monitoring Sheet',
    hint: 'One row per visit. Columns follow the IUI monitoring Excel: endometrium, cervical mucus, and both ovaries.',
    orientation: 'day-rows',
    dayCount: 7,
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'day', label: 'Day' },
      { key: 'endo', label: 'Endometrial Thickness' },
      { key: 'mucus', label: 'Cxal Mucus' },
      { key: 'rtNum', label: 'Follicle Numbers', group: 'Right Ovary' },
      { key: 'rtSize', label: 'Follicle 1 (mm)', group: 'Right Ovary' },
      { key: 'rtSize2', label: 'Follicle 2 (mm)', group: 'Right Ovary' },
      { key: 'ltNum', label: 'Follicle Numbers', group: 'Left Ovary' },
      { key: 'ltSize', label: 'Follicle 1 (mm)', group: 'Left Ovary' },
      { key: 'ltSize2', label: 'Follicle 2 (mm)', group: 'Left Ovary' },
      { key: 'remarks', label: 'Remarks' },
    ],
    rows: [],
  },
};

export function getMonitoringSheetLayout(option: string | undefined | null): MonitoringSheetLayout | null {
  if (!option) return null;
  return LAYOUTS[option as MonitoringSheetOption] ?? null;
}

export const IUI_STOP_REASONS = [
  'Semen Sample is Unsuitable for IUI',
  'Patient Did not Report For IUI',
] as const;

export interface MonSheetColorStyle {
  bg: string;
  text: string;
  border: string;
  badge: string;
  name: string;
  description: string;
}

/**
 * Authentic clinical colors matching legacy Cycle.aspx.cs:
 * White: Day 0 / Baseline
 * Pink: Day 1 / Stimulation Start (#f8bbd0)
 * Yellow: Antagonist Start / Day 6 (#ffeb3b)
 * Green: Trigger / HCG Injection (#81c784)
 * Red: OPU Ovum Pickup (#ef5350)
 * Violet: Progesterone Conversion (#ce93d8)
 * Blue: Terminated Cycle (#64b5f6)
 * Sage: Standard Stimulation / Scan Days (#d0e4a6)
 * Gold: Parameter Header Column (#a66c18)
 */
export const MON_SHEET_COLORS: Record<string, MonSheetColorStyle> = {
  white: {
    bg: '#ffffff',
    text: '#0f172a',
    border: '#cbd5e1',
    badge: 'bg-white text-slate-800 border-slate-300',
    name: 'White',
    description: 'Day 0 / Baseline',
  },
  pink: {
    bg: '#f8bbd0',
    text: '#881337',
    border: '#f472b6',
    badge: 'bg-[#f8bbd0] text-[#881337] border-rose-300',
    name: 'Pink',
    description: 'Day 1 / Stim Start',
  },
  yellow: {
    bg: '#ffeb3b',
    text: '#713f12',
    border: '#facc15',
    badge: 'bg-[#ffeb3b] text-[#713f12] border-amber-300',
    name: 'Yellow',
    description: 'Antagonist Start / Day 6',
  },
  green: {
    bg: '#81c784',
    text: '#14532d',
    border: '#4ade80',
    badge: 'bg-[#81c784] text-[#14532d] border-emerald-400',
    name: 'Green',
    description: 'Trigger / HCG Injection',
  },
  red: {
    bg: '#ef5350',
    text: '#ffffff',
    border: '#dc2626',
    badge: 'bg-[#ef5350] text-white border-rose-600',
    name: 'Red',
    description: 'OPU (Ovum Pickup)',
  },
  violet: {
    bg: '#ce93d8',
    text: '#4a044e',
    border: '#c084fc',
    badge: 'bg-[#ce93d8] text-[#4a044e] border-purple-300',
    name: 'Violet',
    description: 'Progesterone Conversion',
  },
  blue: {
    bg: '#64b5f6',
    text: '#1e3a8a',
    border: '#38bdf8',
    badge: 'bg-[#64b5f6] text-[#1e3a8a] border-sky-300',
    name: 'Blue',
    description: 'Terminated Cycle',
  },
  sage: {
    bg: '#d0e4a6',
    text: '#2d4a12',
    border: '#a3e635',
    badge: 'bg-[#d0e4a6] text-[#2d4a12] border-lime-300',
    name: 'Sage',
    description: 'Stimulation / Monitoring Days',
  },
  gold: {
    bg: '#a66c18',
    text: '#ffffff',
    border: '#855512',
    badge: 'bg-[#a66c18] text-white border-[#855512]',
    name: 'Gold',
    description: 'Parameter Header',
  },
};

export function resolveMonChartCssColor(raw?: string | null): string {
  if (!raw) return '#d0e4a6';
  const c = raw.trim();
  if (c.startsWith('#')) return c;
  const lower = c.toLowerCase();
  switch (lower) {
    case 'white':
      return '#ffffff';
    case 'pink':
      return '#f8bbd0';
    case 'yellow':
      return '#ffeb3b';
    case 'green':
      return '#81c784';
    case 'red':
      return '#ef5350';
    case 'blue':
      return '#64b5f6';
    case 'violet':
      return '#ce93d8';
    case 'gold':
      return '#a66c18';
    default:
      return c;
  }
}

export function getMonChartTextColor(bgColor: string): string {
  const norm = bgColor.toLowerCase();
  if (norm === '#ffffff' || norm === 'white') return '#0f172a';
  if (norm === '#f8bbd0' || norm === 'pink') return '#881337';
  if (norm === '#ffeb3b' || norm === 'yellow') return '#713f12';
  if (norm === '#81c784' || norm === 'green') return '#14532d';
  if (norm === '#ef5350' || norm === 'red') return '#ffffff';
  if (norm === '#64b5f6' || norm === 'blue') return '#1e3a8a';
  if (norm === '#ce93d8' || norm === 'violet') return '#4a044e';
  if (norm === '#d0e4a6') return '#2d4a12';
  if (norm === '#a66c18') return '#ffffff';
  return '#1e293b';
}

function hasAnyAntagonistEntered(values?: MonitoringChartValues): boolean {
  if (!values?.antagonist) return false;
  return Object.values(values.antagonist).some(
    (v) => v && v.trim() !== '' && v.trim() !== '0'
  );
}

export function resolveMonSheetColumnColor(
  option: string | undefined | null,
  colKey: string,
  values?: MonitoringChartValues
): MonSheetColorStyle {
  // 1. Check if an explicit color is stored in values (e.g. from DB CycMCRDColor)
  const savedColor = values?.color?.[colKey] || values?._color?.[colKey];
  if (savedColor) {
    const hex = resolveMonChartCssColor(savedColor);
    const text = getMonChartTextColor(hex);
    return {
      bg: hex,
      text,
      border: hex,
      badge: '',
      name: savedColor,
      description: 'Saved Clinical Color',
    };
  }

  // 2. Special explicit columns
  if (colKey === 'trigger') return MON_SHEET_COLORS.green;
  if (colKey === 'opu') return MON_SHEET_COLORS.red;
  if (colKey === 'prog') return MON_SHEET_COLORS.violet;

  // 3. Check cell data in current column
  if (values) {
    // Check if HCG / Trigger entered on this day
    const rhcg = values.rhcg?.[colKey]?.trim();
    if (rhcg && rhcg !== '0' && rhcg.toLowerCase() !== 'false' && rhcg.toLowerCase() !== 'no') {
      return MON_SHEET_COLORS.green;
    }

    // Check if Progesterone entered on this day (for HRT / ModifiedHRT)
    const pessary = values.pessary?.[colKey]?.trim();
    const dose = values.dose?.[colKey]?.trim();
    if (pessary || (dose && (option === 'HRT' || option === 'ModifiedHRT'))) {
      return MON_SHEET_COLORS.violet;
    }

    // Check if Terminated
    if (values.meta?.terminated === 'yes' && values.meta?.terminatedDay === colKey) {
      return MON_SHEET_COLORS.blue;
    }
  }

  // 4. Assignment Excel columns: Day 0 / 1 / 6 / 9 + Trigger / OPU / Prog.
  const opt = option || 'Antagonist';

  if (colKey === 'd0') return MON_SHEET_COLORS.white;
  if (colKey === 'd1') return MON_SHEET_COLORS.pink;

  if (opt === 'Antagonist' && colKey === 'd6') {
    const antagVal = values?.antagonist?.[colKey]?.trim();
    if ((antagVal && antagVal !== '0') || !hasAnyAntagonistEntered(values)) {
      return MON_SHEET_COLORS.yellow;
    }
  }

  if ((opt === 'Agonist' || opt === 'HRT') && colKey === 'd6') {
    return MON_SHEET_COLORS.yellow;
  }

  return MON_SHEET_COLORS.sage;
}

export function emptyMonitoringChart(layout: MonitoringSheetLayout): MonitoringChartValues {
  const values: MonitoringChartValues = {};
  if (layout.orientation === 'day-rows') {
    const count = layout.dayCount || 7;
    for (let i = 1; i <= count; i += 1) {
      values[`d${i}`] = {};
      for (const col of layout.columns) {
        values[`d${i}`][col.key] = col.key === 'day' ? String(i) : '';
      }
    }
    values.meta = { terminated: '', reason: '', note: '' };
    return values;
  }
  for (const row of layout.rows) {
    values[row.key] = {};
    for (const col of layout.columns) values[row.key][col.key] = '';
  }
  return values;
}
