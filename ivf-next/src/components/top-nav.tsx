'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { TopNavMenu } from '@/lib/nav-config';
import { TOP_NAV_MENUS } from '@/lib/nav-config';
import { NavIcon } from '@/components/nav-icons';

export function TopNav() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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

  // 4 categorized sections for Barcode Preparation Masters
  const MASTER_CATEGORIES = [
    {
      title: 'Patient & Identity',
      badge: 'Clinical',
      color: 'border-purple-200 bg-purple-50/60 text-[#6345A6]',
      items: [
        { label: 'Patient Management', route: '/masters/patient', desc: 'Demographics & Aadhar', icon: 'patient' },
        { label: 'Patient Selection', route: '/dashboard?selectPatient=1', desc: 'Active patient picker', icon: 'patient' },
        { label: 'Doctor Master', route: '/masters/doctor', desc: 'Referring & treating doctors', icon: 'masters' },
      ],
    },
    {
      title: 'Facility & Operators',
      badge: 'Staff',
      color: 'border-blue-200 bg-blue-50/60 text-blue-600',
      items: [
        { label: 'Satellite Master', route: '/masters/satellite', desc: 'Branch centers & clinics', icon: 'masters' },
        { label: 'User / Operator Master', route: '/masters/user', desc: 'Logins & role permissions', icon: 'users' },
        { label: 'Lab Operator Master', route: '/masters/common/2', desc: 'Witnessing technician registry', icon: 'users' },
      ],
    },
    {
      title: 'Consumables & ID',
      badge: 'Witness',
      color: 'border-teal-200 bg-teal-50/60 text-teal-600',
      items: [
        { label: 'Sperm Id Master', route: '/masters/common/22', desc: 'Sample & straw tracking code', icon: 'sperm' },
        { label: 'Media Brand', route: '/masters/common/28', desc: 'Culture & wash media brand', icon: 'inventory' },
        { label: 'Media Series', route: '/masters/common/29', desc: 'Media lot & series registry', icon: 'inventory' },
      ],
    },
    {
      title: 'Equipment & Gases',
      badge: 'Lab Setup',
      color: 'border-amber-200 bg-amber-50/60 text-amber-700',
      items: [
        { label: 'Catheter Master', route: '/masters/common/9', desc: 'ET catheter types & lots', icon: 'masters' },
        { label: 'Incubator Master', route: '/masters/common/30', desc: 'Culture chambers & slots', icon: 'masters' },
        { label: 'Gas Master', route: '/masters/common/31', desc: 'CO2 / Tri-gas mixtures', icon: 'masters' },
      ],
    },
  ];

  return (
    <nav ref={navRef} className="hidden flex-1 items-center gap-1.5 xl:flex">
      {TOP_NAV_MENUS.map((menu) => (
        <div key={menu.label} className="relative">
          {menu.route && !hasDropdown(menu) ? (
            <Link
              href={menu.route}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
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
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                  openMenu === menu.label || isActive(menu)
                    ? 'bg-purple-100 text-[#6345A6] shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{menu.label}</span>
                <span className={`text-[10px] transition-transform duration-200 ${openMenu === menu.label ? 'rotate-180 text-[#6345A6]' : 'opacity-60'}`}>
                  ▾
                </span>
              </button>

              {openMenu === menu.label && (
                <>
                  {menu.label === 'Master' ? (
                    /* Master Dropdown: Categorized Card Grid, safely positioned to never clip */
                    <div
                      className="absolute left-0 sm:left-[-120px] md:left-[-180px] lg:left-[-160px] xl:left-[-120px] top-full z-50 mt-2.5 w-[760px] max-w-[calc(100vw-300px)] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                    >
                      {/* Dropdown Header */}
                      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-[#6345A6]">
                            <span className="text-base">🏷️</span>
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900">
                              Barcode Preparation Masters
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Core clinic & laboratory registries used for specimen identification & witnessing
                            </div>
                          </div>
                        </div>
                        <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-[#6345A6] border border-purple-100">
                          12 Masters
                        </span>
                      </div>

                      {/* 4 Categorized Columns */}
                      <div className="grid grid-cols-4 gap-3">
                        {MASTER_CATEGORIES.map((cat) => (
                          <div
                            key={cat.title}
                            className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50/50 p-2.5"
                          >
                            <div className="mb-2 flex items-center justify-between px-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                {cat.title}
                              </span>
                            </div>

                            <div className="space-y-1">
                              {cat.items.map((item) => (
                                <Link
                                  key={item.label}
                                  href={item.route}
                                  onClick={() => setOpenMenu(null)}
                                  className="group flex flex-col rounded-xl p-2 transition-all hover:bg-white hover:shadow-xs hover:border hover:border-purple-200"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-[#6345A6] transition-colors leading-tight">
                                      {item.label}
                                    </span>
                                    <span className="text-[10px] text-slate-300 group-hover:text-[#6345A6] transition-colors opacity-0 group-hover:opacity-100">
                                      →
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug line-clamp-1">
                                    {item.desc}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Dropdown Footer: Link to Full Master Directory */}
                      <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
                        <span>Need drugs, allergy, or other clinical registries?</span>
                        <Link
                          href="/masters"
                          onClick={() => setOpenMenu(null)}
                          className="font-bold text-[#6345A6] hover:underline flex items-center gap-1"
                        >
                          <span>Full Master Directory (32 Masters)</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* General Dropdowns (e.g. Cryo) */
                    <div
                      className="absolute left-0 top-full z-50 mt-2.5 min-w-[240px] rounded-2xl border border-slate-200 bg-white py-2 shadow-xl animate-in fade-in zoom-in-95 duration-150"
                    >
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
