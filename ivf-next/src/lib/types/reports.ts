export type ReportRow = Record<string, unknown>;

export interface ReportSection {
  name: string;
  rows: ReportRow[];
}

export interface IuiReportId {
  iuiId: string;
  label: string;
}

export interface IuiSummaryResult {
  iuiId: string;
  indication: string;
  iuiKind: 'Single IUI' | 'Double IUI';
  uterusFlags: string;
  echoPattern: string;
  sections: ReportSection[];
}

export const ART_CYCLE_TYPES = [
  'OP+ET',
  'FET',
  'OF',
  'THO',
  'ER',
  'OD',
  'OR',
] as const;
export type ArtCycleTypeIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const ART_CYCLE_LABELS: Record<string, string> = {
  'OP+ET': 'OP+ET',
  'FET': 'FET',
  'OF': 'Oocyte Freezing',
  'THO': 'THO+ET',
  'ER': 'ER+ET',
  'OD': 'OD',
  'OR': 'OR+ET',
};

export interface ArtCycleOption {
  id: string;
  label: string;
}

export interface ArtCycleSummaryResult {
  cycleId: string;
  type: ArtCycleTypeIndex;
  typeLabel: string;
  title: string;
  underPreparation?: boolean;
  sections: ReportSection[];
}
