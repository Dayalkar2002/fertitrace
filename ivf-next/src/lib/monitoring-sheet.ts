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

const DAY_0_9: MonitoringColumn[] = [
  { key: 'd0', label: 'Day 0' },
  { key: 'd1', label: 'Day 1' },
  { key: 'd6', label: 'Day 6' },
  { key: 'd9', label: 'Day 9' },
];

/** Two measurable follicles per ovary, entered as size in mm (e.g. "18 x 20"). */
const FOLLICLE_ROWS: MonitoringRowDef[] = [
  { key: 'folRt', label: 'Follicle Count (Rt)', kind: 'number' },
  { key: 'folRt1', label: 'Rt Follicle 1 (mm)', kind: 'text' },
  { key: 'folRt2', label: 'Rt Follicle 2 (mm)', kind: 'text' },
  { key: 'folLt', label: 'Follicle Count (Lt)', kind: 'number' },
  { key: 'folLt1', label: 'Lt Follicle 1 (mm)', kind: 'text' },
  { key: 'folLt2', label: 'Lt Follicle 2 (mm)', kind: 'text' },
];

const STIM_ROWS: MonitoringRowDef[] = [
  { key: 'date', label: 'Date', kind: 'date' },
  { key: 'drugDose', label: 'Drug / Dose', kind: 'text' },
  { key: 'frequency', label: 'Frequency', kind: 'text' },
  { key: 'lh', label: 'S.E. LH', kind: 'number' },
  { key: 'fsh', label: 'FSH', kind: 'number' },
  { key: 'e2', label: 'Estradiol (E2)', kind: 'number' },
  { key: 'prolactin', label: 'Prolactin', kind: 'number' },
  { key: 'endo', label: 'Endo. Thickness', kind: 'text' },
  ...FOLLICLE_ROWS,
  { key: 'rhcg', label: 'r.HCG', kind: 'text' },
  { key: 'time', label: 'Date / Time', kind: 'text' },
];

const LAYOUTS: Record<MonitoringSheetOption, MonitoringSheetLayout> = {
  Agonist: {
    option: 'Agonist',
    title: 'Agonist Cycle Monitoring Chart',
    hint: 'Days across the top, same layout as the assignment Excel. Fill this on Cycle Creation after the protocol is selected.',
    columns: [...DAY_0_9, { key: 'trigger', label: 'Trigger' }, { key: 'opu', label: 'OPU' }],
    rows: [...STIM_ROWS, { key: 'gnrh', label: 'GnRH Agonist', kind: 'text' }],
  },
  Antagonist: {
    option: 'Antagonist',
    title: 'Antagonist Cycle Monitoring Chart',
    hint: 'Antagonist start is tracked beside the standard stim days.',
    columns: [...DAY_0_9, { key: 'trigger', label: 'Trigger' }, { key: 'opu', label: 'OPU' }],
    rows: [...STIM_ROWS, { key: 'antagonist', label: 'Antagonist', kind: 'text' }, { key: 'gnrh', label: 'GnRH Agonist', kind: 'text' }],
  },
  HRT: {
    option: 'HRT',
    title: 'HRT Cycle Monitoring Chart',
    hint: 'Estrogen build-up through progesterone conversion. Used for FET / recipient lining.',
    columns: [...DAY_0_9, { key: 'prog', label: 'Prog. Conversion' }],
    rows: [
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'drug1', label: 'Drug 1', kind: 'text' },
      { key: 'drug2', label: 'Drug 2', kind: 'text' },
      { key: 'estrogen', label: 'Estrogen', kind: 'text' },
      { key: 'e2', label: 'Estradiol (E2)', kind: 'number' },
      { key: 'endo', label: 'Endo. Thickness', kind: 'text' },
      { key: 'pessary', label: 'Progesterone pessary', kind: 'text' },
      { key: 'dose', label: 'Dose', kind: 'text' },
      { key: 'time', label: 'Date / Time', kind: 'text' },
    ],
  },
  ModifiedHRT: {
    option: 'ModifiedHRT',
    title: 'Modified Natural Cycle Monitoring Chart',
    hint: 'Fewer scan days, up to four drug/dose lines, then trigger and conversion.',
    columns: [
      { key: 'd0', label: 'Day 0' },
      { key: 'd1', label: 'Day 1' },
      { key: 'd9', label: 'Day 9' },
      { key: 'trigger', label: 'Trigger' },
      { key: 'prog', label: 'Prog. Conversion' },
    ],
    rows: [
      { key: 'date', label: 'Date', kind: 'date' },
      { key: 'drug1', label: 'Drug / Dose 1', kind: 'text' },
      { key: 'drug2', label: 'Drug / Dose 2', kind: 'text' },
      { key: 'drug3', label: 'Drug / Dose 3', kind: 'text' },
      { key: 'drug4', label: 'Drug / Dose 4', kind: 'text' },
      { key: 'lh', label: 'S.E. LH', kind: 'number' },
      { key: 'e2', label: 'Estradiol (E2)', kind: 'number' },
      { key: 'endo', label: 'Endo. Thickness', kind: 'text' },
      ...FOLLICLE_ROWS,
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
