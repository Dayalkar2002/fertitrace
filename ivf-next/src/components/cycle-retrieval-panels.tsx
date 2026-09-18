'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { getCycleTypeLabel, getRetrievalLayout } from '@/lib/cycle-utils';
import type { Patient } from '@/lib/types/patient';
import type { FreezeOocyteRow, RetrievalRow } from '@/lib/types/cycle';

const emptyOpuRow = (): RetrievalRow => ({
  leftOvary: null,
  rightOvary: null,
  total: null,
  ivf: null,
  icsi: null,
  gift: null,
  zift: null,
  damaged: null,
});

const emptyFreeze = (): FreezeOocyteRow => ({ mii: null, mi: null, gv: null, total: null });

const OPU_COLS = [
  { key: 'leftOvary', label: 'Left Ovary' },
  { key: 'rightOvary', label: 'Right Ovary' },
  { key: 'total', label: 'Total' },
  { key: 'ivf', label: 'IVF' },
  { key: 'icsi', label: 'ICSI' },
  { key: 'gift', label: 'GIFT' },
  { key: 'zift', label: 'ZIFT' },
  { key: 'damaged', label: 'Damaged' },
] as const;

interface CycleRetrievalPanelsProps {
  cycleType: string;
  semenSource: string;
  cycleId?: string;
  patient?: Patient | null;
}

export function CycleRetrievalPanels({ cycleType, semenSource, cycleId, patient }: CycleRetrievalPanelsProps) {
  const layout = useMemo(() => getRetrievalLayout(cycleType), [cycleType]);
  const [opuRows, setOpuRows] = useState<RetrievalRow[]>([emptyOpuRow()]);
  const [donorRows, setDonorRows] = useState<RetrievalRow[]>([emptyOpuRow()]);
  const [freeze, setFreeze] = useState<FreezeOocyteRow>(emptyFreeze);
  const [fet, setFet] = useState({ source: '', location: '', strawNo: '', thawDate: '', embryoCount: '' });
  const [thaw, setThaw] = useState({ location: '', strawId: '', mii: '', mi: '', gv: '', survived: '' });
  const [erDonor, setErDonor] = useState({
    donorName: '',
    donorMobile: '',
    donorAadhar: '',
    donorCycleId: '',
  });

  const monthYear = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const husbandSelected = semenSource.startsWith('husband');
  const donorSelected = semenSource.startsWith('donor');

  function updateOpu(index: number, key: keyof RetrievalRow, value: string) {
    setOpuRows((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        if (key === 'recipientCycleId') return { ...row, recipientCycleId: value };
        return { ...row, [key]: value === '' ? null : Number(value) };
      })
    );
  }

  function updateDonor(index: number, key: keyof RetrievalRow, value: string) {
    setDonorRows((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        if (key === 'recipientCycleId') return { ...row, recipientCycleId: value };
        return { ...row, [key]: value === '' ? null : Number(value) };
      })
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Retrieval workspace</p>
        <p className="mt-1 text-sm font-bold text-slate-800">{getCycleTypeLabel(cycleType)}</p>
        <p className="text-xs text-slate-600">
          Fields below follow the SMART cycle type, shown in Fertitrace layout.
        </p>
      </div>

      {layout.retrievalChoice === 'self_to_self' && (
        <ChoiceBadge label="Retrieval option" value="Self To Self" />
      )}
      {layout.retrievalChoice === 'donor_to_recipient' && (
        <ChoiceBadge label="Retrieval option" value="Donor To Recipient" />
      )}
      {layout.retrievalChoice === 'received_from_donor' && (
        <ChoiceBadge label="Retrieval option" value="Received from Donor" />
      )}

      {layout.sections.showRecipientDetails && (
        <SectionCard title="Recipient Details" tone="pink">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <ReadField label="Name" value={patient?.name || '—'} />
            <ReadField label="Mobile No" value={patient?.mobile || patient?.phone || '—'} />
            <ReadField label="Aadhaar Card" value={patient?.aadhar || '—'} />
            <ReadField label="Cycle ID" value={cycleId || '—'} />
            <ReadField label="Month and Year" value={monthYear} />
          </div>
        </SectionCard>
      )}

      {layout.sections.showDonorEggDetails && (
        <SectionCard title="Donor Egg Details" tone="amber">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextField label="Name" value={erDonor.donorName} onChange={(v) => setErDonor((s) => ({ ...s, donorName: v }))} />
            <TextField label="Mobile No" value={erDonor.donorMobile} onChange={(v) => setErDonor((s) => ({ ...s, donorMobile: v }))} />
            <TextField label="Aadhaar Card" value={erDonor.donorAadhar} onChange={(v) => setErDonor((s) => ({ ...s, donorAadhar: v }))} />
            <TextField label="Cycle ID" value={erDonor.donorCycleId} onChange={(v) => setErDonor((s) => ({ ...s, donorCycleId: v }))} />
          </div>
        </SectionCard>
      )}

      {(layout.sections.showSelfToSelf || layout.sections.showDonorEggCount) && (
        <SectionCard
          title={layout.sections.showDonorEggCount ? 'Donor Egg Count' : 'Self To Self'}
          tone="emerald"
        >
          <OpuGrid rows={opuRows} onChange={updateOpu} />
          <button
            type="button"
            onClick={() => setOpuRows((rows) => [...rows, emptyOpuRow()])}
            className="mt-3 text-sm font-semibold text-emerald-700 hover:underline"
          >
            + Add Row
          </button>
        </SectionCard>
      )}

      {layout.sections.showDonorToRecipient && (
        <SectionCard title="Donor To Recipient" tone="violet">
          <p className="mb-3 text-xs text-slate-600">
            One oocyte donor can donate to only one recipient. Select the recipient and enter oocyte counts.
          </p>
          <OpuGrid
            rows={donorRows}
            onChange={updateDonor}
            extra={[{ key: 'recipientCycleId', label: 'Recipient Cycle ID' }]}
          />
        </SectionCard>
      )}

      {layout.sections.showOocyteReceivedFrom && (
        <SectionCard title="From Donor" tone="blue">
          <p className="mb-3 text-xs text-slate-600">
            Oocytes received from the mapped donor. Counts stay aligned with the donor retrieval.
          </p>
          <OpuGrid rows={opuRows} onChange={updateOpu} />
        </SectionCard>
      )}

      {layout.sections.showFreezeOocytes && (
        <SectionCard title="Freeze Oocytes" tone="sky">
          <div className="grid gap-3 sm:grid-cols-4">
            {(['mii', 'mi', 'gv', 'total'] as const).map((key) => (
              <label key={key} className="text-xs font-semibold text-slate-600">
                {key === 'mii' ? 'Metaphase II' : key === 'mi' ? 'Metaphase I' : key === 'gv' ? 'GV' : 'Total'}
                <input
                  type="number"
                  value={freeze[key] ?? ''}
                  onChange={(e) =>
                    setFreeze((row) => ({ ...row, [key]: e.target.value === '' ? null : Number(e.target.value) }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                />
              </label>
            ))}
          </div>
        </SectionCard>
      )}

      {layout.sections.showFetThaw && (
        <SectionCard title="Frozen Thaw Embryo Transfer" tone="cyan">
          <p className="mb-3 text-xs text-slate-600">
            FET cycles thaw cryopreserved embryos. OPU retrieval is not used.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <TextField label="Source" value={fet.source} onChange={(v) => setFet((s) => ({ ...s, source: v }))} />
            <TextField label="Location" value={fet.location} onChange={(v) => setFet((s) => ({ ...s, location: v }))} />
            <TextField label="Straw No" value={fet.strawNo} onChange={(v) => setFet((s) => ({ ...s, strawNo: v }))} />
            <label className="text-xs font-semibold text-slate-600">
              Thaw Date
              <input
                type="date"
                value={fet.thawDate}
                onChange={(e) => setFet((s) => ({ ...s, thawDate: e.target.value }))}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm font-normal"
              />
            </label>
            <TextField label="Embryo Count" value={fet.embryoCount} onChange={(v) => setFet((s) => ({ ...s, embryoCount: v }))} />
          </div>
        </SectionCard>
      )}

      {layout.sections.showThawOocytes && (
        <SectionCard title="Thaw Oocyte" tone="amber">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <TextField label="Location" value={thaw.location} onChange={(v) => setThaw((s) => ({ ...s, location: v }))} />
            <TextField label="Straw ID" value={thaw.strawId} onChange={(v) => setThaw((s) => ({ ...s, strawId: v }))} />
            <TextField label="Metaphase II" value={thaw.mii} onChange={(v) => setThaw((s) => ({ ...s, mii: v }))} />
            <TextField label="Metaphase I" value={thaw.mi} onChange={(v) => setThaw((s) => ({ ...s, mi: v }))} />
            <TextField label="GV" value={thaw.gv} onChange={(v) => setThaw((s) => ({ ...s, gv: v }))} />
            <TextField label="Survived" value={thaw.survived} onChange={(v) => setThaw((s) => ({ ...s, survived: v }))} />
          </div>
        </SectionCard>
      )}

      {layout.sections.showHusbandSperm && husbandSelected && (
        <SectionCard title={semenSource === 'husband_cryo' ? 'Husband Semen Details (Frozen)' : 'Husband Semen Details (Fresh)'} tone="emerald">
          <p className="text-sm text-slate-600">
            Husband semen is selected for this cycle. Analysis values appear here after a semen report is saved.
          </p>
        </SectionCard>
      )}

      {layout.sections.showDonorSperm && donorSelected && (
        <SectionCard title="Donor Semen Details" tone="amber">
          <p className="text-sm text-slate-600">
            Embryo recipient cycles use donor sperm. Frozen sample IDs load from analysis when available.
          </p>
        </SectionCard>
      )}
    </div>
  );
}

function ChoiceBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="rounded-full bg-[#6345A6] px-3 py-1 text-xs font-bold text-white">{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  tone,
  children,
}: {
  title: string;
  tone: 'emerald' | 'violet' | 'blue' | 'sky' | 'cyan' | 'amber' | 'pink';
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    emerald: 'border-emerald-200 bg-emerald-50/40',
    violet: 'border-violet-200 bg-violet-50/40',
    blue: 'border-blue-200 bg-blue-50/40',
    sky: 'border-sky-200 bg-sky-50/40',
    cyan: 'border-cyan-200 bg-cyan-50/40',
    amber: 'border-amber-200 bg-amber-50/40',
    pink: 'border-pink-200 bg-pink-50/40',
  };
  return (
    <section className={`rounded-2xl border p-4 shadow-xs ${tones[tone]}`}>
      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-800">{title}</h3>
      {children}
    </section>
  );
}

function OpuGrid({
  rows,
  onChange,
  extra = [],
}: {
  rows: RetrievalRow[];
  onChange: (index: number, key: keyof RetrievalRow, value: string) => void;
  extra?: { key: keyof RetrievalRow; label: string }[];
}) {
  const cols = [...OPU_COLS, ...extra];
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-xs">
        <thead>
          <tr className="text-slate-500">
            {cols.map((col) => (
              <th key={String(col.key)} className="px-1 pb-2 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {cols.map((col) => (
                <td key={String(col.key)} className="px-1 pb-2">
                  <input
                    type={col.key === 'recipientCycleId' ? 'text' : 'number'}
                    value={(row[col.key] as string | number | null | undefined) ?? ''}
                    onChange={(e) => onChange(i, col.key, e.target.value)}
                    className="h-9 w-full min-w-[4.5rem] rounded-lg border border-slate-200 bg-white px-2 text-sm"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal text-slate-800"
      />
    </label>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}
