'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { loadCycleAnalysisSemen } from '@/lib/services/cycle-sperm';
import {
  idLocationQueryType,
  listSpermIdLocations,
  loadSpermLocationDetails,
  type SpermIdOption,
  type SpermLocationDetails,
} from '@/lib/services/sperm-id-location';

export interface RetrievalSpermValue {
  source: string;
  sampleId: string;
  sampleLabel: string;
  details: Partial<SpermLocationDetails> | null;
}

interface CycleRetrievalSpermCardProps {
  semenSource: string;
  cycleId?: string;
  patientId?: number;
  satelliteId?: number;
  onChange?: (value: RetrievalSpermValue) => void;
}

function queryForSemen(semenSource: string) {
  if (semenSource === 'husband_cryo') {
    return {
      title: 'Husband Semen Details (Frozen)',
      spermId: 'Husband',
      semenType: 'Frozen',
      frozen: true,
      empty: 'No frozen husband straws for this patient. Freeze a sample in Sperm Management first.',
    };
  }
  if (semenSource === 'donor_cryo' || semenSource === 'donor_fresh') {
    return {
      title: 'Donor Semen Details (Frozen)',
      spermId: 'Donor',
      semenType: 'Frozen',
      frozen: true,
      empty: 'No donor straw IDs found. Register donor semen in Sperm Management.',
    };
  }
  return {
    title: 'Husband Semen Details (Fresh)',
    spermId: 'Husband',
    semenType: 'Fresh',
    frozen: false,
    empty: 'Fresh husband values appear after a semen analysis is saved for this cycle, same as SMART retrieval.',
  };
}

export function CycleRetrievalSpermCard({
  semenSource,
  cycleId,
  patientId,
  satelliteId,
  onChange,
}: CycleRetrievalSpermCardProps) {
  const { token } = useAuth();
  const query = useMemo(() => queryForSemen(semenSource), [semenSource]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [ids, setIds] = useState<SpermIdOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [details, setDetails] = useState<Partial<SpermLocationDetails> | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !semenSource) return;
    let cancelled = false;
    setSelectedId('');
    setDetails(null);
    setMessage('');
    setLoading(true);

    async function load() {
      try {
        if (query.frozen) {
          const options = await listSpermIdLocations(token!, {
            spermId: query.spermId,
            semenType: query.semenType,
            patId: patientId || 0,
            satId: satelliteId || 0,
          });
          if (cancelled) return;
          setIds(options);
          if (!options.length) setMessage(query.empty);
          return;
        }

        setIds([]);
        if (!cycleId || !patientId) {
          setMessage(query.empty);
          return;
        }
        const analysis = await loadCycleAnalysisSemen(token!, cycleId, patientId);
        if (cancelled) return;
        if (!analysis) {
          setMessage(query.empty);
          return;
        }
        const mapped: Partial<SpermLocationDetails> = {
          vol: analysis.vol,
          sperms: analysis.sperms,
          motility: analysis.motility,
          progMotility: analysis.progMotility,
          grade1: analysis.grade1,
          grade2: analysis.grade2,
          grade3: analysis.grade3,
          grade4: analysis.grade4,
          wbc: analysis.wbc,
          rbc: analysis.rbc,
        };
        setSelectedId(analysis.freezingId || analysis.analysisId);
        setDetails(mapped);
        onChangeRef.current?.({
          source: semenSource,
          sampleId: analysis.freezingId || analysis.analysisId,
          sampleLabel: analysis.spermTypeName || 'Husband Fresh',
          details: mapped,
        });
      } catch (err) {
        if (!cancelled) setMessage(err instanceof Error ? err.message : 'Could not load semen details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, semenSource, cycleId, patientId, satelliteId, query]);

  async function selectId(id: string) {
    setSelectedId(id);
    if (!token || !id) {
      setDetails(null);
      onChangeRef.current?.({ source: semenSource, sampleId: '', sampleLabel: '', details: null });
      return;
    }
    const option = ids.find((item) => item.id === id);
    try {
      const loaded = await loadSpermLocationDetails(token, id, idLocationQueryType(query.spermId, query.semenType));
      setDetails(loaded);
      onChangeRef.current?.({
        source: semenSource,
        sampleId: id,
        sampleLabel: option?.label || id,
        details: loaded,
      });
    } catch {
      setDetails(null);
      onChangeRef.current?.({
        source: semenSource,
        sampleId: id,
        sampleLabel: option?.label || id,
        details: null,
      });
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
      <h3 className="mb-3 text-sm font-extrabold uppercase tracking-wide text-slate-800">{query.title}</h3>
      {query.frozen ? (
        <label className="mb-3 block text-xs font-semibold text-slate-600">
          Sample ID / Location
          <select
            value={selectedId}
            onChange={(e) => void selectId(e.target.value)}
            className="mt-1 h-9 w-full max-w-md rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal text-slate-800"
          >
            <option value="">Select frozen ID</option>
            {ids.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {loading ? <p className="text-sm text-slate-500">Loading semen details…</p> : null}
      {!loading && message && !details ? <p className="text-sm text-slate-600">{message}</p> : null}
      {details ? <SpermMetricsGrid details={details} sampleId={selectedId} /> : null}
    </section>
  );
}

function SpermMetricsGrid({
  details,
  sampleId,
}: {
  details: Partial<SpermLocationDetails>;
  sampleId: string;
}) {
  const cells = [
    { label: 'ID', value: sampleId || '—' },
    { label: 'Vol', value: details.vol || '—' },
    { label: 'Sperms', value: details.sperms || '—' },
    { label: 'Motility', value: details.motility || '—' },
    { label: 'Prog. Motility', value: details.progMotility || '—' },
    { label: 'G1', value: details.grade1 || '—' },
    { label: 'G2', value: details.grade2 || '—' },
    { label: 'G3', value: details.grade3 || '—' },
    { label: 'G4', value: details.grade4 || '—' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-left text-xs">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            {cells.map((cell) => (
              <th key={cell.label} className="px-3 py-2 font-semibold">
                {cell.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {cells.map((cell) => (
              <td key={cell.label} className="px-3 py-2 font-semibold text-slate-800">
                {cell.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
