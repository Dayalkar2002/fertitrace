'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { TopNavMenu, MasterMenuItem } from '@/lib/nav-config';
import { TOP_NAV_MENUS, getMasterColumns } from '@/lib/nav-config';

export function TopNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [masterSearch, setMasterSearch] = useState('');
  const [masterFilter, setMasterFilter] = useState<'all' | 'fertitrace' | 'standard'>('all');
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
    return false;
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
        const matchesQuery = !q || item.label.toLowerCase().includes(q);
        if (!matchesQuery) return false;
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
    <nav ref={navRef} className="hidden flex-1 items-center gap-1.5 xl:flex">
      {TOP_NAV_MENUS.map((menu) => (
        <div key={menu.label} className="relative">
          {menu.route && !hasDropdown(menu) ? (
            <Link
              href={menu.route}
              className={`whitespace-nowrap inline-flex items-center rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
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
                className={`whitespace-nowrap inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  openMenu === menu.label || isActive(menu)
                    ? 'bg-purple-100 text-[#6345A6] shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{menu.label}</span>
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
                    /* Master Dropdown: All 32+ Masters across 4 columns with Two-Color Highlighting */
                    <div className="absolute left-0 sm:left-[-120px] md:left-[-180px] lg:left-[-220px] xl:left-[-200px] top-full z-50 mt-2.5 w-[900px] max-w-[calc(100vw-280px)] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[calc(100vh-120px)] overflow-y-auto">
                      {/* Header with Title, Search, and Two-Color Legend */}
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
                              placeholder="Search masters..."
                              className="w-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-[#6345A6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#6345A6]"
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

                        {/* Two-Color Legend & Filter Tabs */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50/80 px-3 py-2 border border-slate-100">
                          {/* Legend showing both distinct colors */}
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1.5 font-bold text-purple-900">
                              <span className="h-2.5 w-2.5 rounded-full bg-[#6345A6] shadow-2xs ring-2 ring-purple-200" />
                              <span>FertiTrace In-Use (12)</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center gap-1.5 font-semibold text-slate-600">
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 ring-2 ring-slate-100" />
                              <span>Standard Masters (20+)</span>
                            </span>
                          </div>

                          {/* Filter Tabs */}
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

                      {/* 4 Columns of Masters with Two-Colour Highlighting */}
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
                                return (
                                  <Link
                                    key={item.route + item.label}
                                    href={item.route}
                                    onClick={() => setOpenMenu(null)}
                                    className={`group flex items-center justify-between rounded-xl p-2 transition-all border ${
                                      isUsed
                                        ? 'bg-purple-50/80 hover:bg-purple-100/90 border-purple-200/90 hover:border-purple-300 shadow-2xs'
                                        : 'bg-slate-50/60 hover:bg-slate-100/90 border-slate-200/70 hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-1">
                                      <span
                                        className={`h-2 w-2 rounded-full shrink-0 transition-transform group-hover:scale-125 ${
                                          isUsed
                                            ? 'bg-[#6345A6] ring-2 ring-purple-200'
                                            : 'bg-slate-400'
                                        }`}
                                      />
                                      <span
                                        className={`text-xs truncate transition-colors ${
                                          isUsed
                                            ? 'font-bold text-purple-950 group-hover:text-[#6345A6]'
                                            : 'font-medium text-slate-700 group-hover:text-slate-900'
                                        }`}
                                      >
                                        {item.label}
                                      </span>
                                    </div>
                                    <span
                                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[8.5px] font-bold leading-none ${
                                        isUsed
                                          ? 'bg-[#6345A6] text-white shadow-2xs'
                                          : 'bg-slate-200/80 text-slate-600'
                                      }`}
                                    >
                                      {isUsed ? 'In Use' : 'Standard'}
                                    </span>
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
                          <span className="text-[11px] text-purple-800 font-bold">
                            12 highlighted for FertiTrace project
                          </span>
                        </div>
                        <Link
                          href="/masters"
                          onClick={() => setOpenMenu(null)}
                          className="font-bold text-[#6345A6] hover:underline flex items-center gap-1"
                        >
                          <span>Open Full Master Directory</span>
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
                      {menu.items?.map((item) => (
                        <Link
                          key={item.route + item.label}
                          href={item.route}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#6345A6] transition"
                        >
                          <span>{item.label}</span>
                          <span className="text-[10px] opacity-40">→</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}
