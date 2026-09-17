export interface SemenDonorListRow {
  donorIdSrNo: number;
  donorId: string;
  date: string;
  thawId: string;
  location: string;
}

export interface SemenDonorLab {
  id: number;
  name: string;
}

export interface SemenDonorDetail {
  donorIdSrNo: number;
  donorId: string;
  date: string;
  dateDisplay: string;
  semenQty: string;
  semenCount: string;
  semenMotility: string;
  semenProgMotility: string;
  grade1: string;
  grade2: string;
  grade3: string;
  grade4: string;
  semenWbc: string;
  semenRbc: string;
  bloodGroup: string;
  age: string;
  looks: string;
  weight: string;
  height: string;
  facialFeature: string;
  hairColor: string;
  eyesColor: string;
  skinTone: string;
  congenitalDeformities: string;
  geneticallyAcquiredDisease: string;
  chronicIllness: string;
  diseaseRelative: string;
  diseaseFamily: string;
  habits: string;
  qualification: string;
  maritalStatus: string;
  workingStatus: string;
  bloodChemistryPanel: string;
  cbc: string;
  urinalysis: string;
  karytyping: string;
  hiv: string;
  vdrl: string;
  hcv: string;
  thalesemia: string;
  quarantinedPeriod: string;
  remarks: string;
  location: string;
  hbsAg: string;
  donorLabId: number;
  aadhar: string;
  thawId: string;
}

export type SemenDonorSaveInput = Omit<SemenDonorDetail, 'dateDisplay' | 'thawId'> & {
  thawId?: string;
};

export interface SemenSelfRecord {
  freezingId: string;
  cycSSID: number;
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
  epithCell: string;
  roundCell: string;
  recovery: string;
  hams: boolean;
  location: string;
  frozenDate: string;
  frozenDateInput: string;
  thawDate: string;
  thawId: string;
  discardDate: string;
  validTill: string;
  validTillInput: string;
  husbandAadhar: string;
  abstinence: string;
  labOptId: number;
  methodId: number;
  collProbId: number;
  contaminationId: number;
  appearanceId: number;
  colourId: number;
  viscosityId: number;
  nmph1: string;
  nmph2: string;
  liqId: number;
  timeOfLiq: string;
  agglutination: string;
  antibodies: string;
  fructoseId: number;
  linearityId: number;
  velocity: string;
  ph: string;
  impression: string;
}
