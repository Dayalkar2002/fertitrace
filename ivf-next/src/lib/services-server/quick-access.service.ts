import { executeText } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export interface QuickAccessItem {
  quickAccessId?: number;
  userId?: number;
  userLoginName?: string;
  moduleKey: string;
  title: string;
  description?: string;
  route: string;
  icon: string;
  badgeText?: string;
  colorTheme?: string;
  orderIndex: number;
  isPinned: boolean;
  isActive: boolean;
}

export const CATALOG_MODULES: QuickAccessItem[] = [
  {
    moduleKey: 'patient_management',
    title: 'Patient Management',
    description: 'Demographics, Aadhar & Registration',
    route: '/masters/patient',
    icon: 'patient',
    badgeText: 'Core',
    colorTheme: 'purple',
    orderIndex: 1,
    isPinned: true,
    isActive: true,
  },
  {
    moduleKey: 'barcode_printing',
    title: 'Barcode Label Printing',
    description: 'Dish, Tube & Straw Labels',
    route: '/label-printing',
    icon: 'label',
    badgeText: 'Print',
    colorTheme: 'indigo',
    orderIndex: 2,
    isPinned: true,
    isActive: true,
  },
  {
    moduleKey: 'cycle_management',
    title: 'Cycle Entry',
    description: 'Clinical Witnessing Setup',
    route: '/cycle/entry',
    icon: 'cycle',
    badgeText: 'Active',
    colorTheme: 'blue',
    orderIndex: 3,
    isPinned: true,
    isActive: true,
  },
  {
    moduleKey: 'sperm_management',
    title: 'Sperm Processing',
    description: 'Semen Analysis & Witnessing',
    route: '/sperm',
    icon: 'sperm',
    badgeText: 'Lab',
    colorTheme: 'teal',
    orderIndex: 4,
    isPinned: true,
    isActive: true,
  },
  {
    moduleKey: 'sperm_iui',
    title: 'IUI Preparation',
    description: 'Insemination Media & Wash',
    route: '/sperm?mode=IUI',
    icon: 'sperm',
    badgeText: 'IUI',
    colorTheme: 'teal',
    orderIndex: 5,
    isPinned: false,
    isActive: true,
  },
  {
    moduleKey: 'oocyte_management',
    title: 'Oocyte & Embryo',
    description: 'OPU, ICSI & Culturing',
    route: '/oocyte-embryo',
    icon: 'embryo',
    badgeText: 'IVF',
    colorTheme: 'pink',
    orderIndex: 6,
    isPinned: true,
    isActive: true,
  },
  {
    moduleKey: 'cryopreservation',
    title: 'Cryopreservation',
    description: 'Straws, Vials & Canisters',
    route: '/sperm?mode=Cryopreservation',
    icon: 'cryo',
    badgeText: 'Tank',
    colorTheme: 'sky',
    orderIndex: 7,
    isPinned: true,
    isActive: true,
  },
  {
    moduleKey: 'witness_system',
    title: 'Witness Verification',
    description: 'RFID & Mismatch Shield',
    route: '/witness',
    icon: 'witness',
    badgeText: 'Shield',
    colorTheme: 'emerald',
    orderIndex: 8,
    isPinned: true,
    isActive: true,
  },
  {
    moduleKey: 'lab_inventory',
    title: 'Lab Inventory',
    description: 'Media Batches & Expiries',
    route: '/inventory',
    icon: 'inventory',
    badgeText: 'Stock',
    colorTheme: 'amber',
    orderIndex: 9,
    isPinned: false,
    isActive: true,
  },
  {
    moduleKey: 'reports_analytics',
    title: 'Audit & Reports',
    description: 'Compliance & Summary Logs',
    route: '/reports',
    icon: 'reports',
    badgeText: 'Audit',
    colorTheme: 'amber',
    orderIndex: 10,
    isPinned: true,
    isActive: true,
  },
  {
    moduleKey: 'doctor_master',
    title: 'Doctor Master',
    description: 'Clinicians & Specialists',
    route: '/masters/doctor',
    icon: 'masters',
    badgeText: 'Master',
    colorTheme: 'purple',
    orderIndex: 11,
    isPinned: false,
    isActive: true,
  },
  {
    moduleKey: 'satellite_master',
    title: 'Satellite Centers',
    description: 'Affiliated Branch Clinics',
    route: '/masters/satellite',
    icon: 'masters',
    badgeText: 'Branch',
    colorTheme: 'blue',
    orderIndex: 12,
    isPinned: false,
    isActive: true,
  },
  {
    moduleKey: 'user_master',
    title: 'Users & Roles',
    description: 'Operator Master & Permissions',
    route: '/masters/user',
    icon: 'users',
    badgeText: 'Admin',
    colorTheme: 'rose',
    orderIndex: 13,
    isPinned: false,
    isActive: true,
  },
  {
    moduleKey: 'communication',
    title: 'Patient Messaging',
    description: 'Automated SMS & WhatsApp Alerts',
    route: '/communication',
    icon: 'communication',
    badgeText: 'Alerts',
    colorTheme: 'emerald',
    orderIndex: 14,
    isPinned: false,
    isActive: true,
  },
];

function mapRow(r: Record<string, unknown>): QuickAccessItem {
  return {
    quickAccessId: Number(r.QuickAccessId),
    userId: Number(r.UserId ?? 0),
    userLoginName: r.UserLoginName ? String(r.UserLoginName) : undefined,
    moduleKey: String(r.ModuleKey),
    title: String(r.Title),
    description: r.Description ? String(r.Description) : undefined,
    route: String(r.Route),
    icon: String(r.Icon || 'dashboard'),
    badgeText: r.BadgeText ? String(r.BadgeText) : undefined,
    colorTheme: r.ColorTheme ? String(r.ColorTheme) : 'purple',
    orderIndex: Number(r.OrderIndex || 0),
    isPinned: Boolean(r.IsPinned),
    isActive: Boolean(r.IsActive),
  };
}

/**
 * Fetches user-customized Quick Access modules.
 * If user has no customized entries, returns default entries (UserId = 0).
 */
export async function getQuickAccessForUser(
  userId: number = 0,
  loginName: string = 'admin'
): Promise<QuickAccessItem[]> {
  if (isDbConfigured()) {
    try {
      // 1. Check if user has personal configured quick access
      if (userId > 0 || (loginName && loginName !== 'default')) {
        const userQuery = `
          SELECT QuickAccessId, UserId, UserLoginName, ModuleKey, Title, Description, Route, Icon, BadgeText, ColorTheme, OrderIndex, IsPinned, IsActive
          FROM AppUserQuickAccess
          WHERE (UserId = @UserId OR UserLoginName = @LoginName) AND IsActive = 1
          ORDER BY OrderIndex ASC
        `;
        const userRows = await executeText<Record<string, unknown>>(userQuery, [
          { name: '@UserId', value: userId },
          { name: '@LoginName', value: loginName },
        ]);

        if (userRows.recordset && userRows.recordset.length > 0) {
          return userRows.recordset.map(mapRow);
        }
      }

      // 2. Otherwise load default system quick access (UserId = 0)
      const defaultQuery = `
        SELECT QuickAccessId, UserId, UserLoginName, ModuleKey, Title, Description, Route, Icon, BadgeText, ColorTheme, OrderIndex, IsPinned, IsActive
        FROM AppUserQuickAccess
        WHERE UserId = 0 AND IsActive = 1
        ORDER BY OrderIndex ASC
      `;
      const defRows = await executeText<Record<string, unknown>>(defaultQuery);
      if (defRows.recordset && defRows.recordset.length > 0) {
        return defRows.recordset.map(mapRow);
      }
    } catch (err) {
      console.warn('[QuickAccessService] DB fetch failed, using catalog default:', err);
    }
  }

  return CATALOG_MODULES.slice(0, 8);
}

/**
 * Returns all available modules in the catalog for the user to pick from.
 */
export async function getAllCatalogWithUserState(
  userId: number = 0,
  loginName: string = 'admin'
): Promise<QuickAccessItem[]> {
  const activeItems = await getQuickAccessForUser(userId, loginName);
  const activeMap = new Map(activeItems.map((item) => [item.moduleKey, item]));

  return CATALOG_MODULES.map((catItem, idx) => {
    const userItem = activeMap.get(catItem.moduleKey);
    if (userItem) {
      return {
        ...catItem,
        quickAccessId: userItem.quickAccessId,
        orderIndex: userItem.orderIndex,
        isPinned: userItem.isPinned,
        isActive: userItem.isActive,
      };
    }
    return {
      ...catItem,
      orderIndex: idx + 100,
      isPinned: false,
      isActive: false,
    };
  });
}

/**
 * Saves user's custom quick access module selection.
 */
export async function saveUserQuickAccess(
  userId: number,
  loginName: string,
  selectedModules: Array<{
    moduleKey: string;
    isPinned?: boolean;
    isActive?: boolean;
    orderIndex?: number;
  }>
): Promise<QuickAccessItem[]> {
  if (!isDbConfigured()) {
    return CATALOG_MODULES.slice(0, 8);
  }

  const effectiveUserId = userId || 0;
  const effectiveLogin = loginName || 'admin';

  // 1. Delete previous personal entries for this user
  await executeText(
    `DELETE FROM AppUserQuickAccess WHERE (UserId = @UserId AND UserId > 0) OR (UserLoginName = @LoginName AND UserLoginName <> 'default')`,
    [
      { name: '@UserId', value: effectiveUserId },
      { name: '@LoginName', value: effectiveLogin },
    ]
  );

  // 2. Insert new customized entries for this user
  for (let i = 0; i < selectedModules.length; i++) {
    const sel = selectedModules[i];
    const cat = CATALOG_MODULES.find((c) => c.moduleKey === sel.moduleKey);
    if (!cat) continue;

    await executeText(
      `
      INSERT INTO AppUserQuickAccess
      (UserId, UserLoginName, ModuleKey, Title, Description, Route, Icon, BadgeText, ColorTheme, OrderIndex, IsPinned, IsActive)
      VALUES
      (@UserId, @UserLoginName, @ModuleKey, @Title, @Description, @Route, @Icon, @BadgeText, @ColorTheme, @OrderIndex, @IsPinned, @IsActive)
      `,
      [
        { name: '@UserId', value: effectiveUserId },
        { name: '@UserLoginName', value: effectiveLogin },
        { name: '@ModuleKey', value: cat.moduleKey },
        { name: '@Title', value: cat.title },
        { name: '@Description', value: cat.description || '' },
        { name: '@Route', value: cat.route },
        { name: '@Icon', value: cat.icon },
        { name: '@BadgeText', value: cat.badgeText || '' },
        { name: '@ColorTheme', value: cat.colorTheme || 'purple' },
        { name: '@OrderIndex', value: sel.orderIndex ?? i + 1 },
        { name: '@IsPinned', value: sel.isPinned ? 1 : 0 },
        { name: '@IsActive', value: sel.isActive !== false ? 1 : 0 },
      ]
    );
  }

  return getQuickAccessForUser(effectiveUserId, effectiveLogin);
}

/**
 * Resets user quick access to system defaults.
 */
export async function resetUserQuickAccess(
  userId: number,
  loginName: string
): Promise<QuickAccessItem[]> {
  if (isDbConfigured()) {
    await executeText(
      `DELETE FROM AppUserQuickAccess WHERE (UserId = @UserId AND UserId > 0) OR (UserLoginName = @LoginName AND UserLoginName <> 'default')`,
      [
        { name: '@UserId', value: userId || 0 },
        { name: '@LoginName', value: loginName || 'admin' },
      ]
    );
  }
  return getQuickAccessForUser(0, 'default');
}
