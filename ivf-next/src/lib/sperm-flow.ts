/**
 * SMART + Excel-driven sperm registration rules.
 * Sources:
 * - SMART Cycle.aspx / IUI.aspx analysis popups
 * - indication master for cycle id.xlsx
 * - Flow Chart For IUI Cycle.xlsx
 */

export type SpermModule = 'IUI' | 'CYCLE' | 'SEMEN_ANALYSIS' | 'CRYOPRESERVATION';

export type SpermSource = 'Husband / Partner' | 'Donor';
export type SampleState = 'Fresh' | 'Frozen' | 'Thawed / Prepared';
export type IntendedUse = 'Semen Analysis' | 'IUI' | 'IVF / ICSI' | 'Cryopreservation';
export type SemenAnalysisType = 'HSA' | 'SQA';
export type AnalysisEntryPath = 'cycle' | 'iui';
export type CycleIndication = 'IVF' | 'ICSI';
export type CycleSpermId = 'husband_fresh' | 'husband_frozen' | 'donor_frozen';
export type CryoType = 'Fresh' | 'Frozen';

export type IuiIndication =
  | 'HSA'
  | 'SQA'
  | 'TIC / FM'
  | 'HUSBAND SINGLE IUI'
  | 'HUSBAND DOUBLE IUI'
  | 'HUSBAND THAW SINGLE'
  | 'HUSBAND THAW DOUBLE'
  | 'DONOR SINGLE IUI'
  | 'DONOR DOUBLE IUI';

export const IUI_INDICATIONS: { value: IuiIndication; label: string }[] = [
  { value: 'HSA', label: 'HSA — Husband Semen Analysis' },
  { value: 'SQA', label: 'SQA — Semen Qualitative Analysis' },
  { value: 'TIC / FM', label: 'TIC / FM — Timed Intercourse / Follicular Study' },
  { value: 'HUSBAND SINGLE IUI', label: 'HUSBAND SINGLE IUI' },
  { value: 'HUSBAND DOUBLE IUI', label: 'HUSBAND DOUBLE IUI' },
  { value: 'HUSBAND THAW SINGLE', label: 'HUSBAND THAW SINGLE' },
  { value: 'HUSBAND THAW DOUBLE', label: 'HUSBAND THAW DOUBLE' },
  { value: 'DONOR SINGLE IUI', label: 'DONOR SINGLE IUI' },
  { value: 'DONOR DOUBLE IUI', label: 'DONOR DOUBLE IUI' },
];

export const SPERM_MODULES: { value: SpermModule; label: string; hint: string }[] = [
  { value: 'IUI', label: 'IUI', hint: 'Uterus & ovaries indication (SMART IUI.aspx)' },
  { value: 'CYCLE', label: 'Patient Cycle', hint: 'IVF / ICSI analysis from Cycle.aspx' },
  { value: 'SEMEN_ANALYSIS', label: 'Semen Analysis', hint: 'HSA / SQA via Cycle or IUI' },
  { value: 'CRYOPRESERVATION', label: 'Cryopreservation', hint: 'Husband or Donor Fresh freeze / Frozen bank' },
];

export interface SpermFlowSelection {
  module: SpermModule;
  iuiIndication: IuiIndication;
  cycleIndication: CycleIndication;
  cycleSpermId: CycleSpermId;
  cryoType: CryoType;
  cryoSource: SpermSource;
  analysisType: SemenAnalysisType;
  analysisEntryPath: AnalysisEntryPath;
}

export interface SpermFlowDerived {
  spermSource: SpermSource;
  sampleState: SampleState;
  intendedUse: IntendedUse;
  semenAnalysisType: SemenAnalysisType | null;
  strawMode: 'na' | 'husband_frozen' | 'donor_frozen';
  sourceLocked: boolean;
  sampleStateLocked: boolean;
  allowDonor: boolean;
  allowFresh: boolean;
  allowFrozen: boolean;
  beforeProcessing: 'enabled' | 'disabled' | 'na';
  afterProcessing: 'enabled' | 'disabled' | 'na' | 'survival24';
  preFreezing: 'na' | 'readonly' | 'edit';
  postThaw: 'na' | 'edit';
  follicularStudy: 'compulsory' | 'optional' | 'na';
  radioLocked: boolean;
  iuiInscription: 'SINGLE' | 'DOUBLE' | null;
  reportPages: 1 | 2 | null;
  summaryTitle: string;
  processingLabel: 'PRE WASH + POST WASH' | 'PRE THAW - POST THAW' | null;
  captureOnRetrieval: boolean;
  skipAndrology: boolean;
  whereToUse: 'IUI' | 'IVF' | 'ICSI' | null;
  collectionRequired: boolean;
}

const IUI_MAP: Record<IuiIndication, Partial<SpermFlowDerived> & { spermSource: SpermSource; sampleState: SampleState; intendedUse: IntendedUse }> = {
  HSA: {
    spermSource: 'Husband / Partner',
    sampleState: 'Fresh',
    intendedUse: 'Semen Analysis',
    semenAnalysisType: 'HSA',
    strawMode: 'na',
    beforeProcessing: 'enabled',
    afterProcessing: 'disabled',
    preFreezing: 'na',
    postThaw: 'na',
    follicularStudy: 'optional',
    radioLocked: true,
    iuiInscription: null,
    reportPages: 1,
    summaryTitle: 'Husband Semen Analysis',
    collectionRequired: true,
    whereToUse: null,
  },
  SQA: {
    spermSource: 'Husband / Partner',
    sampleState: 'Fresh',
    intendedUse: 'Semen Analysis',
    semenAnalysisType: 'SQA',
    strawMode: 'na',
    beforeProcessing: 'enabled',
    afterProcessing: 'survival24',
    preFreezing: 'na',
    postThaw: 'na',
    follicularStudy: 'optional',
    radioLocked: true,
    iuiInscription: null,
    reportPages: 1,
    summaryTitle: 'Semen Qualitative Analysis',
    collectionRequired: true,
    whereToUse: null,
  },
  'TIC / FM': {
    spermSource: 'Husband / Partner',
    sampleState: 'Fresh',
    intendedUse: 'IUI',
    semenAnalysisType: null,
    strawMode: 'na',
    beforeProcessing: 'na',
    afterProcessing: 'na',
    preFreezing: 'na',
    postThaw: 'na',
    follicularStudy: 'compulsory',
    radioLocked: true,
    iuiInscription: null,
    reportPages: 1,
    summaryTitle: 'TIC / FM',
    skipAndrology: true,
    collectionRequired: false,
    whereToUse: null,
  },
  'HUSBAND SINGLE IUI': {
    spermSource: 'Husband / Partner',
    sampleState: 'Fresh',
    intendedUse: 'IUI',
    strawMode: 'na',
    beforeProcessing: 'enabled',
    afterProcessing: 'enabled',
    preFreezing: 'na',
    postThaw: 'na',
    follicularStudy: 'compulsory',
    radioLocked: true,
    iuiInscription: 'SINGLE',
    reportPages: 2,
    summaryTitle: 'HUSBAND SINGLE IUI',
    collectionRequired: true,
    whereToUse: 'IUI',
  },
  'HUSBAND DOUBLE IUI': {
    spermSource: 'Husband / Partner',
    sampleState: 'Fresh',
    intendedUse: 'IUI',
    strawMode: 'na',
    beforeProcessing: 'enabled',
    afterProcessing: 'enabled',
    preFreezing: 'na',
    postThaw: 'na',
    follicularStudy: 'compulsory',
    radioLocked: true,
    iuiInscription: 'DOUBLE',
    reportPages: 2,
    summaryTitle: 'HUSBAND DOUBLE IUI',
    collectionRequired: true,
    whereToUse: 'IUI',
  },
  'HUSBAND THAW SINGLE': {
    spermSource: 'Husband / Partner',
    sampleState: 'Frozen',
    intendedUse: 'IUI',
    strawMode: 'husband_frozen',
    beforeProcessing: 'na',
    afterProcessing: 'na',
    preFreezing: 'readonly',
    postThaw: 'edit',
    follicularStudy: 'compulsory',
    radioLocked: true,
    iuiInscription: 'SINGLE',
    reportPages: 1,
    summaryTitle: 'HUSBAND THAW SINGLE',
    collectionRequired: false,
    whereToUse: 'IUI',
  },
  'HUSBAND THAW DOUBLE': {
    spermSource: 'Husband / Partner',
    sampleState: 'Frozen',
    intendedUse: 'IUI',
    strawMode: 'husband_frozen',
    beforeProcessing: 'na',
    afterProcessing: 'na',
    preFreezing: 'readonly',
    postThaw: 'edit',
    follicularStudy: 'compulsory',
    radioLocked: true,
    iuiInscription: 'DOUBLE',
    reportPages: 2,
    summaryTitle: 'HUSBAND THAW DOUBLE',
    collectionRequired: false,
    whereToUse: 'IUI',
  },
  'DONOR SINGLE IUI': {
    spermSource: 'Donor',
    sampleState: 'Frozen',
    intendedUse: 'IUI',
    strawMode: 'donor_frozen',
    beforeProcessing: 'enabled',
    afterProcessing: 'enabled',
    preFreezing: 'readonly',
    postThaw: 'edit',
    follicularStudy: 'compulsory',
    radioLocked: true,
    iuiInscription: 'SINGLE',
    reportPages: 1,
    summaryTitle: 'DONOR SINGLE IUI',
    collectionRequired: false,
    whereToUse: 'IUI',
  },
  'DONOR DOUBLE IUI': {
    spermSource: 'Donor',
    sampleState: 'Frozen',
    intendedUse: 'IUI',
    strawMode: 'donor_frozen',
    beforeProcessing: 'enabled',
    afterProcessing: 'enabled',
    preFreezing: 'readonly',
    postThaw: 'edit',
    follicularStudy: 'compulsory',
    radioLocked: true,
    iuiInscription: 'DOUBLE',
    reportPages: 2,
    summaryTitle: 'DONOR DOUBLE IUI',
    collectionRequired: false,
    whereToUse: 'IUI',
  },
};

const defaults: SpermFlowDerived = {
  spermSource: 'Husband / Partner',
  sampleState: 'Fresh',
  intendedUse: 'IUI',
  semenAnalysisType: null,
  strawMode: 'na',
  sourceLocked: true,
  sampleStateLocked: true,
  allowDonor: false,
  allowFresh: true,
  allowFrozen: false,
  beforeProcessing: 'enabled',
  afterProcessing: 'enabled',
  preFreezing: 'na',
  postThaw: 'na',
  follicularStudy: 'optional',
  radioLocked: true,
  iuiInscription: null,
  reportPages: 1,
  summaryTitle: '',
  processingLabel: null,
  captureOnRetrieval: false,
  skipAndrology: false,
  whereToUse: null,
  collectionRequired: true,
};

export function defaultSelectionFromMode(mode?: string | null): SpermFlowSelection {
  const m = (mode || '').trim();
  if (m === 'Cryopreservation') {
    return {
      module: 'CRYOPRESERVATION',
      iuiIndication: 'HUSBAND SINGLE IUI',
      cycleIndication: 'ICSI',
      cycleSpermId: 'husband_fresh',
      cryoType: 'Fresh',
      cryoSource: 'Husband / Partner',
      analysisType: 'HSA',
      analysisEntryPath: 'iui',
    };
  }
  if (m === 'Semen Analysis') {
    return {
      module: 'SEMEN_ANALYSIS',
      iuiIndication: 'HSA',
      cycleIndication: 'ICSI',
      cycleSpermId: 'husband_fresh',
      cryoType: 'Fresh',
      cryoSource: 'Husband / Partner',
      analysisType: 'HSA',
      analysisEntryPath: 'iui',
    };
  }
  if (m === 'IVF / ICSI') {
    return {
      module: 'CYCLE',
      iuiIndication: 'HUSBAND SINGLE IUI',
      cycleIndication: 'ICSI',
      cycleSpermId: 'husband_fresh',
      cryoType: 'Fresh',
      cryoSource: 'Husband / Partner',
      analysisType: 'HSA',
      analysisEntryPath: 'cycle',
    };
  }
  return {
    module: 'IUI',
    iuiIndication: 'HUSBAND SINGLE IUI',
    cycleIndication: 'ICSI',
    cycleSpermId: 'husband_fresh',
    cryoType: 'Fresh',
    cryoSource: 'Husband / Partner',
    analysisType: 'HSA',
    analysisEntryPath: 'iui',
  };
}

export function deriveSpermFlow(sel: SpermFlowSelection): SpermFlowDerived {
  if (sel.module === 'IUI') {
    const row = IUI_MAP[sel.iuiIndication];
    return {
      ...defaults,
      ...row,
      sourceLocked: true,
      sampleStateLocked: true,
      allowDonor: row.spermSource === 'Donor',
      allowFresh: row.sampleState === 'Fresh',
      allowFrozen: row.sampleState === 'Frozen',
      semenAnalysisType: row.semenAnalysisType ?? (sel.iuiIndication === 'HSA' ? 'HSA' : sel.iuiIndication === 'SQA' ? 'SQA' : null),
    };
  }

  if (sel.module === 'SEMEN_ANALYSIS') {
    const viaIui = sel.analysisEntryPath === 'iui';
    const indication: IuiIndication = sel.analysisType === 'SQA' ? 'SQA' : 'HSA';
    const row = IUI_MAP[indication];
    return {
      ...defaults,
      ...row,
      semenAnalysisType: sel.analysisType,
      sourceLocked: true,
      sampleStateLocked: true,
      allowDonor: false,
      allowFresh: true,
      allowFrozen: false,
      summaryTitle: viaIui
        ? `${row.summaryTitle} (via IUI)`
        : `${row.summaryTitle} (via Patient Cycle)`,
      captureOnRetrieval: !viaIui,
      whereToUse: viaIui ? null : sel.cycleIndication,
    };
  }

  if (sel.module === 'CRYOPRESERVATION') {
    const frozen = sel.cryoType === 'Frozen';
    const donor = sel.cryoSource === 'Donor';
    return {
      ...defaults,
      spermSource: donor ? 'Donor' : 'Husband / Partner',
      sampleState: frozen ? 'Frozen' : 'Fresh',
      intendedUse: 'Cryopreservation',
      semenAnalysisType: null,
      strawMode: frozen ? (donor ? 'donor_frozen' : 'husband_frozen') : 'na',
      sourceLocked: false,
      sampleStateLocked: false,
      allowDonor: true,
      allowFresh: true,
      allowFrozen: true,
      beforeProcessing: frozen ? 'na' : 'enabled',
      afterProcessing: frozen ? 'na' : 'na',
      preFreezing: frozen ? 'readonly' : 'edit',
      postThaw: frozen ? 'edit' : 'na',
      collectionRequired: !frozen,
      summaryTitle: donor
        ? frozen
          ? 'Donor Frozen Semen Bank'
          : 'Donor Fresh Cryopreservation'
        : frozen
          ? 'Husband Frozen Semen Bank'
          : 'Husband Fresh Cryopreservation',
      processingLabel: frozen ? 'PRE THAW - POST THAW' : 'PRE WASH + POST WASH',
    };
  }

  // Patient Cycle — IVF / ICSI indication master
  const id = sel.cycleSpermId;
  const frozenHusband = id === 'husband_frozen';
  const donor = id === 'donor_frozen';
  return {
    ...defaults,
    spermSource: donor ? 'Donor' : 'Husband / Partner',
    sampleState: id === 'husband_fresh' ? 'Fresh' : 'Frozen',
    intendedUse: 'IVF / ICSI',
    semenAnalysisType: null,
    strawMode: donor ? 'donor_frozen' : frozenHusband ? 'husband_frozen' : 'na',
    sourceLocked: true,
    sampleStateLocked: true,
    allowDonor: true,
    allowFresh: true,
    allowFrozen: true,
    beforeProcessing: id === 'husband_fresh' ? 'enabled' : 'na',
    afterProcessing: id === 'husband_fresh' ? 'enabled' : 'na',
    preFreezing: id === 'husband_fresh' ? 'na' : 'readonly',
    postThaw: id === 'husband_fresh' ? 'na' : 'edit',
    collectionRequired: id === 'husband_fresh',
    processingLabel: id === 'husband_fresh' ? 'PRE WASH + POST WASH' : 'PRE THAW - POST THAW',
    captureOnRetrieval: true,
    whereToUse: sel.cycleIndication,
    summaryTitle: `${sel.cycleIndication} • ${donor ? 'Donor Frozen' : frozenHusband ? 'Husband Frozen' : 'Husband Fresh'}`,
  };
}
