export interface LookupItem {
  id: number;
  name: string;
}

export interface PatientMasterRow {
  id: number;
  refNo: string;
  name: string;
  category: string;
  husbandName: string;
  address: string;
  dateOfCreation: string | null;
  aadhar?: string;
  husbandAadhar?: string;
  mobile?: string;
  raw?: Record<string, unknown>;
}

export interface PatientMasterDetail {
  id?: number;
  patId?: number;
  refNo: string;
  dateOfCreation: string | null;
  name: string;
  category: string;
  age: number;
  dob: string | null;
  address: string;
  city: string;
  phone: string;
  mobile: string;
  email: string;
  docId: number;
  diagId: number;
  husbandName: string;
  husbandAge: number;
  husbandDob: string | null;
  satId: number;
  refId: number;
  panCard: string;
  aadhar: string;
  husbandAadhar: string;
  husbandPan: string;
  husbandEmail: string;
  husbandPhone?: string;
  photo: string;
  maritalStatus?: string;
  nationality?: string;
  passport?: string;
  husbandPassport?: string;
  artClinicReg?: string;
  pcpndtClinicReg?: string;
}

export interface PatientLookups {
  satellites: LookupItem[];
  doctors: LookupItem[];
  diagnosis: LookupItem[];
  refBy: LookupItem[];
}

export interface CommonMasterRow {
  id: number;
  name: string;
}

export interface UserMasterRow {
  id: number;
  name: string;
  loginName: string;
  roleId: number;
}
