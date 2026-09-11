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
