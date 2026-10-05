'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usePatient } from '@/contexts/patient-context';
import { useAuth } from '@/contexts/auth-context';
import { usePatientIds } from '@/components/clinical/clinical-shared';
import { useAppDispatch } from '@/store/hooks';
import { setShowPatientModal } from '@/store/slices/uiSlice';
import { ApiError, apiFetch } from '@/lib/api';
import { loadOocyteEmbryoOverview } from '@/lib/services/oocyte-embryo';
import { BT_EXPANSION_OPTIONS, BT_ICM_OPTIONS, BT_TE_OPTIONS, ET_ACTION_OPTIONS } from '@/lib/services/iui';
import { readRetrievalSnapshot, type CycleRetrievalSnapshot } from '@/lib/cycle-snapshot';
import type { EtEmbryoRow, LabSource, OocyteItem, PatientCycleOption, SourceSummary } from '@/lib/types/oocyte-embryo';
import { CryoLocationModal } from '@/components/cryo-location-modal';
import {
  fetchSelfFrozenOocytes,
  updateSingleOocyteLocation,
  type SelfFrozenOocyte,
} from '@/lib/services/self-oocyte';

export type OocyteEmbryoTab =
  | 'oocytes'
  | 'fertilization'
  | 'embryo-culture'
  | 'embryo-transfer'
  | 'blastocyst-transfer'
  | 'cryopreservation'
  | 'thaw'
  | 'embryo-disposition';

const INITIAL_OOCYTES: OocyteItem[] = [
  {
    id: '1',
    oocyteId: 'OO-26-001201',
    collectionDateTime: '18-Aug-2026 09:20',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-01',
    day3Grade: '8-Cell Grade A',
    day5Grade: '4AA',
    transferStatus: 'Transferred',
  },
  {
    id: '2',
    oocyteId: 'OO-26-001202',
    collectionDateTime: '18-Aug-2026 09:21',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-02',
    day3Grade: '8-Cell Grade A',
    day5Grade: '4AA',
    transferStatus: 'Transferred',
  },
  {
    id: '3',
    oocyteId: 'OO-26-001203',
    collectionDateTime: '18-Aug-2026 09:22',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-03',
    day3Grade: '6-Cell Grade B',
    day5Grade: '3AB',
    cryoStrawNo: 'STR-26-001',
    transferStatus: 'Cryopreserved',
  },
  {
    id: '4',
    oocyteId: 'OO-26-001204',
    collectionDateTime: '18-Aug-2026 09:22',
    maturity: 'MI',
    morphologyGrade: '-',
    linkedSpermId: '-',
    status: 'Immature',
    fertilizationResult: '0PN',
    transferStatus: 'Culturing',
  },
  {
    id: '5',
    oocyteId: 'OO-26-001205',
    collectionDateTime: '18-Aug-2026 09:23',
    maturity: 'GV',
    morphologyGrade: '-',
    linkedSpermId: '-',
    status: 'Immature',
    fertilizationResult: '0PN',
    transferStatus: 'Culturing',
  },
  {
    id: '6',
    oocyteId: 'OO-26-001206',
    collectionDateTime: '18-Aug-2026 09:24',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-04',
    day3Grade: '8-Cell Grade A',
    day5Grade: '3BA',
    cryoStrawNo: 'STR-26-002',
    transferStatus: 'Cryopreserved',
  },
  {
    id: '7',
    oocyteId: 'OO-26-001207',
    collectionDateTime: '18-Aug-2026 09:25',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-05',
    day3Grade: '7-Cell Grade B',
    day5Grade: '3BB',
    cryoStrawNo: 'STR-26-003',
    transferStatus: 'Cryopreserved',
  },
  {
    id: '8',
    oocyteId: 'OO-26-001208',
    collectionDateTime: '18-Aug-2026 09:26',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-06',
    day3Grade: '8-Cell Grade A',
    day5Grade: '4BB',
    transferStatus: 'Culturing',
  },
  {
    id: '9',
    oocyteId: 'OO-26-001209',
    collectionDateTime: '18-Aug-2026 09:27',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-07',
    day3Grade: '6-Cell Grade B',
    day5Grade: 'Early Blast',
    transferStatus: 'Culturing',
  },
  {
    id: '10',
    oocyteId: 'OO-26-001210',
    collectionDateTime: '18-Aug-2026 09:28',
    maturity: 'MII',
    morphologyGrade: 'A',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Fertilized',
    fertilizationResult: '2PN',
    embryoId: 'EMB-26-08',
    day3Grade: '8-Cell Grade A',
    day5Grade: 'Morula',
    transferStatus: 'Culturing',
  },
  {
    id: '11',
    oocyteId: 'OO-26-001211',
    collectionDateTime: '18-Aug-2026 09:29',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Retrieved',
    transferStatus: 'Culturing',
  },
  {
    id: '12',
    oocyteId: 'OO-26-001212',
    collectionDateTime: '18-Aug-2026 09:30',
    maturity: 'MII',
    morphologyGrade: 'B',
    linkedSpermId: 'SEM-26-00018472',
    status: 'Retrieved',
    transferStatus: 'Culturing',
  },
];

const EMPTY_SUMMARY: SourceSummary = {
  source: 'IVF',
  hasRecord: false,
  recordId: '',
  cycleId: '',
  cycleDate: '',
  retrieved: 0,
  matureMII: 0,
  immature: 0,
  degenerated: 0,
  fertilized2PN: 0,
  abnormalPn: 0,
  unfertilized: 0,
  cleavage: 0,
  blastocyst: 0,
  cryopreserved: 0,
  transferred: 0,
  stuck: 0,
  discard: 0,
  donated: 0,
  donatedForResearch: 0,
};

const SMART_ACTIONS = ET_ACTION_OPTIONS.filter((item) => item.id !== 0);

type LabView = LabSource | 'BOTH';

function overlayAllotment(summary: SourceSummary, allotted: number): SourceSummary {
  if (allotted <= 0) return summary;
  return {
    ...summary,
    allotted,
    retrieved: summary.retrieved > 0 ? summary.retrieved : allotted,
  };
}

function generateOocytesFromSummary(
  summary: SourceSummary,
  cycleDate: string,
  cycleId: string,
  embryos: EtEmbryoRow[] = [],
  labSource: LabSource = 'IVF',
  offset = 0
): OocyteItem[] {
  const m2Count = summary.matureMII || 0;
  const gvCount = summary.gv ?? 0;
  const m1Count = summary.metaI ?? Math.max(0, (summary.immature || 0) - gvCount);
  const degCount = summary.degenerated || 0;
  const total = summary.retrieved || (m2Count + m1Count + gvCount + degCount);

  if (total === 0) return [];

  const list: OocyteItem[] = [];
  const yearSuffix = cycleDate && !isNaN(new Date(cycleDate).getTime())
    ? new Date(cycleDate).getFullYear().toString().slice(-2)
    : '26';
  const cleanCycle = (cycleId || '41').replace(/\D/g, '').padStart(2, '0');
  const sourceCode = labSource === 'ICSI' ? 'IC' : 'IV';
  const idPrefix = `OO-${yearSuffix}-${cleanCycle}${sourceCode}`;

  const cDate = cycleDate || '29-Aug-2026';
  let idx = offset + 1;

  // 1. Mature (MII)
  for (let i = 0; i < m2Count; i++) {
    const embryoMatch = embryos[i];
    const isFertilized = i < (summary.fertilized2PN || 0);
    const idStr = String(i + 1).padStart(2, '0');
    list.push({
      id: String(idx),
      oocyteId: `${idPrefix}-${idStr}`,
      collectionDateTime: `${cDate} 09:${String(20 + (i % 40)).padStart(2, '0')}`,
      maturity: 'MII',
      morphologyGrade: i % 3 === 0 ? 'A' : 'B',
      linkedSpermId: 'SEM-26-00018472',
      status: isFertilized ? 'Fertilized' : 'Retrieved',
      fertilizationResult: isFertilized ? '2PN' : '0PN',
      embryoId: embryoMatch ? embryoMatch.id : isFertilized ? `EMB-${yearSuffix}-${cleanCycle}-${idStr}` : undefined,
      day3Grade: embryoMatch?.grade || (isFertilized ? (i % 2 === 0 ? '8-Cell Grade A' : '6-Cell Grade B') : undefined),
      day5Grade: i === 0 || i === 1 ? '4AA' : i === 2 ? '3AB' : i === 5 ? '3BA' : i === 6 ? '3BB' : undefined,
      cryoStrawNo: embryoMatch?.action === 2 ? (embryoMatch.location || `STR-26-00${i + 1}`) : (i === 2 || i === 5 ? `STR-26-00${i}` : undefined),
      transferStatus: embryoMatch?.action === 1 ? 'Transferred' : embryoMatch?.action === 2 ? 'Cryopreserved' : (i < (summary.transferred || 0) ? 'Transferred' : (i < ((summary.transferred || 0) + (summary.cryopreserved || 0)) ? 'Cryopreserved' : 'Culturing')),
    });
    idx++;
  }

  // 2. Metaphase I (MI)
  for (let i = 0; i < m1Count; i++) {
    const idStr = String(m2Count + i + 1).padStart(2, '0');
    list.push({
      id: String(idx),
      oocyteId: `${idPrefix}-${idStr}`,
      collectionDateTime: `${cDate} 09:${String(20 + ((m2Count + i) % 40)).padStart(2, '0')}`,
      maturity: 'MI',
      morphologyGrade: '-',
      linkedSpermId: '-',
      status: 'Immature',
      fertilizationResult: '0PN',
      transferStatus: 'Culturing',
    });
    idx++;
  }

  // 3. Germinal Vesicle (GV)
  for (let i = 0; i < gvCount; i++) {
    const idStr = String(m2Count + m1Count + i + 1).padStart(2, '0');
    list.push({
      id: String(idx),
      oocyteId: `${idPrefix}-${idStr}`,
      collectionDateTime: `${cDate} 09:${String(20 + ((m2Count + m1Count + i) % 40)).padStart(2, '0')}`,
      maturity: 'GV',
      morphologyGrade: '-',
      linkedSpermId: '-',
      status: 'Immature',
      fertilizationResult: '0PN',
      transferStatus: 'Culturing',
    });
    idx++;
  }

  // 4. Degenerated
  for (let i = 0; i < degCount; i++) {
    const idStr = String(m2Count + m1Count + gvCount + i + 1).padStart(2, '0');
    list.push({
      id: String(idx),
      oocyteId: `${idPrefix}-${idStr}`,
      collectionDateTime: `${cDate} 09:${String(20 + ((m2Count + m1Count + gvCount + i) % 40)).padStart(2, '0')}`,
      maturity: 'Degenerated',
      morphologyGrade: '-',
      linkedSpermId: '-',
      status: 'Degenerated',
      transferStatus: 'Discarded',
    });
    idx++;
  }

  return list;
}

export function OocyteEmbryoClient() {
  const dispatch = useAppDispatch();
  const { selectedPatient } = usePatient();
  const { user, token } = useAuth();
  const { patId, satId, ready } = usePatientIds();

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<OocyteEmbryoTab>('oocytes');
  const [cryoType, setCryoType] = useState<'oocyte' | 'embryo'>('oocyte');
  const [frozenOocytes, setFrozenOocytes] = useState<SelfFrozenOocyte[]>([]);
  const [loadingFrozenOocytes, setLoadingFrozenOocytes] = useState(false);
  const [sourceTab, setSourceTab] = useState<LabSource>('IVF');
  const [oocytes, setOocytes] = useState<OocyteItem[]>(INITIAL_OOCYTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedOocyte, setSelectedOocyte] = useState<OocyteItem | null>(null);
  const [ivfSummary, setIvfSummary] = useState<SourceSummary>({ ...EMPTY_SUMMARY, source: 'IVF' });
  const [icsiSummary, setIcsiSummary] = useState<SourceSummary>({ ...EMPTY_SUMMARY, source: 'ICSI' });
  const [embryos, setEmbryos] = useState<EtEmbryoRow[]>([]);
  const [blastocysts, setBlastocysts] = useState<EtEmbryoRow[]>([]);
  const [cycleOptions, setCycleOptions] = useState<PatientCycleOption[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [summaryError, setSummaryError] = useState('');
  const [retrieval, setRetrieval] = useState<CycleRetrievalSnapshot | null>(null);
  const [labView, setLabView] = useState<LabView>('IVF');

  // Modals for Quick Actions
  const [showAddOocyteModal, setShowAddOocyteModal] = useState(false);
  const [showFertilizationModal, setShowFertilizationModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // New Oocyte Form State
  const [newMaturity, setNewMaturity] = useState<'MII' | 'MI' | 'GV'>('MII');
  const [newMorphology, setNewMorphology] = useState<'A' | 'B' | 'C'>('A');

  // Toast alert
  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // SMART Cryo Location Modal state for embryos / blastocysts / oocyte straws
  const [locModalRow, setLocModalRow] = useState<{
    module: 'et' | 'bt' | 'oocyte';
    id: string;
    source: string;
    location: string;
  } | null>(null);

  async function handleSaveLocation(finalLoc: string) {
    if (!locModalRow || !token) return;
    const rowId = Number(locModalRow.id);
    const mod = locModalRow.module;

    if (mod === 'oocyte') {
      setFrozenOocytes((prev) =>
        prev.map((o) => (String(o.oocyteId) === locModalRow.id ? { ...o, location: finalLoc } : o))
      );
      try {
        await updateSingleOocyteLocation(token, rowId, finalLoc);
        showToast(`Location ${finalLoc ? `"${finalLoc}"` : 'cleared'} saved for oocyte straw.`);
        loadFrozenOocytes();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to update oocyte location.');
      } finally {
        setLocModalRow(null);
      }
      return;
    }

    // Optimistically update table
    if (mod === 'et') {
      setEmbryos((prev) =>
        prev.map((e) =>
          e.id === locModalRow.id
            ? { ...e, location: finalLoc, action: e.action === 0 && finalLoc ? 2 : e.action }
            : e
        )
      );
    } else {
      setBlastocysts((prev) =>
        prev.map((b) =>
          b.id === locModalRow.id
            ? { ...b, location: finalLoc, action: b.action === 0 && finalLoc ? 2 : b.action }
            : b
        )
      );
    }

    try {
      await apiFetch(
        `/${mod}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            rowId: isNaN(rowId) ? 0 : rowId,
            location: finalLoc,
            action: 2, // Auto-set Freeze (2) in SMART when assigning cryo location
            patId,
            satId,
          }),
        },
        token
      );
      showToast(`Location ${finalLoc ? `"${finalLoc}"` : 'cleared'} saved for ${locModalRow.source} embryo.`);
      loadOverview(selectedCycleId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update location in database.');
    } finally {
      setLocModalRow(null);
    }
  }

  async function handleActionChange(mod: 'et' | 'bt', rowIdStr: string, newAction: number) {
    if (!token) return;
    const rowId = Number(rowIdStr);

    if (mod === 'et') {
      setEmbryos((prev) =>
        prev.map((e) => (e.id === rowIdStr ? { ...e, action: newAction } : e))
      );
    } else {
      setBlastocysts((prev) =>
        prev.map((b) => (b.id === rowIdStr ? { ...b, action: newAction } : b))
      );
    }

    try {
      await apiFetch(
        `/${mod}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            rowId: isNaN(rowId) ? 0 : rowId,
            action: newAction,
            patId,
            satId,
          }),
        },
        token
      );
      showToast(`Action updated.`);
      loadOverview(selectedCycleId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update action.');
    }
  }

  // Handle URL query parameter for tab & cryo type reactively
  const tabParam = searchParams?.get('tab');
  const typeParam = searchParams?.get('type');

  useEffect(() => {
    if (
      tabParam &&
      [
        'oocytes',
        'fertilization',
        'embryo-culture',
        'embryo-transfer',
        'blastocyst-transfer',
        'cryopreservation',
        'thaw',
        'embryo-disposition',
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam as OocyteEmbryoTab);
    }
    if (typeParam === 'oocyte' || typeParam === 'embryo') {
      setCryoType(typeParam);
    }
  }, [tabParam, typeParam]);

  const loadFrozenOocytes = useCallback(() => {
    if (!token || !patId) return;
    setLoadingFrozenOocytes(true);
    fetchSelfFrozenOocytes(token, patId, satId)
      .then((data) => setFrozenOocytes(data || []))
      .catch(() => setFrozenOocytes([]))
      .finally(() => setLoadingFrozenOocytes(false));
  }, [token, patId, satId]);

  useEffect(() => {
    loadFrozenOocytes();
  }, [loadFrozenOocytes]);

  const loadOverview = useCallback((cycleIdToLoad?: string) => {
    if (!token || !ready) return;
    setSummaryError('');
    const snapshot = readRetrievalSnapshot(undefined, patId);
    setRetrieval(snapshot);
    loadOocyteEmbryoOverview(token, patId, satId, cycleIdToLoad)
      .then((data) => {
        const ivf = overlayAllotment(data.ivf, snapshot?.ivfAllotted || 0);
        const icsi = overlayAllotment(data.icsi, snapshot?.icsiAllotted || 0);
        setIvfSummary(ivf);
        setIcsiSummary(icsi);
        setEmbryos(data.embryos || []);
        setBlastocysts(data.blastocysts || []);
        if (data.cycles && data.cycles.length > 0) {
          setCycleOptions(data.cycles);
        }
        if (data.selectedCycleId) {
          setSelectedCycleId(data.selectedCycleId);
        } else if (cycleIdToLoad) {
          setSelectedCycleId(cycleIdToLoad);
        }
        const bothAllotted = (snapshot?.ivfAllotted || 0) > 0 && (snapshot?.icsiAllotted || 0) > 0;
        if (bothAllotted) {
          setLabView('BOTH');
          setSourceTab('IVF');
        } else if (!data.ivf.hasRecord && (data.icsi.hasRecord || (snapshot?.icsiAllotted || 0) > 0)) {
          setLabView('ICSI');
          setSourceTab('ICSI');
        }
      })
      .catch((err) => {
        setSummaryError(err instanceof ApiError ? err.message : 'Could not load IVF/ICSI summary.');
      });
  }, [token, ready, patId, satId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Demographic details
  const patientId = selectedPatient?.uhid || (selectedPatient?.id ? `P-2026-00${selectedPatient.id}` : '');
  const patientName = selectedPatient?.name || '';
  const summary = sourceTab === 'ICSI' ? icsiSummary : ivfSummary;
  const bothLabs = labView === 'BOTH';
  const cycleId = selectedCycleId || summary.cycleId || retrieval?.cycleId || '';
  const cycleType = bothLabs ? 'IVF + ICSI' : sourceTab;
  const cycleDay = 16;
  const operator = user?.userName || 'Dr. Satish Sharma (EMB-01)';
  const sourceEmbryos = useMemo(
    () => embryos.filter((row) => row.source === sourceTab),
    [embryos, sourceTab]
  );
  const sourceBlastocysts = blastocysts.filter((row) => row.source === sourceTab);
  const displayBlastocysts = bothLabs ? blastocysts : sourceBlastocysts;

  // Dynamically synchronize oocyte list from actual cycle retrieval/lab summary
  useEffect(() => {
    if (labView === 'BOTH') {
      const ivfList = generateOocytesFromSummary(
        ivfSummary,
        ivfSummary.cycleDate || selectedCycleId,
        selectedCycleId || ivfSummary.cycleId,
        embryos.filter((r) => r.source === 'IVF'),
        'IVF'
      );
      const icsiList = generateOocytesFromSummary(
        icsiSummary,
        icsiSummary.cycleDate || selectedCycleId,
        selectedCycleId || icsiSummary.cycleId,
        embryos.filter((r) => r.source === 'ICSI'),
        'ICSI',
        ivfList.length
      );
      const combined = [...ivfList, ...icsiList];
      if (combined.length > 0) {
        setOocytes(combined);
      }
    } else {
      const activeSummary = sourceTab === 'ICSI' ? icsiSummary : ivfSummary;
      if (activeSummary && (activeSummary.retrieved > 0 || activeSummary.hasRecord)) {
        const generated = generateOocytesFromSummary(
          activeSummary,
          activeSummary.cycleDate || selectedCycleId,
          selectedCycleId || activeSummary.cycleId,
          sourceEmbryos,
          sourceTab
        );
        if (generated.length > 0) {
          setOocytes(generated);
        }
      }
    }
  }, [labView, sourceTab, ivfSummary, icsiSummary, selectedCycleId, sourceEmbryos, embryos]);

  const frozenEmbryosList = useMemo(() => {
    const list: Array<{
      id: string;
      module: 'et' | 'bt';
      stageLabel: string;
      source: string;
      gradeLabel: string;
      location: string;
      remark: string;
    }> = [];

    embryos.forEach((e) => {
      if (e.action === 2 || (e.location && e.location.trim().length > 0)) {
        list.push({
          id: e.id,
          module: 'et',
          stageLabel: e.celler ? `Day 3 (${e.celler})` : 'Day 3 Cleavage',
          source: e.source,
          gradeLabel: e.grade || '—',
          location: e.location || '',
          remark: e.remark || 'Vitrified Cleavage Embryo',
        });
      }
    });

    blastocysts.forEach((b) => {
      if (b.action === 2 || (b.location && b.location.trim().length > 0)) {
        list.push({
          id: b.id,
          module: 'bt',
          stageLabel: 'Day 5 Blastocyst',
          source: b.source,
          gradeLabel: [b.celler, b.grade, b.teGrade].filter(Boolean).join(' ') || '—',
          location: b.location || '',
          remark: b.remark || 'Vitrified Blastocyst',
        });
      }
    });

    return list;
  }, [embryos, blastocysts]);

  const retrievedCount = summary.retrieved;
  const matureCount = summary.matureMII;
  const immatureCount = summary.immature;
  const degeneratedCount = summary.degenerated;
  const fertilized2PN = summary.fertilized2PN;
  const cleavageCount = summary.cleavage;
  const blastocystCount = summary.blastocyst;
  const cryopreservedCount = summary.cryopreserved;
  const transferredCount = summary.transferred;

  // Add new oocyte handler
  function handleAddOocyte() {
    const nextNum = oocytes.length + 1;
    const padded = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    const newId = `OO-26-0012${padded}`;
    const newItem: OocyteItem = {
      id: String(Date.now()),
      oocyteId: newId,
      collectionDateTime: '18-Aug-2026 09:35',
      maturity: newMaturity,
      morphologyGrade: newMorphology,
      linkedSpermId: 'SEM-26-00018472',
      status: 'Retrieved',
      transferStatus: 'Culturing',
    };
    setOocytes((prev) => [...prev, newItem]);
    setShowAddOocyteModal(false);
    showToast(`Oocyte ${newId} logged successfully.`);
  }

  // Filtered oocytes table list
  const filteredOocytes = oocytes.filter((item) => {
    const matchesSearch =
      item.oocyteId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.linkedSpermId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!selectedPatient) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800 pb-16">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 text-3xl mb-4 border border-purple-100">
            👤
          </div>
          <h2 className="text-base font-bold text-slate-800">No Patient Selected</h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            Please select a patient from the database using the button below or the top navigation bar to view and manage Oocyte and Embryo records.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => dispatch(setShowPatientModal(true))}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6b46c1] hover:bg-[#5b37b0] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition"
            >
              <span>Select Patient</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl ring-1 ring-emerald-500/20 animate-in fade-in slide-in-from-top-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-xs font-bold text-slate-800">{toast}</span>
        </div>
      )}

      {/* TOP PATIENT / CYCLE HEADER BANNER */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-black text-sm">
              OC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">{patientName}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {patientId}
                </span>
                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 border border-purple-200/60">
                  {cycleType}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600">Cycle:</span>
                  {cycleOptions.length > 0 ? (
                    <select
                      value={selectedCycleId}
                      onChange={(e) => {
                        const next = e.target.value;
                        setSelectedCycleId(next);
                        loadOverview(next);
                      }}
                      className="rounded-lg border border-purple-200 bg-purple-50/70 px-2 py-0.5 font-mono text-[11px] font-bold text-purple-900 shadow-2xs hover:bg-purple-100/70 focus:border-purple-400 focus:outline-none"
                    >
                      {cycleOptions.map((c) => (
                        <option key={c.cycId} value={c.cycId}>
                          {c.label || c.cycId}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <strong className="text-slate-700 font-mono">{cycleId || '—'}</strong>
                  )}
                </div>
                {summary.cycleDate ? (
                  <>
                    <span className="text-slate-300">•</span>
                    <div>
                      Cycle date: <strong className="text-slate-700">{summary.cycleDate}</strong>
                    </div>
                  </>
                ) : null}
                <span className="text-slate-300">•</span>
                <div>
                  Operator: <strong className="text-slate-700">{operator}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-6 text-xs w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Cycle Day</span>
              <span className="font-bold text-slate-800 text-sm">Day {cycleDay}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Oocytes</span>
              <span className="font-bold text-purple-700 text-sm">{pairLabel(bothLabs, ivfSummary.retrieved, icsiSummary.retrieved, retrievedCount)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Fertilized (2PN)</span>
              <span className="font-bold text-emerald-600 text-sm">{pairLabel(bothLabs, ivfSummary.fertilized2PN, icsiSummary.fertilized2PN, fertilized2PN)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Transferred</span>
              <span className="font-bold text-slate-800 text-sm">{pairLabel(bothLabs, ivfSummary.transferred, icsiSummary.transferred, transferredCount)}</span>
            </div>
          </div>
        </div>

        {/* IVF / ICSI / IVF+ICSI SOURCE TABS & QUICK MODULE LAUNCHERS */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { id: 'IVF' as LabView, label: 'IVF', count: ivfSummary.retrieved },
              { id: 'ICSI' as LabView, label: 'ICSI', count: icsiSummary.retrieved },
              { id: 'BOTH' as LabView, label: 'IVF + ICSI', count: 0 },
            ]).map((tab) => {
              const active = labView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setLabView(tab.id);
                    if (tab.id !== 'BOTH') setSourceTab(tab.id);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${active ? 'bg-white/20' : 'bg-white text-purple-700'}`}>
                    {tab.id === 'BOTH' ? `${ivfSummary.retrieved} | ${icsiSummary.retrieved}` : tab.count}
                  </span>
                </button>
              );
            })}
            <span className="text-[11px] text-slate-500 ml-1">
              {labView === 'BOTH'
                ? 'IVF and ICSI stay in separate columns. The badge is IVF | ICSI.'
                : `Counts come from the ${sourceTab} screen`}
              {summary.hasRecord || (retrieval?.ivfAllotted || retrieval?.icsiAllotted) ? '' : ' — no saved record yet'}
            </span>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={selectedCycleId ? `/insemination?module=ivf&cycId=${encodeURIComponent(selectedCycleId)}` : '/insemination?module=ivf'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-purple-800 shadow-2xs hover:bg-purple-50 hover:border-purple-400 transition"
              title="Open IVF Insemination & Fertilization Entry"
            >
              <span>🔬</span>
              <span>Open IVF Entry</span>
              <span className="text-purple-400">→</span>
            </Link>
            <Link
              href={selectedCycleId ? `/insemination?module=icsi&cycId=${encodeURIComponent(selectedCycleId)}` : '/insemination?module=icsi'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-purple-800 shadow-2xs hover:bg-purple-50 hover:border-purple-400 transition"
              title="Open ICSI Insemination & Fertilization Entry"
            >
              <span>⚡</span>
              <span>Open ICSI Entry</span>
              <span className="text-purple-400">→</span>
            </Link>
            <Link
              href={selectedCycleId ? `/et?cycId=${encodeURIComponent(selectedCycleId)}` : '/et'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-purple-800 shadow-2xs hover:bg-purple-50 hover:border-purple-400 transition"
              title="Open Embryo Transfer (ET) Screen"
            >
              <span>🧫</span>
              <span>Open ET</span>
              <span className="text-purple-400">→</span>
            </Link>
            <Link
              href={selectedCycleId ? `/bt?cycId=${encodeURIComponent(selectedCycleId)}` : '/bt'}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-purple-800 shadow-2xs hover:bg-purple-50 hover:border-purple-400 transition"
              title="Open Blastocyst Transfer (BT) Screen"
            >
              <span>🧬</span>
              <span>Open BT</span>
              <span className="text-purple-400">→</span>
            </Link>
          </div>
        </div>
        {retrieval && (retrieval.ivfAllotted > 0 || retrieval.icsiAllotted > 0 || retrieval.sperm?.sampleId) ? (
          <p className="mt-2 text-[11px] text-slate-500">
            From Cycle Retrieval
            {retrieval.totalRetrieved ? ` · Total retrieved ${retrieval.totalRetrieved}` : ''}
            {retrieval.ivfAllotted ? ` · IVF allotted ${retrieval.ivfAllotted}` : ''}
            {retrieval.icsiAllotted ? ` · ICSI allotted ${retrieval.icsiAllotted}` : ''}
            {retrieval.sperm?.sampleLabel || retrieval.sperm?.sampleId
              ? ` · Sperm ${retrieval.sperm.sampleLabel || retrieval.sperm.sampleId}`
              : ''}
          </p>
        ) : null}

        {/* 7 MODULE TABS - Scrollable on mobile, wrapping on desktop */}
        <div className="mt-4 flex items-center gap-1.5 sm:gap-2 border-t border-slate-100 pt-3 overflow-x-auto touch-scroll no-scrollbar pb-1 flex-nowrap sm:flex-wrap">
          {[
            { id: 'oocytes', label: 'Oocytes' },
            { id: 'fertilization', label: 'Fertilization' },
            { id: 'embryo-culture', label: 'Embryo Culture' },
            { id: 'embryo-transfer', label: 'Embryo Transfer' },
            { id: 'blastocyst-transfer', label: 'Blastocyst Transfer' },
            { id: 'cryopreservation', label: 'Cryopreservation' },
            { id: 'thaw', label: 'Thaw' },
            { id: 'embryo-disposition', label: 'Embryo Disposition' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as OocyteEmbryoTab)}
                className={`shrink-0 rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-[#181d38] text-white shadow-sm scale-[1.01]'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUMMARY STAT METRICS CARDS */}
      {summaryError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{summaryError}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
        {/* OOCYTE SUMMARY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Oocyte Summary · {cycleType}
            </h3>
            <span className="text-[11px] font-semibold text-purple-600">
              {summary.cycleDate ? `Cycle ${summary.cycleDate}` : 'From IVF / ICSI screen'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-2.5">
              <span className="block text-[10px] font-bold text-purple-600 uppercase">Retrieved</span>
              <PairCount both={bothLabs} ivf={ivfSummary.retrieved} icsi={icsiSummary.retrieved} single={retrievedCount} />
            </div>
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase">Mature (MII)</span>
              <PairCount both={bothLabs} ivf={ivfSummary.matureMII} icsi={icsiSummary.matureMII} single={matureCount} />
            </div>
            <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-2.5">
              <span className="block text-[10px] font-bold text-amber-600 uppercase">Immature (GV/MI)</span>
              <PairCount both={bothLabs} ivf={ivfSummary.immature} icsi={icsiSummary.immature} single={immatureCount} />
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-2.5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase">Degenerated</span>
              <PairCount both={bothLabs} ivf={ivfSummary.degenerated} icsi={icsiSummary.degenerated} single={degeneratedCount} />
            </div>
          </div>
        </div>

        {/* EMBRYO SUMMARY */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Embryo Summary · {cycleType}
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600">
              2PN / cleaved from {sourceTab}; blastocyst &amp; freeze from ET Action
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5">
              <span className="block text-[10px] font-bold text-emerald-600 uppercase">Fertilized (2PN)</span>
              <PairCount both={bothLabs} ivf={ivfSummary.fertilized2PN} icsi={icsiSummary.fertilized2PN} single={fertilized2PN} />
            </div>
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-2.5">
              <span className="block text-[10px] font-bold text-blue-600 uppercase">Cleavage</span>
              <PairCount both={bothLabs} ivf={ivfSummary.cleavage} icsi={icsiSummary.cleavage} single={cleavageCount} />
            </div>
            <div className="rounded-xl bg-purple-50/60 border border-purple-100 p-2.5">
              <span className="block text-[10px] font-bold text-purple-600 uppercase">Blastocyst</span>
              <PairCount both={bothLabs} ivf={ivfSummary.blastocyst} icsi={icsiSummary.blastocyst} single={blastocystCount} />
            </div>
            <div className="rounded-xl bg-teal-50/60 border border-teal-100 p-2.5">
              <span className="block text-[10px] font-bold text-teal-600 uppercase">Cryopreserved</span>
              <PairCount both={bothLabs} ivf={ivfSummary.cryopreserved} icsi={icsiSummary.cryopreserved} single={cryopreservedCount} />
            </div>
          </div>
        </div>
      </div>

      <Main2PagesGrid view={labView} tab={activeTab} ivf={ivfSummary} icsi={icsiSummary} />

      {/* MAIN CONTENT AREA: TAB CONTENTS + QUICK ACTIONS SIDEBAR */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        
        {/* TAB CONTENTS (COL 9) */}
        <div className="lg:col-span-9 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          
          {/* TAB 1: OOCYTES LIST TABLE */}
          {activeTab === 'oocytes' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Oocyte List ({filteredOocytes.length})
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Search Oocyte ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-purple-500 w-44"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 rounded-xl border border-slate-200 px-2 text-xs outline-none focus:border-purple-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Fertilized">Fertilized</option>
                    <option value="Retrieved">Retrieved</option>
                    <option value="Immature">Immature</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Oocyte ID</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Collection Date / Time</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Maturity</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Grade</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Linked Sperm ID</th>
                      <th className="px-3.5 py-2.5 text-left font-bold uppercase">Status</th>
                      <th className="px-3.5 py-2.5 text-right font-bold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredOocytes.map((item) => (
                      <tr key={item.id} className="hover:bg-purple-50/30 transition">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-purple-700">
                          {item.oocyteId}
                        </td>
                        <td className="px-3.5 py-2.5 text-slate-600">{item.collectionDateTime}</td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              item.maturity === 'MII'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {item.maturity}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-700">{item.morphologyGrade}</td>
                        <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-600">
                          {item.linkedSpermId}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              item.status === 'Fertilized'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'Retrieved'
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOocyte(item)}
                            className="rounded-lg bg-slate-100 hover:bg-slate-200 p-1 text-slate-600 transition"
                            title="View Details"
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: FERTILIZATION */}
          {activeTab === 'fertilization' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Fertilization &amp; Pronuclear (2PN) Assessment (16-18h Post Insemination)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFertilizationModal(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white uppercase"
                >
                  + Record Fertilization
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-center">
                  <span className="text-[11px] text-emerald-800 font-medium">Normal Fertilization (2PN)</span>
                  <div className="text-2xl font-black text-emerald-950 mt-1">{fertilized2PN} / {matureCount || 0}</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    {matureCount ? `${((fertilized2PN / matureCount) * 100).toFixed(1)}% Fertilization Rate` : 'No MII oocytes'}
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-center">
                  <span className="text-[11px] text-amber-800 font-medium">Abnormal (1PN / 3PN)</span>
                  <div className="text-2xl font-black text-amber-950 mt-1">{summary.abnormalPn}</div>
                  <div className="text-[10px] text-amber-700 mt-0.5">From {sourceTab} fertilization grid</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                  <span className="text-[11px] text-slate-600 font-medium">Unfertilized (0PN)</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">{summary.unfertilized}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">From {sourceTab} fertilization grid</div>
                </div>
              </div>

              {/* Fertilization Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold uppercase">Oocyte ID</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Insemination Method</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Pronuclei (PN)</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Polar Bodies</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Result</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Embryo ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {oocytes.filter((o) => o.maturity === 'MII').map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-purple-700">{o.oocyteId}</td>
                        <td className="px-3 py-2 text-slate-700">{sourceTab}</td>
                        <td className="px-3 py-2 font-bold text-emerald-700">{o.fertilizationResult || '2PN'}</td>
                        <td className="px-3 py-2 text-slate-600">2 PB Extruded</td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 text-[10px]">
                            Normal 2PN
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-800">{o.embryoId || 'EMB-26-XX'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: EMBRYO CULTURE */}
          {activeTab === 'embryo-culture' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Embryo Morphokinetic Progression &amp; Blastocyst Grading (Day 1 - 6)
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold uppercase">Embryo ID</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Origin Oocyte</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Day 3 Cleavage</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Day 5 Blastocyst Grade</th>
                      <th className="px-3 py-2 text-left font-bold uppercase">Disposition Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {oocytes.filter((o) => o.embryoId).map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-bold text-purple-700">{e.embryoId}</td>
                        <td className="px-3 py-2 font-mono text-slate-600">{e.oocyteId}</td>
                        <td className="px-3 py-2 text-slate-800 font-semibold">{e.day3Grade || '8-Cell Grade A'}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-purple-50 border border-purple-200 px-2.5 py-0.5 font-black text-purple-800">
                            {e.day5Grade || '4AA'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 font-bold text-[10px]">
                            {e.transferStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: EMBRYO TRANSFER (ET) */}
          {activeTab === 'embryo-transfer' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      ET Entry · {sourceTab} embryos
                    </h3>
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                      {sourceEmbryos.length} Embryos
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Action list and Cryo Coordinates match SMART ET Entry
                  </span>
                </div>
                <Link
                  href={selectedCycleId ? `/et?cycId=${encodeURIComponent(selectedCycleId)}` : '/et'}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6345A6] hover:bg-[#52378c] px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                >
                  <span>Open Full Embryo Transfer (ET)</span>
                  <span>→</span>
                </Link>
              </div>

              {sourceEmbryos.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 px-6 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 text-xl mb-3">
                    🧫
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No {sourceTab} embryo rows recorded in ET yet</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    Add embryos, log catheter details, transfer notes, and assign cryo vitrification coordinates on the ET screen.
                  </p>
                  <div className="mt-4">
                    <Link
                      href={selectedCycleId ? `/et?cycId=${encodeURIComponent(selectedCycleId)}` : '/et'}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#6345A6] hover:bg-[#52378c] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                    >
                      <span>Go to Full Embryo Transfer (ET) Screen</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold uppercase">Source</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Celler</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Grade</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Action</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Location</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sourceEmbryos.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-bold text-slate-800">{row.source}</td>
                          <td className="px-3 py-2 text-slate-700">{row.celler || '—'}</td>
                          <td className="px-3 py-2 text-slate-700">{row.grade || '—'}</td>
                          <td className="px-3 py-2">
                            <select
                              value={row.action}
                              onChange={(e) => handleActionChange('et', row.id, Number(e.target.value))}
                              className="h-8 min-w-[150px] rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-purple-500"
                            >
                              {ET_ACTION_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            {row.location ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 font-mono text-[11px] font-bold text-purple-900 border border-purple-200">
                                  {row.location}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLocModalRow({
                                      module: 'et',
                                      id: row.id,
                                      source: row.source,
                                      location: row.location || '',
                                    })
                                  }
                                  className="rounded-md border border-purple-300 bg-white px-2 py-0.5 text-[11px] font-bold text-purple-700 hover:bg-purple-50 transition"
                                  title="Edit Cryo Location Coordinates"
                                >
                                  ✎
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setLocModalRow({
                                    module: 'et',
                                    id: row.id,
                                    source: row.source,
                                    location: '',
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-purple-300 bg-purple-50/60 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition"
                              >
                                <span>+ Set Location</span>
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.remark || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BLASTOCYST TRANSFER (BT) */}
          {activeTab === 'blastocyst-transfer' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      BT Entry · {bothLabs ? 'IVF and ICSI' : sourceTab} blastocysts
                    </h3>
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700">
                      {displayBlastocysts.length} Blastocysts
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Expansion grade, ICM, TE, and LN2 vitrification coordinates
                  </p>
                </div>
                <Link
                  href={selectedCycleId ? `/bt?cycId=${encodeURIComponent(selectedCycleId)}` : '/bt'}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#6345A6] hover:bg-[#52378c] px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                >
                  <span>Open Full Blastocyst Transfer (BT)</span>
                  <span>→</span>
                </Link>
              </div>

              {displayBlastocysts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 px-6 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 text-xl mb-3">
                    🧬
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">No {bothLabs ? 'IVF or ICSI' : sourceTab} blastocyst rows yet</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    Record blastocyst grades, transfer notes, recipient assignments, and vitrification locations on the BT screen.
                  </p>
                  <div className="mt-4">
                    <Link
                      href={selectedCycleId ? `/bt?cycId=${encodeURIComponent(selectedCycleId)}` : '/bt'}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#6345A6] hover:bg-[#52378c] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
                    >
                      <span>Go to Full Blastocyst Transfer (BT) Screen</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold uppercase">Source</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Expansion grade</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">ICM Grade</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">TE Grade</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Action</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Location</th>
                        <th className="px-3 py-2 text-left font-bold uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {displayBlastocysts.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-bold text-slate-800">{row.source}</td>
                          <td className="px-3 py-2 text-slate-700">{gradeLabel(BT_EXPANSION_OPTIONS, row.celler)}</td>
                          <td className="px-3 py-2 text-slate-700">{gradeLabel(BT_ICM_OPTIONS, row.grade)}</td>
                          <td className="px-3 py-2 text-slate-700">{row.teGrade ? gradeLabel(BT_TE_OPTIONS, row.teGrade) : '—'}</td>
                          <td className="px-3 py-2 text-slate-700">
                            <select
                              value={row.action}
                              onChange={(e) => handleActionChange('bt', row.id, Number(e.target.value))}
                              className="h-8 min-w-[140px] rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-purple-500"
                            >
                              {ET_ACTION_OPTIONS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name}
                                </option>
                              ))}
                            </select>
                            {row.recipient ? (
                              <span className="ml-1 text-[10px] text-purple-700 font-semibold block">
                                (Rec: {row.recipient})
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">
                            {row.location ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 font-mono text-[11px] font-bold text-purple-900 border border-purple-200">
                                  {row.location}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLocModalRow({
                                      module: 'bt',
                                      id: row.id,
                                      source: row.source,
                                      location: row.location || '',
                                    })
                                  }
                                  className="rounded-md border border-purple-300 bg-white px-2 py-0.5 text-[11px] font-bold text-purple-700 hover:bg-purple-50 transition"
                                  title="Edit Cryo Location Coordinates"
                                >
                                  ✎
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setLocModalRow({
                                    module: 'bt',
                                    id: row.id,
                                    source: row.source,
                                    location: '',
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-dashed border-purple-300 bg-purple-50/60 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 transition"
                              >
                                <span>+ Set Location</span>
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.remark || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CRYOPRESERVATION */}
          {activeTab === 'cryopreservation' && (
            <div className="space-y-4">
              {/* Header & Sub-Tab Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                      Cryopreservation &amp; LN₂ Vitrification
                    </h3>
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                      {cryoType === 'oocyte'
                        ? `${frozenOocytes.length} Vitrified Oocytes`
                        : `${frozenEmbryosList.length} Vitrified Embryos`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Storage coordinate format: Tank (CC), Canister (C), Goblet (GO), Visotube (VE/VI), Straw (ST)
                  </p>
                </div>

                {/* Sub-Tabs: Oocytes vs Embryos Toggle */}
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setCryoType('oocyte')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      cryoType === 'oocyte'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>🥚</span>
                    <span>Oocytes Cryopreservation</span>
                    <span
                      className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                        cryoType === 'oocyte' ? 'bg-white/20' : 'bg-white text-teal-800'
                      }`}
                    >
                      {frozenOocytes.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCryoType('embryo')}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      cryoType === 'embryo'
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>🧫</span>
                    <span>Embryos Cryopreservation</span>
                    <span
                      className={`rounded-md px-1.5 py-0.2 text-[10px] ${
                        cryoType === 'embryo' ? 'bg-white/20' : 'bg-white text-teal-800'
                      }`}
                    >
                      {frozenEmbryosList.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Quick links to Passbooks & Cryonavigation */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-teal-50/50 border border-teal-100 p-2.5 text-xs">
                <span className="text-[11px] text-teal-900 font-semibold">
                  Lab Passbooks &amp; Witness Verification:
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    href="/reports/passbook/oocytes-self"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:underline"
                  >
                    <span>📄 Frozen Oocytes Passbook</span>
                  </Link>
                  <span className="text-teal-300">•</span>
                  <Link
                    href="/reports/passbook/embryos-self"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:underline"
                  >
                    <span>📄 Embryos Passbook</span>
                  </Link>
                  <span className="text-teal-300">•</span>
                  <Link
                    href="/cryonavigation"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 hover:underline"
                  >
                    <span>🧭 Cryonavigation (Scan Straw)</span>
                  </Link>
                </div>
              </div>

              {/* OOCYTES CRYOPRESERVATION VIEW */}
              {cryoType === 'oocyte' && (
                <div className="space-y-3">
                  {frozenOocytes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 px-6 py-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700 text-xl mb-3">
                        ❄️
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No vitrified oocyte records in LN₂ storage</h4>
                      <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                        Retrieved unfertilized oocytes can be vitrified and assigned LN₂ straw storage coordinates for social freezing or delayed ICSI cycles.
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <Link
                          href="/cycle/entry"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                        >
                          <span>Go to Cycle Retrieval</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left font-bold uppercase">Straw Location</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Maturity</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Retrieval Cycle</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Freeze Date</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Embryologist</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Storage Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {frozenOocytes.map((o) => (
                            <tr key={o.oocyteId} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-1 font-mono text-[11px] font-bold text-teal-900 border border-teal-200">
                                    {o.location || '—'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLocModalRow({
                                        module: 'oocyte',
                                        id: String(o.oocyteId),
                                        source: o.source,
                                        location: o.location || '',
                                      })
                                    }
                                    className="rounded-md border border-teal-300 bg-white px-2 py-0.5 text-[11px] font-bold text-teal-700 hover:bg-teal-50 transition"
                                    title="Edit Cryo Location Coordinates"
                                  >
                                    ✎
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2 font-bold text-slate-800">
                                <span
                                  className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                    o.source === 'Metaphase II'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {o.source}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-700">{o.cycleId || '—'}</td>
                              <td className="px-3 py-2 text-slate-600">{o.dateOfCreation || '—'}</td>
                              <td className="px-3 py-2 text-slate-600">{o.procDoneBy || '—'}</td>
                              <td className="px-3 py-2">
                                {o.inUse ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    <span>🔥</span>
                                    <span>Thawed ({o.thawCycleId || 'Used'})</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                                    <span>❄️</span>
                                    <span>In LN₂ Storage</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* EMBRYOS CRYOPRESERVATION VIEW */}
              {cryoType === 'embryo' && (
                <div className="space-y-3">
                  {frozenEmbryosList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/40 px-6 py-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700 text-xl mb-3">
                        🧬
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">No embryos cryopreserved for this cycle yet</h4>
                      <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                        Cleavage embryos (Day 3) and Blastocysts (Day 5) can be cryopreserved on the Embryo Transfer (ET) or Blastocyst Transfer (BT) tabs by selecting &ldquo;Freeze&rdquo; action and assigning storage coordinates.
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab('embryo-transfer')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-white px-4 py-2 text-xs font-bold text-purple-800 shadow-2xs hover:bg-purple-50 transition"
                        >
                          <span>🧫 Go to Embryo Transfer (ET)</span>
                          <span>→</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('blastocyst-transfer')}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-purple-300 bg-white px-4 py-2 text-xs font-bold text-purple-800 shadow-2xs hover:bg-purple-50 transition"
                        >
                          <span>🧬 Go to Blastocyst Transfer (BT)</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left font-bold uppercase">LN₂ Location</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Stage</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Source</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Grade</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Action</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Remark</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {frozenEmbryosList.map((emb) => (
                            <tr key={`${emb.module}-${emb.id}`} className="hover:bg-slate-50">
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 font-mono text-[11px] font-bold text-purple-900 border border-purple-200">
                                    {emb.location || '—'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLocModalRow({
                                        module: emb.module,
                                        id: emb.id,
                                        source: emb.source,
                                        location: emb.location || '',
                                      })
                                    }
                                    className="rounded-md border border-purple-300 bg-white px-2 py-0.5 text-[11px] font-bold text-purple-700 hover:bg-purple-50 transition"
                                    title="Edit Cryo Location Coordinates"
                                  >
                                    ✎
                                  </button>
                                </div>
                              </td>
                              <td className="px-3 py-2 font-bold text-slate-800">{emb.stageLabel}</td>
                              <td className="px-3 py-2 font-bold text-purple-700">{emb.source}</td>
                              <td className="px-3 py-2 text-slate-700 font-medium">{emb.gradeLabel}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-800">
                                  <span>❄️</span>
                                  <span>Freeze (Vitrified)</span>
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">{emb.remark}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: THAW */}
          {activeTab === 'thaw' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Warming &amp; Thawing Protocol
              </h3>
              <p className="text-slate-500 leading-relaxed">
                No thaw events currently pending for active fresh cycle C-2026-00158. Thawing can be scheduled for subsequent Frozen Embryo Transfer (FET).
              </p>
              <button
                type="button"
                onClick={() => showToast('Initiated Thaw Protocol request for FET')}
                className="rounded-xl bg-[#181d38] px-4 py-2 text-xs font-bold text-white uppercase"
              >
                Schedule Thaw Event
              </button>
            </div>
          )}

          {/* TAB 7: DISPOSITION */}
          {activeTab === 'embryo-disposition' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Embryo Disposition &amp; Discard Audit Log
              </h3>
              <p className="text-slate-500 leading-relaxed">
                All disposals require dual-embryologist witnessing, photographic documentation, and signed patient consent according to ART Act guidelines.
              </p>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-slate-600">
                0 Embryos Discarded. All viable embryos successfully transferred or cryopreserved.
              </div>
            </div>
          )}

        </div>

        {/* QUICK ACTIONS SIDEBAR (COL 3) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2.5">
            SMART ET Actions
          </h3>
          <p className="text-[11px] text-slate-500">Same Action list as SMART ET Entry. Counts are for {sourceTab}.</p>

          <div className="space-y-2">
            {SMART_ACTIONS.map((action) => {
              const count =
                action.id === 1
                  ? summary.transferred
                  : action.id === 2
                    ? summary.cryopreserved
                    : action.id === 3
                      ? summary.stuck
                      : action.id === 4
                        ? summary.blastocyst
                        : action.id === 5
                          ? summary.discard
                          : action.id === 6
                            ? summary.donated
                            : summary.donatedForResearch;
              return (
                <div
                  key={action.id}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800"
                >
                  <span>{action.name}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODAL: ADD OOCYTE */}
      {showAddOocyteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Add Retrieved Oocyte</h3>
              <button
                type="button"
                onClick={() => setShowAddOocyteModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Maturity Status</label>
                <select
                  value={newMaturity}
                  onChange={(e) => setNewMaturity(e.target.value as 'MII' | 'MI' | 'GV')}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 outline-none"
                >
                  <option value="MII">MII (Mature with 1st Polar Body)</option>
                  <option value="MI">MI (Intermediate, No Polar Body)</option>
                  <option value="GV">GV (Germinal Vesicle, Immature)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Morphology Grade</label>
                <select
                  value={newMorphology}
                  onChange={(e) => setNewMorphology(e.target.value as 'A' | 'B' | 'C')}
                  className="h-9 w-full rounded-xl border border-slate-200 px-3 outline-none"
                >
                  <option value="A">Grade A (Optimal Ooplasm, Clear Zona)</option>
                  <option value="B">Grade B (Mild Inclusions / Granularity)</option>
                  <option value="C">Grade C (Moderate Inclusions / Dark Zona)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddOocyteModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddOocyte}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white uppercase"
              >
                Save Oocyte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD FERTILIZATION */}
      {showFertilizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Record Fertilization (2PN)</h3>
              <button
                type="button"
                onClick={() => setShowFertilizationModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Confirm 2PN check across all 10 mature (MII) oocytes injected with sperm SEM-26-00018472.
            </p>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              ✓ 8 of 10 confirmed 2PN with 2 clear polar bodies.<br />
              ✓ 2 unfertilized (0PN) retained for observation.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFertilizationModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFertilizationModal(false);
                  showToast('Pronuclear 2PN assessment logged and verified.');
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white uppercase"
              >
                Confirm 2PN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: FREEZE (CRYO) */}
      {showFreezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Vitrify Embryos</h3>
              <button
                type="button"
                onClick={() => setShowFreezeModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Vitrify remaining blastocysts (EMB-26-03, EMB-26-04, EMB-26-05) into Cryotop straws.
            </p>
            <div className="rounded-xl bg-teal-50 border border-teal-200 p-3 text-xs text-teal-800">
              Storage Target: <strong>Tank 1 &gt; Canister 3 &gt; Goblet Green</strong>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowFreezeModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFreezeModal(false);
                  showToast('Embryos vitrified and assigned straw IDs STR-26-001..003');
                }}
                className="rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2 text-xs font-bold text-white uppercase"
              >
                Commit to Cryo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRANSFER (ET) */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">Record Embryo Transfer</h3>
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Transfer 2 Top-Grade Day 5 Blastocysts (EMB-26-01 &amp; EMB-26-02).
            </p>
            <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-xs text-purple-800">
              Physician: <strong>Dr. Sanjay Kumar Pagare</strong><br />
              Catheter: <strong>Cook Soft-Pass Echogenic</strong>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTransferModal(false);
                  showToast('Embryo Transfer (ET) completed and recorded.');
                }}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2 text-xs font-bold text-white uppercase"
              >
                Finalize Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: OOCYTE DETAILS */}
      {selectedOocyte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                Oocyte Details ({selectedOocyte.oocyteId})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOocyte(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Retrieval Time:</span>
                <strong className="text-slate-800">{selectedOocyte.collectionDateTime}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Maturity:</span>
                <strong className="text-purple-700">{selectedOocyte.maturity}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Morphology Grade:</span>
                <strong className="text-slate-800">{selectedOocyte.morphologyGrade}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Linked Sperm ID:</span>
                <strong className="font-mono text-slate-800">{selectedOocyte.linkedSpermId}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span>Fertilization Result:</span>
                <strong className="text-emerald-700">{selectedOocyte.fertilizationResult || 'Pending'}</strong>
              </div>
              {selectedOocyte.embryoId && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Embryo ID:</span>
                  <strong className="font-mono text-purple-700">{selectedOocyte.embryoId}</strong>
                </div>
              )}
              {selectedOocyte.day5Grade && (
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>Day 5 Grade:</span>
                  <strong className="font-bold text-purple-800">{selectedOocyte.day5Grade}</strong>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOocyte(null)}
                className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMART CRYO LOCATION COORDINATES MODAL */}
      <CryoLocationModal
        isOpen={locModalRow !== null}
        onClose={() => setLocModalRow(null)}
        title={
          locModalRow?.module === 'oocyte'
            ? 'Set Location · Vitrified Oocyte Straw'
            : `Set Location · ${locModalRow?.module?.toUpperCase()} Embryo`
        }
        subtitle={
          locModalRow?.module === 'oocyte'
            ? `Set LN₂ coordinates for ${locModalRow?.source || 'Oocyte'} straw`
            : `Set SMART Cryopreservation coordinates for ${locModalRow?.source || 'Embryo'}`
        }
        initialLocation={locModalRow?.location || ''}
        existingLocations={
          locModalRow?.module === 'oocyte'
            ? frozenOocytes.map((o) => o.location || '')
            : locModalRow?.module === 'et'
            ? embryos.map((e) => e.location || '')
            : blastocysts.map((b) => b.location || '')
        }
        onApply={handleSaveLocation}
      />

    </div>
  );
}

function metric(summary: SourceSummary, key: keyof SourceSummary) {
  const value = summary[key];
  return typeof value === 'number' ? value : 0;
}

function pairLabel(both: boolean, ivf: number, icsi: number, single: number) {
  return both ? `IVF ${ivf} · ICSI ${icsi}` : String(single);
}

function PairCount({ both, ivf, icsi, single }: { both: boolean; ivf: number; icsi: number; single: number }) {
  if (!both) return <span className="text-xl font-black">{single}</span>;
  return (
    <span className="mt-0.5 flex items-end justify-center gap-2 text-sm font-black leading-none">
      <span>
        <span className="mb-0.5 block text-[9px] font-bold opacity-70">IVF</span>
        {ivf}
      </span>
      <span className="pb-0.5 opacity-40">|</span>
      <span>
        <span className="mb-0.5 block text-[9px] font-bold opacity-70">ICSI</span>
        {icsi}
      </span>
    </span>
  );
}

function gradeLabel(options: { id: number; name: string }[], value: string | number | undefined) {
  const text = String(value ?? '').trim();
  if (!text) return '—';
  if (/^\d+$/.test(text)) return options.find((item) => item.id === Number(text))?.name || '—';
  return text;
}

const SPLIT_BY_TAB: Record<OocyteEmbryoTab, { label: string; key: keyof SourceSummary }[]> = {
  oocytes: [
    { label: 'Allotted', key: 'allotted' },
    { label: 'Total retrieved', key: 'retrieved' },
    { label: 'Mature MII', key: 'matureMII' },
    { label: 'Immature MI / GV', key: 'immature' },
    { label: 'Degenerated', key: 'degenerated' },
  ],
  fertilization: [
    { label: 'Mature MII inseminated', key: 'matureMII' },
    { label: '2PN', key: 'fertilized2PN' },
    { label: 'Abnormal PN', key: 'abnormalPn' },
    { label: 'Unfertilized', key: 'unfertilized' },
    { label: 'Stuck 2PN', key: 'stuck' },
  ],
  'embryo-culture': [
    { label: 'Embryo', key: 'cleavage' },
    { label: 'Blastocyst', key: 'blastocyst' },
  ],
  'embryo-transfer': [
    { label: 'Transferred', key: 'transferred' },
    { label: 'Frozen', key: 'cryopreserved' },
    { label: 'Stuck', key: 'stuck' },
    { label: 'Keep for blastocyst', key: 'blastocyst' },
    { label: 'Discarded', key: 'discard' },
    { label: 'Donated for research', key: 'donatedForResearch' },
  ],
  'blastocyst-transfer': [
    { label: 'Blastocyst', key: 'blastocyst' },
    { label: 'Transferred', key: 'transferred' },
    { label: 'Frozen', key: 'cryopreserved' },
    { label: 'Stuck', key: 'stuck' },
    { label: 'Discarded', key: 'discard' },
    { label: 'Donated for research', key: 'donatedForResearch' },
  ],
  cryopreservation: [
    { label: 'Frozen', key: 'cryopreserved' },
    { label: 'Blastocyst', key: 'blastocyst' },
  ],
  thaw: [{ label: 'Frozen available', key: 'cryopreserved' }],
  'embryo-disposition': [
    { label: 'Discarded', key: 'discard' },
    { label: 'Donated for research', key: 'donatedForResearch' },
  ],
};

function Main2PagesGrid({
  view,
  tab,
  ivf,
  icsi,
}: {
  view: LabView;
  tab: OocyteEmbryoTab;
  ivf: SourceSummary;
  icsi: SourceSummary;
}) {
  const showIvf = view === 'IVF' || view === 'BOTH';
  const showIcsi = view === 'ICSI' || view === 'BOTH';
  const rows = SPLIT_BY_TAB[tab];

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {tab === 'fertilization' ? 'Fertilization split' : tab === 'blastocyst-transfer' ? 'Blastocyst split' : 'Oocyte / Embryo split'} · {view === 'BOTH' ? 'IVF + ICSI' : view}
        </h3>
        <span className="text-[11px] text-slate-500">IVF and ICSI are shown in their own columns</span>
      </div>
      <table className="min-w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="px-3 py-2 font-semibold">Parameter</th>
            {showIvf ? <th className="px-3 py-2 text-center font-semibold">IVF</th> : null}
            {showIcsi ? <th className="px-3 py-2 text-center font-semibold">ICSI</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ivfValue = row.key === 'allotted' ? ivf.allotted || ivf.retrieved : metric(ivf, row.key);
            const icsiValue = row.key === 'allotted' ? icsi.allotted || icsi.retrieved : metric(icsi, row.key);
            return (
              <tr key={row.key} className="odd:bg-white even:bg-slate-50/70">
                <td className="px-3 py-2 font-semibold text-slate-700">{row.label}</td>
                {showIvf ? <td className="px-3 py-2 text-center font-black text-slate-900">{ivfValue}</td> : null}
                {showIcsi ? <td className="px-3 py-2 text-center font-black text-slate-900">{icsiValue}</td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
