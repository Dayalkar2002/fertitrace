'use client';

import React, { useEffect, useState } from 'react';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';
import { listCommonMaster } from '@/lib/services/masters';
import { deleteSemenSelf, listSemenSelf, type SemenSelfRecord } from '@/lib/services/semen-self';
import type { CommonMasterRow } from '@/lib/types/master';
import { SMART_MASTER_CATS } from '@/lib/sperm-analysis';

export function SemenSelfForm({ onBack, cryoType = 'Fresh' }: { onBack?: () => void; cryoType?: 'Fresh' | 'Frozen' }) {
  const { selectedPatient } = usePatient();
  const { user, token } = useAuth();
  const [masters, setMasters] = useState<Record<string, CommonMasterRow[]>>({});

  useEffect(() => {
    if (!token) return;
    void Promise.all(
      (Object.entries(SMART_MASTER_CATS) as [string, number][]).map(async ([key, catId]) => {
        try {
          return [key, await listCommonMaster(token, catId)] as const;
        } catch {
          return [key, []] as const;
        }
      })
    ).then((pairs) => setMasters(Object.fromEntries(pairs)));
  }, [token]);

  function masterOptions(key: keyof typeof SMART_MASTER_CATS) {
    return (masters[key] || []).map((row) => (
      <option key={row.id} value={row.name}>
        {row.name}
      </option>
    ));
  }

  function masterName(key: keyof typeof SMART_MASTER_CATS, id: number) {
    if (!id) return '';
    return (masters[key] || []).find((row) => row.id === id)?.name || '';
  }

  const patientName = selectedPatient?.name || 'Select a patient';
  const partnerName = selectedPatient?.partner || '—';
  const uhid = selectedPatient?.uhid || '—';
  const operatorName = user?.userName || 'Dr. Satish (EMB-01)';

  // Pre-Freezing Details state (Matching Image 2: SemenSelf.aspx)
  const [vol, setVol] = useState('');
  const [totalSperm, setTotalSperm] = useState('');
  const [totalMotility, setTotalMotility] = useState('');
  const [progMotility, setProgMotility] = useState('');
  const [grade1, setGrade1] = useState('');
  const [grade2, setGrade2] = useState('');
  const [grade3, setGrade3] = useState('');
  const [grade4, setGrade4] = useState('');
  const [wbc, setWbc] = useState('');
  const [rbc, setRbc] = useState('');
  const [epithCell, setEpithCell] = useState('');
  const [roundCell, setRoundCell] = useState('');
  const [recovery, setRecovery] = useState('');
  const [isHam, setIsHam] = useState(false);
  const [thawCount, setThawCount] = useState('');
  const [frozenDate, setFrozenDate] = useState('');
  const [validTill, setValidTill] = useState('');
  const [location, setLocation] = useState('');

  // Qualitative parameters
  const [appearance, setAppearance] = useState('');
  const [colour, setColour] = useState('');
  const [viscosity, setViscosity] = useState('');
  const [normomorphs1, setNormomorphs1] = useState('');
  const [normomorphs2, setNormomorphs2] = useState('');
  const [liquefaction, setLiquefaction] = useState('');
  const [timeOfLiq, setTimeOfLiq] = useState('');
  const [agglutination, setAgglutination] = useState('');
  const [antibodies, setAntibodies] = useState('');
  const [fructose, setFructose] = useState('');
  const [linearity, setLinearity] = useState('');
  const [velocity, setVelocity] = useState('');
  const [ph, setPh] = useState('');
  const [collProblem, setCollProblem] = useState('');
  const [contamination, setContamination] = useState('');
  const [abstinence, setAbstinence] = useState('');
  const [labOperator, setLabOperator] = useState('');
  const [method, setMethod] = useState('');
  const [impression, setImpression] = useState('');
  const [husbandAadhar, setHusbandAadhar] = useState('');

  // Straw allocation
  const [strawCount, setStrawCount] = useState('6');
  const [strawColor, setStrawColor] = useState('Yellow');

  const [records, setRecords] = useState<SemenSelfRecord[]>([]);
  const [selectedFreezingId, setSelectedFreezingId] = useState('');
  const [listLoading, setListLoading] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    if (!token || !selectedPatient?.id) {
      setRecords([]);
      return;
    }
    let cancelled = false;
    setListLoading(true);
    void listSemenSelf(token, selectedPatient.id, selectedPatient.satelliteId || 0)
      .then((rows) => {
        if (cancelled) return;
        setRecords(rows);
        if (rows[0]?.husbandAadhar) setHusbandAadhar(rows[0].husbandAadhar);
      })
      .catch((err) => {
        if (!cancelled) showToast(err instanceof Error ? err.message : 'Failed to load frozen semen records.');
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, selectedPatient?.id, selectedPatient?.satelliteId]);

  function applyRecord(r: SemenSelfRecord) {
    setSelectedFreezingId(r.freezingId);
    setVol(r.vol);
    setTotalSperm(r.sperms);
    setTotalMotility(r.motility);
    setProgMotility(r.progMotility);
    setGrade1(r.grade1);
    setGrade2(r.grade2);
    setGrade3(r.grade3);
    setGrade4(r.grade4);
    setWbc(r.wbc);
    setRbc(r.rbc);
    setEpithCell(r.epithCell);
    setRoundCell(r.roundCell);
    setRecovery(r.recovery);
    setIsHam(r.hams);
    setLocation(r.location);
    setThawCount(r.thawId);
    setFrozenDate(r.frozenDateInput);
    setValidTill(r.validTillInput);
    setHusbandAadhar(r.husbandAadhar);
    setAbstinence(r.abstinence);
    setLabOperator(masterName('labOperator', r.labOptId));
    setMethod(masterName('method', r.methodId));
    setCollProblem(masterName('collProblem', r.collProbId));
    setContamination(masterName('contamination', r.contaminationId));
    setAppearance(masterName('appearance', r.appearanceId));
    setColour(masterName('colour', r.colourId));
    setViscosity(masterName('viscosity', r.viscosityId));
    setNormomorphs1(r.nmph1);
    setNormomorphs2(r.nmph2);
    setLiquefaction(masterName('liquefaction', r.liqId));
    setTimeOfLiq(r.timeOfLiq);
    setAgglutination(r.agglutination);
    setAntibodies(r.antibodies);
    setFructose(masterName('fructose', r.fructoseId));
    setLinearity(masterName('linearity', r.linearityId));
    setVelocity(r.velocity);
    setPh(r.ph);
    setImpression(r.impression);
  }

  async function handleDeleteRecord(r: SemenSelfRecord) {
    if (!token || !selectedPatient?.id) return;
    try {
      const rows = await deleteSemenSelf(token, {
        patientId: selectedPatient.id,
        satId: selectedPatient.satelliteId || 0,
        cycSSID: r.cycSSID,
        freezingId: r.freezingId,
      });
      setRecords(rows);
      if (selectedFreezingId === r.freezingId) setSelectedFreezingId('');
      showToast('Record deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    showToast('Select a saved row below to view existing cryo details.');
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
                Husband / Partner • {cryoType}
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

      {cryoType === 'Frozen' && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-[11px] text-amber-900">
          <strong>Husband Frozen selected.</strong> Pre-freezing is locked from the semen bank. Choose a straw below, then enter post-thaw on continue.
        </div>
      )}

      {/* MAIN FORM: PRE-FREEZING DETAILS (Image 2) */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
        <div className={`${cryoType === 'Frozen' ? 'bg-slate-600' : 'bg-[#1f5f38]'} px-4 py-2 text-white flex items-center justify-between`}>
          <h3 className="text-xs font-bold uppercase tracking-wider">
            {cryoType === 'Frozen' ? 'Pre Freezing Details (Read-only snapshot)' : 'Pre Freezing Details'}
          </h3>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium">
            WHO 5th/6th Criteria &amp; Cryo Banking
          </span>
        </div>

        <div className={`p-4 space-y-4 ${cryoType === 'Frozen' ? 'pointer-events-none opacity-70' : ''}`}>
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
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Trial Swim Up</label>
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
                <option value="">Select</option>
                {masterOptions('appearance')}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Colour</label>
              <select
                value={colour}
                onChange={(e) => setColour(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option value="">Select</option>
                {masterOptions('colour')}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Viscosity</label>
              <select
                value={viscosity}
                onChange={(e) => setViscosity(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option value="">Select</option>
                {masterOptions('viscosity')}
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
                <option value="">Select</option>
                {masterOptions('liquefaction')}
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
                <option value="">Select</option>
                {masterOptions('fructose')}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Linearity</label>
              <select
                value={linearity}
                onChange={(e) => setLinearity(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option value="">Select</option>
                {masterOptions('linearity')}
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
              <label className="block text-[10px] text-slate-500 mb-0.5">Lab Operator :</label>
              <select
                value={labOperator}
                onChange={(e) => setLabOperator(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option value="">Select</option>
                {masterOptions('labOperator')}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Coll.Problem :</label>
              <select
                value={collProblem}
                onChange={(e) => setCollProblem(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option value="">Select</option>
                {masterOptions('collProblem')}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Contamination :</label>
              <select
                value={contamination}
                onChange={(e) => setContamination(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option value="">Select</option>
                {masterOptions('contamination')}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Abstinence :</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={abstinence}
                  onChange={(e) => setAbstinence(e.target.value)}
                  className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
                />
                <span className="text-slate-500 text-[10px]">Days</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Method :</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              >
                <option value="">Select</option>
                {masterOptions('method')}
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

      <div className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Patient Frozen Semen History
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">
            {!selectedPatient?.id
              ? 'Select a patient'
              : listLoading
                ? 'Loading…'
                : `${records.length} record${records.length === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold whitespace-nowrap">
              <tr>
                <th className="px-2 py-2 text-center">Select</th>
                <th className="px-2 py-2 text-left">Freezing ID</th>
                <th className="px-2 py-2 text-left">ID</th>
                <th className="px-2 py-2 text-left">Vol</th>
                <th className="px-2 py-2 text-left">Sperms</th>
                <th className="px-2 py-2 text-left">Motility</th>
                <th className="px-2 py-2 text-left">Prog. Motility</th>
                <th className="px-2 py-2 text-left">G1</th>
                <th className="px-2 py-2 text-left">G2</th>
                <th className="px-2 py-2 text-left">G3</th>
                <th className="px-2 py-2 text-left">G4</th>
                <th className="px-2 py-2 text-left">WBC</th>
                <th className="px-2 py-2 text-left">RBC</th>
                <th className="px-2 py-2 text-left">Epith Cell</th>
                <th className="px-2 py-2 text-left">Round Cell</th>
                <th className="px-2 py-2 text-left">Location</th>
                <th className="px-2 py-2 text-left">Frozen Date</th>
                <th className="px-2 py-2 text-left">Thaw Date</th>
                <th className="px-2 py-2 text-left">Thaw ID</th>
                <th className="px-2 py-2 text-left">Discard Date</th>
                <th className="px-2 py-2 text-left">Valid Till Date</th>
                <th className="px-2 py-2 text-left">Aadhar No.</th>
                <th className="px-2 py-2 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {records.length === 0 && !listLoading && (
                <tr>
                  <td colSpan={23} className="px-3 py-4 text-center text-amber-800">
                    {selectedPatient?.id ? 'No Records Found...' : 'Select a patient to view saved semen cryo records.'}
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr
                  key={`${r.freezingId}-${r.cycSSID}`}
                  className={`hover:bg-slate-50 transition ${
                    selectedFreezingId === r.freezingId ? 'bg-emerald-50' : ''
                  }`}
                >
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => applyRecord(r)}
                      className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                    >
                      Select
                    </button>
                  </td>
                  <td className="px-2 py-2 font-mono font-bold text-blue-700">{r.freezingId}</td>
                  <td className="px-2 py-2 text-slate-600">{r.cycSSID}</td>
                  <td className="px-2 py-2">{r.vol}</td>
                  <td className="px-2 py-2">{r.sperms}</td>
                  <td className="px-2 py-2">{r.motility}</td>
                  <td className="px-2 py-2 font-bold text-emerald-700">{r.progMotility}</td>
                  <td className="px-2 py-2">{r.grade1}</td>
                  <td className="px-2 py-2">{r.grade2}</td>
                  <td className="px-2 py-2">{r.grade3}</td>
                  <td className="px-2 py-2">{r.grade4}</td>
                  <td className="px-2 py-2">{r.wbc}</td>
                  <td className="px-2 py-2">{r.rbc}</td>
                  <td className="px-2 py-2">{r.epithCell}</td>
                  <td className="px-2 py-2">{r.roundCell}</td>
                  <td className="px-2 py-2 font-mono text-[11px]">{r.location}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{r.frozenDate}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{r.thawDate}</td>
                  <td className="px-2 py-2 font-mono">{r.thawId}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{r.discardDate}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{r.validTill}</td>
                  <td className="px-2 py-2 font-mono">{r.husbandAadhar}</td>
                  <td className="px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => void handleDeleteRecord(r)}
                      className="text-rose-600 font-bold hover:underline"
                    >
                      Delete
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
