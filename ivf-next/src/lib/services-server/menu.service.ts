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
        return parents.map((p) => {
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
      }
    } catch (err) {
      console.warn('[MenuService] DB fetch failed for Left Menu, using fallback:', err);
    }
  }
  return DEFAULT_LEFT_MENUS;
}

export async function getTopMenuItems(onlyActive = true): Promise<TopMenuItem[]> {
  if (isDbConfigured()) {
    try {
      const sqlQuery = onlyActive
        ? `SELECT TopMenuId, NodeName, Label, Route, Icon, OrderIndex, IsActive, RequiresBarcode FROM AppMenuTop WHERE IsActive = 1 ORDER BY OrderIndex ASC`
        : `SELECT TopMenuId, NodeName, Label, Route, Icon, OrderIndex, IsActive, RequiresBarcode FROM AppMenuTop ORDER BY OrderIndex ASC`;

      const rows = await executeText<Record<string, unknown>>(sqlQuery);

      if (rows.recordset && rows.recordset.length > 0) {
        return rows.recordset.map((r) => ({
          topMenuId: Number(r.TopMenuId),
          nodeName: String(r.NodeName),
          label: String(r.Label),
          route: String(r.Route),
          icon: r.Icon ? String(r.Icon) : undefined,
          orderIndex: Number(r.OrderIndex || 0),
          isActive: Boolean(r.IsActive),
          requiresBarcode: Boolean(r.RequiresBarcode),
        }));
      }
    } catch (err) {
      console.warn('[MenuService] DB fetch failed for Top Menu, using fallback:', err);
    }
  }

  return onlyActive ? DEFAULT_TOP_MENUS.filter((m) => m.isActive) : DEFAULT_TOP_MENUS;
}
