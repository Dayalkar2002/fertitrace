'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import { PatientContextBar } from '@/components/patient-context-bar';
import { PatientSelectModal } from '@/components/patient-select-modal';
import { TopNav } from '@/components/top-nav';
import { NavIcon } from '@/components/nav-icons';
import { SmartLogo } from '@/components/smart-logo';
import { SIDE_NAV_SECTIONS } from '@/lib/nav-config';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  toggleSidebar,
  setShowPatientModal,
  setShowLogoutModal,
} from '@/store/slices/uiSlice';

import { LeftMenuItem, DEFAULT_LEFT_MENUS } from '@/lib/nav-config';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { sidebarOpen, showPatientModal, showLogoutModal } = useAppSelector((state) => state.ui);
  const { user, logout } = useAuth();
  const { selectedPatient } = usePatient();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [leftMenus, setLeftMenus] = useState<LeftMenuItem[]>(DEFAULT_LEFT_MENUS);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    patient_management: true,
    sperm_management: true,
  });

  useEffect(() => {
    async function loadMenus() {
      try {
        const res = await fetch('/api/menus');
        const json = await res.json();
        if (json.success && json.leftMenu && json.leftMenu.length > 0) {
          setLeftMenus(json.leftMenu);
        }
      } catch {
        // use default fallback
      }
    }
    void loadMenus();
  }, []);

  const toggleExpand = (nodeName: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeName]: !prev[nodeName] }));
  };

  useEffect(() => {
    if (searchParams.get('selectPatient') === '1') {
      dispatch(setShowPatientModal(true));
    }
  }, [searchParams, dispatch]);

  function isRouteActive(route: string): boolean {
    const [routePath, routeQuery] = route.split('?');
    if (routeQuery) {
      // Must match path and query parameters
      if (pathname !== routePath) return false;
      const targetParams = new URLSearchParams(routeQuery);
      let matches = true;
      targetParams.forEach((val, key) => {
        if (searchParams.get(key) !== val) {
          matches = false;
        }
      });
      return matches;
    }

    // If target route has no query, but current URL has specific query for another sub-module (e.g. mode=IUI),
    // don't mark default route as active if current query points elsewhere
    if (pathname === routePath) {
      // If we are on /sperm with mode=IUI, /sperm alone should not be considered active if other sub-routes match
      return true;
    }

    return pathname.startsWith(`${routePath}/`);
  }

  function isSubItemActive(subRoute: string): boolean {
    const [routePath, routeQuery] = subRoute.split('?');
    if (pathname !== routePath) return false;
    if (routeQuery) {
      const targetParams = new URLSearchParams(routeQuery);
      for (const [key, val] of targetParams.entries()) {
        if (searchParams.get(key) !== val) return false;
      }
      return true;
    }
    // Sub-item has no query (e.g. /sperm - default mode). It is only active if no conflicting search param is present
    return !searchParams.get('mode') && !searchParams.get('tab') && !searchParams.get('action');
  }

  function isParentActive(item: LeftMenuItem): boolean {
    const [base] = item.route.split('?');
    if (pathname === base || pathname.startsWith(`${base}/`)) return true;
    if (item.subModules?.some((s) => isSubItemActive(s.route))) return true;
    return false;
  }

  return (
    <>
      <div className="flex min-h-screen bg-[#f4f6fa] text-slate-800">
        {/* Left Dark Navy Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-[250px]' : 'w-0'
          } shrink-0 overflow-hidden transition-all duration-200 z-30`}
        >
          <div className="flex h-full w-[250px] flex-col bg-[#181d38] text-white">
            {/* Sidebar Brand Header */}
            <div className="border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <SmartLogo className="h-9 w-9" />
                <div>
                  <div className="font-black text-lg tracking-tight text-white leading-none">
                    FERTITRACE
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 mt-1">
                    IVF Lab System
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Header Title */}
            <div className="px-5 pt-4 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                MAIN MENU
              </span>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {leftMenus.map((item) => {
                if (item.nodeName === 'logout') {
                  return (
                    <button
                      key={item.nodeName}
                      data-node={item.nodeName}
                      type="button"
                      onClick={() => dispatch(setShowLogoutModal(true))}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <NavIcon name={item.icon || 'logout'} className="h-4 w-4 shrink-0 opacity-90" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                }

                const hasSubs = Boolean(item.subModules && item.subModules.length > 0);
                const isItemActive = hasSubs ? isParentActive(item) : isRouteActive(item.route);
                const isExpanded = expandedNodes[item.nodeName] ?? false;

                return (
                  <div key={item.nodeName} className="space-y-0.5">
                    <div
                      data-node={item.nodeName}
                      className={`flex items-center justify-between rounded-lg transition-all ${
                        isItemActive && !hasSubs
                          ? 'bg-[#6b46c1] text-white shadow-md font-semibold'
                          : isItemActive && hasSubs
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Link
                        href={item.route}
                        className="flex flex-1 items-center gap-3 px-3 py-2.5 text-sm font-medium"
                      >
                        <NavIcon name={item.icon || 'dashboard'} className="h-4 w-4 shrink-0 opacity-90" />
                        <span className="truncate">{item.label}</span>
                        {item.badgeText && (
                          <span className="ml-auto rounded-full bg-indigo-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                            {item.badgeText}
                          </span>
                        )}
                      </Link>
                      {hasSubs && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.nodeName)}
                          className="px-2 py-2.5 text-slate-400 hover:text-white transition"
                          title="Toggle sub-modules"
                        >
                          <svg
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Sub-modules */}
                    {hasSubs && isExpanded && (
                      <div className="ml-4 pl-3 border-l border-white/15 space-y-0.5 pt-0.5 pb-1">
                        {item.subModules!.map((sub) => {
                          const subActive = isSubItemActive(sub.route);
                          return (
                            <Link
                              key={sub.nodeName}
                              data-node={sub.nodeName}
                              href={sub.route}
                              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                                subActive
                                  ? 'bg-[#6b46c1] text-white font-semibold shadow-xs'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  subActive ? 'bg-white' : 'bg-slate-400 opacity-60'
                                }`}
                              />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="border-t border-white/10 p-4 text-center">
              <div className="font-bold tracking-wider text-white text-sm">FERTITRACE</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Version 2.0.0</div>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Navbar */}
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 md:px-5">
              {/* Left Side: Logo & Menu Toggle */}
              <div className="flex items-center gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={() => dispatch(toggleSidebar())}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
                  aria-label="Toggle sidebar"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>

                {/* Logo Brand */}
                <Link href="/dashboard" className="flex items-center gap-2.5">
                  <SmartLogo className="h-9 w-9" />
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-black tracking-tight text-[#1d4ed8]">
                        FERTITRACE
                      </span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 leading-none">
                      IVF Laboratory Management System
                    </div>
                  </div>
                </Link>

                {/* Top Navigation Bar */}
                <div className="ml-2 hidden lg:block">
                  <TopNav />
                </div>
              </div>

              {/* Right Side Tools & User Profile */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setShowPatientModal(true))}
                  className="hidden rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-[#6b46c1] hover:bg-purple-100 sm:inline-flex"
                >
                  {selectedPatient ? 'Change Patient' : 'Select Patient'}
                </button>

                {/* Notification Bell */}
                <button
                  type="button"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                  aria-label="Notifications"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                    5
                  </span>
                </button>

                {/* Help Button */}
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    ?
                  </div>
                  <span>Help</span>
                </button>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-[#6b46c1] font-bold text-xs">
                      Dr
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        Dr. Admin
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">Administrator</div>
                    </div>
                    <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-50">
                      <div className="border-b border-slate-100 px-4 py-2">
                        <p className="text-xs font-bold text-slate-800">
                          {user?.userName || user?.userLoginName || 'Dr. Admin'}
                        </p>
                        <p className="text-[10px] text-slate-500">Dr.Admin@fertitrace.com</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(setShowPatientModal(true));
                          setUserDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {selectedPatient ? `Patient: ${selectedPatient.name}` : 'Select Patient'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          dispatch(setShowLogoutModal(true));
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Patient Context Bar if active */}
          {selectedPatient && (
            <div className="border-b border-slate-200/80 bg-white px-5 py-2">
              <PatientContextBar
                patient={selectedPatient}
                onSelectPatient={() => dispatch(setShowPatientModal(true))}
              />
            </div>
          )}

          {/* Main Workspace */}
          <main className="flex-1 p-5 md:p-6 bg-[#f4f6fa]">{children}</main>
        </div>
      </div>

      <PatientSelectModal open={showPatientModal} onClose={() => dispatch(setShowPatientModal(false))} />

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>

            <h3 className="text-center text-lg font-bold text-slate-900">Confirm Logout</h3>
            <p className="mt-1 text-center text-xs text-slate-500 font-medium">
              Are you sure you want to logout from FERTITRACE?
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => dispatch(setShowLogoutModal(false))}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  dispatch(setShowLogoutModal(false));
                  logout();
                }}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-semibold text-white shadow-sm transition"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
