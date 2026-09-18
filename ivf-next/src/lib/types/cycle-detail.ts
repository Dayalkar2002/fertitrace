import type { LookupItem } from '@/lib/types/master';

export interface CycleHistoryFindings {
  idiopathic: boolean;
  if: boolean;
  mf: boolean;
  dor: boolean;
  ovu: boolean;
  tf: boolean;
  cf: boolean;
  endo: boolean;
  other: boolean;
}

export interface CycleHistoryAttempt {
  cycleDate: string;
  ivf: boolean;
  icsi: boolean;
  stimProtId: number;
  lmp: string;
  stimDetails: string;
  he2: number;
  prgs: number;
  lh: number;
  hcg: string;
  ovum: string;
  oocytes: number;
  fertilized: number;
  remark: string;
}

export interface CycleHistory {
  height: number;
  weight: number;
  bmi: number;
  allergyId: number;
  medSurHistory: string;
  isg: number;
  isp: number;
  isAb: number;
  isEct: number;
  isDuration: number;
  findings: CycleHistoryFindings;
  endoOpt: number;
  otherTxt: string;
  indication: string;
  hlmp: string;
  hsg: string;
  stimProtId: number;
  attemptCount: number;
  attemptPrev: number;
  attemptEw: number;
  currentDate: string;
  comments: string;
  monitoringSheet: string;
  historyAttempts: CycleHistoryAttempt[];
}

export interface CycleSurvival {
  conc: number;
  motility: number;
  nmph1: number;
  nmph2: number;
  date: string;
  recovery: string;
  antibodies: string;
  saResult: { positive: boolean; borderline: boolean; negative: boolean };
  gnrh: { none: boolean; stopLupron: boolean; luteal: boolean };
  dosage: boolean;
  spermSource: { donor: boolean; donorCryo: boolean; husband: boolean; husbandCryo: boolean };
  transferType: { ivf: boolean; gift: boolean; zift: boolean; cryoAll: boolean };
  consent: { icsi: boolean; hatching: boolean; cryo: boolean; immatures: boolean; apa: boolean };
  comments: string;
}

export interface MonitoringDay0 {
  date: string;
  fshDrug1: number;
  fshDrug1Dose: number;
  fshDrug2: number;
  fshDrug2Dose: number;
  hmgDrug1: number;
  hmgDrug1Dose: number;
  hmgDrug2: number;
  hmgDrug2Dose: number;
  cloDrug1: number;
  cloDrug1Dose: number;
  antaDrug1: number;
  antaDrug1Dose: number;
  othDrug1: number;
  othDrug1Dose: number;
  gnrha: number;
  e2: number;
  lh: number;
  fsh: number;
  tsh: number;
  prol: number;
  prog: number;
  remarks: string;
  ultrasound: string;
  endometrium: string;
}

export interface MonitoringRemDay {
  day: number;
  date: string;
  fshDrug1: number;
  fshDrug2: number;
  hmgDrug1: number;
  hmgDrug2: number;
  cloDrug1: number;
  antaDrug1: number;
  othDrug1: number;
  e2: number;
  lh: number;
  fsh: number;
  gnrha: number;
  follicleLeft: number;
  follicleRight: number;
  endometrium: string;
  remarks: string;
  hcg: boolean;
  hcgDose: number;
  ultrasound: string;
}

export interface CycleMonitoring {
  day0: MonitoringDay0;
  remDays: MonitoringRemDay[];
}

export interface CycleOutcome {
  outcomeDate: string;
  bhcgDate: string;
  value: number;
  noSacs: number;
  ptDay: number;
  outcome: number;
  pregOpt: number;
  pregDelOpt: number;
  postTreatment: string;
  advice: string;
  treatment: string;
}

export interface TabMasters {
  allergies: LookupItem[];
  stimProtocols: LookupItem[];
  fshDrugs: LookupItem[];
  hmgDrugs: LookupItem[];
  cloDrugs: LookupItem[];
  antaDrugs: LookupItem[];
  otherDrugs: LookupItem[];
  catheters: LookupItem[];
}

export const emptyTabMasters: TabMasters = {
  allergies: [],
  stimProtocols: [],
  fshDrugs: [],
  hmgDrugs: [],
  cloDrugs: [],
  antaDrugs: [],
  otherDrugs: [],
  catheters: [],
};
