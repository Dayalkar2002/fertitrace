'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CycleRetrievalSpermCard, type RetrievalSpermValue } from '@/components/cycle-retrieval-sperm';
import { useAuth } from '@/contexts/auth-context';
import { tallyOpuRows, writeRetrievalSnapshot } from '@/lib/cycle-snapshot';
import { getCycleTypeLabel, getRetrievalLayout } from '@/lib/cycle-utils';
import {
  fetchFrozenOocyteLocations,
  fetchRecipientCycles,
  fetchRetrievalRecipients,
  saveFrozenOocyteLocation,
} from '@/lib/services/cycles';
import type { Patient } from '@/lib/types/patient';
import type { FreezeOocyteRow, FrozenOocyteLocation, RetrievalData, RetrievalRow } from '@/lib/types/cycle';

/** SMART Cycle.aspx: Freeze Oocytes is allowed only when donor egg total is more than 10. */
const OD_FREEZE_MIN = 10;

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

const DONOR_EGG_COLS = [
  { key: 'leftOvary', label: 'Left Ovary' },
  { key: 'rightOvary', label: 'Right Ovary' },
  { key: 'total', label: 'Total' },
] as const;

const TEXT_KEYS = new Set<keyof RetrievalRow>(['recipientCycleId', 'recipientName', 'fromDonor']);

function applyOpuValue(row: RetrievalRow, key: keyof RetrievalRow, value: string): RetrievalRow {
  if (TEXT_KEYS.has(key)) return { ...row, [key]: value };
  const next: RetrievalRow = { ...row, [key]: value === '' ? null : Number(value) };
  if (key === 'leftOvary' || key === 'rightOvary') {
    const left = Number(key === 'leftOvary' ? next.leftOvary || 0 : row.leftOvary || 0);
    const right = Number(key === 'rightOvary' ? next.rightOvary || 0 : row.rightOvary || 0);
    next.total = left + right;
  }
  return next;
}

interface CycleRetrievalPanelsProps {
  cycleType: string;
  semenSource: string;
  cycleId?: string;
  patient?: Patient | null;
  monitoringSheet?: string;
  fzoCycleId?: string;
  fzoRecipientId?: number;
  onChange?: (data: RetrievalData) => void;
}

export function CycleRetrievalPanels({
  cycleType,
  semenSource,
  cycleId,
  patient,
  monitoringSheet = '',
  fzoCycleId = '',
  fzoRecipientId = 0,
  onChange,
}: CycleRetrievalPanelsProps) {
  const { token } = useAuth();
  const layout = useMemo(() => getRetrievalLayout(cycleType), [cycleType]);
  const [recipients, setRecipients] = useState<{ id: number; name: string }[]>([]);
  const [recipientCycles, setRecipientCycles] = useState<{ id: string; label: string }[]>([]);
  const [recipientLocked, setRecipientLocked] = useState(false);
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
  const [sperm, setSperm] = useState<RetrievalSpermValue | null>(null);
  const [locations, setLocations] = useState<FrozenOocyteLocation[]>([]);
  const [locationSaving, setLocationSaving] = useState<number | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const monthYear = new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  const husbandSelected = semenSource.startsWith('husband');
  const donorSelected = semenSource.startsWith('donor');
  const showHusbandSperm = Boolean(layout.sections.showHusbandSperm && husbandSelected);
  const showDonorSperm = Boolean(layout.sections.showDonorSperm && donorSelected);

  useEffect(() => {
    const opuTally = tallyOpuRows(
      layout.sections.showDonorToRecipient || layout.sections.showDonorEggCount ? donorRows : opuRows
    );
    writeRetrievalSnapshot({
      cycleId: cycleId || '',
      patientId: patient?.id || 0,
      cycleType,
      semenSource,
      monitoringSheet,
      ivfAllotted: opuTally.ivfAllotted,
      icsiAllotted: opuTally.icsiAllotted,
      totalRetrieved: opuTally.totalRetrieved,
      freeze: layout.sections.showFreezeOocytes ? freeze : null,
      fetEmbryoCount: Number(fet.embryoCount) || 0,
      thawMii: Number(thaw.mii) || 0,
      thawMi: Number(thaw.mi) || 0,
      thawGv: Number(thaw.gv) || 0,
      thawSurvived: Number(thaw.survived) || 0,
      sperm,
      savedAt: new Date().toISOString(),
    });
  }, [
    cycleId,
    cycleType,
    donorRows,
    fet.embryoCount,
    freeze,
    layout.sections.showDonorEggCount,
    layout.sections.showDonorToRecipient,
    layout.sections.showFreezeOocytes,
    monitoringSheet,
    opuRows,
    patient?.id,
    semenSource,
    sperm,
    thaw.gv,
    thaw.mi,
    thaw.mii,
    thaw.survived,
  ]);

  useEffect(() => {
    onChangeRef.current?.({
      selfToSelf: layout.sections.showSelfToSelf ? opuRows : undefined,
      donorEggCount: layout.sections.showDonorEggCount ? opuRows : undefined,
      donorToRecipient: layout.sections.showDonorToRecipient ? donorRows : undefined,
      freezeOocytes: layout.sections.showFreezeOocytes ? freeze : undefined,
      fetThaw: layout.sections.showFetThaw ? fet : undefined,
      thawOocytes: layout.sections.showThawOocytes ? thaw : undefined,
    });
  }, [donorRows, fet, freeze, layout.sections, opuRows, thaw]);

  function updateOpu(index: number, key: keyof RetrievalRow, value: string) {
    setOpuRows((rows) => rows.map((row, i) => (i === index ? applyOpuValue(row, key, value) : row)));
  }

  function updateDonor(index: number, key: keyof RetrievalRow, value: string) {
    setDonorRows((rows) => rows.map((row, i) => (i === index ? applyOpuValue(row, key, value) : row)));
  }

  // Quick Allotment helpers for embryologists
  function quickAllot(type: 'all-icsi' | 'all-ivf' | 'split-50-50') {
    setOpuRows((rows) => {
      const row = rows[0] || emptyOpuRow();
      const total = Number(row.total || 0);
      if (total <= 0) return rows;
      if (type === 'all-icsi') {
        return [{ ...row, icsi: total, ivf: 0 }];
      }
      if (type === 'all-ivf') {
        return [{ ...row, ivf: total, icsi: 0 }];
      }
      if (type === 'split-50-50') {
        const half = Math.floor(total / 2);
        return [{ ...row, ivf: half, icsi: total - half }];
      }
      return rows;
    });
  }

  const donorEggTotal = Number(opuRows[0]?.total || 0);
  const showFreeze =
    layout.sections.showFreezeOocytes && (layout.type !== 'OD' || donorEggTotal > OD_FREEZE_MIN);
  const selectedRecipientId = Number(donorRows[0]?.recipientPatientId || 0);
  const retrievalCountsLocked = Boolean(layout.sections.lockRetrievalCounts);

  useEffect(() => {
    if (!retrievalCountsLocked) return;
    const donorLabel = patient?.receivedFromDonorId ? String(patient.receivedFromDonorId) : '';
    if (!donorLabel) return;
    setOpuRows((rows) => {
      const row = rows[0] || emptyOpuRow();
      if (row.fromDonor) return rows;
      return [{ ...row, fromDonor: donorLabel }];
    });
    setErDonor((prev) =>
      prev.donorCycleId || prev.donorName
        ? prev
        : { ...prev, donorCycleId: donorLabel }
    );
  }, [patient?.receivedFromDonorId, retrievalCountsLocked]);

  useEffect(() => {
    if (!token || !patient?.id || !layout.sections.showDonorToRecipient) {
      setRecipients([]);
      return;
    }
    let cancelled = false;
    void fetchRetrievalRecipients(token, patient.id, patient.satelliteId || 0, cycleId || '')
      .then((data) => {
        if (cancelled) return;
        setRecipients(data.recipients || []);
        const locked = Number(data.lockedRecipientId) || 0;
        setRecipientLocked(locked > 0);
        if (locked > 0) {
          const match = (data.recipients || []).find((item) => item.id === locked);
          setDonorRows((rows) => {
            const row = rows[0] || emptyOpuRow();
            return [{ ...row, recipientPatientId: locked, recipientName: match?.name || row.recipientName || '' }];
          });
        }
      })
      .catch(() => {
        if (!cancelled) setRecipients([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token, patient?.id, patient?.satelliteId, cycleId, layout.sections.showDonorToRecipient]);

  useEffect(() => {
    if (!token || !layout.sections.showDonorToRecipient || selectedRecipientId <= 0) {
      setRecipientCycles([]);
      return;
    }
    let cancelled = false;
    void fetchRecipientCycles(token, selectedRecipientId, patient?.satelliteId || 0, cycleId || '')
      .then((cycles) => {
        if (!cancelled) setRecipientCycles(cycles);
      })
      .catch(() => {
        if (!cancelled) setRecipientCycles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token, selectedRecipientId, patient?.satelliteId, cycleId, layout.sections.showDonorToRecipient]);

  const locationCycleId = fzoCycleId || (layout.type === 'FrozenOocytes' ? cycleId : '');
  const locationPatId =
    fzoRecipientId ||
    (fzoCycleId ? Number(donorRows[0]?.recipientPatientId || 0) : 0) ||
    patient?.id ||
    0;

  useEffect(() => {
    if (!token || !locationCycleId || !locationPatId) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    void fetchFrozenOocyteLocations(token, locationCycleId, locationPatId, patient?.satelliteId || 0)
      .then((rows) => {
        if (!cancelled) setLocations(rows);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token, locationCycleId, locationPatId, patient?.satelliteId]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">Retrieval workspace</p>
        <p className="mt-1 text-sm font-bold text-slate-800">{getCycleTypeLabel(cycleType)}</p>
        <p className="text-xs text-slate-600">
          Fields below follow the SMART cycle type, shown in Fertitrace layout. IVF / ICSI allotted here feeds Embryo Management.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800">Monitoring sheet</p>
        <p className="mt-1 text-xs text-slate-600">
          {monitoringSheet
            ? `${monitoringSheet} is filled on Cycle Creation, with the protocol for this cycle.`
            : 'Choose the protocol on Cycle Creation. The matching monitoring sheet opens there.'}
        </p>
      </section>

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
          <p className="mb-3 text-xs text-slate-600">
            SMART fills this from the linked oocyte donor. Entry is blocked on the recipient cycle.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReadField label="Name" value={erDonor.donorName || '—'} />
            <ReadField label="Mobile No" value={erDonor.donorMobile || '—'} />
            <ReadField label="Aadhaar Card" value={erDonor.donorAadhar || '—'} />
            <ReadField label="Cycle ID" value={erDonor.donorCycleId || '—'} />
          </div>
        </SectionCard>
      )}

      {layout.sections.showSelfToSelf && (
        <SectionCard title="Self To Self" tone="emerald">
          {/* Quick Allotment Helpers */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-slate-500">
              Record ovary retrieval and use quick allotment shortcuts below:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => quickAllot('all-icsi')}
                title="Allot all retrieved oocytes to ICSI"
                className="rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition active:scale-[0.99]"
              >
                ⚡ All to ICSI
              </button>
              <button
                type="button"
                onClick={() => quickAllot('all-ivf')}
                title="Allot all retrieved oocytes to IVF"
                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition active:scale-[0.99]"
              >
                ⚡ All to IVF
              </button>
              <button
                type="button"
                onClick={() => quickAllot('split-50-50')}
                title="Split retrieved oocytes equally between IVF and ICSI"
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition active:scale-[0.99]"
              >
                ⚡ 50/50 Split
              </button>
            </div>
          </div>
          <OpuGrid rows={opuRows.slice(0, 1)} onChange={updateOpu} />
        </SectionCard>
      )}

      {layout.sections.showDonorEggCount && (
        <SectionCard title="Donor Egg Count" tone="emerald">
          <OpuGrid rows={opuRows.slice(0, 1)} onChange={updateOpu} columns={DONOR_EGG_COLS} />
        </SectionCard>
      )}

      {layout.sections.showDonorToRecipient && (
        <SectionCard title="Donor To Recipient" tone="violet">
          <OpuGrid
            rows={donorRows.slice(0, 1)}
            onChange={(index, key, value) => {
              if (key === 'recipientPatientId') {
                const person = recipients.find((item) => String(item.id) === value);
                setDonorRows((rows) =>
                  rows.map((row, i) =>
                    i === index
                      ? {
                          ...row,
                          recipientPatientId: value ? Number(value) : null,
                          recipientName: person?.name || '',
                          recipientCycleId: '',
                        }
                      : row
                  )
                );
                return;
              }
              updateDonor(index, key, value);
            }}
            leading={[
              {
                key: 'recipientPatientId',
                label: 'To Recipient',
                disabled: recipientLocked,
                options: [
                  { value: '', label: '--Select--' },
                  ...recipients.map((item) => ({ value: String(item.id), label: item.name })),
                ],
              },
              {
                key: 'recipientCycleId',
                label: 'Recipient Cycle Date',
                disabled: selectedRecipientId <= 0,
                options: [
                  { value: '', label: '--Select--' },
                  ...recipientCycles.map((item) => ({ value: item.id, label: item.label })),
                ],
              },
            ]}
          />
          {!recipients.length ? (
            <p className="mt-2 text-xs text-slate-600">No recipient patients were returned for this donor.</p>
          ) : null}
        </SectionCard>
      )}

      {layout.sections.showOocyteReceivedFrom && (
        <SectionCard title="Received from Donor" tone="blue">
          <p className="mb-3 text-xs text-slate-600">
            SMART blocks ovary / IVF / ICSI entry here. Counts come from the donor retrieval and cannot be typed on this cycle.
          </p>
          <OpuGrid
            rows={opuRows.slice(0, 1)}
            onChange={updateOpu}
            leading={[{ key: 'fromDonor', label: 'From Donor' }]}
            readOnly={retrievalCountsLocked}
          />
        </SectionCard>
      )}

      {layout.sections.showDonorToSelf && !layout.sections.showOocyteReceivedFrom && (
        <SectionCard title="Received from Donor" tone="blue">
          <p className="mb-3 text-xs text-slate-600">
            SMART shows this donor-egg grid as read-only on Embryo Recipient. Counts are taken from the donor cycle.
          </p>
          <OpuGrid rows={opuRows.slice(0, 1)} onChange={updateOpu} readOnly={retrievalCountsLocked} />
        </SectionCard>
      )}

      {showFreeze && (
        <SectionCard title="Freeze Oocytes" tone="sky">
          <div className="grid gap-3 sm:grid-cols-4">
            {(['mii', 'mi', 'gv'] as const).map((key) => (
              <label key={key} className="text-xs font-semibold text-slate-600">
                {key === 'mii' ? 'Metaphase II' : key === 'mi' ? 'Metaphase I' : 'GV'}
                <input
                  type="number"
                  value={freeze[key] ?? ''}
                  onChange={(e) =>
                    setFreeze((row) => {
                      const next = { ...row, [key]: e.target.value === '' ? null : Number(e.target.value) };
                      next.total = Number(next.mii || 0) + Number(next.mi || 0) + Number(next.gv || 0);
                      return next;
                    })
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-2 text-sm"
                />
              </label>
            ))}
            <label className="text-xs font-semibold text-slate-600">
              Total
              <input
                readOnly
                value={(freeze.mii || 0) + (freeze.mi || 0) + (freeze.gv || 0)}
                className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-slate-100 px-2 text-sm font-bold text-blue-800"
              />
            </label>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {layout.type === 'OD'
              ? 'On Submit leftover freeze oocytes are stored on the recipient Frozen Oocyte (FZO) cycle. Location is assigned there, not on ET / BT / IVF / ICSI.'
              : 'On Submit these oocytes are stored in CycOocytesLocation. Assign the straw location below.'}
          </p>
        </SectionCard>
      )}

      {(locations.length > 0 || fzoCycleId) && (
        <SectionCard title="Frozen Oocytes — Location" tone="sky">
          {fzoCycleId ? (
            <p className="mb-3 text-xs text-slate-600">
              SMART stored these on Frozen Oocyte cycle <strong>{fzoCycleId}</strong>. Give each oocyte a cryo location here.
            </p>
          ) : (
            <p className="mb-3 text-xs text-slate-600">
              Same grid as SMART Frozen Oocytes. Source is MII / MI / GV; location is the straw.
            </p>
          )}
          {!locations.length ? (
            <p className="text-xs text-slate-500">No oocyte location rows yet. Submit retrieval first.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {locations.map((row) => (
                    <tr key={row.oocytesId}>
                      <td className="px-3 py-2 font-semibold text-slate-700">{row.source}</td>
                      <td className="px-3 py-2">
                        <input
                          value={row.location}
                          onChange={(e) =>
                            setLocations((rows) =>
                              rows.map((item) =>
                                item.oocytesId === row.oocytesId ? { ...item, location: e.target.value } : item
                              )
                            )
                          }
                          placeholder="CC-DF11/C-1/GO-BL/VE-PK/VI-BK/ST-BR"
                          className="h-8 w-full min-w-[16rem] rounded-lg border border-slate-200 px-2 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={!token || locationSaving === row.oocytesId}
                          onClick={() => {
                            if (!token || !locationCycleId) return;
                            setLocationSaving(row.oocytesId);
                            void saveFrozenOocyteLocation(token, locationCycleId, row.oocytesId, row.location)
                              .finally(() => setLocationSaving(null));
                          }}
                          className="rounded-lg bg-[#6345A6] px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                        >
                          {locationSaving === row.oocytesId ? 'Saving…' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

      {(showHusbandSperm || showDonorSperm) && (
        <CycleRetrievalSpermCard
          semenSource={semenSource}
          cycleId={cycleId}
          patientId={patient?.id}
          satelliteId={patient?.satelliteId}
          onChange={setSperm}
        />
      )}
    </div>
  );
}

function ChoiceBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-2xs">
      <span className="text-xs font-semibold text-slate-500">{label}:</span>
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

type GridColumn = {
  key: keyof RetrievalRow;
  label: string;
  options?: { value: string; label: string }[];
  disabled?: boolean;
};

function OpuGrid({
  rows,
  onChange,
  columns = OPU_COLS,
  leading = [],
  readOnly = false,
}: {
  rows: RetrievalRow[];
  onChange: (index: number, key: keyof RetrievalRow, value: string) => void;
  columns?: readonly GridColumn[];
  leading?: GridColumn[];
  readOnly?: boolean;
}) {
  const cols: GridColumn[] = [...leading, ...columns];

  function handleStep(index: number, key: keyof RetrievalRow, delta: number) {
    const current = Number(rows[index]?.[key] || 0);
    const nextVal = Math.max(0, current + delta);
    onChange(index, key, String(nextVal));
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-xs">
        <thead>
          <tr className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
            {cols.map((col) => (
              <th key={String(col.key)} className="px-2.5 py-2 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50 transition">
              {cols.map((col) => {
                const text = TEXT_KEYS.has(col.key) || col.key === 'recipientPatientId';
                const locked = readOnly || col.key === 'total';
                const current = (row[col.key] as string | number | null | undefined) ?? '';
                const isOvary = !readOnly && (col.key === 'leftOvary' || col.key === 'rightOvary');

                return (
                  <td key={String(col.key)} className="px-2 py-2">
                    {col.options ? (
                      <select
                        disabled={readOnly || col.disabled}
                        value={String(current)}
                        onChange={(e) => onChange(i, col.key, e.target.value)}
                        className="h-8 w-full min-w-[8.5rem] rounded-lg border border-slate-200 bg-white px-2 text-xs disabled:bg-slate-100"
                      >
                        {col.options.map((option) => (
                          <option key={option.value || 'blank'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-1">
                        {isOvary && (
                          <button
                            type="button"
                            onClick={() => handleStep(i, col.key, -1)}
                            className="flex h-7 w-5 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                          >
                            -
                          </button>
                        )}
                        <input
                          type={text ? 'text' : 'number'}
                          readOnly={locked}
                          value={current}
                          placeholder={locked ? '—' : '—'}
                          onChange={(e) => onChange(i, col.key, e.target.value)}
                          className={`h-8 rounded-lg border px-2 text-xs font-semibold outline-none transition ${
                            readOnly
                              ? `${text ? 'w-36' : 'w-16'} border-slate-200 bg-slate-100 text-slate-600 text-center`
                              : locked
                              ? 'w-18 border-blue-200 bg-blue-50/80 font-bold text-blue-800 text-center'
                              : isOvary
                              ? 'w-14 border-slate-200 bg-white text-center focus:border-purple-600'
                              : text
                              ? 'w-36 border-slate-200 bg-white'
                              : 'w-16 border-slate-200 bg-white text-center focus:border-purple-600'
                          }`}
                        />
                        {isOvary && (
                          <button
                            type="button"
                            onClick={() => handleStep(i, col.key, 1)}
                            className="flex h-7 w-5 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                          >
                            +
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
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
        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-normal text-slate-800 outline-none transition focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
      />
    </label>
  );
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 truncate">{value}</p>
    </div>
  );
}
