'use client';

import React, { useState } from 'react';

export interface DonorRecord {
  srNo: number;
  donorId: string;
  donorLab: string;
  date: string;
  bloodGroup: string;
  thawId: string;
  count: string;
  motility: string;
  location: string;
  aadhar: string;
  quarantineStatus: string;
}

export function SemenDonorForm({ onBack }: { onBack?: () => void }) {
  // Donor Identification & Lab
  const [donorId, setDonorId] = useState('2026/012');
  const [date, setDate] = useState('2026-09-11');
  const [donorLab, setDonorLab] = useState('CryoLife Donor Registry');

  // Semen Wash Report (FSS)
  const [qty, setQty] = useState('0.5');
  const [countMl, setCountMl] = useState('80');
  const [motility, setMotility] = useState('70');
  const [progMotility, setProgMotility] = useState('60');
  const [wbc, setWbc] = useState('0-1');
  const [rbc, setRbc] = useState('0');
  const [g1, setG1] = useState('40');
  const [g2, setG2] = useState('20');
  const [g3, setG3] = useState('10');
  const [g4, setG4] = useState('0');

  // Donor Information
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [age, setAge] = useState('27');
  const [healthLooks, setHealthLooks] = useState('Good / Athletic');
  const [weight, setWeight] = useState('72');
  const [height, setHeight] = useState('175');

  // Facial Features
  const [facialFeature, setFacialFeature] = useState('Sharp / Oval');
  const [colorHair, setColorHair] = useState('Black');
  const [colorEyes, setColorEyes] = useState('Dark Brown');
  const [skinTone, setSkinTone] = useState('Wheatish Fair');

  // Health & Genetics History
  const [congenitalDef, setCongenitalDef] = useState('NO');
  const [geneticDisease, setGeneticDisease] = useState('NO');
  const [chronicIllness, setChronicIllness] = useState('NO');
  const [relativeDisease, setRelativeDisease] = useState('NO');
  const [familyDisease, setFamilyDisease] = useState('NO');
  const [habits, setHabits] = useState('Non-Smoker / Social');

  // Abilities
  const [education, setEducation] = useState('Post Graduate');
  const [maritalStatus, setMaritalStatus] = useState('Unmarried');
  const [workingStatus, setWorkingStatus] = useState('Employed / Professional');
  const [remarks, setRemarks] = useState('Physically fit, normozoospermic donor.');

  // Screening Investigations (Image 3)
  const [bloodChem, setBloodChem] = useState('WNL');
  const [cbc, setCbc] = useState('WNL');
  const [urineAnalysis, setUrineAnalysis] = useState('WNL');
  const [karyotyping, setKaryotyping] = useState('Normal Chromosome Complements (46, XY)');
  const [hiv, setHiv] = useState('Negative');
  const [hbsag, setHbsag] = useState('Negative');
  const [vdrl, setVdrl] = useState('Negative');
  const [hcv, setHcv] = useState('Negative');
  const [thalassemia, setThalassemia] = useState('Negative (Normal HbA2)');
  const [quarantinePeriod, setQuarantinePeriod] = useState('> 6 Months (Quarantine Cleared)');

  // Aadhar & Storage Location
  const [aadhar, setAadhar] = useState('7721 9904 1822');
  const [location, setLocation] = useState('Tank 2 > Canister 4 > Goblet A > Straw D-01-D-06');
  const [thawId, setThawId] = useState('THAW-26-000412');

  // Donor Search input
  const [searchAadhar, setSearchAadhar] = useState('');

  // Records list (Image 3)
  const [records, setRecords] = useState<DonorRecord[]>([
    {
      srNo: 1,
      donorId: '2026/001',
      donorLab: 'LifeCell ART Bank',
      date: '11/Aug/2026',
      bloodGroup: 'B+',
      thawId: 'THAW-26-000301',
      count: '85 M/ml',
      motility: '75%',
      location: 'Tank 2 > Canister 1',
      aadhar: '9921 4451 0021',
      quarantineStatus: 'Cleared',
    },
    {
      srNo: 2,
      donorId: '2026/002',
      donorLab: 'CryoLife Donor Registry',
      date: '11/Aug/2026',
      bloodGroup: 'O+',
      thawId: 'THAW-26-000302',
      count: '78 M/ml',
      motility: '70%',
      location: 'Tank 2 > Canister 2',
      aadhar: '9921 4451 0022',
      quarantineStatus: 'Cleared',
    },
    {
      srNo: 3,
      donorId: '2026/003',
      donorLab: 'Mumbai Andrology Bank',
      date: '11/Aug/2026',
      bloodGroup: 'A+',
      thawId: 'THAW-26-000303',
      count: '90 M/ml',
      motility: '80%',
      location: 'Tank 2 > Canister 3',
      aadhar: '9921 4451 0023',
      quarantineStatus: 'Cleared',
    },
  ]);

  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const newRec: DonorRecord = {
      srNo: records.length + 1,
      donorId,
      donorLab,
      date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      bloodGroup,
      thawId,
      count: `${countMl} M/ml`,
      motility: `${motility}%`,
      location,
      aadhar,
      quarantineStatus: 'Cleared',
    };
    setRecords([newRec, ...records]);
    showToast(`Donor ${donorId} registered successfully in cryo quarantine bank!`);
  }

  return (
    <div className="space-y-4 font-sans text-slate-800 text-xs">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-300 bg-white p-3.5 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
            ✓
          </span>
          <span className="text-xs font-bold text-slate-800">{toast}</span>
        </div>
      )}

      {/* Header Bar */}
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
              <span>🧬 Donor Semen Master &amp; Cryo Bank</span>
              <span className="rounded bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                Mandatory Frozen Quarantine (&gt; 6 Months)
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              ART Act 2022 / ICMR Registered Donor Banking with Full Screening, Serology &amp; Biometric Traceability
            </p>
          </div>
        </div>

        {/* Aadhar Quick Search */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-600">Donor Aadhar:</span>
          <input
            type="text"
            value={searchAadhar}
            onChange={(e) => setSearchAadhar(e.target.value)}
            placeholder="12-digit Aadhar"
            className="h-7 w-32 rounded border border-slate-300 px-2 text-[11px] font-mono"
          />
          <button
            type="button"
            onClick={() => showToast(`Searching donor registry for Aadhar: ${searchAadhar}`)}
            className="h-7 rounded bg-[#1f5f38] hover:bg-emerald-800 px-2.5 text-[11px] font-bold text-white"
          >
            Find
          </button>
        </div>
      </div>

      {/* MAIN FORM: DONOR SEMEN MASTER (Image 3 & 4) */}
      <form onSubmit={handleSave} className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
        <div className="bg-[#1f5f38] px-4 py-2 text-white flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Donor Semen Master Entry
          </h3>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-medium">
            Screening &amp; Cryo Inventory
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Top Identifier Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Donor ID *</label>
              <input
                type="text"
                value={donorId}
                onChange={(e) => setDonorId(e.target.value)}
                required
                className="h-7 w-full rounded border border-slate-300 px-2 font-mono font-bold text-xs text-blue-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Registration Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Select Donor Lab *</label>
              <select
                value={donorLab}
                onChange={(e) => setDonorLab(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs font-semibold"
              >
                <option>CryoLife Donor Registry</option>
                <option>LifeCell ART Bank</option>
                <option>Mumbai Andrology Bank</option>
                <option>ART Approved Donor Lab 01</option>
              </select>
            </div>
          </div>

          {/* 2-Column Grid matching Image 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-slate-200 pb-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Semen Wash Report (FSS) */}
              <div className="rounded-lg border border-amber-300/80 bg-amber-50/40 p-3 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1">
                  Semen Wash Report (FSS)
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Quantity (ml)</label>
                    <input
                      type="text"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Count (M/ml)</label>
                    <input
                      type="text"
                      value={countMl}
                      onChange={(e) => setCountMl(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Motility (%)</label>
                    <input
                      type="text"
                      value={motility}
                      onChange={(e) => setMotility(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">WBC / h.p.f.</label>
                    <input
                      type="text"
                      value={wbc}
                      onChange={(e) => setWbc(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">RBC / h.p.f.</label>
                    <input
                      type="text"
                      value={rbc}
                      onChange={(e) => setRbc(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Facial Feature */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  Facial Features
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Facial Feature</label>
                    <input
                      type="text"
                      value={facialFeature}
                      onChange={(e) => setFacialFeature(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Color Of Hair</label>
                    <input
                      type="text"
                      value={colorHair}
                      onChange={(e) => setColorHair(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Color Of Eyes</label>
                    <input
                      type="text"
                      value={colorEyes}
                      onChange={(e) => setColorEyes(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Skin Tone</label>
                    <input
                      type="text"
                      value={skinTone}
                      onChange={(e) => setSkinTone(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Donor Personal Abilities */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  Donors Personal Abilities &amp; Social
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Educational Qualification</label>
                    <input
                      type="text"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Marital Status</label>
                    <input
                      type="text"
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Current Working Status</label>
                    <input
                      type="text"
                      value={workingStatus}
                      onChange={(e) => setWorkingStatus(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Donor Information */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  Donor Demographics
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Blood Group</label>
                    <input
                      type="text"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs font-bold text-red-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Age, Years</label>
                    <input
                      type="text"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Health Looks</label>
                    <input
                      type="text"
                      value={healthLooks}
                      onChange={(e) => setHealthLooks(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Weight (Kgs)</label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 mb-0.5">Height (Cms)</label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="h-6 w-full rounded border border-slate-300 px-1.5 text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Health & Genetic History */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-1.5 text-[10px]">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                  Genetic &amp; Health History
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-0.5">
                    <span className="text-slate-600">Any Congenital Deformities:</span>
                    <input
                      type="text"
                      value={congenitalDef}
                      onChange={(e) => setCongenitalDef(e.target.value)}
                      className="h-5 w-14 rounded border border-slate-300 px-1 text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-0.5">
                    <span className="text-slate-600">Any Genetically Acquired Disease:</span>
                    <input
                      type="text"
                      value={geneticDisease}
                      onChange={(e) => setGeneticDisease(e.target.value)}
                      className="h-5 w-14 rounded border border-slate-300 px-1 text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-0.5">
                    <span className="text-slate-600">History of Any Chronic Illness:</span>
                    <input
                      type="text"
                      value={chronicIllness}
                      onChange={(e) => setChronicIllness(e.target.value)}
                      className="h-5 w-14 rounded border border-slate-300 px-1 text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-0.5">
                    <span className="text-slate-600">Serious Disease to Blood Relative:</span>
                    <input
                      type="text"
                      value={relativeDisease}
                      onChange={(e) => setRelativeDisease(e.target.value)}
                      className="h-5 w-14 rounded border border-slate-300 px-1 text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-0.5">
                    <span className="text-slate-600">Serious Disease to Family Member:</span>
                    <input
                      type="text"
                      value={familyDisease}
                      onChange={(e) => setFamilyDisease(e.target.value)}
                      className="h-5 w-14 rounded border border-slate-300 px-1 text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-0.5">
                    <span className="text-slate-600">Habits / Social History:</span>
                    <input
                      type="text"
                      value={habits}
                      onChange={(e) => setHabits(e.target.value)}
                      className="h-5 w-32 rounded border border-slate-300 px-1 text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[9px] text-slate-500 mb-0.5">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-7 w-full rounded border border-slate-300 px-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Screening Investigations Panel (Matching Image 3) */}
          <div className="rounded-lg border border-emerald-300/80 bg-emerald-50/40 p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                <span>🛡️ Mandatory ART Screening Investigations &amp; Serology</span>
              </h4>
              <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                100% Negative Certified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-[10px]">
              <div>
                <span className="block text-slate-500">Blood Chemistry Panel</span>
                <input
                  type="text"
                  value={bloodChem}
                  onChange={(e) => setBloodChem(e.target.value)}
                  className="h-6 w-full rounded border border-slate-300 px-1.5 font-bold text-emerald-800"
                />
              </div>
              <div>
                <span className="block text-slate-500">Complete Blood Count (CBC)</span>
                <input
                  type="text"
                  value={cbc}
                  onChange={(e) => setCbc(e.target.value)}
                  className="h-6 w-full rounded border border-slate-300 px-1.5 font-bold text-emerald-800"
                />
              </div>
              <div>
                <span className="block text-slate-500">Urine Analysis</span>
                <input
                  type="text"
                  value={urineAnalysis}
                  onChange={(e) => setUrineAnalysis(e.target.value)}
                  className="h-6 w-full rounded border border-slate-300 px-1.5 font-bold text-emerald-800"
                />
              </div>
              <div>
                <span className="block text-slate-500">HIV I &amp; II</span>
                <input
                  type="text"
                  value={hiv}
                  onChange={(e) => setHiv(e.target.value)}
                  className="h-6 w-full rounded border border-slate-300 px-1.5 font-bold text-emerald-800"
                />
              </div>
              <div>
                <span className="block text-slate-500">HBsAg</span>
                <input
                  type="text"
                  value={hbsag}
                  onChange={(e) => setHbsag(e.target.value)}
                  className="h-6 w-full rounded border border-slate-300 px-1.5 font-bold text-emerald-800"
                />
              </div>
              <div>
                <span className="block text-slate-500">VDRL</span>
                <input
                  type="text"
                  value={vdrl}
                  onChange={(e) => setVdrl(e.target.value)}
                  className="h-6 w-full rounded border border-slate-300 px-1.5 font-bold text-emerald-800"
                />
              </div>
              <div>
                <span className="block text-slate-500">HCV</span>
                <input
                  type="text"
                  value={hcv}
                  onChange={(e) => setHcv(e.target.value)}
                  className="h-6 w-full rounded border border-slate-300 px-1.5 font-bold text-emerald-800"
                />
              </div>
              <div>
                <span className="block text-slate-500">Thalassemia Trait</span>
                <input
                  type="text"
                  value={thalassemia}
                  onChange={(e) => setThalassemia(e.target.value)}
                  className="h-6 w-full rounded border border-slate-300 px-1.5 font-bold text-emerald-800"
                />
              </div>
              <div className="sm:col-span-2">
                <span className="block text-slate-500">Quarantined Period (ART Rule)</span>
                <input
                  type="text"
                  value={quarantinePeriod}
                  onChange={(e) => setQuarantinePeriod(e.target.value)}
                  className="h-6 w-full rounded border border-emerald-300 bg-emerald-50 px-1.5 font-bold text-emerald-900"
                />
              </div>
            </div>
          </div>

          {/* Cryo Location & Biometrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Donor Aadhar (12-Digit)</label>
              <input
                type="text"
                value={aadhar}
                onChange={(e) => setAadhar(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 font-mono font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Storage Location Coordinates</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 font-mono text-xs text-blue-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Assigned Thaw ID</label>
              <input
                type="text"
                value={thawId}
                onChange={(e) => setThawId(e.target.value)}
                className="h-7 w-full rounded border border-slate-300 px-2 font-mono font-bold text-xs text-emerald-700"
              />
            </div>
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
              Submit &amp; Quarantine Donor Straws
            </button>
          </div>
        </div>
      </form>

      {/* BOTTOM GRID: DONOR INVENTORY (Image 3) */}
      <div className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Donor Semen Master Bank Inventory
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">
            Available Vials: {records.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold">
              <tr>
                <th className="px-3 py-2 text-center">Select</th>
                <th className="px-3 py-2 text-left">Sr No</th>
                <th className="px-3 py-2 text-left">Donor ID</th>
                <th className="px-3 py-2 text-left">Donor Lab</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-center">Blood Group</th>
                <th className="px-3 py-2 text-left">Thaw ID</th>
                <th className="px-3 py-2 text-left">Quarantine</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {records.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => showToast(`Selected Donor ${r.donorId} for clinical cycle assignment`)}
                      className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                    >
                      Select
                    </button>
                  </td>
                  <td className="px-3 py-2 text-slate-400">{r.srNo}</td>
                  <td className="px-3 py-2 font-mono font-bold text-blue-800">{r.donorId}</td>
                  <td className="px-3 py-2 text-slate-600">{r.donorLab}</td>
                  <td className="px-3 py-2 text-slate-600">{r.date}</td>
                  <td className="px-3 py-2 text-center font-bold text-red-700">{r.bloodGroup}</td>
                  <td className="px-3 py-2 font-mono font-bold text-emerald-700">{r.thawId}</td>
                  <td className="px-3 py-2">
                    <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {r.quarantineStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center space-x-2">
                    <button
                      type="button"
                      onClick={() => showToast(`Dispatched straw barcode for Donor ${r.donorId}`)}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      Print Label
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecords(records.filter((item) => item.donorId !== r.donorId));
                        showToast(`Removed Donor ${r.donorId}`);
                      }}
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
