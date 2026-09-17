'use client';

import Link from 'next/link';
import { type ReactNode, useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { ModuleRunner } from '@/components/module-runner';
import { ArtCycleReport } from '@/components/reports/art-cycle-report';
import { IuiSummaryReport } from '@/components/reports/iui-summary-report';
import { REPORT_MENU_GROUPS, TOP_NAV_MENUS } from '@/lib/nav-config';
import { getModuleDefinition, titleFromSlug } from '@/lib/module-registry';

const REPORT_TABS = TOP_NAV_MENUS.find((menu) => menu.label === 'Reports')?.items ?? [];

function isReportTabActive(pathname: string, route: string) {
  if (pathname === route) return true;
  if (route === '/reports/andrology/iui' && (pathname === '/reports/iui' || pathname.startsWith('/reports/andrology/iui'))) {
    return true;
  }
  return pathname.startsWith(`${route}/`);
}

function ReportScreenHeader({ title }: { title: string }) {
  const pathname = usePathname();
  return (
    <div className="print:hidden mb-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6345A6]">Reports</p>
      <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-900">{title}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        {REPORT_TABS.map((tab) => {
          const active = isReportTabActive(pathname, tab.route);
          return (
            <Link
              key={tab.route}
              href={tab.route}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                active
                  ? 'bg-[#6345A6] text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-purple-50 hover:text-[#6345A6]'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SmartReportFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <ReportScreenHeader title={title} />
      {children}
    </div>
  );
}

export function ReportPage() {
  const params = useParams<{ slug?: string[] }>();
  const slug = params.slug ?? [];
  const path = slug.length ? `reports/${slug.join('/')}` : 'reports';
  const title = titleFromSlug(slug.length ? slug : ['reports']);
  const slugPath = slug.join('/');

  const matchedRoute = useMemo(() => {
    for (const group of REPORT_MENU_GROUPS) {
      for (const item of group.items) {
        const routeSlug = item.route.replace(/^\/reports\/?/, '');
        if (routeSlug === slug.join('/')) return item;
      }
    }
    return null;
  }, [slug]);

  const SMART_REPORT_ROUTES = new Set(['/reports/art-cycle', '/reports/andrology/iui']);
  const displayTitle = matchedRoute?.label ?? title;
  const reportsHub = slug.length === 0;

  if (slugPath === 'art-cycle') {
    return (
      <SmartReportFrame title="ART Cycle Summary">
        <ArtCycleReport />
      </SmartReportFrame>
    );
  }
  if (slugPath === 'andrology/iui' || slugPath === 'iui') {
    return (
      <SmartReportFrame title="IUI Summary Report">
        <IuiSummaryReport />
      </SmartReportFrame>
    );
  }

  if (reportsHub) {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-green">Analytics</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-900">Reports Hub</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Open ART Cycle or IUI from the Reports tab in the top menu, matching SMART. Other reports
            still run through the stored-procedure viewer when SQL is configured.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {REPORT_MENU_GROUPS.map((group) => (
            <div key={group.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card">
              <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {group.label}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.route}>
                    <Link
                      href={item.route}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                        SMART_REPORT_ROUTES.has(item.route)
                          ? 'bg-purple-50 text-[#6345A6] hover:bg-purple-100'
                          : 'text-slate-700 hover:bg-brand-mist hover:text-brand-dark'
                      }`}
                    >
                      <span>{item.label}</span>
                      {SMART_REPORT_ROUTES.has(item.route) && (
                        <span className="rounded-md bg-[#6345A6] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          SMART
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const def = getModuleDefinition(path);
  if (def) {
    return <ModuleRunner path={path} titleOverride={displayTitle} />;
  }

  return (
    <div className="space-y-4">
      <ModuleRunner path={path} titleOverride={displayTitle} />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Available reports</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {REPORT_MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{group.label}</h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.route}>
                    <Link href={item.route} className="text-sm text-brand-primary hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
