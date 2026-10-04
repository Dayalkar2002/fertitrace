'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TopNavMenu, MasterMenuItem } from '@/lib/nav-config';
import { TOP_NAV_MENUS, getMasterColumns, FERTITRACE_IN_USE_COUNT, STANDARD_MASTER_COUNT, QR_CODE_MASTER_COUNT } from '@/lib/nav-config';

export function TopNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [masterSearch, setMasterSearch] = useState('');
  const [masterFilter, setMasterFilter] = useState<'all' | 'fertitrace' | 'standard' | 'qrcode'>('all');
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset master search/filter when menu closes
  useEffect(() => {
    if (openMenu !== 'Master') {
      setMasterSearch('');
      setMasterFilter('all');
    }
  }, [openMenu]);

  function isActive(menu: TopNavMenu): boolean {
    if (menu.route) return pathname === menu.route || pathname.startsWith(`${menu.route}/`);
    if (menu.items?.some((i) => pathname === i.route || pathname.startsWith(`${i.route}/`))) return true;
    if (menu.groups?.some((g) => g.items.some((i) => pathname.startsWith(i.route)))) return true;
    if (menu.label === 'Master' && (pathname.startsWith('/masters') || pathname === '/dashboard?selectPatient=1')) return true;
    if (menu.label === 'Reports' && pathname.startsWith('/reports')) return true;
    return false;
  }

  function isItemActive(route: string) {
    if (pathname === route) return true;
    if (route === '/reports/andrology/iui' && pathname === '/reports/iui') return true;
    return pathname.startsWith(`${route}/`);
  }

  function activeChildLabel(menu: TopNavMenu) {
    return menu.items?.find((item) => isItemActive(item.route))?.label;
  }

  function hasDropdown(menu: TopNavMenu): boolean {
    return !!(menu.columns?.length || menu.groups?.length || menu.items?.length);
  }

  // All columns of masters (columns 1 to 4)
  const masterColumns = useMemo(() => getMasterColumns(), []);

  // Filtered master columns based on search and active filter tab
  const filteredColumns = useMemo(() => {
    const q = masterSearch.trim().toLowerCase();
    return masterColumns.map((col) =>
      col.filter((item) => {
        const matchesQuery = !q || item.label.toLowerCase().includes(q) || (item.qrRole && item.qrRole.toLowerCase().includes(q));
        if (!matchesQuery) return false;
        if (masterFilter === 'qrcode') return !!item.isQrCode;
        if (masterFilter === 'fertitrace') return !!item.isFertiTrace;
        if (masterFilter === 'standard') return !item.isFertiTrace;
        return true;
      })
    );
  }, [masterColumns, masterSearch, masterFilter]);

  const totalVisibleMasters = useMemo(() => {
    return filteredColumns.reduce((acc, col) => acc + col.length, 0);
  }, [filteredColumns]);

  return (
    <nav ref={navRef} className="flex min-w-0 flex-1 items-center gap-1">
      {TOP_NAV_MENUS.map((menu) => {
        const currentChild = activeChildLabel(menu);
        return (
        <div key={menu.label} className="relative">
          {menu.route && !hasDropdown(menu) ? (
            <Link
              href={menu.route}
              className={`whitespace-nowrap inline-flex items-center rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                isActive(menu)
                  ? 'bg-purple-100 text-[#6345A6] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {menu.label}
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
                className={`whitespace-nowrap inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-bold transition-all ${
                  openMenu === menu.label || isActive(menu)
                    ? 'bg-purple-100 text-[#6345A6] shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{menu.label}</span>
                {currentChild && (
                  <span className="rounded-md bg-[#6345A6] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    {currentChild}
                  </span>
                )}
                <span
                  className={`text-[10px] transition-transform duration-200 ${
                    openMenu === menu.label ? 'rotate-180 text-[#6345A6]' : 'opacity-60'
                  }`}
                >
                  ▾
                </span>
              </button>

              {openMenu === menu.label && (
                <>
                  {menu.label === 'Master' ? (
                    /* Master Dropdown: All Masters across 4 columns with QR Code & Two-Color Highlighting */
                    <div className="absolute left-0 sm:left-[-120px] md:left-[-180px] lg:left-[-220px] xl:left-[-200px] top-full z-50 mt-2.5 w-[940px] max-w-[calc(100vw-280px)] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[calc(100vh-120px)] overflow-y-auto">
                      {/* Header with Title, Search, and Legend */}
                      <div className="border-b border-slate-100 pb-3.5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-[#6345A6]">
                              <span className="text-base">🏷️</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900">
                                  Master Directory
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                  All 4 Columns
                                </span>
                                {masterFilter === 'qrcode' && (
                                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                    ⚡ QR Generation Tables Active
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Clinic, laboratory witnessing & configuration registries
                              </div>
                            </div>
                          </div>

                          {/* Search Input */}
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={masterSearch}
                              onChange={(e) => setMasterSearch(e.target.value)}
                              placeholder="Search masters or QR fields..."
                              className="w-56 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#6345A6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6345A6]"
                            />
                            {masterSearch && (
                              <button
                                type="button"
                                onClick={() => setMasterSearch('')}
                                className="absolute right-2 text-xs text-slate-400 hover:text-slate-600"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tri-Color Legend & Filter Tabs */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50/80 px-3 py-2 border border-slate-100">
                          {/* Legend showing distinct colors including QR Code Tables */}
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px]">
                            <span className="flex items-center gap-1.5 font-bold text-purple-900">
                              <span className="h-2.5 w-2.5 rounded-full bg-[#6345A6] shadow-2xs ring-2 ring-purple-200" />
                              <span>FertiTrace In-Use ({FERTITRACE_IN_USE_COUNT})</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1.5 font-bold text-emerald-800">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-2xs ring-2 ring-emerald-200" />
                              <span>QR Code Tables ({QR_CODE_MASTER_COUNT})</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 ring-2 ring-slate-100" />
                              <span>Standard ({STANDARD_MASTER_COUNT})</span>
                            </span>
                          </div>

                          {/* Filter Tabs with separate QR Code option */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setMasterFilter('all')}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                                masterFilter === 'all'
                                  ? 'bg-purple-600 text-white shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              All ({totalVisibleMasters})
                            </button>
                            <button
                              type="button"
                              onClick={() => setMasterFilter('qrcode')}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                                masterFilter === 'qrcode'
                                  ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-300'
                                  : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/70'
                              }`}
                            >
                              ⚡ QR Code ({QR_CODE_MASTER_COUNT})
                            </button>
                            <button
                              type="button"
                              onClick={() => setMasterFilter('fertitrace')}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                                masterFilter === 'fertitrace'
                                  ? 'bg-[#6345A6] text-white shadow-2xs'
                                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                              }`}
                            >
                              🟣 FertiTrace
                            </button>
                            <button
                              type="button"
                              onClick={() => setMasterFilter('standard')}
                              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition ${
                                masterFilter === 'standard'
                                  ? 'bg-slate-700 text-white shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              ⚪ Standard
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 4 Columns of Masters with QR Highlighting */}
                      <div className="mt-3.5 grid grid-cols-4 gap-3">
                        {filteredColumns.map((column, ci) => (
                          <div key={ci} className="space-y-1.5">
                            <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 mb-1">
                              Column {ci + 1}
                            </div>
                            {column.length === 0 ? (
                              <div className="px-2 py-3 text-center text-[10px] italic text-slate-400">
                                No matching masters
                              </div>
                            ) : (
                              column.map((item) => {
                                const isUsed = !!item.isFertiTrace;
                                const isQr = !!item.isQrCode;
                                return (
                                  <Link
                                    key={item.route + item.label}
                                    href={item.route}
                                    onClick={() => setOpenMenu(null)}
                                    title={item.qrRole || item.label}
                                    className={`group flex items-center justify-between rounded-xl p-2 transition-all border ${
                                      masterFilter === 'qrcode'
                                        ? 'bg-emerald-50/80 hover:bg-emerald-100/90 border-emerald-300 hover:border-emerald-400 shadow-2xs'
                                        : isQr && isUsed
                                        ? 'bg-purple-50/80 hover:bg-purple-100/90 border-purple-200/90 hover:border-purple-300 shadow-2xs ring-1 ring-emerald-500/20'
                                        : isUsed
                                        ? 'bg-purple-50/80 hover:bg-purple-100/90 border-purple-200/90 hover:border-purple-300 shadow-2xs'
                                        : 'bg-slate-50/60 hover:bg-slate-100/90 border-slate-200/70 hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex flex-col min-w-0 pr-1">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`h-2 w-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                                            isQr
                                              ? 'bg-emerald-500 ring-2 ring-emerald-200'
                                              : isUsed
                                              ? 'bg-[#6345A6] ring-2 ring-purple-200'
                                              : 'bg-slate-400'
                                          }`}
                                        />
                                        <span
                                          className={`text-xs truncate transition-colors ${
                                            isQr
                                              ? 'font-bold text-slate-900 group-hover:text-emerald-700'
                                              : isUsed
                                              ? 'font-bold text-purple-950 group-hover:text-[#6345A6]'
                                              : 'font-medium text-slate-700 group-hover:text-slate-900'
                                          }`}
                                        >
                                          {item.label}
                                        </span>
                                      </div>
                                      {masterFilter === 'qrcode' && item.qrRole && (
                                        <span className="mt-0.5 text-[9px] font-medium text-emerald-700 truncate pl-4">
                                          {item.qrRole}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {isQr && (
                                        <span className="rounded-md px-1 py-0.5 text-[8px] font-black leading-none bg-emerald-600 text-white shadow-2xs" title={item.qrRole}>
                                          ⚡ QR
                                        </span>
                                      )}
                                      <span
                                        className={`rounded-md px-1.5 py-0.5 text-[8.5px] font-bold leading-none ${
                                          isUsed
                                            ? 'bg-[#6345A6] text-white shadow-2xs'
                                            : 'bg-slate-200/80 text-slate-600'
                                        }`}
                                      >
                                        {isUsed ? 'In Use' : 'Standard'}
                                      </span>
                                    </div>
                                  </Link>
                                );
                              })
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            Showing {totalVisibleMasters} registries
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-emerald-800 font-bold">
                            {QR_CODE_MASTER_COUNT} active in QR code generation
                          </span>
                        </div>
                        <Link
                          href="/masters/qr-code"
                          onClick={() => setOpenMenu(null)}
                          className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                        >
                          <span>Open QR Code Master & Data Dictionary</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* General Dropdowns (e.g. Cryo) */
                    <div className="absolute left-0 top-full z-50 mt-2.5 min-w-[240px] rounded-2xl border border-slate-200 bg-white py-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-1.5 border-b border-slate-100 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {menu.label} Navigation
                      </div>
                      {menu.items?.map((item) => {
                        const itemActive = isItemActive(item.route);
                        return (
                          <Link
                            key={item.route + item.label}
                            href={item.route}
                            onClick={() => setOpenMenu(null)}
                            className={`flex items-center justify-between px-3.5 py-2 text-xs transition ${
                              itemActive
                                ? 'bg-purple-50 font-extrabold text-[#6345A6]'
                                : 'font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#6345A6]'
                            }`}
                          >
                            <span>{item.label}</span>
                            {itemActive ? (
                              <span className="rounded bg-[#6345A6] px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                                Current
                              </span>
                            ) : (
                              <span className="text-[10px] opacity-40">→</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
        );
      })}
    </nav>
  );
}
