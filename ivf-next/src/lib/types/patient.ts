export interface Patient {
  id: number;
  uhid: string;
  name: string;
  partner: string;
  age: number;
  gender: string;
  aadhar: string;
  satelliteId: number;
  mobile?: string;
  phone?: string;
  email?: string;
  category?: string;
  isOocyteDonor?: boolean;
  lockedRecipients?: LockedRecipient[];
  receivedFromDonorId?: number;
}

export interface LockedRecipient {
  recipientId: number;
  recipientName: string;
  cycleId: string;
  recipientAadhar?: string;
}

export interface Satellite {
  id: number;
  name: string;
}
