'use client';

import { useEffect, useState } from 'react';
import { ModuleAlerts, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import {
  fieldDate,
  GameteTable,
  HormoneAssays,
  HtmlNote,
  ReportSelect,
  TransferTable,
  TypePills,
  val,
} from '@/components/reports/clinical-report';
import {
  CraftFooter,
  CraftHeader,
  CraftPairs,
  CraftPaper,
  CraftSection,
} from '@/components/reports/craft-report';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import { ApiError } from '@/lib/api';
import { listArtCycles, loadArtCycleSummary, type ArtCycleOption, type ArtCycleSummaryResult } from '@/lib/services/reports';
import { ART_CYCLE_TYPES } from '@/lib/types/reports';
import type { ReportRow } from '@/lib/types/reports';

function sectionRows(summary: ArtCycleSummaryResult | null, name: string): ReportRow[] {
  return summary?.sections.find((s) => s.name === name)?.rows || [];
}

function artHeading(title: string): string {
  if (title === 'FET Report') return 'Frozen Embryo Transfer (FET) Report';
  if (title === 'Embryos Report') return 'Embryo Recipient Report';
  if (title === 'Oocytes Report') return 'Oocyte Cryopreservation Report';
  return 'Assisted Reproductive Technology (ART) Cycle Report';
}

export function ArtCycleReport() {
  const { token } = useAuth();
  const { selectedSatellite } = usePatient();
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
  const etFrozen = sectionRows(summary, 'ET Frozen');
  const btFrozen = sectionRows(summary, 'BT Frozen');
  const clinic = selectedSatellite?.name || 'FERTITRACE';

  return (
    <PatientRequired>
      <div className="print:hidden mb-3 flex flex-wrap items-center gap-4">
        <ReportSelect
          label="Select Cycle"
          value={selectedId}
          onChange={setSelectedId}
          placeholder={loadingList ? 'Loading cycles…' : 'Select Cycle'}
          options={cycles}
          disabled={loadingList}
        />
        <TypePills options={ART_CYCLE_TYPES} selectedIndex={summary?.type ?? 0} />
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto rounded-lg bg-[#123E73] px-3 py-1.5 text-xs font-bold text-white"
        >
          Print
        </button>
      </div>
      <ModuleAlerts error={error} />
      {loadingSummary && <p className="print:hidden mb-3 text-sm text-slate-500">Loading ART Cycle summary…</p>}
      {summary && !loadingSummary && (
        <CraftPaper>
          <CraftHeader
            clinicName={clinic}
            clinicLine="Clinical Laboratory Report"
            title={artHeading(summary.title)}
            reportNo={`ART/${summary.cycleId}`}
            reportedOn={fieldDate(patient, 'CycODate', 'MaxDate') || new Date().toLocaleDateString('en-GB')}
          />

          <div className="space-y-3 p-4 sm:p-5">
            <CraftSection no={1} title="Patient & Cycle Details" tone="navy">
              <div className="grid gap-4 md:grid-cols-2">
                <CraftPairs
                  columns={1}
                  items={[
                    { label: 'Patient Name', value: val(patient, 'PatName') || patientName },
                    { label: 'UHID', value: selectedPatient?.uhid || val(patient, 'PatID') },
                    { label: "Husband's Name", value: val(patient, 'patHusbName') || selectedPatient?.partner || '' },
                    { label: 'Age', value: val(patient, 'PatAge') || String(selectedPatient?.age ?? '') },
                    { label: 'L.M.P.', value: fieldDate(patient, 'CycHHLMP') },
                  ]}
                />
                <CraftPairs
                  columns={1}
                  items={[
                    { label: 'Cycle No.', value: val(patient, 'CycID') || summary.cycleId },
                    { label: 'Date', value: fieldDate(patient, 'CycODate', 'MaxDate') },
                    { label: 'Procedure', value: summary.typeLabel },
                    { label: 'Smart Id', value: val(patient, 'PatID', 'Pat') },
                    { label: 'OPU Done On', value: fieldDate(patient, 'OPUDoneOn') },
                  ]}
                />
              </div>
            </CraftSection>

            <div className="grid gap-3 lg:grid-cols-2">
              <CraftSection no={2} title="Follicular Phase Treatment & Stimulation" tone="teal">
                <HtmlNote html={val(patient, 'TreatMent')} />
              </CraftSection>
              <CraftSection no={3} title="Hormone Assays" tone="blue">
                <HormoneAssays row={patient} />
                <div className="mt-3 space-y-1 text-[12px] text-slate-700">
                  <div>
                    <b>Embryo Transfer Done On:</b> {fieldDate(patient, 'ETDate') || '—'}
                  </div>
                  <div>
                    <b>Blastocyst Transfer Done On:</b> {fieldDate(patient, 'BTDate') || '—'}
                  </div>
                </div>
              </CraftSection>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <CraftSection no={4} title="Gamete Distribution" tone="green">
                <GameteTable row={patient} />
              </CraftSection>
              <div className="space-y-3">
                <CraftSection no={5} title="Embryo Transfer Details" tone="orange">
                  <TransferTable title="" rows={etRows} />
                </CraftSection>
                <CraftSection no={6} title="Blastocyst Transfer Details" tone="purple">
                  <TransferTable title="" rows={btRows} />
                </CraftSection>
              </div>
            </div>

            {(etFrozen.length > 0 || btFrozen.length > 0) && (
              <div className="grid gap-3 lg:grid-cols-2">
                {etFrozen.length > 0 && (
                  <CraftSection no={7} title="Embryos Frozen" tone="sky">
                    <TransferTable title="" rows={etFrozen} />
                  </CraftSection>
                )}
                {btFrozen.length > 0 && (
                  <CraftSection no={8} title="Blastocysts Frozen" tone="teal">
                    <TransferTable title="" rows={btFrozen} />
                  </CraftSection>
                )}
              </div>
            )}

            {oocyteStraw.length > 0 && (
              <CraftSection no={9} title="Oocyte Straw" tone="sky">
                <TransferTable title="" rows={oocyteStraw} />
              </CraftSection>
            )}

            {val(patient, 'CycOAdvice') && (
              <CraftSection no={10} title="Advice / Remarks" tone="navy">
                <HtmlNote html={val(patient, 'CycOAdvice')} />
              </CraftSection>
            )}
          </div>

          <CraftFooter consultant={val(patient, 'DocName', 'RefDoctor')} date={fieldDate(patient, 'CycODate', 'MaxDate')} />
        </CraftPaper>
      )}
    </PatientRequired>
  );
}
