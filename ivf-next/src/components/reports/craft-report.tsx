'use client';

import type { ReactNode } from 'react';
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

/** Wraps one or more A4 letterhead pages. Print uses the `letterhead` @page from globals.css. */
export function CraftPaper({ children }: { children: ReactNode }) {
  return (
    <div className="a4-letterhead overflow-x-auto pb-4 print:overflow-visible print:pb-0">
      <div className="mx-auto w-fit space-y-6 print:w-auto print:space-y-0">{children}</div>
    </div>
  );
}

/**
 * One A4 sheet. The top 3in and bottom 1in are left blank for the pre-printed letterhead;
 * on screen those bands are shown as dashed guides.
 */
export function CraftPage({ children, pageNo, pageCount }: { children: ReactNode; pageNo?: number; pageCount?: number }) {
  return (
    <article className="a4-letterhead-page relative flex flex-col bg-white text-slate-900 shadow-md ring-1 ring-slate-200 print:shadow-none print:ring-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[3in] items-center justify-center border-b border-dashed border-slate-300 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 print:hidden">
        Letterhead area · 3 inch
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[1in] items-center justify-center border-t border-dashed border-slate-300 bg-slate-50/70 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400 print:hidden">
        Letterhead footer · 1 inch
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      {pageCount && pageCount > 1 ? (
        <div className="mt-1 text-right text-[9px] font-semibold text-slate-500">
          Page {pageNo} of {pageCount}
        </div>
      ) : null}
    </article>
  );
}

export function CraftHeader({
  title,
  subtitle,
  reportNo,
  reportedOn,
  extra,
}: {
  clinicName?: string;
  clinicLine?: string;
  title: string;
  subtitle?: string;
  reportNo: string;
  reportedOn: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b-2 border-[#123E73] pb-1.5">
      <div className="min-w-0 flex-1">
        <h1 className="text-[15px] font-black uppercase leading-tight tracking-wide text-[#123E73]">{title}</h1>
        {subtitle && <p className="text-[9px] font-semibold text-[#1A56A8]">{subtitle}</p>}
        {extra}
      </div>
      <div className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-[9px] leading-4 text-slate-700">
        <div>
          <span className="font-semibold">Report No. :</span> {reportNo}
        </div>
        <div>
          <span className="font-semibold">Reported On :</span> {reportedOn}
        </div>
      </div>
    </div>
  );
}

export function CraftSection({
  no,
  title,
  tone,
  children,
  className = '',
  aside,
}: {
  no?: number | string;
  title: string;
  tone: SectionTone;
  children: ReactNode;
  className?: string;
  aside?: ReactNode;
}) {
  return (
    <section className={`overflow-hidden rounded-md border border-slate-200 ${className}`}>
      <div className={`${TONES[tone]} flex items-center justify-between px-2 py-[2px] text-[9px] font-black uppercase tracking-wide text-white`}>
        <span>
          {no != null && no !== '' ? `${no}. ` : ''}
          {title}
        </span>
        {aside}
      </div>
      <div className="bg-white px-1.5 py-1">{children}</div>
    </section>
  );
}

export function CraftPairs({
  items,
  columns = 2,
  labelWidth = 118,
}: {
  items: Array<{ label: string; value: string }>;
  columns?: 1 | 2;
  labelWidth?: number;
}) {
  return (
    <div className={`grid gap-x-4 gap-y-[1px] ${columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {items.map((item) => (
        <div
          key={item.label}
          className="grid items-baseline gap-1 text-[9px] leading-[11.5px]"
          style={{ gridTemplateColumns: `${labelWidth}px 1fr` }}
        >
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
  emptyRows = 0,
}: {
  headers: string[];
  rows: string[][];
  headerClass?: string;
  emptyRows?: number;
}) {
  const padded = rows.length < emptyRows ? [...rows, ...Array.from({ length: emptyRows - rows.length }, () => headers.map(() => ''))] : rows;
  return (
    <table className="w-full border-collapse text-[9px] leading-[10.5px]">
      <thead>
        <tr className={headerClass}>
          {headers.map((h) => (
            <th key={h} className="border border-slate-200 px-1 py-[2px] text-left font-bold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {padded.length === 0 ? (
          <tr>
            <td className="border border-slate-200 px-1.5 py-1 text-center text-slate-400" colSpan={headers.length}>
              No records
            </td>
          </tr>
        ) : (
          padded.map((row, i) => (
            <tr key={i} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
              {row.map((cell, j) => (
                <td key={j} className={`border border-slate-200 px-1 py-0 text-slate-800 ${j === 0 ? 'whitespace-nowrap' : ''}`}>
                  {dash(cell)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export function CraftStatus({ ok, label, prefix }: { ok: boolean; label: string; prefix?: string }) {
  return (
    <div
      className={`mt-1 flex items-center justify-center gap-2 rounded px-2 py-[2px] text-[10px] font-black ${
        ok ? 'bg-[#1F8A4C] text-white' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {prefix && <span className="text-[9px] font-bold uppercase opacity-90">{prefix}</span>}
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
    <tr className="border-t border-slate-100 text-[9px] leading-[10.5px]">
      <td className="px-1 py-0 font-semibold text-slate-700">{parameter}</td>
      <td className="px-1 py-0 font-bold text-slate-900">{dash(result)}</td>
      <td className="px-1 py-0 text-slate-500">{reference}</td>
      <td className="px-1 py-0 text-center">
        {ok == null ? (
          <span className="text-slate-300">–</span>
        ) : ok ? (
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600 text-[7px] font-black text-white">✓</span>
        ) : (
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-rose-500 text-[7px] font-black text-white">✕</span>
        )}
      </td>
    </tr>
  );
}

export function CraftWhoHead() {
  return (
    <thead>
      <tr className="text-left text-[8.5px] font-bold uppercase text-slate-400">
        <th className="px-1 pb-0.5">Parameter</th>
        <th className="px-1 pb-0.5">Result</th>
        <th className="px-1 pb-0.5">WHO 2021</th>
        <th className="px-1 pb-0.5 text-center">Status</th>
      </tr>
    </thead>
  );
}

export function CraftDonut({
  segments,
  center,
  caption,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  center: string;
  caption?: string;
}) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0) || 1;
  let acc = 0;
  const stops = segments
    .map((s) => {
      const start = (acc / total) * 100;
      acc += Math.max(0, s.value);
      return `${s.color} ${start}% ${(acc / total) * 100}%`;
    })
    .join(', ');
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-[62px] w-[62px] shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }}>
        <div className="absolute inset-[11px] flex flex-col items-center justify-center rounded-full bg-white leading-none">
          <span className="text-[11px] font-black text-slate-900">{center}</span>
          {caption && <span className="text-[7px] text-slate-500">{caption}</span>}
        </div>
      </div>
      <div className="flex-1 space-y-[1px] text-[9px]">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-slate-600">{s.label}</span>
            <span className="font-bold text-slate-900">{s.value} %</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function gaugePoint(fraction: number, radius: number) {
  const theta = Math.PI - fraction * Math.PI;
  return { x: 50 + radius * Math.cos(theta), y: 50 - radius * Math.sin(theta) };
}

function gaugeArc(from: number, to: number, radius: number) {
  const a = gaugePoint(from, radius);
  const b = gaugePoint(to, radius);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${radius} ${radius} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/** Semicircle gauge; bands are red below `low`, amber up to `normal`, green above. */
export function CraftGauge({
  percent,
  max = 15,
  low = 2,
  normal = 4,
  label,
}: {
  percent: number | null;
  max?: number;
  low?: number;
  normal?: number;
  label: string;
}) {
  const p = percent == null ? 0 : Math.max(0, Math.min(max, percent));
  const needle = gaugePoint(p / max, 30);
  return (
    <div className="text-center">
      <svg viewBox="0 0 100 56" className="mx-auto h-[50px] w-[96px]">
        <path d={gaugeArc(0, low / max, 40)} stroke="#ef4444" strokeWidth="11" fill="none" />
        <path d={gaugeArc(low / max, normal / max, 40)} stroke="#f59e0b" strokeWidth="11" fill="none" />
        <path d={gaugeArc(normal / max, 1, 40)} stroke="#22c55e" strokeWidth="11" fill="none" />
        {percent != null && (
          <>
            <line x1="50" y1="50" x2={needle.x} y2={needle.y} stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="3.5" fill="#0f172a" />
          </>
        )}
      </svg>
      <div className="text-[12px] font-black leading-tight text-slate-900">{percent == null ? '—' : `${percent}%`}</div>
      <div className="text-[8.5px] font-semibold text-slate-600">{label}</div>
    </div>
  );
}

export function CraftRangeBar({
  value,
  low,
  normal,
  max,
  unit,
}: {
  value: number | null;
  low: number;
  normal: number;
  max: number;
  unit: string;
}) {
  const pos = value == null ? null : Math.max(0, Math.min(100, (value / max) * 100));
  const lowPct = (low / max) * 100;
  const normPct = (normal / max) * 100;
  return (
    <div className="mt-1">
      <div className="relative h-3 text-[7.5px] font-bold text-white">
        <div className="absolute inset-y-0 left-0 flex items-center justify-center rounded-l bg-rose-500" style={{ width: `${lowPct}%` }}>
          Low
        </div>
        <div className="absolute inset-y-0 flex items-center justify-center bg-amber-400" style={{ left: `${lowPct}%`, width: `${normPct - lowPct}%` }}>
          Borderline
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center justify-center rounded-r bg-emerald-600" style={{ left: `${normPct}%` }}>
          Normal
        </div>
        {pos != null && <div className="absolute -top-1 h-5 w-[2px] bg-slate-900" style={{ left: `${pos}%` }} />}
      </div>
      <div className="relative mt-[1px] h-2.5 text-[7.5px] text-slate-500">
        <span className="absolute left-0">0</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${lowPct}%` }}>
          {low} {unit}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: `${normPct}%` }}>
          {normal} {unit}
        </span>
      </div>
    </div>
  );
}

export interface SignBox {
  title: string;
  subtitle?: string;
  name?: string;
}

export function CraftSignatures({ boxes, date, time }: { boxes: SignBox[]; date?: string; time?: string }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${boxes.length}, minmax(0, 1fr))` }}>
      {boxes.map((box) => (
        <div key={box.title} className="rounded border border-slate-200 px-1.5 py-1 text-center">
          <div className="text-[9px] font-bold text-slate-800">
            {box.title}
            {box.subtitle && <span className="ml-1 text-[8px] font-normal text-slate-500">({box.subtitle})</span>}
          </div>
          <div className="mx-2 mt-2.5 border-b border-slate-300" />
          <div className="mt-0.5 text-[9px] font-bold text-slate-800">{dash(box.name || '')}</div>
          {(date || time) && (
            <div className="text-[8px] text-slate-500">
              Date : {dash(date || '')}
              {time ? `  Time : ${time}` : ''}
            </div>
          )}
        </div>
      ))}
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
  return (
    <div className="mt-auto space-y-1 pt-1.5">
      <CraftSignatures
        date={date}
        boxes={[
          { title: 'Prepared By', subtitle: 'Lab Technician', name: preparedBy },
          { title: 'Verified By', subtitle: 'Embryologist', name: verifiedBy },
          { title: 'Consultant', name: consultant },
          { title: 'Released By', name: releasedBy },
        ]}
      />
      <div className="flex items-center justify-between gap-2 text-[8px] text-slate-500">
        <span>Assessment performed as per the WHO Laboratory Manual for the Examination and Processing of Human Semen.</span>
        <span className="shrink-0 font-bold text-[#123E73]">ISO 15189:2012 Accredited Laboratory</span>
      </div>
    </div>
  );
}

export function prettyDateTime(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return prettyDate(value);
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${prettyDate(date)} ${time}`;
}

export function prettyTime(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function toNumber(value: string): number | null {
  if (String(value).trim() === '') return null;
  const n = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}
