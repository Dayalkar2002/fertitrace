'use client';

import type { ReactNode } from 'react';
import type { ReportRow } from '@/lib/types/reports';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function val(row: ReportRow | undefined, ...keys: string[]): string {
  if (!row) return '';
  const lookup = new Map(Object.keys(row).map((key) => [key.toLowerCase(), key]));
  for (const key of keys) {
    const actual = lookup.get(key.toLowerCase());
    if (actual === undefined) continue;
    const value = row[actual];
    if (value === undefined || value === null || value === '') continue;
    return String(value);
  }
  return '';
}

export function prettyDate(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string' && /^\d{2}-[A-Za-z]{3}-\d{2,4}$/.test(value.trim())) return value.trim();
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return `${String(date.getDate()).padStart(2, '0')}-${MONTHS[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
}

export function num(row: ReportRow | undefined, ...keys: string[]): string {
  const text = val(row, ...keys).trim();
  return text === '' ? '0' : text;
}

export function fieldDate(row: ReportRow | undefined, ...keys: string[]): string {
  if (!row) return '';
  const lookup = new Map(Object.keys(row).map((key) => [key.toLowerCase(), key]));
  for (const key of keys) {
    const actual = lookup.get(key.toLowerCase());
    if (actual === undefined) continue;
    const value = row[actual];
    if (value === undefined || value === null || value === '') continue;
    return prettyDate(value);
  }
  return '';
}

export function dash(text: string): string {
  return text.trim() ? text : '—';
}

export function TypePills({
  options,
  selectedIndex,
}: {
  options: readonly string[];
  selectedIndex: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
      {options.map((option, index) => (
        <label key={option} className="flex items-center gap-1">
          <input type="radio" checked={selectedIndex === index} readOnly disabled className="accent-slate-700" />
          <span className={selectedIndex === index ? 'font-bold' : ''}>{option}</span>
        </label>
      ))}
    </div>
  );
}

export function Kv({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <span className={className}>
      <b>{label}</b> {value || ''}
    </span>
  );
}

export function SmartViewer({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded border border-slate-400 bg-[#ece9d8] shadow-sm print:border-0 print:bg-white print:shadow-none">
      <div className="border-b border-slate-300 bg-[#f3f2ea] px-3 py-1.5 text-center text-[15px] font-bold">{title}</div>
      <div className="max-h-[72vh] overflow-auto bg-white p-4 font-[Times_New_Roman,Times,serif] text-[13px] leading-5 text-black print:max-h-none">
        {children}
      </div>
    </div>
  );
}

export function HormoneAssays({ row }: { row: ReportRow | undefined }) {
  const cols = [
    {
      date: fieldDate(row, 'pinkdate'),
      e2: val(row, 'pinkE2'),
      thirdLabel: 'LH',
      thirdValue: val(row, 'pinkLH'),
      thirdUnit: 'IU/ml',
    },
    {
      date: fieldDate(row, 'yellodate'),
      e2: val(row, 'yellowE2'),
      thirdLabel: 'Prolactin',
      thirdValue: val(row, 'yellowProlactin'),
      thirdUnit: 'ng/ml',
    },
    {
      date: fieldDate(row, 'Greendate'),
      e2: val(row, 'GreenE2'),
      thirdLabel: 'Progesterone',
      thirdValue: val(row, 'GreenProlactin'),
      thirdUnit: 'ng/ml',
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 text-[12px]">
      {cols.map((col, index) => (
        <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Date: {dash(col.date)}</div>
          <div className="mt-1 font-semibold text-slate-800">E2: {dash(col.e2)} pg/ml</div>
          <div className="text-slate-700">
            {col.thirdLabel}: {dash(col.thirdValue)} {col.thirdUnit}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GameteTable({ row }: { row: ReportRow | undefined }) {
  const lines: Array<[string, string, string]> = [
    ['Oocytes Aspirated', 'RIVF', 'RICSI'],
    ['Metaphase II', 'IVFMPhaseII', 'ICSIMPhaseII'],
    ['Oocytes Fertilised', 'IVF2PN', 'ICSI2PN'],
    ['Embryos Cleaved', 'IVFICleaved', 'ICSICleaved'],
    ['Embryos Transferred', 'IVFTransfer', 'ICSTransfer'],
    ['Embryos Frozen', 'IVFFroze', 'ICSFroze'],
    ['Blastocyst Transferred', 'BTIVFTransfer', 'BTICSTransfer'],
    ['Blastocyst Frozen', 'BTIVFFroze', 'BTICSFroze'],
  ];
  return (
    <table className="w-full border-collapse text-[11px]">
      <thead>
        <tr className="bg-[#123E73] text-white">
          <th className="px-2 py-2 text-left font-bold" />
          <th className="px-2 py-2 font-bold">IVF</th>
          <th className="px-2 py-2 font-bold">ICSI</th>
        </tr>
      </thead>
      <tbody>
        {lines.map(([label, ivf, icsi], index) => (
          <tr key={label} className={index % 2 ? 'bg-slate-50' : 'bg-white'}>
            <td className="border border-slate-200 px-2 py-1.5 font-semibold text-slate-700">{label}</td>
            <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-slate-900">{num(row, ivf)}</td>
            <td className="border border-slate-200 px-2 py-1.5 text-center font-bold text-slate-900">{num(row, icsi)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TransferTable({ title, rows }: { title: string; rows: ReportRow[] }) {
  return (
    <div>
      {title ? <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</div> : null}
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-[#123E73] text-white">
            {['No.', 'Source', 'Cellar Stage', 'Grade', 'Remarks'].map((h) => (
              <th key={h} className="px-2 py-2 text-left font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="border border-slate-200 px-2 py-2 text-center text-slate-400" colSpan={5}>
                No records
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={index} className={index % 2 ? 'bg-slate-50' : 'bg-white'}>
                <td className="border border-slate-200 px-2 py-1.5">{index + 1}</td>
                <td className="border border-slate-200 px-2 py-1.5">{dash(val(row, 'ETEDSource'))}</td>
                <td className="border border-slate-200 px-2 py-1.5">{dash(val(row, 'celler'))}</td>
                <td className="border border-slate-200 px-2 py-1.5">{dash(val(row, 'Grade'))}</td>
                <td className="border border-slate-200 px-2 py-1.5">{dash(val(row, 'Remark', 'Remarks'))}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ReportToolbar({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="print:hidden mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b4a8b]">Clinical report</p>
          <h1 className="mt-0.5 text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-[#0b4a8b] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#093a6e]"
        >
          Print
        </button>
      </div>
      {children && <div className="mt-4 flex flex-wrap items-end gap-4">{children}</div>}
    </div>
  );
}

export function ReportPaper({
  clinicName,
  clinicLine,
  reportTitle,
  children,
}: {
  clinicName: string;
  clinicLine?: string;
  reportTitle: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[820px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <header className="border-b border-slate-200 bg-slate-50 px-6 py-5 text-center">
        <div className="text-lg font-black tracking-wide text-[#0b4a8b]">{clinicName}</div>
        {clinicLine && <div className="mt-1 text-[11px] text-slate-500">{clinicLine}</div>}
        <div className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-800">{reportTitle}</div>
      </header>
      <div className="px-6 py-5 space-y-5 text-[13px] text-slate-800">{children}</div>
    </article>
  );
}

export function IdentityGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
          <div className="font-semibold text-slate-900">{dash(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

export function ReportBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 border-b border-slate-200 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0b4a8b]">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function FieldLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[13px] leading-6">
      <span className="font-semibold text-slate-700">{label}</span>{' '}
      <span className="text-slate-800">{dash(value)}</span>
    </p>
  );
}

export function KpiRow({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
          <div className="mt-0.5 text-lg font-bold text-slate-900">{dash(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

export function ClinicalTable({
  columns,
  rows,
}: {
  columns: Array<{ key: string; label: string; date?: boolean }>;
  rows: ReportRow[];
}) {
  if (!rows.length) return null;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-[12px]">
        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-3 py-2">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-100">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap px-3 py-2 text-slate-800">
                  {dash(col.date ? fieldDate(row, col.key) : val(row, col.key))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HtmlNote({ html }: { html: string }) {
  const clean = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').trim();
  if (!clean) return <p className="text-slate-400">—</p>;
  return (
    <div
      className="text-[13px] leading-6 text-slate-800 [&_p]:my-0.5 [&_br]:leading-5"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

export function ReportSelect({
  label,
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{ id: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-w-[240px] flex-col gap-1 text-[11px] font-semibold text-slate-500">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800"
      >
        <option value="0">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
