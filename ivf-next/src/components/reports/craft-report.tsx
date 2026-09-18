'use client';

import type { ReactNode } from 'react';
import { SmartLogo } from '@/components/smart-logo';
import { dash, prettyDate } from '@/components/reports/clinical-report';

type SectionTone = 'navy' | 'teal' | 'blue' | 'orange' | 'green' | 'purple' | 'sky';

const TONES: Record<SectionTone, string> = {
  navy: 'bg-[#123E73]',
  teal: 'bg-[#0E7A8A]',
  blue: 'bg-[#1A56A8]',
  orange: 'bg-[#E67A22]',
  green: 'bg-[#1F8A4C]',
  purple: 'bg-[#6345A6]',
  sky: 'bg-[#0369a1]',
};

export function CraftPaper({ children }: { children: ReactNode }) {
  return (
    <article className="mx-auto max-w-[980px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      {children}
    </article>
  );
}

export function CraftHeader({
  clinicName,
  clinicLine,
  title,
  subtitle,
  reportNo,
  reportedOn,
}: {
  clinicName: string;
  clinicLine?: string;
  title: string;
  subtitle?: string;
  reportNo: string;
  reportedOn: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-[#123E73] px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SmartLogo className="h-14 w-14" />
        <div>
          <div className="text-lg font-black tracking-wide text-[#123E73]">{clinicName}</div>
          {clinicLine && <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700">{clinicLine}</div>}
        </div>
      </div>
      <div className="min-w-[240px] flex-1 text-center">
        <h1 className="text-base font-black uppercase leading-tight tracking-wide text-[#123E73] sm:text-lg">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p>}
      </div>
      <div className="text-right text-[11px] text-slate-600">
        <div>
          <span className="font-semibold">Report No. :</span> {reportNo}
        </div>
        <div>
          <span className="font-semibold">Reported On :</span> {reportedOn}
        </div>
        <div className="mt-1 h-6 w-36 border border-slate-300 bg-[repeating-linear-gradient(90deg,#111_0,#111_1px,transparent_1px,transparent_3px)]" />
      </div>
    </header>
  );
}

export function CraftSection({
  no,
  title,
  tone,
  children,
  className = '',
}: {
  no: number | string;
  title: string;
  tone: SectionTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`overflow-hidden rounded-xl border border-slate-200 ${className}`}>
      <div className={`${TONES[tone]} px-3 py-1.5 text-[12px] font-black uppercase tracking-wide text-white`}>
        {no}. {title}
      </div>
      <div className="bg-white p-3">{children}</div>
    </section>
  );
}

export function CraftPairs({ items, columns = 2 }: { items: Array<{ label: string; value: string }>; columns?: 1 | 2 }) {
  return (
    <div className={`grid gap-x-6 gap-y-1.5 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[140px_1fr] items-baseline gap-2 text-[12px] sm:grid-cols-[150px_1fr]">
          <span className="font-semibold text-slate-600">{item.label}</span>
          <span className="font-bold text-slate-900">: {dash(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function CraftTable({
  headers,
  rows,
  headerClass = 'bg-[#123E73] text-white',
}: {
  headers: string[];
  rows: string[][];
  headerClass?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-[11px]">
        <thead>
          <tr className={headerClass}>
            {headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-2 py-2 text-left font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="border border-slate-200 px-2 py-3 text-center text-slate-400" colSpan={headers.length}>
                No records
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap border border-slate-200 px-2 py-1.5 text-slate-800">
                    {dash(cell)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function CraftStatus({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`mt-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-black ${
        ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
      }`}
    >
      <span>{ok ? '✓' : '!'}</span>
      {label}
    </div>
  );
}

export function CraftWhoRow({
  parameter,
  result,
  reference,
  ok,
}: {
  parameter: string;
  result: string;
  reference: string;
  ok?: boolean | null;
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="px-2 py-1.5 font-semibold text-slate-700">{parameter}</td>
      <td className="px-2 py-1.5 font-bold text-slate-900">{dash(result)}</td>
      <td className="px-2 py-1.5 text-slate-500">{reference}</td>
      <td className="px-2 py-1.5 text-center">
        {ok == null ? '—' : ok ? <span className="text-emerald-600">●</span> : <span className="text-rose-500">●</span>}
      </td>
    </tr>
  );
}

export function CraftDonut({ percent, label }: { percent: number; label: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-20 w-20 shrink-0 rounded-full"
        style={{ background: `conic-gradient(#16a34a ${p}%, #e2e8f0 0)` }}
      >
        <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-[11px] font-black text-slate-800">
          {p.toFixed(0)}%
        </div>
      </div>
      <div className="text-[11px] font-semibold text-slate-600">{label}</div>
    </div>
  );
}

export function CraftGauge({ percent, label }: { percent: number; label: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="text-center">
      <div
        className="mx-auto h-16 w-32 overflow-hidden"
        style={{
          background: `conic-gradient(from 180deg, #ef4444 0deg, #f59e0b 60deg, #22c55e 120deg, #e2e8f0 180deg)`,
          borderRadius: '8rem 8rem 0 0',
        }}
      >
        <div className="mt-6 text-lg font-black text-slate-900">{p.toFixed(0)}%</div>
      </div>
      <div className="mt-1 text-[11px] font-semibold text-slate-600">{label}</div>
    </div>
  );
}

export function CraftFooter({
  preparedBy,
  verifiedBy,
  consultant,
  releasedBy,
  date,
}: {
  preparedBy?: string;
  verifiedBy?: string;
  consultant?: string;
  releasedBy?: string;
  date?: string;
}) {
  const boxes = [
    { title: 'Prepared By (Lab Technician)', name: preparedBy },
    { title: 'Verified By (Embryologist)', name: verifiedBy },
    { title: 'Consultant', name: consultant },
    { title: 'Released By', name: releasedBy },
  ];
  return (
    <footer className="border-t border-slate-200 px-5 py-4 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {boxes.map((box) => (
          <div key={box.title} className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{box.title}</div>
            <div className="mt-6 h-8 border-b border-slate-300" />
            <div className="mt-2 text-[12px] font-bold text-slate-800">{dash(box.name || '')}</div>
            <div className="text-[10px] text-slate-500">Date : {dash(date || '')}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
        <span>Assessment performed according to the WHO Laboratory Manual for the Examination and Processing of Human Semen.</span>
        <span className="font-semibold">ISO 15189:2012 Accredited Laboratory</span>
      </div>
    </footer>
  );
}

export function prettyDateTime(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return prettyDate(value);
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${prettyDate(date)} ${time}`;
}

export function prettyTime(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function toNumber(value: string): number | null {
  const n = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}
