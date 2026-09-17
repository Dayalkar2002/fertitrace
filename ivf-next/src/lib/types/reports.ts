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

export const ART_CYCLE_TYPES = ['OP+ET', 'OR+ET', 'FET', 'ER', 'OF'] as const;
export type ArtCycleTypeIndex = 0 | 1 | 2 | 3 | 4;

export interface ArtCycleOption {
  id: string;
  label: string;
}

export interface ArtCycleSummaryResult {
  cycleId: string;
  type: ArtCycleTypeIndex;
  typeLabel: string;
  title: string;
  sections: ReportSection[];
}
