export interface OocyteItem {
  id: string;
  oocyteId: string;
  collectionDateTime: string;
  maturity: 'MII' | 'MI' | 'GV' | 'Degenerated';
  morphologyGrade: 'A' | 'B' | 'C' | '-';
  linkedSpermId: string;
  status: 'Retrieved' | 'Fertilized' | 'Immature' | 'Degenerated' | 'Discarded';
  fertilizationResult?: '2PN' | '1PN' | '3PN' | '0PN' | 'Degenerate';
  embryoId?: string;
  day3Grade?: string;
  day5Grade?: string;
  cryoStrawNo?: string;
  transferStatus?: 'Transferred' | 'Cryopreserved' | 'Culturing' | 'Discarded';
}

export type LabSource = 'IVF' | 'ICSI';

export interface SourceSummary {
  source: LabSource;
  hasRecord: boolean;
  recordId: string;
  cycleId: string;
  cycleDate: string;
  retrieved: number;
  matureMII: number;
  immature: number;
  degenerated: number;
  fertilized2PN: number;
  abnormalPn: number;
  unfertilized: number;
  cleavage: number;
  blastocyst: number;
  cryopreserved: number;
  transferred: number;
  stuck: number;
  discard: number;
  donated: number;
  donatedForResearch: number;
  allotted?: number;
}

export interface EtEmbryoRow {
  id: string;
  source: LabSource;
  celler: string;
  grade: string;
  action: number;
  actionLabel: string;
  location: string;
  remark: string;
  cycleId: string;
}

export interface OocyteEmbryoOverview {
  ivf: SourceSummary;
  icsi: SourceSummary;
  embryos: EtEmbryoRow[];
}
