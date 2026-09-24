import { executeText } from '@/lib/db/spExecutor';
import { isDbConfigured } from '@/lib/db/pool';

export type { LeftMenuSubItem, LeftMenuItem, TopMenuItem } from '@/lib/nav-config';
import { DEFAULT_LEFT_MENUS, DEFAULT_TOP_MENUS, LeftMenuItem, TopMenuItem } from '@/lib/nav-config';
export { DEFAULT_LEFT_MENUS, DEFAULT_TOP_MENUS };

export async function getLeftMenuItems(): Promise<LeftMenuItem[]> {
  if (isDbConfigured()) {
    try {
      const rows = await executeText<Record<string, unknown>>(`
        SELECT NodeId, NodeName, Label, Route, Icon, ParentNodeId, OrderIndex, IsActive, BadgeText
        FROM AppMenuLeft
        WHERE IsActive = 1
        ORDER BY OrderIndex ASC
      `);

      if (rows.recordset && rows.recordset.length > 0) {
        const all = rows.recordset;
        const parents = all.filter((r) => !r.ParentNodeId);
        const mapped = parents.map((p) => {
          const subs = all
            .filter((s) => Number(s.ParentNodeId) === Number(p.NodeId))
            .map((s) => ({
              nodeId: Number(s.NodeId),
              nodeName: String(s.NodeName),
              label: String(s.Label),
              route: String(s.Route),
              icon: s.Icon ? String(s.Icon) : undefined,
              orderIndex: Number(s.OrderIndex || 0),
              isActive: Boolean(s.IsActive),
            }));

          return {
            nodeId: Number(p.NodeId),
            nodeName: String(p.NodeName),
            label: String(p.Label),
            route: String(p.Route),
            icon: p.Icon ? String(p.Icon) : undefined,
            orderIndex: Number(p.OrderIndex || 0),
            isActive: Boolean(p.IsActive),
            badgeText: p.BadgeText ? String(p.BadgeText) : undefined,
            subModules: subs.length > 0 ? subs : undefined,
          };
        });
        const patched = mapped
          .filter((item) => item.nodeName !== 'cryopreservation' && item.nodeName !== 'embryo_management')
          .map((item) => {
            if (item.nodeName === 'oocyte_management') {
              return { ...item, label: 'Oocyte & Embryo', route: '/oocyte-embryo' };
            }
            if (item.nodeName === 'cycle_management') {
              return { ...item, label: 'Cycle Retrieval Screen', route: '/cycle/entry' };
            }
            if (item.nodeName !== 'communication' || (item.subModules && item.subModules.length > 0)) {
              return item;
            }
            const fallback = DEFAULT_LEFT_MENUS.find((row) => row.nodeName === 'communication');
            return fallback?.subModules ? { ...item, subModules: fallback.subModules } : item;
          });
        return hideConsentMenu(ensureCycleCreationMenu(patched));
      }
    } catch (err) {
      console.warn('[MenuService] DB fetch failed for Left Menu, using fallback:', err);
    }
  }
  return hideConsentMenu(DEFAULT_LEFT_MENUS);
}

function ensureCycleCreationMenu(items: LeftMenuItem[]): LeftMenuItem[] {
  if (items.some((item) => item.nodeName === 'cycle_creation' || item.route === '/cycle/creation')) {
    return items;
  }
  const creation = DEFAULT_LEFT_MENUS.find((item) => item.nodeName === 'cycle_creation');
  if (!creation) return items;
  const retrievalIndex = items.findIndex(
    (item) => item.nodeName === 'cycle_management' || item.route === '/cycle/entry'
  );
  if (retrievalIndex < 0) return [creation, ...items];
  return [...items.slice(0, retrievalIndex), creation, ...items.slice(retrievalIndex)];
}

function hideConsentMenu(items: LeftMenuItem[]): LeftMenuItem[] {
  return items.filter((item) => item.nodeName !== 'consent_forms' && item.route !== '/consent');
}

export async function getTopMenuItems(onlyActive = true): Promise<TopMenuItem[]> {
  if (isDbConfigured()) {
    try {
      const sqlQuery = onlyActive
        ? `SELECT TopMenuId, NodeName, Label, Route, Icon, OrderIndex, IsActive, RequiresBarcode FROM AppMenuTop WHERE IsActive = 1 ORDER BY OrderIndex ASC`
        : `SELECT TopMenuId, NodeName, Label, Route, Icon, OrderIndex, IsActive, RequiresBarcode FROM AppMenuTop ORDER BY OrderIndex ASC`;

      const rows = await executeText<Record<string, unknown>>(sqlQuery);

      if (rows.recordset && rows.recordset.length > 0) {
        return rows.recordset
          .map((r) => {
            const nodeName = String(r.NodeName);
            return {
              topMenuId: Number(r.TopMenuId),
              nodeName,
              label: String(r.Label),
              route: nodeName === 'cycle_barcode' ? '/cycle/creation' : String(r.Route),
              icon: r.Icon ? String(r.Icon) : undefined,
              orderIndex: Number(r.OrderIndex || 0),
              isActive: Boolean(r.IsActive),
              requiresBarcode: Boolean(r.RequiresBarcode),
            };
          })
          .filter((item) => item.nodeName !== 'consent_forms' && item.route !== '/consent');
      }
    } catch (err) {
      console.warn('[MenuService] DB fetch failed for Top Menu, using fallback:', err);
    }
  }

  return onlyActive ? DEFAULT_TOP_MENUS.filter((m) => m.isActive) : DEFAULT_TOP_MENUS;
}
