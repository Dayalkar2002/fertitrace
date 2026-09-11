'use client';

import React, { useState } from 'react';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';

export interface SemenSelfRecord {
  srNo: number;
  id: string;
  frozenDate: string;
  validTill: string;
  location: string;
  straws: number;
  volume: string;
  count: string;
  motility: string;
  progMotility: string;
  husbandAadhar: string;
  status: 'Stored' | 'Thawed' | 'Discarded';
}

export function SemenSelfForm({ onBack }: { onBack?: () => void }) {
  const { selectedPatient } = usePatient();
  const { user } = useAuth();

  const patientName = selectedPatient?.name || 'Mrs. Anjali Sharma';
  const partnerName = selectedPatient?.partner || 'Mr. Rohit Sharma';
  const uhid = selectedPatient?.uhid || 'P-2026-00125';
  const operatorName = user?.userName || 'Dr. Satish (EMB-01)';

  // Pre-Freezing Details state (Matching Image 2: SemenSelf.aspx)
  const [vol, setVol] = useState('2.5');
  const [totalSperm, setTotalSperm] = useState('65');
  const [totalMotility, setTotalMotility] = useState('60');
  const [progMotility, setProgMotility] = useState('45');
  const [grade1, setGrade1] = useState('30');
  const [grade2, setGrade2] = useState('15');
  const [grade3, setGrade3] = useState('10');
  const [grade4, setGrade4] = useState('5');
  const [wbc, setWbc] = useState('0-1');
  const [rbc, setRbc] = useState('0');
  const [epithCell, setEpithCell] = useState('0-1');
  const [roundCell, setRoundCell] = useState('0');
  const [recovery, setRecovery] = useState('75');
  const [isHam, setIsHam] = useState(false);
  const [thawCount, setThawCount] = useState('0');
  const [frozenDate, setFrozenDate] = useState('2026-09-11');
  const [validTill, setValidTill] = useState('2027-09-11');
  const [location, setLocation] = useState('Tank 1 > Canister 2 > Goblet B > S01-S06');

  // Qualitative parameters
  const [appearance, setAppearance] = useState('Normal');
  const [colour, setColour] = useState('Normal');
  const [viscosity, setViscosity] = useState('Normal');
  const [normomorphs1, setNormomorphs1] = useState('5');
  const [normomorphs2, setNormomorphs2] = useState('0');
  const [liquefaction, setLiquefaction] = useState('Normal');
  const [timeOfLiq, setTimeOfLiq] = useState('25');
  const [agglutination, setAgglutination] = useState('Nil');
  const [antibodies, setAntibodies] = useState('Negative');
  const [fructose, setFructose] = useState('+Ve');
  const [linearity, setLinearity] = useState('A');
  const [velocity, setVelocity] = useState('25');
  const [ph, setPh] = useState('7.6');
  const [collProblem, setCollProblem] = useState('No');
  const [contamination, setContamination] = useState('No');
  const [abstinence, setAbstinence] = useState('3');
  const [labOperator, setLabOperator] = useState('Dr. Satish (EMB-01)');
  const [method, setMethod] = useState('Masturbation (No Culture)');
  const [impression, setImpression] = useState('Normozoospermia - Suitable for slow freezing protocol');
  const [husbandAadhar, setHusbandAadhar] = useState('8834 9122 0451');

  // Straw allocation
  const [strawCount, setStrawCount] = useState('6');
  const [strawColor, setStrawColor] = useState('Yellow');

  // Mock list of frozen samples for this patient
  const [records, setRecords] = useState<SemenSelfRecord[]>([
    {
      srNo: 1,
      id: 'FROZ-26-000554',
      frozenDate: '11/Aug/2026',
      validTill: '11/Aug/2027',
      location: 'Tank 1 > Canister 2 > Goblet B',
      straws: 6,
      volume: '2.5 ml',
      count: '65 M/ml',
      motility: '60%',
      progMotility: '45%',
      husbandAadhar: '8834 9122 0451',
      status: 'Stored',
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newRec: SemenSelfRecord = {
      srNo: records.length + 1,
      id: `FROZ-26-000${Math.floor(100 + Math.random() * 900)}`,
      frozenDate: new Date(frozenDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      validTill: new Date(validTill).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      location,
      straws: Number(strawCount) || 6,
      volume: `${vol} ml`,
      count: `${totalSperm} M/ml`,
      motility: `${totalMotility}%`,
      progMotility: `${progMotility}%`,
      husbandAadhar,
      status: 'Stored',
    };
    setRecords([newRec, ...records]);
    showToast('Pre-freezing details saved! Straws locked in Liquid Nitrogen inventory.');
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 text-xs">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-300 bg-white p-3.5 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
            ✓
          </span>
          <span className="text-xs font-bold text-slate-800">{toast}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              ← Back to Registration
            </button>
          )}
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span>❄️ Semen Cryopreservation (Self)</span>
              <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-bold">
                Husband / Partner
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Patient: <strong className="text-slate-700">{patientName}</strong> ({uhid}) • Partner:{' '}
              <strong className="text-slate-700">{partnerName}</strong> • Operator: {operatorName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">Husband Aadhar:</span>
          <input
            type="text"
            value={husbandAadhar}
            onChange={(e) => setHusbandAadhar(e.target.value)}
            className="h-7 w-36 rounded border border-slate-300 px-2 font-mono text-[11px] font-bold"
          />
        </div>
      </div>

      {/* MAIN FORM: PRE-FREEZING DETAILS (Image 2) */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
        <div className="bg-[#1f5f38] px-4 py-2 text-white flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Pre Freezing Details
          </h3>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium">
            WHO 5th/6th Criteria &amp; Cryo Banking
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Row 1: Volume, Count, Motility, Grades, Cytology, Thaw & Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 border-b border-slate-200 pb-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Volume (ml)</label>
              <input
                type="text"
                value={vol}
                onChange={(e) => setVol(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Total Sperm (M/ml)</label>
              <input
                type="text"
                value={totalSperm}
                onChange={(e) => setTotalSperm(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Total Motility (%)</label>
              <input
                type="text"
                value={totalMotility}
                onChange={(e) => setTotalMotility(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Prog Motility (%)</label>
              <input
                type="text"
                value={progMotility}
                onChange={(e) => setProgMotility(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Recovery (%)</label>
              <input
                type="text"
                value={recovery}
                onChange={(e) => setRecovery(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs font-bold"
              />
            </div>
            <div className="flex items-center gap-2 pt-3">
              <input
                type="checkbox"
                id="hamCheck"
                checked={isHam}
                onChange={(e) => setIsHam(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600"
              />
              <label htmlFor="hamCheck" className="text-[11px] font-bold text-slate-700 cursor-pointer">
                Ham's Medium
              </label>
            </div>
          </div>

          {/* Row 2: Grades & Cells */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 border-b border-slate-200 pb-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Grade 1 (Rapid)</label>
              <input
                type="text"
                value={grade1}
                onChange={(e) => setGrade1(e.target.value)}
                className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Grade 2 (Slow)</label>
              <input
                type="text"
                value={grade2}
                onChange={(e) => setGrade2(e.target.value)}
                className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Grade 3 (Non-Prog)</label>
              <input
                type="text"
                value={grade3}
                onChange={(e) => setGrade3(e.target.value)}
                className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Grade 4 (Immotile)</label>
              <input
                type="text"
                value={grade4}
                onChange={(e) => setGrade4(e.target.value)}
                className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">WBC (/HPF)</label>
              <input
                type="text"
                value={wbc}
                onChange={(e) => setWbc(e.target.value)}
                className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">RBC (/HPF)</label>
              <input
                type="text"
                value={rbc}
                onChange={(e) => setRbc(e.target.value)}
                className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Epith Cell</label>
              <input
                type="text"
                value={epithCell}
                onChange={(e) => setEpithCell(e.target.value)}
                className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Round Cell</label>
              <input
                type="text"
                value={roundCell}
                onChange={(e) => setRoundCell(e.target.value)}
                className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
              />
            </div>
          </div>

          {/* Row 3: Physical & Chemical Characteristics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 border-b border-slate-200 pb-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Appearance</label>
              <select
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option>Normal</option>
                <option>Shaggy</option>
                <option>Turbid</option>
                <option>Viscous</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Colour</label>
              <select
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option>Normal</option>
                <option>Pale Yellow</option>
                <option>Brownish</option>
                <option>Grey White</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Viscosity</label>
              <select
                value={viscosity}
                onChange={(e) => setViscosity(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option>Normal</option>
                <option>High</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Normomorphs (%)</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={normomorphs1}
                  onChange={(e) => setNormomorphs1(e.target.value)}
                  className="h-7 w-12 rounded border border-slate-300 px-1.5 text-xs text-center font-bold"
                />
                <span className="text-slate-400">/</span>
                <input
                  type="text"
                  value={normomorphs2}
                  onChange={(e) => setNormomorphs2(e.target.value)}
                  className="h-7 w-12 rounded border border-slate-300 px-1.5 text-xs text-center"
                />
                <span className="text-slate-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Liquefaction</label>
              <select
                value={liquefaction}
                onChange={(e) => setLiquefaction(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option>Normal</option>
                <option>Delayed</option>
                <option>Incomplete</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Time of Liquefaction</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={timeOfLiq}
                  onChange={(e) => setTimeOfLiq(e.target.value)}
                  className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
                />
                <span className="text-slate-500">Min</span>
              </div>
            </div>
          </div>

          {/* Row 4: Biochemical & Physical */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 border-b border-slate-200 pb-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Agglutination</label>
              <input
                type="text"
                value={agglutination}
                onChange={(e) => setAgglutination(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Antibodies</label>
              <input
                type="text"
                value={antibodies}
                onChange={(e) => setAntibodies(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Fructose</label>
              <select
                value={fructose}
                onChange={(e) => setFructose(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option>+Ve</option>
                <option>-Ve</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Linearity</label>
              <select
                value={linearity}
                onChange={(e) => setLinearity(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Velocity</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={velocity}
                  onChange={(e) => setVelocity(e.target.value)}
                  className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
                />
                <span className="text-slate-500 text-[10px]">r/Sec</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">pH</label>
              <input
                type="text"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              />
            </div>
          </div>

          {/* Row 5: Logistics & Cryo Storage Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Frozen Date</label>
              <input
                type="date"
                value={frozenDate}
                onChange={(e) => setFrozenDate(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Valid Till Date</label>
              <input
                type="date"
                value={validTill}
                onChange={(e) => setValidTill(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                Storage Location Coordinates
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-xs font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Straws Stored</label>
              <input
                type="number"
                value={strawCount}
                onChange={(e) => setStrawCount(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Lab Operator</label>
              <select
                value={labOperator}
                onChange={(e) => setLabOperator(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option>Dr. Satish (EMB-01)</option>
                <option>Dr. Amit Verma (EMB-02)</option>
                <option>Mrs. Treesa Fernandes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5">Impression / Clinical Notes</label>
            <input
              type="text"
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#1f5f38] hover:bg-emerald-800 px-6 py-2 text-xs font-bold text-white shadow-xs"
            >
              Submit &amp; Freeze Sample
            </button>
          </div>
        </div>
      </form>

      {/* BOTTOM GRID: FROZEN SAMPLES RECORD (Image 2 table) */}
      <div className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Patient Frozen Semen History
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">
            Total Frozen Records: {records.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Sample ID</th>
                <th className="px-3 py-2 text-left">Frozen Date</th>
                <th className="px-3 py-2 text-left">Valid Till</th>
                <th className="px-3 py-2 text-left">Straws</th>
                <th className="px-3 py-2 text-left">Storage Location</th>
                <th className="px-3 py-2 text-left">Motility (Prog)</th>
                <th className="px-3 py-2 text-left">Aadhar</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {records.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="px-3 py-2 text-slate-400">{r.srNo}</td>
                  <td className="px-3 py-2 font-mono font-bold text-blue-700">{r.id}</td>
                  <td className="px-3 py-2 text-slate-600">{r.frozenDate}</td>
                  <td className="px-3 py-2 text-slate-600">{r.validTill}</td>
                  <td className="px-3 py-2 font-bold text-slate-700">{r.straws}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{r.location}</td>
                  <td className="px-3 py-2 font-bold text-emerald-700">{r.progMotility}</td>
                  <td className="px-3 py-2 font-mono text-slate-500">{r.husbandAadhar}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center space-x-2">
                    <button
                      type="button"
                      onClick={() => showToast(`Printed cryo barcode label for ${r.id}`)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Print Label
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(`Selected ${r.id} for thawing verification`)}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Thaw
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
