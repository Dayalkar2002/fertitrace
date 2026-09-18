'use client';

import { useEffect, useState } from 'react';
import { ModuleAlerts, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { fieldDate, HtmlNote, ReportSelect, TypePills, val } from '@/components/reports/clinical-report';
import {
  CraftDonut,
  CraftFooter,
  CraftHeader,
  CraftPairs,
  CraftPaper,
  CraftSection,
  CraftStatus,
  CraftTable,
  CraftWhoRow,
  prettyDateTime,
  prettyTime,
  toNumber,
} from '@/components/reports/craft-report';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import { ApiError } from '@/lib/api';
import { listIuiReportIds, loadIuiSummary, type IuiReportId, type IuiSummaryResult } from '@/lib/services/reports';
import type { ReportRow } from '@/lib/types/reports';

function isHsa(indication: string): boolean {
  return indication.toUpperCase().includes('HSA');
}

function reportTitle(indication: string): string {
  const text = indication.toUpperCase();
  if (text.includes('HSA')) return 'Husband Semen Analysis Report';
  if (text.includes('SQA')) return 'SQA Summary Report';
  if (text.includes('THAW')) return 'IUI Thaw / Sperm Preparation Report';
  return 'Intrauterine Insemination (IUI) Sperm Preparation Report';
}

function n(row: ReportRow | undefined, ...keys: string[]): number | null {
  return toNumber(val(row, ...keys));
}

function whoOk(value: number | null, min?: number, max?: number): boolean | null {
  if (value == null) return null;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

export function IuiSummaryReport() {
  const { token } = useAuth();
  const { selectedSatellite } = usePatient();
  const { patId, satId, patientName, ready, selectedPatient } = usePatientIds();
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
  const hsa = isHsa(summary?.indication || '');
  const clinic = selectedSatellite?.name || 'FERTITRACE';
  const reportedOn = prettyDateTime(new Date());

  const beforeVol = n(analysis, 'IUIABVol');
  const beforeConc = n(analysis, 'IUIABSperms');
  const beforeMot = n(analysis, 'IUIABMotility');
  const afterVol = n(analysis, 'IUIAAVol');
  const afterConc = n(analysis, 'IUIAASperms');
  const afterMot = n(analysis, 'IUIAAMotility');
  const tmsc =
    afterVol != null && afterConc != null && afterMot != null
      ? afterVol * afterConc * (afterMot / 100)
      : null;
  const beforeTmsc =
    beforeVol != null && beforeConc != null && beforeMot != null
      ? beforeVol * beforeConc * (beforeMot / 100)
      : null;
  const recovery = tmsc != null && beforeTmsc && beforeTmsc > 0 ? (tmsc / beforeTmsc) * 100 : null;
  const suitable = tmsc != null ? tmsc >= 1 : false;

  return (
    <PatientRequired>
      <div className="print:hidden mb-3 flex flex-wrap items-center gap-4">
        <ReportSelect
          label="Select IUI ID"
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
          className="ml-auto rounded-lg bg-[#123E73] px-3 py-1.5 text-xs font-bold text-white"
        >
          Print
        </button>
      </div>
      <ModuleAlerts error={error} />
      {loadingSummary && <p className="print:hidden mb-3 text-sm text-slate-500">Loading report…</p>}
      {summary && !loadingSummary && (
        <CraftPaper>
          <CraftHeader
            clinicName={clinic}
            clinicLine="Clinical Laboratory Report"
            title={reportTitle(summary.indication)}
            subtitle={hsa ? '(Analysis Performed as per WHO 2021 Criteria)' : undefined}
            reportNo={hsa ? `SA/${summary.iuiId}` : `IUI/${summary.iuiId}`}
            reportedOn={reportedOn}
          />

          <div className="space-y-3 p-4 sm:p-5">
            {hsa ? (
              <>
                <div className="grid gap-3 lg:grid-cols-2">
                  <CraftSection no={1} title="Patient Information" tone="navy">
                    <CraftPairs
                      columns={1}
                      items={[
                        { label: 'Patient Name', value: val(uterus, 'PatFullName', 'PatName') || patientName },
                        { label: 'Partner Name', value: val(uterus, 'PatHusbName') || selectedPatient?.partner || '' },
                        { label: 'UHID / Patient ID', value: selectedPatient?.uhid || String(patId) },
                        { label: 'Age', value: String(selectedPatient?.age || val(uterus, 'PatAge') || '') },
                        { label: 'Referring Doctor', value: val(uterus, 'RefDoctor') },
                        { label: 'Indication', value: summary.indication },
                        { label: 'Abstinence', value: val(analysis, 'IUIAAbstinence') ? `${val(analysis, 'IUIAAbstinence')} Days` : '' },
                      ]}
                    />
                  </CraftSection>
                  <CraftSection no={2} title="Sample Information" tone="blue">
                    <CraftPairs
                      columns={1}
                      items={[
                        { label: 'Sample Type', value: val(analysis, 'SpermName') },
                        { label: 'Collection Date', value: fieldDate(analysis, 'IUIADate') },
                        { label: 'Collection Time', value: prettyTime(val(analysis, 'IUIADate')) },
                        { label: 'Collection Method', value: val(analysis, 'CollProbName') },
                        { label: 'Lab Operator', value: val(analysis, 'LabOptName') },
                        { label: 'Method', value: val(analysis, 'MtdName') },
                        { label: 'Analysis Time', value: prettyTime(val(analysis, 'IUIVDate')) },
                        { label: 'Contamination', value: val(analysis, 'IUIAContaminationName') },
                      ]}
                    />
                  </CraftSection>
                </div>

                <CraftSection no={3} title="Sample Source" tone="orange">
                  {(() => {
                    const source = (val(analysis, 'SpermName') || 'Self Sample').toLowerCase();
                    const donor = source.includes('donor');
                    return (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${donor ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-emerald-300 bg-emerald-50 text-emerald-800'}`}>
                          {donor ? '○' : '●'} Self Sample
                        </div>
                        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${donor ? 'border-sky-300 bg-sky-50 text-sky-800' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                          {donor ? '●' : '○'} Donor Sample
                        </div>
                      </div>
                    );
                  })()}
                </CraftSection>

                <div className="grid gap-3 lg:grid-cols-3">
                  <CraftSection no={4} title="Sample Characteristics" tone="teal">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="text-left text-slate-400">
                          <th className="pb-1">Parameter</th>
                          <th>Result</th>
                          <th>WHO 2021</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        <CraftWhoRow parameter="Appearance" result={val(analysis, 'AppName')} reference="—" ok={null} />
                        <CraftWhoRow parameter="Colour" result={val(analysis, 'ColName')} reference="—" ok={null} />
                        <CraftWhoRow parameter="Volume" result={`${val(analysis, 'IUIABVol')} ml`} reference="≥ 1.4 ml" ok={whoOk(beforeVol, 1.4)} />
                        <CraftWhoRow parameter="Viscosity" result={val(analysis, 'ViscoName')} reference="Normal" ok={null} />
                        <CraftWhoRow parameter="Liquefaction" result={val(analysis, 'LiqName')} reference="Normal" ok={null} />
                        <CraftWhoRow parameter="Liquefaction Time" result={val(analysis, 'IUIATimeOfLiq')} reference="≤ 60 Min" ok={null} />
                        <CraftWhoRow parameter="pH" result={val(analysis, 'IUIApH')} reference="≥ 7.2" ok={whoOk(n(analysis, 'IUIApH'), 7.2)} />
                        <CraftWhoRow parameter="Fructose" result={val(analysis, 'FrucName')} reference="Positive" ok={null} />
                        <CraftWhoRow parameter="Agglutination" result={val(analysis, 'IUIAAgglut')} reference="None" ok={null} />
                        <CraftWhoRow parameter="Antibodies" result={val(analysis, 'IUIAAntibodies')} reference="Not Detected" ok={null} />
                      </tbody>
                    </table>
                  </CraftSection>

                  <CraftSection no={5} title="Sperm Concentration & Motility" tone="green">
                    <table className="mb-3 w-full text-[11px]">
                      <thead>
                        <tr className="text-left text-slate-400">
                          <th className="pb-1">Parameter</th>
                          <th>Result</th>
                          <th>WHO 2021</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        <CraftWhoRow parameter="Concentration" result={`${val(analysis, 'IUIABSperms')} M/ml`} reference="≥ 16 M/ml" ok={whoOk(beforeConc, 16)} />
                        <CraftWhoRow parameter="Total Motility" result={`${val(analysis, 'IUIABMotility')} %`} reference="≥ 42 %" ok={whoOk(beforeMot, 42)} />
                        <CraftWhoRow parameter="Progressive Motility" result={`${val(analysis, 'IUIABProgMotility')} %`} reference="≥ 30 %" ok={whoOk(n(analysis, 'IUIABProgMotility'), 30)} />
                      </tbody>
                    </table>
                    <CraftDonut percent={beforeMot || 0} label={`Total Motility: ${beforeMot ?? 0}%`} />
                    <div className="mt-2 space-y-0.5 text-[11px] text-slate-600">
                      <div>Rapid Progressive (Grade I) : {val(analysis, 'IUIABGrade1')} %</div>
                      <div>Slow Progressive (Grade II) : {val(analysis, 'IUIABGrade2')} %</div>
                      <div>Non Progressive (Grade III) : {val(analysis, 'IUIABGrade3')} %</div>
                      <div>Immotile (Grade IV) : {val(analysis, 'IUIABGrade4')} %</div>
                    </div>
                  </CraftSection>

                  <CraftSection no={6} title="Morphology / Microscopy" tone="purple">
                    <table className="w-full text-[11px]">
                      <tbody>
                        <CraftWhoRow parameter="WBC" result={`${val(analysis, 'IUIABWBC')} / HPF`} reference="< 1 M/ml" ok={null} />
                        <CraftWhoRow parameter="RBC" result={`${val(analysis, 'IUIABRBC')} / HPF`} reference="0" ok={null} />
                        <CraftWhoRow parameter="Epithelial Cells" result={val(analysis, 'IUIABECell')} reference="0 – 1 / HPF" ok={null} />
                        <CraftWhoRow parameter="Round Cells" result={val(analysis, 'IUIABRCell')} reference="—" ok={null} />
                        <CraftWhoRow parameter="Linearity" result={val(analysis, 'LinName')} reference="—" ok={null} />
                        <CraftWhoRow parameter="Velocity" result={val(analysis, 'IUIAVelocity')} reference="—" ok={null} />
                      </tbody>
                    </table>
                  </CraftSection>
                </div>

                <CraftSection no={7} title="Doctor Remarks" tone="navy">
                  <HtmlNote html={val(uterus, 'IUIOAdvice', 'IUIRemarks') || 'Semen parameters are reported as per WHO 2021 criteria.'} />
                </CraftSection>
              </>
            ) : (
              <>
                <CraftSection no={1} title="Patient & Cycle Details" tone="navy">
                  <div className="grid gap-4 md:grid-cols-2">
                    <CraftPairs
                      columns={1}
                      items={[
                        { label: 'Patient Name', value: val(uterus, 'PatFullName', 'PatName') || patientName },
                        { label: 'UHID', value: selectedPatient?.uhid || String(patId) },
                        { label: 'Partner Name', value: val(uterus, 'PatHusbName') || selectedPatient?.partner || '' },
                        { label: 'LMP', value: fieldDate(uterus, 'IUISLMP') },
                        { label: 'Consultant', value: val(uterus, 'RefDoctor') },
                      ]}
                    />
                    <CraftPairs
                      columns={1}
                      items={[
                        { label: 'Cycle No.', value: summary.iuiId },
                        { label: 'Date', value: fieldDate(uterus, 'IUIUODateOfCreation', 'PatDateOfCreation') },
                        { label: 'Indication', value: summary.indication || summary.iuiKind },
                        { label: 'Sample Source', value: val(analysis, 'SpermName') },
                        { label: 'Method Used', value: val(analysis, 'MtdName') },
                        { label: 'Abstinence', value: val(analysis, 'IUIAAbstinence') ? `${val(analysis, 'IUIAAbstinence')} Days` : '' },
                      ]}
                    />
                  </div>
                </CraftSection>

                <CraftSection no={2} title="Follicular Monitoring with Stimulation" tone="navy">
                  <CraftTable
                    headers={['Date', 'Day', 'Left Ovary Follicle', 'Right Ovary Follicle', 'Endometrium (mm)', 'Cervical Mucus', 'Remarks']}
                    rows={follicular.map((row) => [
                      fieldDate(row, 'IUIFSDate'),
                      val(row, 'IUIFSDay'),
                      val(row, 'IUIFSLtOveryFollicle', 'IUIFSLtRd'),
                      val(row, 'IUIFSRtOveryFollicle', 'IUIFSRtRd'),
                      val(row, 'IUIFSEndoThickness'),
                      val(row, 'IUIFSCXMucus'),
                      val(row, 'IUIFSRemark'),
                    ])}
                  />
                </CraftSection>

                <div className="grid gap-3 lg:grid-cols-2">
                  <CraftSection no={3} title="Semen Sample Details" tone="teal">
                    <CraftPairs
                      columns={1}
                      items={[
                        { label: 'Collection Time', value: prettyTime(val(analysis, 'IUIADate')) },
                        { label: 'Received Time', value: prettyTime(val(analysis, 'IUIVDate')) },
                        { label: 'Appearance', value: val(analysis, 'AppName') },
                        { label: 'Colour', value: val(analysis, 'ColName') },
                        { label: 'Liquefaction', value: val(analysis, 'LiqName') },
                        { label: 'Liquefaction Time', value: val(analysis, 'IUIATimeOfLiq') },
                        { label: 'Viscosity', value: val(analysis, 'ViscoName') },
                        { label: 'pH', value: val(analysis, 'IUIApH') },
                        { label: 'Fructose', value: val(analysis, 'FrucName') },
                        { label: 'Agglutination', value: val(analysis, 'IUIAAgglut') },
                        { label: 'Antibodies', value: val(analysis, 'IUIAAntibodies') },
                        { label: 'Contamination', value: val(analysis, 'IUIAContaminationName') },
                      ]}
                    />
                  </CraftSection>
                  <CraftSection no={4} title="Semen Analysis" tone="blue">
                    <CraftTable
                      headerClass="bg-[#1A56A8] text-white"
                      headers={['Parameter', 'Before Processing', 'After Processing']}
                      rows={[
                        ['Volume (ml)', val(analysis, 'IUIABVol'), val(analysis, 'IUIAAVol')],
                        ['Concentration (Million/ml)', val(analysis, 'IUIABSperms'), val(analysis, 'IUIAASperms')],
                        ['Total Motility (%)', val(analysis, 'IUIABMotility'), val(analysis, 'IUIAAMotility')],
                        ['Progressive Motility (%)', val(analysis, 'IUIABProgMotility'), val(analysis, 'IUIAAProgMotility')],
                        ['Grade A (Rapid Progressive %)', val(analysis, 'IUIABGrade1'), ''],
                        ['Grade B (Slow Progressive %)', val(analysis, 'IUIABGrade2'), ''],
                        ['Grade C (Non Progressive %)', val(analysis, 'IUIABGrade3'), ''],
                        ['Grade D (Immotile %)', val(analysis, 'IUIABGrade4'), ''],
                        ['WBC (per HPF)', val(analysis, 'IUIABWBC'), ''],
                        ['RBC (per HPF)', val(analysis, 'IUIABRBC'), ''],
                        ['Epithelial Cells (per HPF)', val(analysis, 'IUIABECell'), ''],
                        ['Round Cells (per HPF)', val(analysis, 'IUIABRCell'), ''],
                        ['Linearity', val(analysis, 'LinName'), val(analysis, 'LinAName')],
                        ['Velocity (μm/sec)', val(analysis, 'IUIAVelocity'), ''],
                      ]}
                    />
                  </CraftSection>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <CraftSection no={5} title="Sperm Preparation Details" tone="orange">
                    <CraftPairs
                      columns={1}
                      items={[
                        { label: 'Preparation Method', value: val(analysis, 'MtdName') },
                        { label: 'Operator', value: val(analysis, 'LabOptName') },
                        { label: 'Sample Source', value: val(analysis, 'SpermName') },
                        { label: 'Collection Problem', value: val(analysis, 'CollProbName') },
                      ]}
                    />
                  </CraftSection>
                  <CraftSection no={6} title="Final Sample for IUI" tone="green">
                    <CraftPairs
                      columns={1}
                      items={[
                        { label: 'Final Volume (ml)', value: val(analysis, 'IUIAAVol') },
                        { label: 'Final Concentration (Million/ml)', value: val(analysis, 'IUIAASperms') },
                        { label: 'Progressive Motility (%)', value: val(analysis, 'IUIAAProgMotility') },
                        { label: 'Total Motility (%)', value: val(analysis, 'IUIAAMotility') },
                        { label: 'Total Motile Sperm Count (TMSC)', value: tmsc != null ? tmsc.toFixed(2) : '' },
                        { label: 'Recovery (%)', value: recovery != null ? `${recovery.toFixed(0)}%` : '' },
                      ]}
                    />
                    <CraftStatus ok={suitable} label={suitable ? 'SUITABLE FOR IUI' : 'REVIEW BEFORE IUI'} />
                  </CraftSection>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <CraftSection no={7} title="Post IUI Treatment" tone="navy">
                    <HtmlNote html={val(uterus, 'IUIOPostTreat')} />
                  </CraftSection>
                  <CraftSection no={8} title="Remarks" tone="sky">
                    <HtmlNote
                      html={
                        val(uterus, 'IUIOAdvice', 'IUIRemarks') ||
                        (val(analysis, 'MtdName') ? `Sample processed by ${val(analysis, 'MtdName')} method.` : '')
                      }
                    />
                  </CraftSection>
                </div>
              </>
            )}
          </div>

          <CraftFooter
            preparedBy={val(analysis, 'LabOptName')}
            consultant={val(uterus, 'RefDoctor')}
            date={fieldDate(uterus, 'IUIUODateOfCreation', 'IUIADate')}
          />
        </CraftPaper>
      )}
    </PatientRequired>
  );
}
