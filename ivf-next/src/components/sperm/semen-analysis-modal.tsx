'use client';

import React from 'react';
import type { CycAnalysisRecord } from '@/lib/services/semen-analysis';

interface SemenAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: CycAnalysisRecord | null;
  patientName?: string;
  partnerName?: string;
}

export function SemenAnalysisModal({
  isOpen,
  onClose,
  analysis,
  patientName = '',
  partnerName = '',
}: SemenAnalysisModalProps) {
  if (!isOpen || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm text-lg">
              🔬
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Semen Analysis Details (SMART Form)
                </h2>
                {analysis.cycleId && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                    Cycle: {analysis.cycleId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-700">{patientName || `Patient #${analysis.patientId}`}</span>
                {partnerName && <span> (H/O {partnerName})</span>}
                &nbsp;•&nbsp; Date: <span className="font-semibold text-slate-700">{analysis.date || '—'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          {/* Top Metadata Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Sperm ID</span>
              <span className="font-bold text-slate-800">{analysis.spermType || 'Husband'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Indication</span>
              <span className="font-bold text-purple-700">{analysis.indication || 'ICSI'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Method</span>
              <span className="font-bold text-slate-800">{analysis.method || 'No Culture'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Lab Operator</span>
              <span className="font-bold text-slate-800">{analysis.labOperator || '—'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Abstinence</span>
              <span className="font-bold text-slate-800">{analysis.abstinence} Days</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-400">Intended Use</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                ✓ {analysis.whereToUse || 'ICSI'}
              </span>
            </div>
          </div>

          {/* 3 Main Panels */}
          <div className="grid gap-5 md:grid-cols-3">
            {/* Panel 1: Physical / Basic Details */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                <span className="text-amber-700 font-bold">📋</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900">
                  Basic Details & Physical Exam
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Appearance</span>
                  <span className="font-semibold text-slate-800">{analysis.appearance}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Colour</span>
                  <span className="font-semibold text-slate-800">{analysis.colour}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Viscosity</span>
                  <span className="font-semibold text-slate-800">{analysis.viscosity}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Liquefaction</span>
                  <span className="font-semibold text-slate-800">{analysis.liquefaction}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Time of Liquefaction</span>
                  <span className="font-semibold text-slate-800">{analysis.timeOfLiq ? `${analysis.timeOfLiq} Min` : '—'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Agglutination</span>
                  <span className="font-semibold text-slate-800">{analysis.agglutination || 'nil'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Antibodies</span>
                  <span className="font-semibold text-slate-800">{analysis.antibodies || 'nil'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Fructose</span>
                  <span className="font-semibold text-slate-800">{analysis.fructose}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Linearity</span>
                  <span className="font-semibold text-slate-800">{analysis.linearity}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Velocity</span>
                  <span className="font-semibold text-slate-800">{analysis.velocity} r/Sec</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">pH</span>
                  <span className="font-semibold text-slate-800">{analysis.ph.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Normomorphs</span>
                  <span className="font-semibold text-slate-800">{analysis.normomorphs1} / {analysis.normomorphs2} %</span>
                </div>
              </div>
            </div>

            {/* Panel 2: Before Processing */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-blue-200 pb-2">
                <span className="text-blue-700 font-bold">🧪</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-blue-900">
                  Before Processing
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Volume</span>
                  <span className="font-bold text-blue-900">{analysis.beforeVol.toFixed(2)} ml</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Total Sperms (Conc)</span>
                  <span className="font-bold text-blue-900">{analysis.beforeSperms} M/ml</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Total Motility</span>
                  <span className="font-bold text-blue-900">{analysis.beforeMotility} %</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Progressive Motility</span>
                  <span className="font-bold text-blue-900">{analysis.beforeProgMotility} %</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Grade 1 (Rapid Prog)</span>
                  <span className="font-semibold text-slate-800">{analysis.beforeGrade1 || '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Grade 2 (Slow Prog)</span>
                  <span className="font-semibold text-slate-800">{analysis.beforeGrade2 || '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Grade 3 (Non-Prog)</span>
                  <span className="font-semibold text-slate-800">{analysis.beforeGrade3 || '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Grade 4 (Immotile)</span>
                  <span className="font-semibold text-slate-800">{analysis.beforeGrade4 || '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">WBC / RBC</span>
                  <span className="font-semibold text-slate-800">{analysis.beforeWbc} / {analysis.beforeRbc}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Epith / Round Cells</span>
                  <span className="font-semibold text-slate-800">{analysis.beforeEpith} / {analysis.beforeRound}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Trial Swim Up</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-300">
                    {analysis.trialSwimUp || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Panel 3: After Processing */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-emerald-200 pb-2">
                <span className="text-emerald-700 font-bold">✨</span>
                <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-900">
                  After Processing
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Volume</span>
                  <span className="font-bold text-emerald-900">{analysis.afterVol.toFixed(2)} ml</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Conc. Total Sperms</span>
                  <span className="font-bold text-emerald-900">{analysis.afterSperms} M/ml</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Total Motility</span>
                  <span className="font-bold text-emerald-900">{analysis.afterMotility} %</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Progressive Motility</span>
                  <span className="font-bold text-emerald-900">{analysis.afterProgMotility} %</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Linearity</span>
                  <span className="font-semibold text-slate-800">{analysis.afterLinearity || 'A'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Grade 1 (Rapid Prog)</span>
                  <span className="font-semibold text-slate-800">{analysis.afterGrade1 || '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Grade 2 (Slow Prog)</span>
                  <span className="font-semibold text-slate-800">{analysis.afterGrade2 || '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Grade 3 (Non-Prog)</span>
                  <span className="font-semibold text-slate-800">{analysis.afterGrade3 || '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">Grade 4 (Immotile)</span>
                  <span className="font-semibold text-slate-800">{analysis.afterGrade4 || '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-100 py-1">
                  <span className="text-slate-500">WBC / RBC</span>
                  <span className="font-semibold text-slate-800">{analysis.afterWbc} / {analysis.afterRbc}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Epith / Round Cells</span>
                  <span className="font-semibold text-slate-800">{analysis.afterEpith} / {analysis.afterRound}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <span className="text-[11px] text-slate-500">
            Recorded in SMART Database (Table: <code className="font-mono text-purple-700">CycAnalysis</code>, ID: #{analysis.analysisId})
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#6345A6] px-5 py-1.5 text-xs font-bold text-white hover:bg-[#553890] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
