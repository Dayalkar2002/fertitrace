import type { Patient } from '@/lib/types/patient';

export interface SourceOption {
  id: string;
  label: string;
  description: string;
}

export interface DonorOocyteDetails {
  donorId: string;
  donorName: string;
  oocyteCount: number;
  recipientCount?: number;
}

export interface OocyteRecipientDetails {
  receivedFromDonorId: string;
  donorName: string;
  oocyteCount: number;
}

export interface EmbryoRecipientDetails {
  embryoDonorCoupleId: string;
  donorCoupleName: string;
  embryoBatchNo: string;
  oocyteDonorId?: string;
  semenDonorId?: string;
}

export interface SemenDonorDetails {
  donorSemenId: string;
  cryoStrawNo: string;
  freezingDate: string;
}

export interface CycleCreationPayload {
  patientId: number;
  satelliteId: number;
  cycleId?: string;
  cycleType: string;
  treatmentType: string;
  startDate: string;
  lmp: string;
  expectedOpuDate: string;
  consultantId: number;
  protocol: string;
  monitoringSheet: string;
  notes: string;
}

export interface PatientCycleRow {
  cycleId: string;
  cycleType: string;
  typeLabel: string;
  cycleDate: string;
  postTreatment: string;
  advice: string;
  monitoringSheet: string;
}

export interface CycleCreationResult extends CycleCreationPayload {
  cycleId: string;
  patientName?: string;
  uhid?: string;
}

export interface CycleEntryPayload {
  patientId: number;
  satelliteId: number;
  oocyteSource: string;
  semenSource: string;
  cycleDate?: string;
  cycleId?: string;
  cycleType?: string;
  treatmentType?: string;
  lmp?: string;
  expectedOpuDate?: string;
  consultantId?: number;
  protocol?: string;
  monitoringSheet?: string;
  notes?: string;
  donorOocyteDetails?: DonorOocyteDetails | null;
  oocyteRecipientDetails?: OocyteRecipientDetails | null;
  embryoRecipientDetails?: EmbryoRecipientDetails | null;
  semenDonorDetails?: SemenDonorDetails | null;
}

export interface CycleEntry extends CycleEntryPayload {
  cycleId?: string;
  patientName?: string;
  uhid?: string;
  cycleType?: string;
  status?: string;
}

export interface RetrievalSections {
  showSelfToSelf: boolean;
  showSelfToRecipient: boolean;
  showDonorToSelf: boolean;
  showDonorToRecipient: boolean;
  showEmbryoRecipient: boolean;
  lockOocyteDonation: boolean;
  lockSemenCryo: boolean;
  showOocyteReceivedFrom: boolean;
  showSemenSampleId: boolean;
  showFreezeOocytes?: boolean;
  showFetThaw?: boolean;
  showThawOocytes?: boolean;
  showDonorEggCount?: boolean;
  showHusbandSperm?: boolean;
  showDonorSperm?: boolean;
  showRecipientDetails?: boolean;
  showDonorEggDetails?: boolean;
  /** SMART D2S / D2SGVER: recipient cannot type retrieval counts. */
  lockRetrievalCounts?: boolean;
}

export interface RetrievalRow {
  leftOvary?: number | null;
  rightOvary?: number | null;
  ivf?: number | null;
  icsi?: number | null;
  gift?: number | null;
  zift?: number | null;
  damaged?: number | null;
  total?: number | null;
  recipientPatientId?: number | null;
  recipientCycleId?: string;
  recipientName?: string;
  fromDonor?: string;
}

export interface FreezeOocyteRow {
  mii?: number | null;
  mi?: number | null;
  gv?: number | null;
  total?: number | null;
}

export interface FrozenOocyteLocation {
  oocytesId: number;
  source: string;
  location: string;
  cycleId: string;
  procDoneBy: string;
  sourceDonorCycleId: string;
}

export interface FreezePersistResult {
  fzoCycleId: string;
  recipientPatientId: number;
  mii: number;
  mi: number;
  gv: number;
  locations: FrozenOocyteLocation[];
}

export interface FetThawDetails {
  source: string;
  location: string;
  strawNo: string;
  thawDate: string;
  embryoCount: string;
}

export interface ThawOocyteDetails {
  location: string;
  strawId: string;
  mii: string;
  mi: string;
  gv: string;
  survived: string;
}

export interface EmbryoRecipientInfo {
  recipientName: string;
  recipientMobile: string;
  recipientAadhar: string;
  cycleId: string;
  monthYear: string;
  donorName: string;
  donorMobile: string;
  donorAadhar: string;
  donorCycleId: string;
}

export interface RetrievalData {
  selfToSelf?: RetrievalRow[];
  donorToRecipient?: RetrievalRow[];
  donorToSelf?: RetrievalRow[];
  donorEggCount?: RetrievalRow[];
  freezeOocytes?: FreezeOocyteRow;
  fetThaw?: FetThawDetails;
  thawOocytes?: ThawOocyteDetails;
  embryoRecipient?: EmbryoRecipientInfo;
}

export interface RetrievalConfig {
  cycle: CycleEntry;
  sections: RetrievalSections;
  patient: Patient | null;
  availableRecipients: { id: number; name: string; uhid: string; aadhar?: string }[];
  lockedRecipients: {
    recipientId: number;
    recipientName: string;
    recipientAadhar?: string;
    cycleId: string;
  }[];
  donorAadhar: string;
  existingRetrieval: RetrievalData | null;
}

export interface DonorAadharCheck {
  donorAadhar: string;
  recipientAadhar: string;
  message: string;
  isAllowed: boolean;
}
