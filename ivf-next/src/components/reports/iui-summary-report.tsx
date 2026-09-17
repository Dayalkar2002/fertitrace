'use client';

import { useEffect, useState } from 'react';
import { ModuleAlerts, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import {
  ClinicalTable,
  Kv,
  ReportSelect,
  SmartViewer,
  TypePills,
  fieldDate,
  val,
} from '@/components/reports/clinical-report';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import { ApiError } from '@/lib/api';
import { listIuiReportIds, loadIuiSummary, type IuiReportId, type IuiSummaryResult } from '@/lib/services/reports';

function iuiReportTitle(indication: string): string {
  const text = indication.toUpperCase();
  if (text.includes('HSA')) return 'HSA Summary Report';
  if (text.includes('SQA')) return 'SQA Summary Report';
  if (text.includes('TIC') || text.includes('FM')) return 'TIC / Follicle Monitoring Report';
  if (text.includes('THAW')) return 'IUI Thaw Report';
  return 'IUI Summary Report';
}

export function IuiSummaryReport() {
  const { token } = useAuth();
  const { selectedSatellite } = usePatient();
  const { patId, satId, patientName, ready } = usePatientIds();
  const [ids, setIds] = useState<IuiReportId[]>([]);
  const [selectedId, setSelectedId] = useState('0');
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<IuiSummaryResult | null>(null);

  useEffect(() => {
    if (!token || !ready) return;
    let cancelled = false;
    setLoadingList(true);
    setError('');
    setSelectedId('0');
    setSummary(null);
    listIuiReportIds(token, patId, satId)
      .then((rows) => {
        if (cancelled) return;
        setIds(rows);
        if (rows[0]) setSelectedId(rows[0].iuiId);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to load IUI IDs.');
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, ready, patId, satId]);

  useEffect(() => {
    if (!token || !ready || selectedId === '0') {
      setSummary(null);
      return;
    }
    const selected = ids.find((row) => row.iuiId === selectedId);
    let cancelled = false;
    setLoadingSummary(true);
    setError('');
    loadIuiSummary(token, patId, satId, selectedId, selected?.label || '')
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setSummary(null);
          setError(err instanceof ApiError ? err.message : 'Failed to load IUI summary.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, ready, patId, satId, selectedId, ids]);

  const uterus = summary?.sections.find((s) => s.name === 'Patient / Uterus & Ovaries')?.rows[0];
  const follicular = summary?.sections.find((s) => s.name === 'Follicular Study')?.rows || [];
  const analysis = summary?.sections.find((s) => s.name === 'IUI Analysis')?.rows[0];
  const showAnalysis = Boolean(analysis) && !/TIC|FM/.test((summary?.indication || '').toUpperCase());

  return (
    <PatientRequired>
      <div className="print:hidden mb-3 flex flex-wrap items-center gap-4">
        <ReportSelect
          label="Select IUI ID:-"
          value={selectedId}
          onChange={setSelectedId}
          placeholder={loadingList ? 'Loading IUI IDs…' : 'Select IUI'}
          options={ids.map((row) => ({ id: row.iuiId, label: row.label }))}
          disabled={loadingList}
        />
        {summary && (
          <TypePills options={['Single IUI', 'Double IUI']} selectedIndex={summary.iuiKind === 'Double IUI' ? 1 : 0} />
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto rounded border border-slate-400 bg-white px-3 py-1.5 text-xs font-semibold"
        >
          Print
        </button>
      </div>
      <ModuleAlerts error={error} />
      {loadingSummary && <p className="print:hidden mb-3 text-sm text-slate-500">Loading IUI summary…</p>}
      {summary && !loadingSummary && (
        <SmartViewer title={iuiReportTitle(summary.indication)}>
          {selectedSatellite?.name && (
            <div className="mb-3 text-center">
              <div className="text-[15px] font-bold uppercase">{selectedSatellite.name}</div>
            </div>
          )}
          <div className="grid grid-cols-12 gap-x-3 gap-y-1">
            <Kv className="col-span-7" label="Name :-" value={val(uterus, 'PatFullName', 'PatName') || patientName} />
            <Kv className="col-span-5" label="Date:-" value={fieldDate(uterus, 'IUIUODateOfCreation', 'PatDateOfCreation')} />
            <Kv className="col-span-7" label="Ref By :-" value={val(uterus, 'RefDoctor')} />
            <Kv className="col-span-5" label="L.M.P.:-" value={fieldDate(uterus, 'IUISLMP')} />
            <div className="col-span-7">
              <b>1. Uterus</b>
            </div>
            <Kv className="col-span-5" label="Indication :-" value={summary.indication} />
            <div className="col-span-12">
              * Not Seen/Normal/Enlarged &amp; AVAF/ RF/ RV :- {summary.uterusFlags}
            </div>
            <div className="col-span-7">
              * Uterine Measurement LxBxT = {val(uterus, 'IUIUMeasurement') || '0.00'} Cms
            </div>
            <div className="col-span-5">* Echopattern :- {summary.echoPattern}</div>
            <div className="col-span-7">* Focal Lesion :- {val(uterus, 'IUIUFocalLesion')}</div>
            <div className="col-span-5">* Endometrial Echo :- {val(uterus, 'IUIUEchoEndo')}</div>
            <div className="col-span-12 mt-2">
              <b>2.Ovaries</b>
              <span className="ml-6">Size (Lt) :- {val(uterus, 'IUIOSizeLt') || '0.00'} mms</span>
              <span className="ml-6">Size (Rt) :- {val(uterus, 'IUIOSizeRt') || '0.00'} mms</span>
              <span className="ml-6">Echo Pattern :- {val(uterus, 'IUIOEchoPattern')}</span>
            </div>
          </div>

          {follicular.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 font-bold">Follicular Study</div>
              <ClinicalTable
                rows={follicular}
                columns={[
                  { key: 'IUIFSDate', label: 'Date', date: true },
                  { key: 'IUIFSDay', label: 'Day' },
                  { key: 'IUIFSEndoThickness', label: 'Endo' },
                  { key: 'IUIFSCXMucus', label: 'CX mucus' },
                  { key: 'IUIFSRtRd', label: 'Rt RD' },
                  { key: 'IUIFSLtRd', label: 'Lt RD' },
                  { key: 'IUIFSRtOveryFollicle', label: 'Rt follicle' },
                  { key: 'IUIFSLtOveryFollicle', label: 'Lt follicle' },
                  { key: 'IUIFSRemark', label: 'Remark' },
                ]}
              />
            </div>
          )}

          {showAnalysis && analysis && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 font-bold">Before Processing</div>
                <div>Vol: {val(analysis, 'IUIABVol')} ml</div>
                <div>Total Sperms: {val(analysis, 'IUIABSperms')} M/ml</div>
                <div>Total Motility: {val(analysis, 'IUIABMotility')} %</div>
                <div>Prog. Motility: {val(analysis, 'IUIABProgMotility')} %</div>
              </div>
              <div>
                <div className="mb-1 font-bold">After Processing</div>
                <div>Vol: {val(analysis, 'IUIAAVol')} ml</div>
                <div>Conc. Total Sperms: {val(analysis, 'IUIAASperms')} M/ml</div>
                <div>Total Motility: {val(analysis, 'IUIAAMotility')} %</div>
                <div>Prog. Motility: {val(analysis, 'IUIAAProgMotility')} %</div>
              </div>
            </div>
          )}
        </SmartViewer>
      )}
    </PatientRequired>
  );
}
