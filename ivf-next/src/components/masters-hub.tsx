'use client';

import Link from 'next/link';
import { getMasterColumns, getQrCodeMasters, QR_CODE_MASTER_COUNT } from '@/lib/nav-config';

export function MastersHub() {
  const columns = getMasterColumns();
  const qrMasters = getQrCodeMasters();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Administration & Master Registries</p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-slate-900">Masters Hub</h1>
            <p className="mt-1.5 max-w-2xl text-xs text-slate-500">
              Central registries for FertiTrace IVF witnessing, laboratory workflows, patient care, and legacy smART configuration.
            </p>
          </div>
          <Link
            href="/masters/qr-code"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 shrink-0"
          >
            <span>⚡ Open QR Code Master Dictionary</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Featured QR Code Generation Tables Highlight */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-purple-50/40 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white text-sm">⚡</span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tables Used in QR Code Generations ({QR_CODE_MASTER_COUNT})
              </h2>
              <p className="text-[11px] text-slate-500">
                These 13 master tables feed container types, procedure codes, specimen IDs, clinic identifiers, and security signatures into FertiTrace QR codes.
              </p>
            </div>
          </div>
          <Link
            href="/masters/qr-code"
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            View 11-Field Mapping →
          </Link>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {qrMasters.map((m) => (
            <Link
              key={m.label}
              href={m.route}
              className="group flex flex-col justify-between rounded-xl border border-emerald-200/80 bg-white/90 p-2.5 shadow-2xs hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                    {m.label}
                  </span>
                  <span className="rounded bg-emerald-100 px-1 py-0.5 text-[8px] font-black text-emerald-800 shrink-0">
                    QR
                  </span>
                </div>
                {m.qrRole && (
                  <p className="mt-1 text-[9.5px] text-slate-500 line-clamp-2">
                    {m.qrRole}
                  </p>
                )}
              </div>
              <span className="mt-2 text-[10px] font-semibold text-emerald-600 group-hover:underline">
                Configure →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4 Columns of All Masters */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column, colIndex) => (
          <div
            key={colIndex}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 border-b border-slate-100 pb-1">
              Column {colIndex + 1}
            </div>
            <div className="flex flex-col gap-1">
              {column.map((item) => {
                const isQr = !!item.isQrCode;
                return (
                  <Link
                    key={item.route + item.label}
                    href={item.route}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                      isQr
                        ? 'border border-emerald-200/80 bg-emerald-50/40 text-slate-800 hover:bg-emerald-100/70 hover:border-emerald-300'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`h-1.5 w-1.5 rounded-full ${isQr ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className={isQr ? 'font-bold' : ''}>{item.label}</span>
                    </div>
                    {isQr && (
                      <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black text-white shrink-0">
                        ⚡ QR
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
