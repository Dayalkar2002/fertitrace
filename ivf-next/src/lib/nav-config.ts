export interface NavMenuItem {
  label: string;
  route: string;
  icon?: string;
}

export interface NavMenuGroup {
  label: string;
  items: NavMenuItem[];
}

export interface TopNavMenu {
  label: string;
  route?: string;
  icon?: string;
  items?: NavMenuItem[];
  groups?: NavMenuGroup[];
  columns?: MasterMenuItem[][];
}

export interface SideNavSection {
  title: string;
  icon?: string;
  standalone?: boolean;
  flat?: boolean;
  items: NavMenuItem[];
}

export type MasterType =
  | 'common'
  | 'patient'
  | 'doctor'
  | 'satellite'
  | 'user'
  | 'donor-lab'
  | 'outcome-drug'
  | 'appointments'
  | 'patient-selection';

export interface MasterMenuItem {
  label: string;
  type: MasterType;
  catId?: number;
  column: 1 | 2 | 3 | 4;
  route: string;
}

function routeFor(item: Omit<MasterMenuItem, 'route'>): string {
  switch (item.type) {
    case 'common':
      return `/masters/common/${item.catId}`;
    case 'patient':
      return '/masters/patient';
    case 'doctor':
      return '/masters/doctor';
    case 'satellite':
      return '/masters/satellite';
    case 'user':
      return '/masters/user';
    case 'donor-lab':
      return '/masters/donor-lab';
    case 'outcome-drug':
      return '/masters/outcome-drug';
    case 'appointments':
      return '/masters/appointments';
    case 'patient-selection':
      return '/dashboard?selectPatient=1';
    default:
      return '/masters';
  }
}

const RAW_REGISTRY: Omit<MasterMenuItem, 'route'>[] = [
  { label: 'Allergies Master', type: 'common', catId: 12, column: 1 },
  { label: 'Catheter Master', type: 'common', catId: 9, column: 1 },
  { label: 'Contamination', type: 'common', catId: 27, column: 1 },
  { label: 'Donor Lab', type: 'donor-lab', column: 1 },
  { label: 'FSH Drug Master', type: 'common', catId: 14, column: 1 },
  { label: 'Indication Master', type: 'common', catId: 23, column: 1 },
  { label: 'Media Brand', type: 'common', catId: 28, column: 1 },
  { label: 'Out Come Drug Master', type: 'outcome-drug', column: 1 },
  { label: 'Referring Doctor', type: 'common', catId: 21, column: 1 },
  { label: 'Termination Master', type: 'common', catId: 11, column: 1 },
  { label: 'Antagonist Master', type: 'common', catId: 18, column: 2 },
  { label: 'Clomiphene Citrate', type: 'common', catId: 17, column: 2 },
  { label: 'Diagnosis Master', type: 'common', catId: 20, column: 2 },
  { label: 'Findings', type: 'common', catId: 26, column: 2 },
  { label: 'Gas', type: 'common', catId: 31, column: 2 },
  { label: 'Lab Oper. Master', type: 'common', catId: 2, column: 2 },
  { label: 'Media Series', type: 'common', catId: 29, column: 2 },
  { label: 'Patient Management', type: 'patient', column: 2 },
  { label: 'Satellite Master', type: 'satellite', column: 2 },
  { label: 'User Master', type: 'user', column: 2 },
  { label: 'Appearance Master', type: 'common', catId: 4, column: 3 },
  { label: 'Collection Problem', type: 'common', catId: 24, column: 3 },
  { label: 'Doctor Master', type: 'doctor', column: 3 },
  { label: 'Personnel Master', type: 'common', catId: 16, column: 3 },
  { label: 'HMG Drug Master', type: 'common', catId: 15, column: 3 },
  { label: 'Linearity', type: 'common', catId: 25, column: 3 },
  { label: 'Method Master', type: 'common', catId: 3, column: 3 },
  { label: 'Patient Selection', type: 'patient-selection', column: 3 },
  { label: 'Sperm Id Master', type: 'common', catId: 22, column: 3 },
  { label: 'Viscosity Master', type: 'common', catId: 6, column: 3 },
  { label: 'Appointment Scheduler', type: 'appointments', column: 4 },
  { label: 'Colour Master', type: 'common', catId: 5, column: 4 },
  { label: 'Done By Master', type: 'common', catId: 10, column: 4 },
  { label: 'Fructose Master', type: 'common', catId: 8, column: 4 },
  { label: 'Incubator Used', type: 'common', catId: 30, column: 4 },
  { label: 'Liquefaction Master', type: 'common', catId: 7, column: 4 },
  { label: 'Other Drug Master', type: 'common', catId: 19, column: 4 },
  { label: 'Other Drug Master 2', type: 'common', catId: 32, column: 4 },
  { label: 'Ovulation Induction', type: 'common', catId: 13, column: 4 },
];

export const MASTER_REGISTRY: MasterMenuItem[] = RAW_REGISTRY.map((item) => ({
  ...item,
  route: routeFor(item),
}));

export function getMasterColumns(): MasterMenuItem[][] {
  return [1, 2, 3, 4].map((col) => MASTER_REGISTRY.filter((item) => item.column === col));
}

// Masters specifically used for barcode preparation, specimen labeling, witnessing, and clinical operations
const BARCODE_MASTER_RAW: Omit<MasterMenuItem, 'route'>[] = [
  { label: 'Patient Management', type: 'patient', column: 1 },
  { label: 'Patient Selection', type: 'patient-selection', column: 1 },
  { label: 'Doctor Master', type: 'doctor', column: 1 },
  { label: 'Satellite Master', type: 'satellite', column: 2 },
  { label: 'User / Operator Master', type: 'user', column: 2 },
  { label: 'Sperm Id Master', type: 'common', catId: 22, column: 2 },
  { label: 'Media Brand', type: 'common', catId: 28, column: 3 },
  { label: 'Media Series', type: 'common', catId: 29, column: 3 },
  { label: 'Catheter Master', type: 'common', catId: 9, column: 3 },
  { label: 'Incubator Master', type: 'common', catId: 30, column: 4 },
  { label: 'Gas Master', type: 'common', catId: 31, column: 4 },
  { label: 'Lab Operator Master', type: 'common', catId: 2, column: 4 },
];

export const BARCODE_MASTER_REGISTRY: MasterMenuItem[] = BARCODE_MASTER_RAW.map((item) => ({
  ...item,
  route: routeFor(item),
}));

export function getBarcodeMasterColumns(): MasterMenuItem[][] {
  return [1, 2, 3, 4].map((col) => BARCODE_MASTER_REGISTRY.filter((item) => item.column === col));
}

export function getCommonMasterLabel(catId: number): string {
  return MASTER_REGISTRY.find((item) => item.type === 'common' && item.catId === catId)?.label ?? 'Common Master';
}

export const REPORT_MENU_GROUPS: NavMenuGroup[] = [
  {
    label: 'Documents & Summary',
    items: [
      { label: 'Documents', route: '/reports/consent-forms' },
      { label: 'ART Cycle', route: '/reports/art-cycle' },
      { label: 'QR Code List', route: '/reports/qrcode-list' },
      { label: 'IVF Summary', route: '/reports/ivf-summary' },
      { label: 'HSA Summary', route: '/reports/hsa-summary' },
      { label: 'Embryo Pictures', route: '/reports/embryo-pictures' },
    ],
  },
  {
    label: 'Passbook',
    items: [
      { label: 'Frozen Semen Self', route: '/reports/passbook/semen-self' },
      { label: 'Frozen Semen Donor', route: '/reports/passbook/semen-donor' },
      { label: 'Frozen Oocytes', route: '/reports/passbook/oocytes' },
      { label: 'Embryos – Self', route: '/reports/passbook/embryos-self' },
      { label: 'Embryos Recipient / Donation', route: '/reports/passbook/embryos-recipient' },
      { label: 'Oocytes Passbook', route: '/reports/passbook/oocytes-passbook' },
    ],
  },
  {
    label: 'Andrology',
    items: [
      { label: 'IUI Summary', route: '/reports/andrology/iui' },
      { label: 'Semen Self Freeze', route: '/reports/andrology/semen-self-freeze' },
      { label: 'Semen Self – Valid Till', route: '/reports/andrology/semen-valid-till' },
    ],
  },
  {
    label: 'Statistics & Pictures',
    items: [
      { label: 'Fresh Cycles', route: '/reports/statistics/fresh-cycles' },
      { label: 'Frozen Cycles', route: '/reports/statistics/frozen-cycles' },
      { label: 'Pictures', route: '/reports/pictures' },
    ],
  },
];

/** Top navigation focused strictly on: Dashboard, Master (barcode preparation masters), Barcode Label, and Cryo section */
export const TOP_NAV_MENUS: TopNavMenu[] = [
  { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
  { label: 'Master', icon: 'masters', columns: getBarcodeMasterColumns() },
  { label: 'Barcode Label', route: '/label-printing', icon: 'label' },
  {
    label: 'Cryo',
    icon: 'cryo',
    items: [
      { label: 'Sperm Cryopreservation', route: '/sperm?mode=Cryopreservation' },
      { label: 'Oocytes Cryopreservation', route: '/oocyte-embryo?tab=cryopreservation' },
      { label: 'Embryos Cryopreservation', route: '/oocyte-embryo?tab=cryopreservation' },
      { label: 'Semen – Self', route: '/cryo/semen-self' },
      { label: 'Semen – Donor', route: '/cryo/semen-donor' },
    ],
  },
];

export const SIDE_NAV_SECTIONS: SideNavSection[] = [
  {
    title: 'MAIN MENU',
    standalone: false,
    items: [
      { label: 'Dashboard', route: '/dashboard', icon: 'dashboard' },
      { label: 'Patient Management', route: '/masters/patient', icon: 'patient' },
      { label: 'Cycle Management', route: '/cycle/entry', icon: 'cycle' },
      { label: 'Sperm Management', route: '/sperm', icon: 'sperm' },
      { label: 'Oocyte Management', route: '/oocyte-embryo', icon: 'oocyte' },
      { label: 'Embryo Management', route: '/oocyte-embryo', icon: 'embryo' },
      { label: 'Cryopreservation', route: '/sperm?mode=Cryopreservation', icon: 'cryo' },
      { label: 'Witness System', route: '/witness', icon: 'witness' },
      { label: 'Lab Inventory', route: '/inventory', icon: 'inventory' },
      { label: 'Reports & Analytics', route: '/reports', icon: 'reports' },
      { label: 'Communication', route: '/communication', icon: 'communication' },
      { label: 'Audit Trails', route: '/audit', icon: 'audit' },
      { label: 'Settings', route: '/masters', icon: 'settings' },
      { label: 'Users & Roles', route: '/masters/user', icon: 'users' },
      { label: 'Smart Card / Access', route: '/smartcard', icon: 'smartcard' },
      { label: 'Label Printing', route: '/label-printing', icon: 'label' },
      { label: 'Help & Support', route: '/help', icon: 'help' },
      { label: 'Logout', route: '/login', icon: 'logout' },
    ],
  },
];

export interface LeftMenuSubItem {
  nodeId: number;
  nodeName: string;
  label: string;
  route: string;
  icon?: string;
  orderIndex: number;
  isActive: boolean;
}

export interface LeftMenuItem {
  nodeId: number;
  nodeName: string;
  label: string;
  route: string;
  icon?: string;
  orderIndex: number;
  isActive: boolean;
  badgeText?: string;
  subModules?: LeftMenuSubItem[];
}

export interface TopMenuItem {
  topMenuId: number;
  nodeName: string;
  label: string;
  route: string;
  icon?: string;
  orderIndex: number;
  isActive: boolean;
  requiresBarcode: boolean;
}

export const DEFAULT_LEFT_MENUS: LeftMenuItem[] = [
  { nodeId: 1, nodeName: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: 'dashboard', orderIndex: 1, isActive: true },
  {
    nodeId: 2,
    nodeName: 'patient_management',
    label: 'Patient Management',
    route: '/masters/patient',
    icon: 'patient',
    orderIndex: 2,
    isActive: true,
  },
  {
    nodeId: 3,
    nodeName: 'cycle_management',
    label: 'Cycle Management',
    route: '/cycle/entry',
    icon: 'cycle',
    orderIndex: 3,
    isActive: true,
  },
  {
    nodeId: 4,
    nodeName: 'sperm_management',
    label: 'Sperm Management',
    route: '/sperm',
    icon: 'sperm',
    orderIndex: 4,
    isActive: true,
    subModules: [
      { nodeId: 105, nodeName: 'sperm_witness', label: 'Sperm Witnessing', route: '/sperm', icon: 'sperm', orderIndex: 1, isActive: true },
      { nodeId: 106, nodeName: 'semen_analysis', label: 'Semen Analysis', route: '/sperm?mode=Semen+Analysis', icon: 'sperm', orderIndex: 2, isActive: true },
      { nodeId: 107, nodeName: 'sperm_iui', label: 'IUI Preparation', route: '/sperm?mode=IUI', icon: 'sperm', orderIndex: 3, isActive: true },
      { nodeId: 108, nodeName: 'sperm_cryo', label: 'Sperm Cryopreservation', route: '/sperm?mode=Cryopreservation', icon: 'sperm', orderIndex: 4, isActive: true },
    ],
  },
  {
    nodeId: 5,
    nodeName: 'oocyte_management',
    label: 'Oocyte Management',
    route: '/oocyte-embryo?tab=oocytes',
    icon: 'oocyte',
    orderIndex: 5,
    isActive: true,
  },
  {
    nodeId: 6,
    nodeName: 'embryo_management',
    label: 'Embryo Management',
    route: '/oocyte-embryo?tab=embryo-culture',
    icon: 'embryo',
    orderIndex: 6,
    isActive: true,
  },
  {
    nodeId: 7,
    nodeName: 'cryopreservation',
    label: 'Cryopreservation',
    route: '/sperm?mode=Cryopreservation',
    icon: 'cryo',
    orderIndex: 7,
    isActive: true,
    subModules: [
      { nodeId: 109, nodeName: 'cryo_sperm', label: 'Sperm Cryo', route: '/sperm?mode=Cryopreservation', icon: 'cryo', orderIndex: 1, isActive: true },
      { nodeId: 110, nodeName: 'cryo_embryo', label: 'Embryo Cryo', route: '/oocyte-embryo?tab=cryopreservation', icon: 'cryo', orderIndex: 2, isActive: true },
    ],
  },
  { nodeId: 8, nodeName: 'witness_system', label: 'Witness System', route: '/witness', icon: 'witness', orderIndex: 8, isActive: true },
  { nodeId: 9, nodeName: 'lab_inventory', label: 'Lab Inventory', route: '/inventory', icon: 'inventory', orderIndex: 9, isActive: true },
  { nodeId: 10, nodeName: 'reports_analytics', label: 'Reports & Analytics', route: '/reports', icon: 'reports', orderIndex: 10, isActive: true },
  { nodeId: 11, nodeName: 'communication', label: 'Patient Communication', route: '/communication', icon: 'communication', orderIndex: 11, isActive: true },
  { nodeId: 12, nodeName: 'audit_trails', label: 'Audit Trails', route: '/audit', icon: 'audit', orderIndex: 12, isActive: true },
  { nodeId: 13, nodeName: 'settings', label: 'Settings', route: '/masters', icon: 'settings', orderIndex: 13, isActive: true },
  { nodeId: 14, nodeName: 'users_roles', label: 'Users & Roles', route: '/masters/user', icon: 'users', orderIndex: 14, isActive: true },
  { nodeId: 15, nodeName: 'smart_card_access', label: 'Smart Card / Access', route: '/smartcard', icon: 'smartcard', orderIndex: 15, isActive: true },
  { nodeId: 16, nodeName: 'label_printing', label: 'Label Printing', route: '/label-printing', icon: 'label', orderIndex: 16, isActive: true },
  { nodeId: 17, nodeName: 'help_support', label: 'Help & Support', route: '/help', icon: 'help', orderIndex: 17, isActive: true },
  { nodeId: 18, nodeName: 'logout', label: 'Logout', route: '/login', icon: 'logout', orderIndex: 18, isActive: true },
];

export const DEFAULT_TOP_MENUS: TopMenuItem[] = [
  { topMenuId: 1, nodeName: 'barcode_printing', label: 'Barcode Labels', route: '/label-printing', icon: 'label', orderIndex: 1, isActive: true, requiresBarcode: true },
  { topMenuId: 2, nodeName: 'electronic_witness', label: 'Witnessing (RFID/Barcode)', route: '/witness', icon: 'witness', orderIndex: 2, isActive: true, requiresBarcode: true },
  { topMenuId: 3, nodeName: 'sperm_barcode', label: 'Sperm Witnessing', route: '/sperm', icon: 'sperm', orderIndex: 3, isActive: true, requiresBarcode: true },
  { topMenuId: 4, nodeName: 'oocyte_embryo_barcode', label: 'Oocyte & Embryo Tracking', route: '/oocyte-embryo', icon: 'embryo', orderIndex: 4, isActive: true, requiresBarcode: true },
  { topMenuId: 5, nodeName: 'cycle_barcode', label: 'Clinical Cycles', route: '/cycle/entry', icon: 'cycle', orderIndex: 5, isActive: true, requiresBarcode: true },
  { topMenuId: 6, nodeName: 'dashboard', label: 'Dashboard', route: '/dashboard', icon: 'dashboard', orderIndex: 6, isActive: false, requiresBarcode: false },
  { topMenuId: 7, nodeName: 'master_directory', label: 'Master Directory', route: '/masters', icon: 'masters', orderIndex: 7, isActive: false, requiresBarcode: false },
  { topMenuId: 8, nodeName: 'reports_summary', label: 'Reports', route: '/reports', icon: 'reports', orderIndex: 8, isActive: false, requiresBarcode: false },
  { topMenuId: 9, nodeName: 'consent_forms', label: 'Consent Form', route: '/consent', icon: 'consent', orderIndex: 9, isActive: false, requiresBarcode: false },
];
