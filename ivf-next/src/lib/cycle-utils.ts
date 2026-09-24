export const CYCLE_TYPE_MAP: Record<string, Record<string, string>> = {
  // SMART Cycle Types
  Fresh: {
    husband_fresh: 'Fresh Cycle - Conventional IVF (Self Oocyte + Husband Fresh)',
    husband_cryo: 'Fresh Cycle - IVF with Frozen Husband Semen',
    donor_fresh: 'Fresh Cycle - IVF (Self Oocyte + Donor Fresh Semen)',
    donor_cryo: 'Fresh Cycle - IVF (Self Oocyte + Donor Cryo Semen)',
    surgical_fresh: 'Fresh Cycle - ICSI with Surgical Sperm',
    surgical_frozen: 'Fresh Cycle - ICSI with Frozen Surgical Sperm',
  },
  FET: {
    husband_fresh: 'Frozen Thaw Embryo Transfer (FET)',
    husband_cryo: 'FET with Frozen Husband Semen',
    donor_fresh: 'FET with Donor Fresh Semen',
    donor_cryo: 'FET with Donor Cryo Semen',
    surgical_fresh: 'FET with Surgical Sperm',
    surgical_frozen: 'FET with Frozen Surgical Sperm',
  },
  FrozenOocytes: {
    husband_fresh: 'Frozen Oocyte (FZO) - Cryopreservation',
    husband_cryo: 'Frozen Oocyte (FZO) - Frozen Husband Semen',
    donor_fresh: 'Frozen Oocyte (FZO) - Donor Fresh Semen',
    donor_cryo: 'Frozen Oocyte (FZO) - Donor Cryo Semen',
    surgical_fresh: 'Frozen Oocyte (FZO) - Surgical Sperm',
    surgical_frozen: 'Frozen Oocyte (FZO) - Frozen Surgical',
  },
  ThawOocytes: {
    husband_fresh: 'Thaw Oocyte (THO) + Husband Fresh',
    husband_cryo: 'Thaw Oocyte (THO) + Husband Cryo',
    donor_fresh: 'Thaw Oocyte (THO) + Donor Fresh Semen',
    donor_cryo: 'Thaw Oocyte (THO) + Donor Cryo Semen',
    surgical_fresh: 'Thaw Oocyte (THO) + Surgical Sperm',
    surgical_frozen: 'Thaw Oocyte (THO) + Frozen Surgical',
  },
  ER: {
    husband_fresh: 'Embryo Recipient (ER) Cycle',
    husband_cryo: 'Embryo Recipient (ER) (Husband Cryo)',
    donor_fresh: 'Embryo Recipient (ER) (Donor Semen)',
    donor_cryo: 'Embryo Recipient (ER) (Donor Cryo)',
    surgical_fresh: 'Embryo Recipient (ER) (Surgical Sperm)',
    surgical_frozen: 'Embryo Recipient (ER) (Frozen Surgical)',
  },
  OD: {
    husband_fresh: 'Oocyte Donor (OD) + Husband Fresh',
    husband_cryo: 'Oocyte Donor (OD) + Husband Cryo',
    donor_fresh: 'Oocyte Donor (OD) + Donor Fresh Semen',
    donor_cryo: 'Oocyte Donor (OD) + Donor Cryo Semen',
    surgical_fresh: 'Oocyte Donor (OD) + Surgical Sperm',
    surgical_frozen: 'Oocyte Donor (OD) + Frozen Surgical Sperm',
  },
  OR: {
    husband_fresh: 'Oocyte Recipient (OR) + Husband Fresh',
    husband_cryo: 'Oocyte Recipient (OR) + Husband Cryo',
    donor_fresh: 'Oocyte Recipient (OR) + Donor Fresh Semen',
    donor_cryo: 'Oocyte Recipient (OR) + Donor Cryo Semen',
    surgical_fresh: 'Oocyte Recipient (OR) + Surgical Sperm',
    surgical_frozen: 'Oocyte Recipient (OR) + Frozen Surgical Sperm',
  },

  // Legacy key aliases for backward compatibility
  self_oocyte: {
    husband_fresh: 'Conventional IVF (Self Oocyte + Husband Fresh)',
    husband_cryo: 'IVF with Frozen Husband Semen',
    donor_fresh: 'IVF (Self Oocyte + Donor Fresh Semen)',
    donor_cryo: 'IVF (Self Oocyte + Donor Cryo Semen)',
    surgical_fresh: 'ICSI with Surgical Sperm (Self Oocyte)',
    surgical_frozen: 'ICSI with Frozen Surgical Sperm (Self Oocyte)',
  },
  donor_oocyte: {
    husband_fresh: 'Donor Oocyte + Husband Fresh',
    husband_cryo: 'Donor Oocyte + Husband Cryo',
    donor_fresh: 'Donor Oocyte + Donor Fresh Semen',
    donor_cryo: 'Donor Oocyte + Donor Cryo Semen',
    surgical_fresh: 'Donor Oocyte + Surgical Sperm',
    surgical_frozen: 'Donor Oocyte + Frozen Surgical Sperm',
  },
  oocyte_recipient: {
    husband_fresh: 'Oocyte Recipient + Husband Fresh',
    husband_cryo: 'Oocyte Recipient + Husband Cryo',
    donor_fresh: 'Oocyte Recipient + Donor Fresh Semen',
    donor_cryo: 'Oocyte Recipient + Donor Cryo Semen',
    surgical_fresh: 'Oocyte Recipient + Surgical Sperm',
    surgical_frozen: 'Oocyte Recipient + Frozen Surgical Sperm',
  },
  embryo_recipient: {
    husband_fresh: 'Embryo Recipient Cycle',
    husband_cryo: 'Embryo Recipient Cycle (Husband Cryo)',
    donor_fresh: 'Embryo Recipient Cycle (Donor Semen)',
    donor_cryo: 'Embryo Recipient Cycle (Donor Cryo)',
    surgical_fresh: 'Embryo Recipient Cycle (Surgical Sperm)',
    surgical_frozen: 'Embryo Recipient Cycle (Frozen Surgical)',
  },
};

export const MONITORING_SHEET_OPTIONS = [
  { value: 'Agonist', label: 'Agonist Cycle' },
  { value: 'Antagonist', label: 'Antagonist Cycle' },
  { value: 'HRT', label: 'HRT Cycle' },
  { value: 'ModifiedHRT', label: 'Modified Natural Cycle' },
  { value: 'IUI', label: 'IUI Monitoring Sheet' },
] as const;

export type MonitoringSheetOption = (typeof MONITORING_SHEET_OPTIONS)[number]['value'];

export const CYCLE_CREATION_TYPES = [
  { value: 'Fresh', label: 'Fresh cycle (FR)' },
  { value: 'FET', label: 'Frozen Thaw Embryo Transfer (FET)' },
  { value: 'FrozenOocytes', label: 'Frozen Oocyte (FZO)' },
  { value: 'ThawOocytes', label: 'Thaw Oocyte (THO)' },
  { value: 'ER', label: 'Embryo Recipient (ER)' },
  { value: 'OD', label: 'Oocyte Donor (OD)' },
  { value: 'OR', label: 'Oocyte Recipient (OR)' },
  { value: 'IUI', label: 'IUI' },
] as const;

/** IUI treatment choices from the IUI cycle creation Excel. HSA and SQA have no monitoring sheet. */
export const IUI_TREATMENT_OPTIONS = [
  { value: 'HSA', label: 'H S A', group: 'Fresh', monitoring: false },
  { value: 'SQA', label: 'SQA', group: 'Fresh', monitoring: false },
  { value: 'SingleHusband', label: 'Single Husband', group: 'Fresh', monitoring: true },
  { value: 'DoubleHusband', label: 'Double Husband', group: 'Fresh', monitoring: true },
  { value: 'FMTIC', label: 'FM/TIC', group: 'Fresh', monitoring: true },
  { value: 'ThawHusbandSingle', label: 'Thaw Husband single', group: 'Frozen', monitoring: true },
  { value: 'ThawHusbandDouble', label: 'Thaw Husband Double', group: 'Frozen', monitoring: true },
  { value: 'ThawDonorSingle', label: 'Thaw Donor Single', group: 'Frozen', monitoring: true },
  { value: 'ThawDonorDouble', label: 'Thaw Donor Double', group: 'Frozen', monitoring: true },
] as const;

export type SmartCycleType = (typeof CYCLE_CREATION_TYPES)[number]['value'];

export const SMART_SEMEN_IDS = ['husband_fresh', 'husband_cryo', 'donor_cryo'] as const;

export const TREATMENT_TYPES = [
  { value: 'Fresh', label: 'Fresh' },
  { value: 'Frozen', label: 'Frozen' },
] as const;

export const FALLBACK_PROTOCOLS = [
  'Long Protocol',
  'Short Protocol',
  'Ultra Long Protocol',
  'Mild Stimulation',
];

export const CYCLE_CREATION_STORAGE_KEY = 'fertitrace.cycleCreation';

export function parseMonitoringSheet(comments: string, fallback = ''): string {
  const match = comments.match(/\[\[MSO:([^\]]+)\]\]/i);
  return match?.[1]?.trim() || fallback;
}

export function stripMonitoringSheetMarker(comments: string): string {
  return comments.replace(/\s*\[\[MSO:[^\]]+\]\]\s*/gi, ' ').trim();
}

export function embedMonitoringSheetMarker(comments: string, option: string): string {
  const cleaned = stripMonitoringSheetMarker(comments);
  if (!option) return cleaned;
  return cleaned ? `${cleaned} [[MSO:${option}]]` : `[[MSO:${option}]]`;
}

export function computeCycleType(oocyteSource: string, semenSource: string): string {
  return (
    CYCLE_TYPE_MAP[oocyteSource]?.[semenSource] ??
    CYCLE_TYPE_MAP['Fresh']?.[semenSource] ??
    'IVF Treatment Cycle'
  );
}

export function showDonorOocyteDetails(oocyteSource: string): boolean {
  return oocyteSource === 'OD' || oocyteSource === 'donor_oocyte';
}

export function showOocyteRecipientDetails(oocyteSource: string): boolean {
  return oocyteSource === 'OR' || oocyteSource === 'oocyte_recipient';
}

export function showEmbryoRecipientDetails(oocyteSource: string): boolean {
  return oocyteSource === 'ER' || oocyteSource === 'embryo_recipient';
}

export function showSemenDonorDetails(semenSource: string): boolean {
  return ['husband_cryo', 'donor_fresh', 'donor_cryo', 'surgical_frozen'].includes(semenSource);
}

export function normalizeCycleType(value: string | undefined | null): SmartCycleType {
  const v = (value || '').trim();
  if (!v) return 'Fresh';
  if (v === 'IVF' || v === 'ICSI' || v === 'self_oocyte') return 'Fresh';
  if (v === 'donor_oocyte') return 'OD';
  if (v === 'oocyte_recipient') return 'OR';
  if (v === 'embryo_recipient') return 'ER';
  if (
    v === 'Fresh' ||
    v === 'FET' ||
    v === 'FrozenOocytes' ||
    v === 'ThawOocytes' ||
    v === 'OD' ||
    v === 'OR' ||
    v === 'ER' ||
    v === 'IUI'
  ) {
    return v;
  }
  const lower = v.toLowerCase();
  if (lower === 'iui') return 'IUI';
  if (lower.includes('embryo rec') || lower.startsWith('er ') || lower.startsWith('er(') || lower.startsWith('er -')) return 'ER';
  if (lower.includes('oocyte rec') || lower.startsWith('or ') || lower.startsWith('or(') || lower.startsWith('or -')) return 'OR';
  if (lower.includes('oocyte don') || lower.startsWith('od ') || lower.startsWith('od(')) return 'OD';
  if (lower.includes('frozen thaw') || lower.includes('(fet)')) return 'FET';
  if (lower.includes('frozen oocyte') || lower.includes('(fzo)')) return 'FrozenOocytes';
  if (lower.includes('thaw oocyte') || lower.includes('(tho)')) return 'ThawOocytes';
  if (lower.includes('fresh') || lower.includes('(fr)')) return 'Fresh';
  return 'Fresh';
}

export function oocyteSourceFromCreation(cycleType: string | undefined | null): SmartCycleType {
  return normalizeCycleType(cycleType);
}

export function getCycleTypeLabel(cycleType: string | undefined | null): string {
  const type = normalizeCycleType(cycleType);
  return CYCLE_CREATION_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function getMonitoringSheetLabel(option: string | undefined | null): string {
  const value = (option || '').trim();
  return MONITORING_SHEET_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

/** SMART: Fresh / FZO / OD use Agonist or Antagonist charts. */
export function isStimulationMonSheetCycle(cycleType: string | undefined | null): boolean {
  const type = normalizeCycleType(cycleType);
  return type === 'Fresh' || type === 'FrozenOocytes' || type === 'OD';
}

/** SMART: FET / THO / OR / ER use HRT or Modified Natural charts. */
export function isHrtMonSheetCycle(cycleType: string | undefined | null): boolean {
  const type = normalizeCycleType(cycleType);
  return type === 'FET' || type === 'ThawOocytes' || type === 'OR' || type === 'ER';
}

export function iuiTreatmentUsesSheet(treatmentType: string | undefined | null): boolean {
  const match = IUI_TREATMENT_OPTIONS.find((item) => item.value === treatmentType);
  return match ? match.monitoring : true;
}

export function requiresMonitoringSheet(cycleType: string | undefined | null, treatmentType?: string): boolean {
  if (normalizeCycleType(cycleType) === 'IUI') return iuiTreatmentUsesSheet(treatmentType);
  return true;
}

export function isMonitoringSheetAllowed(
  cycleType: string | undefined | null,
  option: string,
  treatmentType?: string
): boolean {
  const type = normalizeCycleType(cycleType);
  if (type === 'IUI') {
    if (!iuiTreatmentUsesSheet(treatmentType)) return false;
    return option === 'IUI';
  }
  if (option === 'IUI') return false;
  if (isStimulationMonSheetCycle(cycleType)) return option === 'Agonist' || option === 'Antagonist';
  if (isHrtMonSheetCycle(cycleType)) return option === 'HRT' || option === 'ModifiedHRT';
  return false;
}

export function monitoringSheetHint(cycleType: string | undefined | null, treatmentType?: string): string {
  if (normalizeCycleType(cycleType) === 'IUI') {
    if (!iuiTreatmentUsesSheet(treatmentType)) {
      return 'H S A and SQA do not use an IUI monitoring sheet.';
    }
    return 'IUI uses the IUI Monitoring Sheet. Fill the day rows on this screen.';
  }
  if (isStimulationMonSheetCycle(cycleType)) {
    return 'Select Agonist or Antagonist (HRT options blocked for this cycle).';
  }
  if (isHrtMonSheetCycle(cycleType)) {
    return 'Select HRT or Modified Natural Cycle (Agonist / Antagonist blocked for this cycle).';
  }
  return 'Select a monitoring sheet for this cycle.';
}

export function isFrozenCycleType(cycleType: string | undefined | null, treatmentType?: string): boolean {
  const type = normalizeCycleType(cycleType);
  if (treatmentType === 'Frozen') return true;
  return type === 'FET' || type === 'FrozenOocytes' || type === 'ThawOocytes';
}

export function defaultSemenSource(cycleType: string | undefined | null, treatmentType?: string): string {
  const type = normalizeCycleType(cycleType);
  const frozen = isFrozenCycleType(type, treatmentType);
  if (type === 'IUI') return '';
  if (type === 'ER') return 'donor_cryo';
  if (type === 'OD') return '';
  if (frozen) return 'husband_cryo';
  return 'husband_fresh';
}

export function allowedSemenSources(cycleType: string | undefined | null, treatmentType?: string): string[] {
  const type = normalizeCycleType(cycleType);
  if (type === 'IUI' || type === 'OD') return [];
  if (type === 'ER') return ['donor_cryo'];
  if (type === 'OR') return ['husband_fresh', 'husband_cryo'];
  if (isFrozenCycleType(type, treatmentType) && type !== 'FrozenOocytes') {
    return ['husband_cryo', 'donor_cryo', 'husband_fresh'];
  }
  return [...SMART_SEMEN_IDS];
}

export function getRetrievalLayout(cycleType: string | undefined | null) {
  const type = normalizeCycleType(cycleType);
  const base = {
    type,
    lockOocyteSource: true,
    showOocyteRadios: true,
    showSemenRadios: type !== 'OD',
    retrievalChoice: 'self_to_self' as const,
    sections: {
      showSelfToSelf: false,
      showSelfToRecipient: false,
      showDonorToSelf: false,
      showDonorToRecipient: false,
      showEmbryoRecipient: false,
      lockOocyteDonation: false,
      lockSemenCryo: false,
      showOocyteReceivedFrom: false,
      showSemenSampleId: false,
      showFreezeOocytes: false,
      showFetThaw: false,
      showThawOocytes: false,
      showDonorEggCount: false,
      showHusbandSperm: false,
      showDonorSperm: false,
      showRecipientDetails: false,
      showDonorEggDetails: false,
      lockRetrievalCounts: false,
    },
  };

  if (type === 'Fresh') {
    return {
      ...base,
      retrievalChoice: 'self_to_self' as const,
      sections: { ...base.sections, showSelfToSelf: true, showHusbandSperm: true, showDonorSperm: true },
    };
  }
  if (type === 'FrozenOocytes') {
    return {
      ...base,
      retrievalChoice: 'self_to_self' as const,
      sections: { ...base.sections, showSelfToSelf: true, showFreezeOocytes: true },
    };
  }
  if (type === 'FET') {
    return {
      ...base,
      retrievalChoice: 'none' as const,
      sections: { ...base.sections, showFetThaw: true },
    };
  }
  if (type === 'ThawOocytes') {
    return {
      ...base,
      retrievalChoice: 'none' as const,
      sections: { ...base.sections, showThawOocytes: true, showHusbandSperm: true, showDonorSperm: true },
    };
  }
  if (type === 'OD') {
    return {
      ...base,
      retrievalChoice: 'donor_to_recipient' as const,
      sections: {
        ...base.sections,
        showDonorToRecipient: true,
        showDonorEggCount: true,
        showFreezeOocytes: true,
        lockOocyteDonation: true,
      },
    };
  }
  if (type === 'IUI') {
    return {
      ...base,
      showOocyteRadios: false,
      showSemenRadios: false,
      retrievalChoice: 'none' as const,
    };
  }
  if (type === 'OR') {
    return {
      ...base,
      retrievalChoice: 'received_from_donor' as const,
      sections: {
        ...base.sections,
        showDonorToSelf: true,
        showOocyteReceivedFrom: true,
        showHusbandSperm: true,
        lockRetrievalCounts: true,
      },
    };
  }
  return {
    ...base,
    retrievalChoice: 'none' as const,
    sections: {
      ...base.sections,
      showEmbryoRecipient: true,
      showRecipientDetails: true,
      showDonorEggDetails: true,
      showDonorToSelf: true,
      showDonorSperm: true,
      lockRetrievalCounts: true,
    },
  };
}
