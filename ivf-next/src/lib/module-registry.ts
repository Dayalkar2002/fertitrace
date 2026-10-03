export type ModuleKind = 'common-crud' | 'sp-crud' | 'report' | 'cryo-list' | 'hub' | 'info';

export interface SpCrudSpec {
  procName: string;
  paramNames: string;
  listValues: unknown[];
  saveValues: (id: number, name: string, queryIndex: number) => unknown[];
}

export interface ReportSpec {
  procName: string;
  paramNames: string;
  queryIndex: number;
  requiresPatient?: boolean;
  requiresDateRange?: boolean;
  buildValues: (ctx: { patId: number; satId: number; fromDate: string; toDate: string; queryIndex: number }) => unknown[];
}

export interface CryoSpec {
  procName: string;
  paramNames: string;
  listQueryIndex: number;
  buildListValues: (ctx: { patId: number; satId: number; queryIndex: number }) => unknown[];
}

export interface HubLink {
  label: string;
  href: string;
  description?: string;
}

export interface ModuleDefinition {
  path: string;
  title: string;
  description: string;
  kind: ModuleKind;
  note?: string;
  commonCatId?: number;
  spCrud?: SpCrudSpec;
  report?: ReportSpec;
  cryo?: CryoSpec;
  hubLinks?: HubLink[];
}

function spCrud(
  procName: string,
  idParam: string,
  nameParam: string,
  extraParams: string[] = []
): SpCrudSpec {
  const paramNames = [idParam, nameParam, ...extraParams, '@QueryIndex'].join(',');
  const extraCount = extraParams.length;
  const emptyExtras = Array(extraCount).fill('');

  return {
    procName,
    paramNames,
    listValues: [0, '', ...emptyExtras, 1],
    saveValues: (id, name, queryIndex) => [id, name, ...emptyExtras, queryIndex],
  };
}

function patientReport(
  procName: string,
  paramNames: string,
  queryIndex: number,
  opts: { requiresPatient?: boolean; requiresDateRange?: boolean } = {}
): ReportSpec {
  const names = paramNames.split(',').map((n) => n.trim());
  return {
    procName,
    paramNames,
    queryIndex,
    requiresPatient: opts.requiresPatient ?? true,
    requiresDateRange: opts.requiresDateRange ?? false,
    buildValues: ({ patId, satId, fromDate, toDate, queryIndex: qi }) => {
      const valueMap: Record<string, unknown> = {
        '@PatID': patId,
        '@SatID': satId,
        '@FromDate': fromDate,
        '@ToDate': toDate,
        '@QueryIndex': qi,
      };
      return names.map((name) => valueMap[name] ?? 0);
    },
  };
}

function cryoList(procName: string, idParam: string): CryoSpec {
  const paramNames = ['@PatID', '@SatID', idParam, '@QueryIndex'].join(',');
  return {
    procName,
    paramNames,
    listQueryIndex: 1,
    buildListValues: ({ patId, satId, queryIndex }) => [patId, satId, 0, queryIndex],
  };
}

const REPORT_PARAMS = '@PatID,@SatID,@FromDate,@ToDate,@QueryIndex';
const REPORT_PARAMS_NO_DATE = '@PatID,@SatID,@QueryIndex';

/** Unified registry for all modules not covered by dedicated clinical/master pages. */
export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    path: 'stats',
    title: 'Stats / Inventory',
    description: 'Statistics and inventory from legacy smART — run date-range reports below or open cycle statistics.',
    kind: 'hub',
    hubLinks: [
      { label: 'Fresh Cycles Statistics', href: '/reports/statistics/fresh-cycles', description: 'Fresh cycle stats report' },
      { label: 'Frozen Cycles Statistics', href: '/reports/statistics/frozen-cycles', description: 'Frozen cycle stats report' },
      { label: 'IVF Summary', href: '/reports/ivf-summary' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    path: 'media',
    title: 'Media',
    description: 'Media brand and series masters — same data as legacy MediaBrand.aspx / MediaSeries.aspx.',
    kind: 'hub',
    hubLinks: [
      { label: 'Media Brand', href: '/masters/common/28', description: 'Common master category 28' },
      { label: 'Media Series', href: '/masters/common/29', description: 'Common master category 29' },
    ],
  },
  {
    path: 'sms',
    title: 'Manual SMS',
    description: 'Manual SMS module — legacy ManualSMS.aspx. Patient list and message compose will use spManualSMS when connected to SQL.',
    kind: 'report',
    note: 'Requires patient context. Adjust stored procedure name if your database uses a different SP.',
    report: patientReport('spManualSMS', '@PatID,@SatID,@QueryIndex', 1, { requiresPatient: true }),
  },
  {
    path: 'report-email',
    title: 'Report Email',
    description: 'Schedule and send report emails — legacy ReportEmail.aspx.',
    kind: 'info',
    note: 'Email scheduling UI is not in the legacy SP layer exposed here. Use reports below and configure email in the database admin tools until a dedicated API is added.',
  },
  {
    path: 'role-master',
    title: 'Role Master',
    description: 'Role and permission master — RoleMaster.aspx.',
    kind: 'sp-crud',
    spCrud: spCrud('spRoleMaster', '@RoleID', '@RoleName'),
  },
  {
    path: 'masters/donor-lab',
    title: 'Donor Lab',
    description: 'Donor lab master — spDonorLab.',
    kind: 'sp-crud',
    spCrud: spCrud('spDonorLab', '@DonorLabID', '@DonorLabName'),
  },
  {
    path: 'masters/outcome-drug',
    title: 'Out Come Drug Master',
    description: 'Outcome drug master — OutComeDrugMaster.aspx.',
    kind: 'sp-crud',
    spCrud: spCrud('spOutComeDrugMaster', '@OutComeDrugID', '@OutComeDrugName'),
  },
  {
    path: 'masters/appointments',
    title: 'Appointments',
    description: 'Appointment schedule — spActivityMaster / AppointMentSchedule.',
    kind: 'report',
    report: patientReport('spActivityMaster', REPORT_PARAMS, 1, { requiresPatient: true, requiresDateRange: true }),
    note: 'Lists appointments for the selected patient and date range via spActivityMaster.',
  },
  {
    path: 'cryo/semen-self',
    title: 'Cryopreservation – Semen Self',
    description: 'Semen self cryopreservation — SemenSelf.aspx.',
    kind: 'cryo-list',
    cryo: cryoList('spSemenSelf', '@SemenSelfID'),
  },
  {
    path: 'cryo/semen-donor',
    title: 'Cryopreservation – Semen Donor',
    description: 'Donor semen cryopreservation — DonorSemen.aspx.',
    kind: 'cryo-list',
    cryo: cryoList('spSemenDonor', '@SemenDonorID'),
  },
  {
    path: 'cryo/oocytes',
    title: 'Cryopreservation – Oocytes',
    description: 'Oocyte cryopreservation module.',
    kind: 'cryo-list',
    cryo: cryoList('spOocyteCryo', '@OocyteCryoID'),
  },
  {
    path: 'cryo/embryos',
    title: 'Cryopreservation – Embryos',
    description: 'Embryo cryopreservation module.',
    kind: 'cryo-list',
    cryo: cryoList('spEmbryoCryo', '@EmbryoCryoID'),
  },
  {
    path: 'reports/consent-forms',
    title: 'Consent Forms',
    description: 'Report viewer — RptConsentForms.aspx.',
    kind: 'report',
    report: patientReport('spRptConsentForms', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/art-cycle',
    title: 'ART Cycle Summary',
    description: 'Report viewer — rptARTCYCLESUMMARY.aspx.',
    kind: 'report',
    report: patientReport('spRptARTCycleSummary', REPORT_PARAMS, 1, { requiresDateRange: true }),
  },
  {
    path: 'reports/qrcode-list',
    title: 'QR Code List',
    description: 'Report viewer — QRCodeList.aspx.',
    kind: 'report',
    report: patientReport('spRptQRCodeList', REPORT_PARAMS_NO_DATE, 1, { requiresPatient: false }),
  },
  {
    path: 'reports/ivf-summary',
    title: 'IVF Summary Report',
    description: 'Report viewer — spRptIVFSummary.',
    kind: 'report',
    report: patientReport('spRptIVFSummary', REPORT_PARAMS, 1, { requiresDateRange: true }),
  },
  {
    path: 'reports/hsa-summary',
    title: 'HSA Summary Report',
    description: 'Report viewer — spRptHSASummary.',
    kind: 'report',
    report: patientReport('spRptHSASummary', REPORT_PARAMS, 1, { requiresDateRange: true }),
  },
  {
    path: 'reports/embryo-pictures',
    title: 'Embryo Pictures Report',
    description: 'Report viewer — embryo pictures module.',
    kind: 'report',
    report: patientReport('spRptEmbryoPictures', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/passbook/semen-self',
    title: 'Frozen Semen Self Passbook',
    description: 'Report viewer — rptSemonSelf.aspx.',
    kind: 'report',
    report: patientReport('spRptSemenSelfPassbook', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/passbook/semen-donor',
    title: 'Frozen Semen Donor Passbook',
    description: 'Report viewer — rptSemonDonor.aspx.',
    kind: 'report',
    report: patientReport('spRptSemenDonorPassbook', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/passbook/oocytes',
    title: 'Frozen Oocytes Passbook',
    description: 'Report viewer — rptEmbroys.aspx (Oocytes).',
    kind: 'report',
    report: patientReport('spRptOocytes', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/passbook/embryos-self',
    title: 'Embryos – Self Passbook',
    description: 'Report viewer — rptEmbroys.aspx.',
    kind: 'report',
    report: patientReport('spRptEmbryoSelfPassbook', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/passbook/embryos-recipient',
    title: 'Embryos Recipient / Donation',
    description: 'Report viewer — rptEmbroysRecipient.aspx.',
    kind: 'report',
    report: patientReport('spRptEmbryoRecipientPassbook', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/passbook/oocytes-passbook',
    title: 'Oocytes Passbook',
    description: 'Report viewer — RptOcytePassbook.',
    kind: 'report',
    report: patientReport('spRptOcytePassbook', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/andrology/iui',
    title: 'IUI Summary Report',
    description: 'Report viewer — RptIUISummary.aspx.',
    kind: 'report',
    report: patientReport('spRptIUISummary', REPORT_PARAMS, 1, { requiresDateRange: true }),
  },
  {
    path: 'reports/andrology/semen-self-freeze',
    title: 'Semen Self Freeze Report',
    description: 'Report viewer — RptSemenSelfFreeze.aspx.',
    kind: 'report',
    report: patientReport('spRptSemenSelfFreeze', REPORT_PARAMS, 1, { requiresDateRange: true }),
  },
  {
    path: 'reports/andrology/semen-valid-till',
    title: 'Semen Self – Valid Till',
    description: 'Report viewer — RptSemenSelfFreezeValidTill.aspx.',
    kind: 'report',
    report: patientReport('spRptSemenSelfFreezeValidTill', REPORT_PARAMS_NO_DATE, 1),
  },
  {
    path: 'reports/statistics/fresh-cycles',
    title: 'Fresh Cycles Statistics',
    description: 'Statistics report — fresh cycles.',
    kind: 'report',
    report: patientReport('spRptFreshCyclesStats', REPORT_PARAMS, 1, { requiresPatient: false, requiresDateRange: true }),
  },
  {
    path: 'reports/statistics/frozen-cycles',
    title: 'Frozen Cycles Statistics',
    description: 'Statistics report — frozen cycles.',
    kind: 'report',
    report: patientReport('spRptFrozenCyclesStats', REPORT_PARAMS, 1, { requiresPatient: false, requiresDateRange: true }),
  },
  {
    path: 'reports/pictures',
    title: 'Pictures Report',
    description: 'Report viewer — RptEmbryosPictures.aspx.',
    kind: 'report',
    report: patientReport('spRptEmbryosPictures', REPORT_PARAMS_NO_DATE, 1),
  },
];

const REGISTRY_MAP = new Map(MODULE_REGISTRY.map((m) => [m.path, m]));

export function getModuleDefinition(path: string): ModuleDefinition | null {
  const normalized = path.replace(/^\/+|\/+$/g, '');
  return REGISTRY_MAP.get(normalized) ?? null;
}

export function titleFromSlug(slug: string[]): string {
  return slug
    .join(' › ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** @deprecated Use getModuleDefinition — kept for backward compatibility */
export interface PendingModuleMeta {
  title: string;
  description: string;
  note?: string;
}

export function getPendingModule(path: string): PendingModuleMeta | null {
  const def = getModuleDefinition(path);
  if (!def) return null;
  return { title: def.title, description: def.description, note: def.note };
}
