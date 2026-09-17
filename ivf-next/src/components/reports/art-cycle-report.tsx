'use client';

import { useEffect, useState } from 'react';
import { ModuleAlerts, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import {
  GameteTable,
  HormoneAssays,
  HtmlNote,
  Kv,
  ReportSelect,
  SmartViewer,
  TransferTable,
  TypePills,
  fieldDate,
  val,
} from '@/components/reports/clinical-report';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { listArtCycles, loadArtCycleSummary, type ArtCycleOption, type ArtCycleSummaryResult } from '@/lib/services/reports';
import { ART_CYCLE_TYPES } from '@/lib/types/reports';
import type { ReportRow } from '@/lib/types/reports';

function sectionRows(summary: ArtCycleSummaryResult | null, name: string): ReportRow[] {
  return summary?.sections.find((s) => s.name === name)?.rows || [];
}

export function ArtCycleReport() {
  const { token } = useAuth();
  const { patId, satId, patientName, ready, selectedPatient } = usePatientIds();
  const [cycles, setCycles] = useState<ArtCycleOption[]>([]);
  const [selectedId, setSelectedId] = useState('0');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<ArtCycleSummaryResult | null>(null);

  useEffect(() => {
    if (!token || !ready) return;
    let cancelled = false;
    setLoadingList(true);
    setError('');
    setSelectedId('0');
    setSummary(null);
    listArtCycles(token, patId, satId)
      .then((rows) => {
        if (cancelled) return;
        setCycles(rows);
        if (rows[0]) setSelectedId(rows[0].id);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load ART cycles.');
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, ready, patId, satId]);

  useEffect(() => {
    if (!token || selectedId === '0') {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setLoadingSummary(true);
    setError('');
    loadArtCycleSummary(token, selectedId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setSummary(null);
          setError(err instanceof ApiError ? err.message : 'Failed to load ART Cycle summary.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, selectedId]);

  const patient =
    sectionRows(summary, 'Patient Summary')[0] ||
    sectionRows(summary, 'FET Summary')[0] ||
    sectionRows(summary, 'Embryo Summary')[0] ||
    sectionRows(summary, 'Oocyte Summary')[0];
  const etRows = sectionRows(summary, 'ET Transfer')
    .concat(sectionRows(summary, 'ET Celler'))
    .concat(sectionRows(summary, 'Patient Transfer'));
  const btRows = sectionRows(summary, 'BT Transfer').concat(sectionRows(summary, 'BT Celler'));
  const oocyteStraw = sectionRows(summary, 'Oocyte Straw');

  return (
    <PatientRequired>
      <div className="print:hidden mb-3 flex flex-wrap items-center gap-4">
        <ReportSelect
          label="Name :"
          value={selectedId}
          onChange={setSelectedId}
          placeholder={loadingList ? 'Loading cycles…' : 'Select Patient'}
          options={cycles}
          disabled={loadingList}
        />
        <TypePills options={ART_CYCLE_TYPES} selectedIndex={summary?.type ?? 0} />
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto rounded border border-slate-400 bg-white px-3 py-1.5 text-xs font-semibold"
        >
          Print
        </button>
      </div>
      <ModuleAlerts error={error} />
      {loadingSummary && <p className="print:hidden mb-3 text-sm text-slate-500">Loading ART Cycle summary…</p>}
      {summary && !loadingSummary && (
        <SmartViewer title={summary.title}>
          <div className="grid grid-cols-12 gap-x-3 gap-y-1">
            <Kv className="col-span-5" label="Name :-" value={val(patient, 'PatName') || patientName} />
            <Kv className="col-span-2" label="Age" value={val(patient, 'PatAge') || String(selectedPatient?.age ?? 0)} />
            <Kv className="col-span-3" label="Date:" value={fieldDate(patient, 'CycODate', 'MaxDate')} />
            <Kv className="col-span-2" label="Cycle No:" value={val(patient, 'CycID')} />
            <Kv className="col-span-5" label="Husband's Name:" value={val(patient, 'patHusbName') || selectedPatient?.partner || ''} />
            <Kv className="col-span-3" label="L.M.P." value={fieldDate(patient, 'CycHHLMP')} />
            <Kv className="col-span-4" label="Smart Id:-" value={val(patient, 'PatID', 'Pat')} />
            <Kv className="col-span-12" label="Procedure:-" value={summary.typeLabel} />
          </div>

          <div className="mt-3 grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-1 font-bold">Follicular Phase Treatment &amp; Stimulation Schedule:</div>
              <HtmlNote html={val(patient, 'TreatMent')} />
            </div>
            <div className="space-y-2">
              <div>
                <b>OPU Done On :</b> {fieldDate(patient, 'OPUDoneOn')}
              </div>
              <div className="font-bold">Hormone Assays:</div>
              <HormoneAssays row={patient} />
              <div>
                <b>Embryos Transfer Done On:</b> {fieldDate(patient, 'ETDate')}
              </div>
              <div>
                <b>Catheter Used:</b> Cook/Labotect/CCD/Others
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <div className="mb-1 font-bold">Gamete Distribution</div>
              <GameteTable row={patient} />
            </div>
            <div className="space-y-3">
              <TransferTable title="Embryo Transfer Details" rows={etRows} />
              <div>
                <b>Blastocyst Transfer Done On:</b> {fieldDate(patient, 'BTDate')}
              </div>
              <TransferTable title="Blastocyst Transfer Details" rows={btRows} />
            </div>
          </div>

          {oocyteStraw.length > 0 && (
            <div className="mt-4">
              <TransferTable title="Oocyte Straw" rows={oocyteStraw} />
            </div>
          )}
          {val(patient, 'CycOAdvice') && (
            <div className="mt-4">
              <div className="mb-1 font-bold">Advice</div>
              <HtmlNote html={val(patient, 'CycOAdvice')} />
            </div>
          )}
        </SmartViewer>
      )}
    </PatientRequired>
  );
}
