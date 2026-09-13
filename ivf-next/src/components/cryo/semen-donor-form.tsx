'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  deleteSemenDonor,
  getSemenDonor,
  listDonorLabs,
  listSemenDonors,
  saveSemenDonor,
  searchSemenDonorByAadhar,
  type SemenDonorDetail,
  type SemenDonorLab,
  type SemenDonorListRow,
} from '@/lib/services/semen-donor';

function todayInputDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function SemenDonorForm({ onBack }: { onBack?: () => void }) {
  const { token } = useAuth();
  const [donorIdSrNo, setDonorIdSrNo] = useState(0);
  const [donorId, setDonorId] = useState('');
  const [date, setDate] = useState(todayInputDate);
  const [donorLabId, setDonorLabId] = useState(0);
  const [qty, setQty] = useState('');
  const [countMl, setCountMl] = useState('');
  const [motility, setMotility] = useState('');
  const [progMotility, setProgMotility] = useState('');
  const [wbc, setWbc] = useState('');
  const [rbc, setRbc] = useState('');
  const [g1, setG1] = useState('0');
  const [g2, setG2] = useState('0');
  const [g3, setG3] = useState('0');
  const [g4, setG4] = useState('0');
  const [bloodGroup, setBloodGroup] = useState('');
  const [age, setAge] = useState('');
  const [healthLooks, setHealthLooks] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [facialFeature, setFacialFeature] = useState('');
  const [colorHair, setColorHair] = useState('');
  const [colorEyes, setColorEyes] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const [congenitalDef, setCongenitalDef] = useState('NO');
  const [geneticDisease, setGeneticDisease] = useState('NO');
  const [chronicIllness, setChronicIllness] = useState('NO');
  const [relativeDisease, setRelativeDisease] = useState('NO');
  const [familyDisease, setFamilyDisease] = useState('NO');
  const [habits, setHabits] = useState('NO');
  const [education, setEducation] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [workingStatus, setWorkingStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [bloodChem, setBloodChem] = useState('WNL');
  const [cbc, setCbc] = useState('WNL');
  const [urineAnalysis, setUrineAnalysis] = useState('WNL');
  const [karyotyping, setKaryotyping] = useState('Normal Chromosome Complements');
  const [hiv, setHiv] = useState('Negative');
  const [hbsag, setHbsag] = useState('Negative');
  const [vdrl, setVdrl] = useState('Negative');
  const [hcv, setHcv] = useState('Negative');
  const [thalassemia, setThalassemia] = useState('Negative');
  const [quarantinePeriod, setQuarantinePeriod] = useState('> 6 Months');
  const [aadhar, setAadhar] = useState('');
  const [location, setLocation] = useState('');
  const [thawId, setThawId] = useState('');
  const [searchAadhar, setSearchAadhar] = useState('');
  const [records, setRecords] = useState<SemenDonorListRow[]>([]);
  const [labs, setLabs] = useState<SemenDonorLab[]>([]);
  const [selectedSrNo, setSelectedSrNo] = useState(0);
  const [aadharLocked, setAadharLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const resetForm = useCallback((preserveScreening = false) => {
    setDonorIdSrNo(0);
    setSelectedSrNo(0);
    setDonorId('');
    setDate(todayInputDate());
    setDonorLabId(0);
    setQty('');
    setCountMl('');
    setMotility('');
    setProgMotility('');
    setWbc('');
    setRbc('');
    setG1('0');
    setG2('0');
    setG3('0');
    setG4('0');
    setBloodGroup('');
    setAge('');
    setHealthLooks('');
    setWeight('');
    setHeight('');
    setFacialFeature('');
    setColorHair('');
    setColorEyes('');
    setSkinTone('');
    setCongenitalDef('NO');
    setGeneticDisease('NO');
    setChronicIllness('NO');
    setRelativeDisease('NO');
    setFamilyDisease('NO');
    setHabits('NO');
    setEducation('');
    setMaritalStatus('');
    setWorkingStatus('');
    setRemarks('');
    if (!preserveScreening) {
      setBloodChem('WNL');
      setCbc('WNL');
      setUrineAnalysis('WNL');
      setKaryotyping('Normal Chromosome Complements');
      setHiv('Negative');
      setHbsag('Negative');
      setVdrl('Negative');
      setHcv('Negative');
      setThalassemia('Negative');
      setQuarantinePeriod('> 6 Months');
    }
    setAadhar('');
    setLocation('');
    setThawId('');
    setAadharLocked(false);
  }, []);

  const applyDetail = useCallback((detail: SemenDonorDetail) => {
    setDonorIdSrNo(detail.donorIdSrNo);
    setSelectedSrNo(detail.donorIdSrNo);
    setDonorId(detail.donorId);
    setDate(detail.date || todayInputDate());
    setDonorLabId(detail.donorLabId || 0);
    setQty(detail.semenQty);
    setCountMl(detail.semenCount);
    setMotility(detail.semenMotility);
    setProgMotility(detail.semenProgMotility);
    setWbc(detail.semenWbc);
    setRbc(detail.semenRbc);
    setG1(detail.grade1 || '0');
    setG2(detail.grade2 || '0');
    setG3(detail.grade3 || '0');
    setG4(detail.grade4 || '0');
    setBloodGroup(detail.bloodGroup);
    setAge(detail.age);
    setHealthLooks(detail.looks);
    setWeight(detail.weight);
    setHeight(detail.height);
    setFacialFeature(detail.facialFeature);
    setColorHair(detail.hairColor);
    setColorEyes(detail.eyesColor);
    setSkinTone(detail.skinTone);
    setCongenitalDef(detail.congenitalDeformities || 'NO');
    setGeneticDisease(detail.geneticallyAcquiredDisease || 'NO');
    setChronicIllness(detail.chronicIllness || 'NO');
    setRelativeDisease(detail.diseaseRelative || 'NO');
    setFamilyDisease(detail.diseaseFamily || 'NO');
    setHabits(detail.habits || 'NO');
    setEducation(detail.qualification);
    setMaritalStatus(detail.maritalStatus);
    setWorkingStatus(detail.workingStatus);
    setRemarks(detail.remarks);
    setBloodChem(detail.bloodChemistryPanel);
    setCbc(detail.cbc);
    setUrineAnalysis(detail.urinalysis);
    setKaryotyping(detail.karytyping);
    setHiv(detail.hiv);
    setHbsag(detail.hbsAg);
    setVdrl(detail.vdrl);
    setHcv(detail.hcv);
    setThalassemia(detail.thalesemia);
    setQuarantinePeriod(detail.quarantinedPeriod);
    setAadhar(detail.aadhar);
    setLocation(detail.location);
    setThawId(detail.thawId);
    setAadharLocked(true);
  }, []);

  const loadList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [rows, labRows] = await Promise.all([listSemenDonors(token), listDonorLabs(token)]);
      setRecords(rows);
      setLabs(labRows);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load donor semen records.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  async function handleSelect(srNo: number) {
    if (!token || !srNo) return;
    try {
      const detail = await getSemenDonor(token, srNo);
      applyDetail(detail);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load donor.');
    }
  }

  async function handleFind() {
    if (!token) return;
    if (!searchAadhar.trim()) {
      showToast('Enter Donor Aadhar to search.');
      return;
    }
    try {
      const detail = await searchSemenDonorByAadhar(token, searchAadhar.trim());
      if (!detail) {
        showToast('No donor found for this Aadhar.');
        return;
      }
      applyDetail(detail);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Search failed.');
    }
  }

  async function handleDelete(srNo: number) {
    if (!token || !srNo) return;
    try {
      const rows = await deleteSemenDonor(token, srNo);
      setRecords(rows);
      if (selectedSrNo === srNo) resetForm();
      showToast('Donor deleted.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!aadhar.trim()) {
      showToast('Enter Donor Aadhar first.');
      return;
    }
    if (!location.trim()) {
      showToast('Please enter Location.');
      return;
    }
    setSaving(true);
    try {
      const result = await saveSemenDonor(token, {
        donorIdSrNo,
        donorId,
        date,
        semenQty: qty,
        semenCount: countMl,
        semenMotility: motility,
        semenProgMotility: progMotility,
        grade1: g1,
        grade2: g2,
        grade3: g3,
        grade4: g4,
        semenWbc: wbc,
        semenRbc: rbc,
        bloodGroup,
        age,
        looks: healthLooks,
        weight,
        height,
        facialFeature,
        hairColor: colorHair,
        eyesColor: colorEyes,
        skinTone,
        congenitalDeformities: congenitalDef,
        geneticallyAcquiredDisease: geneticDisease,
        chronicIllness,
        diseaseRelative: relativeDisease,
        diseaseFamily: familyDisease,
        habits,
        qualification: education,
        maritalStatus,
        workingStatus,
        bloodChemistryPanel: bloodChem,
        cbc,
        urinalysis: urineAnalysis,
        karytyping: karyotyping,
        hiv,
        vdrl,
        hcv,
        thalesemia: thalassemia,
        quarantinedPeriod: quarantinePeriod,
        remarks,
        location,
        hbsAg: hbsag,
        donorLabId,
        aadhar: aadhar.trim(),
      });
      setRecords(result.list);
      if (result.detail) applyDetail(result.detail);
      showToast(result.message);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
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
            onClick={() => void handleFind()}
            className="h-7 rounded bg-[#1f5f38] hover:bg-emerald-800 px-2.5 text-[11px] font-bold text-white"
          >
            Find
          </button>
          {selectedSrNo > 0 && (
            <button
              type="button"
              onClick={() => resetForm(true)}
              className="h-7 rounded border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              New
            </button>
          )}
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
                value={donorLabId}
                onChange={(e) => setDonorLabId(Number(e.target.value))}
                className="h-7 w-full rounded border border-slate-300 px-2 text-xs font-semibold"
              >
                <option value={0}>Select Donor Lab</option>
                {labs.map((lab) => (
                  <option key={lab.id} value={lab.id}>
                    {lab.name}
                  </option>
                ))}
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
                readOnly={aadharLocked}
                title={aadharLocked ? 'Donor Aadhar cannot be changed once saved.' : undefined}
                className={`h-7 w-full rounded border border-slate-300 px-2 font-mono font-bold text-xs ${
                  aadharLocked ? 'bg-slate-100 text-slate-600' : ''
                }`}
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
                readOnly
                className="h-7 w-full rounded border border-slate-300 bg-slate-50 px-2 font-mono font-bold text-xs text-emerald-700"
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
              disabled={saving}
              className="rounded-lg bg-[#1f5f38] hover:bg-emerald-800 px-6 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-60"
            >
              {saving ? 'Saving…' : donorIdSrNo > 0 ? 'Update' : 'Submit'}
            </button>
          </div>
        </div>
      </form>

      <div className="rounded-xl border border-slate-300/80 bg-white shadow-xs overflow-hidden">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Donor Semen Master
          </h4>
          <span className="text-[11px] font-semibold text-slate-500">
            {loading ? 'Loading…' : `${records.length} record${records.length === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold">
              <tr>
                <th className="px-3 py-2 text-center">Select</th>
                <th className="px-3 py-2 text-left">Donor Id SrNo</th>
                <th className="px-3 py-2 text-left">Donor ID</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Thaw Id</th>
                <th className="px-3 py-2 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {records.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-amber-800">
                    No Records Found...
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr
                  key={r.donorIdSrNo}
                  className={`hover:bg-slate-50 transition ${
                    selectedSrNo === r.donorIdSrNo ? 'bg-emerald-50' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => void handleSelect(r.donorIdSrNo)}
                      className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                    >
                      Select
                    </button>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{r.donorIdSrNo}</td>
                  <td className="px-3 py-2 font-mono font-bold text-blue-800">{r.donorId}</td>
                  <td className="px-3 py-2 text-slate-600">{r.date}</td>
                  <td className="px-3 py-2 font-mono font-bold text-emerald-700">{r.thawId}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => void handleDelete(r.donorIdSrNo)}
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
