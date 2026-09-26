'use client';

import { useEffect, useState } from 'react';
import { ModuleAlerts, PatientRequired, usePatientIds } from '@/components/clinical/clinical-shared';
import { dash, fieldDate, ReportSelect, TypePills, val } from '@/components/reports/clinical-report';
import {
  CraftDonut,
  CraftFooter,
  CraftGauge,
  CraftHeader,
  CraftPage,
  CraftPairs,
  CraftPaper,
  CraftRangeBar,
  CraftSection,
  CraftSignatures,
  CraftStatus,
  CraftTable,
  CraftWhoHead,
  CraftWhoRow,
  prettyDateTime,
  prettyTime,
  toNumber,
} from '@/components/reports/craft-report';
import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';
import { listIuiReportIds, loadIuiSummary, type IuiReportId, type IuiSummaryResult } from '@/lib/services/reports';
import type { ReportRow } from '@/lib/types/reports';

export interface IuiReportContext {
  patientName: string;
  uhid: string;
  partner: string;
  age: string;
}

type SemenKind = 'HSA' | 'SQA' | null;

function semenKind(indication: string): SemenKind {
  const text = indication.toUpperCase().replace(/\s+/g, '');
  if (text.includes('HSA')) return 'HSA';
  if (text.includes('SQA')) return 'SQA';
  return null;
}

function iuiTitle(indication: string): string {
  return indication.toUpperCase().includes('THAW')
    ? 'IUI Thaw – Sperm Preparation Report'
    : 'Intrauterine Insemination (IUI) Sperm Preparation Report';
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

function fixed(value: number | null, digits = 2): string {
  if (value == null) return '';
  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function withUnit(text: string, unit: string): string {
  return text.trim() ? `${text} ${unit}` : '';
}

function morphologyText(row: ReportRow | undefined): string {
  const a = val(row, 'IUIANMPH1');
  const b = val(row, 'IUIANMPH2');
  if (!a && !b) return '';
  return b && b !== a ? `${a || 0} - ${b}` : a;
}

function ReportNote({ html, fallback }: { html: string; fallback?: string }) {
  const clean = (html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').trim();
  if (!clean) return <p className="text-[9.5px] text-slate-500">{fallback || '—'}</p>;
  return (
    <div
      className="text-[9.5px] leading-[13px] text-slate-800 [&_p]:my-0"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}

/** WHO 2021 lower reference limits used for the impression. */
function semenImpression(values: {
  volume: number | null;
  conc: number | null;
  totalNumber: number | null;
  pr: number | null;
  totalMotility: number | null;
  morph: number | null;
}): { label: string; ok: boolean; detail: string } {
  if (values.conc === 0) {
    return { label: 'Azoospermia', ok: false, detail: 'No spermatozoa seen in the ejaculate.' };
  }
  const below: string[] = [];
  if (values.volume != null && values.volume < 1.4) below.push('Volume');
  if (values.conc != null && values.conc < 16) below.push('Concentration');
  if (values.totalNumber != null && values.totalNumber < 39) below.push('Total Sperm Number');
  if (values.pr != null && values.pr < 30) below.push('Progressive Motility');
  if (values.totalMotility != null && values.totalMotility < 42) below.push('Total Motility');
  if (values.morph != null && values.morph < 4) below.push('Normal Forms');

  const prefixes: string[] = [];
  if ((values.conc != null && values.conc < 16) || (values.totalNumber != null && values.totalNumber < 39)) prefixes.push('oligo');
  if (values.pr != null && values.pr < 30) prefixes.push('astheno');
  if (values.morph != null && values.morph < 4) prefixes.push('terato');
  const label = prefixes.length
    ? `${prefixes.join('').replace(/^./, (c) => c.toUpperCase())}zoospermia`
    : 'Normozoospermia';
  const detail = below.length
    ? `Parameters below WHO 2021 reference: ${below.join(', ')}.`
    : 'All parameters are within normal limits as per WHO 2021 criteria.';
  return { label, ok: prefixes.length === 0, detail };
}

function HsaPage({ summary, analysis, uterus, ctx }: { summary: IuiSummaryResult; analysis?: ReportRow; uterus?: ReportRow; ctx: IuiReportContext }) {
  const kind = semenKind(summary.indication) || 'HSA';
  const volume = n(analysis, 'IUIABVol');
  const conc = n(analysis, 'IUIABSperms');
  const totalMot = n(analysis, 'IUIABMotility');
  const pr = n(analysis, 'IUIABProgMotility');
  const g1 = n(analysis, 'IUIABGrade1');
  const g2 = n(analysis, 'IUIABGrade2');
  const g3 = n(analysis, 'IUIABGrade3');
  const g4 = n(analysis, 'IUIABGrade4');
  const morph = n(analysis, 'IUIANMPH1');
  const totalNumber = volume != null && conc != null ? volume * conc : null;
  const impression = semenImpression({ volume, conc, totalNumber, pr, totalMotility: totalMot, morph });
  const source = val(analysis, 'SpermName') || 'Husband';
  const donor = source.toLowerCase().includes('donor');
  const analysisDate = val(analysis, 'iuivdate', 'IUIVDate') || val(analysis, 'IUIADate');

  return (
    <CraftPage>
      <CraftHeader
        title={kind === 'HSA' ? 'Husband Semen Analysis Report' : 'Semen Quality Analysis (SQA) Report'}
        subtitle="(Analysis Performed as per WHO 2021 Criteria)"
        reportNo={`SA/${summary.iuiId}`}
        reportedOn={prettyDateTime(new Date())}
      />

      <div className="mt-1.5 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <CraftSection no={1} title="Patient Information" tone="navy">
            <CraftPairs
              columns={1}
              labelWidth={100}
              items={[
                { label: 'Patient Name', value: val(uterus, 'PatFullName', 'PatName') || ctx.patientName },
                { label: 'Partner Name', value: val(uterus, 'PatHusbName') || ctx.partner },
                { label: 'UHID / Patient ID', value: ctx.uhid },
                { label: 'Age', value: ctx.age || val(uterus, 'PatAge') ? `${ctx.age || val(uterus, 'PatAge')} Years` : '' },
                { label: 'Referring Doctor', value: val(uterus, 'RefDoctor') },
                { label: 'Indication', value: kind },
                { label: 'Abstinence', value: withUnit(val(analysis, 'IUIAAbstinence'), 'Days') },
              ]}
            />
          </CraftSection>
          <CraftSection no={2} title="Sample Information" tone="blue">
            <CraftPairs
              columns={1}
              labelWidth={100}
              items={[
                { label: 'Sample Type', value: donor ? 'Donor Sample' : 'Self Sample' },
                { label: 'Collection Date', value: fieldDate(analysis, 'IUIADate') },
                { label: 'Collection Time', value: prettyTime(val(analysis, 'IUIADate')) },
                { label: 'Collection Problem', value: val(analysis, 'CollProbName') || 'No' },
                { label: 'Contamination', value: val(analysis, 'IUIAContaminationName') || 'No' },
                { label: 'Lab Operator', value: val(analysis, 'LabOptName') },
                { label: 'Method', value: val(analysis, 'MtdName') || 'WHO 2021' },
                { label: 'Analysis Date / Time', value: analysisDate ? `${fieldDate(analysis, 'iuivdate', 'IUIVDate', 'IUIADate')} ${prettyTime(analysisDate)}` : '' },
              ]}
            />
          </CraftSection>
        </div>

        <CraftSection no={3} title="Sample Source" tone="orange">
          <div className="grid grid-cols-[1fr_1fr_1.6fr] items-center gap-1.5">
            <div className={`rounded border px-2 py-[2px] text-[9px] font-bold ${donor ? 'border-slate-200 text-slate-400' : 'border-emerald-400 bg-emerald-50 text-emerald-800'}`}>
              {donor ? '○' : '●'} Self Sample <span className="font-normal">(Patient)</span>
            </div>
            <div className={`rounded border px-2 py-[2px] text-[9px] font-bold ${donor ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-200 text-slate-400'}`}>
              {donor ? '●' : '○'} Donor Sample <span className="font-normal">(From ART Bank)</span>
            </div>
            {donor ? (
              <CraftPairs
                columns={1}
                labelWidth={105}
                items={[
                  { label: 'Donor Sample / Straw', value: val(analysis, 'IUIAFreezingId') },
                  { label: 'Date Thawed / Used', value: fieldDate(analysis, 'IUIThawDate', 'IUIADate') },
                ]}
              />
            ) : (
              <p className="text-[8.5px] text-slate-500">Sample collected from the patient&apos;s partner at the laboratory.</p>
            )}
          </div>
        </CraftSection>

        <div className="grid grid-cols-3 gap-1.5">
          <CraftSection no={4} title="Sample Characteristics" tone="teal">
            <table className="w-full">
              <CraftWhoHead />
              <tbody>
                <CraftWhoRow parameter="Appearance" result={val(analysis, 'AppName')} reference="–" ok={null} />
                <CraftWhoRow parameter="Colour" result={val(analysis, 'ColName')} reference="–" ok={null} />
                <CraftWhoRow parameter="Volume" result={withUnit(val(analysis, 'IUIABVol'), 'ml')} reference="≥ 1.4 ml" ok={whoOk(volume, 1.4)} />
                <CraftWhoRow parameter="Viscosity" result={val(analysis, 'ViscoName')} reference="Normal" ok={null} />
                <CraftWhoRow parameter="Liquefaction" result={val(analysis, 'LiqName')} reference="Normal" ok={null} />
                <CraftWhoRow parameter="Liq. Time" result={withUnit(val(analysis, 'IUIATimeOfLiq'), 'Min')} reference="≤ 60 Min" ok={whoOk(n(analysis, 'IUIATimeOfLiq'), undefined, 60)} />
                <CraftWhoRow parameter="pH" result={val(analysis, 'IUIApH')} reference="≥ 7.2" ok={whoOk(n(analysis, 'IUIApH'), 7.2)} />
                <CraftWhoRow parameter="Fructose" result={val(analysis, 'FrucName')} reference="–" ok={null} />
                <CraftWhoRow parameter="Agglutination" result={val(analysis, 'IUIAAgglut')} reference="–" ok={null} />
                <CraftWhoRow parameter="Antibodies" result={val(analysis, 'IUIAAntibodies')} reference="–" ok={null} />
              </tbody>
            </table>
          </CraftSection>

          <CraftSection no={5} title="Sperm Concentration & Motility" tone="green">
            <table className="w-full">
              <CraftWhoHead />
              <tbody>
                <CraftWhoRow parameter="Concentration" result={withUnit(val(analysis, 'IUIABSperms'), 'M/ml')} reference="≥ 16 M/ml" ok={whoOk(conc, 16)} />
                <CraftWhoRow parameter="Total Sperm No." result={withUnit(fixed(totalNumber, 1), 'M')} reference="≥ 39 M" ok={whoOk(totalNumber, 39)} />
              </tbody>
            </table>
            <CraftRangeBar value={totalNumber} low={15} normal={39} max={80} unit="M" />
            <div className="mt-1 border-t border-slate-100 pt-1 text-[9px] font-bold text-[#1F8A4C]">
              MOTILITY <span className="font-normal text-slate-500">(Total Motility: {dash(fixed(totalMot))}%)</span>
            </div>
            <CraftDonut
              center={`${fixed(totalMot) || '–'}%`}
              caption="Motility"
              segments={[
                { label: 'Rapid Prog. (Gr I)', value: g1 ?? 0, color: '#16a34a' },
                { label: 'Slow Prog. (Gr II)', value: g2 ?? 0, color: '#facc15' },
                { label: 'Non Prog. (Gr III)', value: g3 ?? 0, color: '#3b82f6' },
                { label: 'Immotile (Gr IV)', value: g4 ?? 0, color: '#ef4444' },
              ]}
            />
            <div className="mt-0.5 text-[8.5px] font-semibold text-slate-600">
              Progressive (PR): {dash(fixed(pr))}% &nbsp;|&nbsp; Non Progressive: {dash(fixed(g3))}%
            </div>
          </CraftSection>

          <CraftSection no={6} title="Morphology" tone="purple" aside={<span className="text-[8px] font-semibold normal-case">(Strict Kruger)</span>}>
            <table className="w-full">
              <CraftWhoHead />
              <tbody>
                <CraftWhoRow parameter="Normal Forms" result={withUnit(morphologyText(analysis), '%')} reference="≥ 4 %" ok={whoOk(morph, 4)} />
              </tbody>
            </table>
            <div className="mt-2">
              <CraftGauge percent={morph} label="Normal Forms" />
            </div>
          </CraftSection>
        </div>

        <div className="grid grid-cols-[1.25fr_1fr] gap-1.5">
          <CraftSection no={7} title="Microscopy" tone="navy">
            <table className="w-full">
              <CraftWhoHead />
              <tbody>
                <CraftWhoRow parameter="WBC" result={withUnit(val(analysis, 'IUIABWBC'), '/ HPF')} reference="< 1 M/ml" ok={null} />
                <CraftWhoRow parameter="RBC" result={withUnit(val(analysis, 'IUIABRBC'), '/ HPF')} reference="–" ok={null} />
                <CraftWhoRow parameter="Epithelial Cells" result={withUnit(val(analysis, 'IUIABECell'), '/ HPF')} reference="–" ok={null} />
                <CraftWhoRow parameter="Round Cells" result={withUnit(val(analysis, 'IUIABRCell'), '/ HPF')} reference="–" ok={null} />
                <CraftWhoRow parameter="Linearity" result={val(analysis, 'LinName')} reference="–" ok={null} />
                <CraftWhoRow parameter="Velocity" result={withUnit(val(analysis, 'IUIAVelocity'), 'µm/s')} reference="–" ok={null} />
              </tbody>
            </table>
          </CraftSection>
          <CraftSection no={8} title="WHO 2021 Reference Values" tone="blue">
            <div className="space-y-[1px] text-[9px] leading-[12.5px]">
              {[
                ['Volume', '≥ 1.4 ml'],
                ['Total Sperm Concentration', '≥ 16 M/ml'],
                ['Total Sperm Number', '≥ 39 M/ejaculate'],
                ['Progressive Motility (PR)', '≥ 30 %'],
                ['Total Motility (PR + NP)', '≥ 42 %'],
                ['Vitality', '≥ 54 %'],
                ['Morphology (Normal Forms)', '≥ 4 %'],
                ['WBC', '< 1 M/ml'],
              ].map(([label, ref]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-bold text-slate-900">{ref}</span>
                </div>
              ))}
              <p className="pt-0.5 text-[7.5px] text-[#1A56A8]">
                Reference: WHO Laboratory Manual for the Examination and Processing of Human Semen, 6th Edition, 2021
              </p>
            </div>
          </CraftSection>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <div className={`rounded-md border px-2.5 py-1 ${impression.ok ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
            <div className="text-[8px] font-bold uppercase text-slate-500">Impression</div>
            <div className={`text-[13px] font-black leading-tight ${impression.ok ? 'text-[#1F8A4C]' : 'text-amber-700'}`}>{impression.label}</div>
            <p className="text-[8.5px] leading-[11px] text-slate-700">{impression.detail}</p>
          </div>
          <CraftSection no={9} title="Doctor Remarks" tone="navy">
            <ReportNote html={val(uterus, 'IUIOAdvice', 'Remarks')} fallback="Semen parameters are reported as per WHO 2021 criteria." />
          </CraftSection>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-[3fr_1.3fr] gap-1.5 pt-1.5">
        <CraftSignatures
          boxes={[
            { title: 'Lab Operator', name: val(analysis, 'LabOptName') },
            { title: 'Reviewed By', name: '' },
            { title: 'Approved By', name: val(uterus, 'RefDoctor') },
          ]}
        />
        <div className="rounded border border-slate-200 px-2 py-1 text-[8px] leading-[11px] text-slate-600">
          <div className="font-bold text-[#123E73]">This is a system generated report.</div>
          <div>• Results relate only to the sample provided.</div>
          <div>• Not for medico-legal purpose.</div>
          <div>• Please correlate clinically.</div>
        </div>
      </div>
    </CraftPage>
  );
}

function IuiPage({
  summary,
  analysis,
  uterus,
  follicular,
  ctx,
  pageNo,
  pageCount,
}: {
  summary: IuiSummaryResult;
  analysis?: ReportRow;
  uterus?: ReportRow;
  follicular: ReportRow[];
  ctx: IuiReportContext;
  pageNo: number;
  pageCount: number;
}) {
  const beforeVol = n(analysis, 'IUIABVol');
  const beforeConc = n(analysis, 'IUIABSperms');
  const beforeMot = n(analysis, 'IUIABMotility');
  const afterVol = n(analysis, 'IUIAAVol');
  const afterConc = n(analysis, 'IUIAASperms');
  const afterMot = n(analysis, 'IUIAAMotility');
  const beforeCount = beforeVol != null && beforeConc != null ? beforeVol * beforeConc : null;
  const afterCount = afterVol != null && afterConc != null ? afterVol * afterConc : null;
  const tmsc = afterCount != null && afterMot != null ? afterCount * (afterMot / 100) : null;
  const beforeTmsc = beforeCount != null && beforeMot != null ? beforeCount * (beforeMot / 100) : null;
  const recovery = tmsc != null && beforeTmsc && beforeTmsc > 0 ? (tmsc / beforeTmsc) * 100 : null;
  const suitable = tmsc != null && tmsc >= 1;
  const iuiDate = fieldDate(analysis, 'IUIADate') || fieldDate(uterus, 'IUIUODateOfCreation');
  const morph = morphologyText(analysis);

  return (
    <CraftPage pageNo={pageNo} pageCount={pageCount}>
      <CraftHeader
        title={iuiTitle(summary.indication)}
        subtitle={pageCount > 1 ? `${summary.iuiKind} · Insemination ${pageNo} of ${pageCount}` : undefined}
        reportNo={`IUI/${summary.iuiId}${pageCount > 1 ? `/${pageNo}` : ''}`}
        reportedOn={prettyDateTime(new Date())}
      />

      <div className="mt-1.5 space-y-1.5">
        <CraftSection no={1} title="Patient & Cycle Details" tone="navy">
          <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-3">
            <CraftPairs
              columns={1}
              labelWidth={74}
              items={[
                { label: 'Patient Name', value: val(uterus, 'PatFullName', 'PatName') || ctx.patientName },
                { label: 'UHID', value: ctx.uhid },
                { label: 'Partner Name', value: val(uterus, 'PatHusbName') || ctx.partner },
                { label: 'Consultant', value: val(uterus, 'RefDoctor') },
              ]}
            />
            <CraftPairs
              columns={1}
              labelWidth={62}
              items={[
                { label: 'Cycle No.', value: summary.iuiId },
                { label: 'Date', value: iuiDate },
                { label: 'LMP', value: fieldDate(uterus, 'IUISLMP') },
                { label: 'Indication', value: summary.indication || summary.iuiKind },
              ]}
            />
            <CraftPairs
              columns={1}
              labelWidth={74}
              items={[
                { label: 'Sample Source', value: val(analysis, 'SpermName') },
                { label: 'Method Used', value: val(analysis, 'MtdName') },
                { label: 'Abstinence', value: withUnit(val(analysis, 'IUIAAbstinence'), 'Days') },
              ]}
            />
          </div>
        </CraftSection>

        <CraftSection no={2} title="Follicular Monitoring with Stimulation" tone="navy">
          <CraftTable
            headerClass="bg-slate-100 text-slate-700"
            headers={['Date', 'Day', 'Left Ovary Follicle (mm)', 'Right Ovary Follicle (mm)', 'Endometrium (mm)', 'Cervical Mucus', 'Remarks', 'Sign']}
            rows={follicular.map((row) => [
              fieldDate(row, 'IUIFSDate'),
              val(row, 'IUIFSDay'),
              val(row, 'IUIFSLtOveryFollicle', 'IUIFSLtRd'),
              val(row, 'IUIFSRtOveryFollicle', 'IUIFSRtRd'),
              val(row, 'IUIFSEndoThickness'),
              val(row, 'IUIFSCXMucus'),
              val(row, 'IUIFSRemark'),
              '',
            ])}
          />
        </CraftSection>

        <div className="grid grid-cols-[1fr_1.55fr] gap-1.5">
          <div className="space-y-1.5">
          <CraftSection no={3} title="Semen Sample Details" tone="teal">
            <CraftPairs
              columns={1}
              labelWidth={92}
              items={[
                { label: 'Collection Time', value: prettyTime(val(analysis, 'IUIADate')) },
                { label: 'Received Time', value: prettyTime(val(analysis, 'iuivdate', 'IUIVDate')) },
                { label: 'Appearance', value: val(analysis, 'AppName') },
                { label: 'Colour', value: val(analysis, 'ColName') },
                { label: 'Liquefaction', value: val(analysis, 'LiqName') },
                { label: 'Liquefaction Time', value: withUnit(val(analysis, 'IUIATimeOfLiq'), 'Min.') },
                { label: 'Viscosity', value: val(analysis, 'ViscoName') },
                { label: 'pH', value: val(analysis, 'IUIApH') },
                { label: 'Fructose', value: val(analysis, 'FrucName') },
                { label: 'Agglutination', value: val(analysis, 'IUIAAgglut') },
                { label: 'Antibodies', value: val(analysis, 'IUIAAntibodies') },
                { label: 'Contamination', value: val(analysis, 'IUIAContaminationName') },
              ]}
            />
          </CraftSection>
          <CraftSection no={5} title="Sperm Preparation Details" tone="orange">
            <CraftPairs
              columns={1}
              labelWidth={92}
              items={[
                { label: 'Preparation Method', value: val(analysis, 'MtdName') },
                { label: 'Trial Swim Up', value: val(analysis, 'IUIABRecovery') },
                { label: 'Collection Problem', value: val(analysis, 'CollProbName') },
                { label: 'Operator', value: val(analysis, 'LabOptName') },
              ]}
            />
          </CraftSection>
          </div>
          <CraftSection no={4} title="Semen Analysis" tone="blue">
            <CraftTable
              headerClass="bg-[#1A56A8] text-white"
              headers={['Parameter', 'Before Processing', 'After Processing']}
              rows={[
                ['Volume (ml)', val(analysis, 'IUIABVol'), val(analysis, 'IUIAAVol')],
                ['Concentration (Million/ml)', val(analysis, 'IUIABSperms'), val(analysis, 'IUIAASperms')],
                ['Total Count (Million)', fixed(beforeCount), fixed(afterCount)],
                ['Total Motility (%)', val(analysis, 'IUIABMotility'), val(analysis, 'IUIAAMotility')],
                ['Progressive Motility (%)', val(analysis, 'IUIABProgMotility'), val(analysis, 'IUIAAProgMotility')],
                ['Grade A (Rapid Progressive %)', val(analysis, 'IUIABGrade1'), ''],
                ['Grade B (Slow Progressive %)', val(analysis, 'IUIABGrade2'), ''],
                ['Grade C (Non Progressive %)', val(analysis, 'IUIABGrade3'), ''],
                ['Grade D (Immotile %)', val(analysis, 'IUIABGrade4'), ''],
                ['Morphology (Normal Forms %)', morph, ''],
                ['Velocity (µm/sec)', val(analysis, 'IUIAVelocity'), ''],
                ['Linearity', val(analysis, 'LinName'), val(analysis, 'LinAName')],
                ['WBC (per HPF)', val(analysis, 'IUIABWBC'), ''],
                ['RBC (per HPF)', val(analysis, 'IUIABRBC'), ''],
                ['Epithelial Cells (per HPF)', val(analysis, 'IUIABECell'), ''],
                ['Round Cells (per HPF)', val(analysis, 'IUIABRCell'), ''],
              ]}
            />
          </CraftSection>
        </div>

        <div className="grid grid-cols-[1.25fr_1fr_1fr] gap-1.5">
          <CraftSection no={6} title="Final Sample for IUI" tone="green">
            <CraftPairs
              columns={1}
              labelWidth={150}
              items={[
                { label: 'Final Volume (ml)', value: val(analysis, 'IUIAAVol') },
                { label: 'Final Concentration (Million/ml)', value: val(analysis, 'IUIAASperms') },
                { label: 'Progressive Motility (%)', value: val(analysis, 'IUIAAProgMotility') },
                { label: 'Total Motility (%)', value: val(analysis, 'IUIAAMotility') },
              ]}
            />
            <div className="mt-0.5 flex items-center justify-between gap-2 rounded bg-emerald-50 px-1.5 py-[1px] text-[9.5px] font-black text-[#1F8A4C]">
              <span>TMSC (Million)</span>
              <span className="text-[12px]">{dash(fixed(tmsc))}</span>
              <span className="text-[9px] font-bold text-slate-600">Recovery : {recovery != null ? `${recovery.toFixed(0)}%` : '—'}</span>
            </div>
            <CraftStatus ok={suitable} prefix="Final Sample Status" label={suitable ? 'SUITABLE FOR IUI' : 'REVIEW BEFORE IUI'} />
          </CraftSection>
          <CraftSection no={7} title="Post IUI Treatment" tone="navy">
            <ReportNote html={val(uterus, 'IUIOPostTreat')} />
          </CraftSection>
          <CraftSection no={8} title="Remarks" tone="purple">
            <ReportNote
              html={val(uterus, 'IUIOAdvice', 'Remarks')}
              fallback={val(analysis, 'MtdName') ? `Sample processed by ${val(analysis, 'MtdName')} method.` : ''}
            />
          </CraftSection>
        </div>
      </div>

      <CraftFooter
        preparedBy={val(analysis, 'LabOptName')}
        consultant={val(uterus, 'RefDoctor')}
        date={iuiDate}
      />
    </CraftPage>
  );
}

export function IuiReportDocument({ summary, ctx }: { summary: IuiSummaryResult; ctx: IuiReportContext }) {
  const uterus = summary.sections.find((s) => s.name === 'Patient / Uterus & Ovaries')?.rows[0];
  const follicular = summary.sections.find((s) => s.name === 'Follicular Study')?.rows || [];
  const seen = new Set<string>();
  const analyses = (summary.sections.find((s) => s.name === 'IUI Analysis')?.rows || []).filter((row) => {
    const key = val(row, 'IUIAID');
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (semenKind(summary.indication)) {
    return (
      <CraftPaper>
        <HsaPage summary={summary} analysis={analyses[0]} uterus={uterus} ctx={ctx} />
      </CraftPaper>
    );
  }

  const pages = summary.iuiKind === 'Double IUI' ? analyses.slice(0, 2) : analyses.slice(0, 1);
  const list = pages.length ? pages : [undefined];
  return (
    <CraftPaper>
      {list.map((analysis, index) => (
        <IuiPage
          key={index}
          summary={summary}
          analysis={analysis}
          uterus={uterus}
          follicular={follicular}
          ctx={ctx}
          pageNo={index + 1}
          pageCount={list.length}
        />
      ))}
    </CraftPaper>
  );
}

export function IuiSummaryReport() {
  const { token } = useAuth();
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

  const ctx: IuiReportContext = {
    patientName,
    uhid: selectedPatient?.uhid || String(patId),
    partner: selectedPatient?.partner || '',
    age: selectedPatient?.age ? String(selectedPatient.age) : '',
  };

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
        {summary && !semenKind(summary.indication) && (
          <TypePills options={['Single IUI', 'Double IUI']} selectedIndex={summary.iuiKind === 'Double IUI' ? 1 : 0} />
        )}
        <span className="text-[11px] text-slate-500">A4 · prints on letterhead (3 in top, 1 in bottom kept blank)</span>
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
      {summary && !loadingSummary && <IuiReportDocument summary={summary} ctx={ctx} />}
    </PatientRequired>
  );
}
