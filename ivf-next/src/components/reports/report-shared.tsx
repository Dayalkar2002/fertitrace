'use client';

import { SpDataTable } from '@/components/sp-data-table';
import type { ReportSection } from '@/lib/types/reports';

export function ReportSections({ sections }: { sections: ReportSection[] }) {
  if (!sections.length) {
    return <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No report data found for this selection.</p>;
  }

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.name} className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{section.name}</h3>
          <SpDataTable rows={section.rows} emptyMessage={`No ${section.name.toLowerCase()} rows.`} />
        </section>
      ))}
    </div>
  );
}

const selectCls = 'h-9 min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 text-sm';
const radioCls = 'flex items-center gap-1.5 text-xs font-semibold text-slate-700';

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
    <label className="flex flex-col gap-1 text-xs text-slate-500">
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={selectCls}
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

export function DisabledRadios({
  options,
  selectedIndex,
}: {
  options: readonly string[];
  selectedIndex: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {options.map((option, index) => (
        <label key={option} className={radioCls}>
          <input type="radio" checked={selectedIndex === index} readOnly disabled />
          {option}
        </label>
      ))}
    </div>
  );
}
