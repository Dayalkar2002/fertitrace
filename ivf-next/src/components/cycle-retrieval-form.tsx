'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { usePatient } from '@/contexts/patient-context';
import { CycleRetrievalPanels } from '@/components/cycle-retrieval-panels';
import { CYCLE_CREATION_STORAGE_KEY, getCycleTypeLabel } from '@/lib/cycle-utils';
import { ApiError } from '@/lib/api';
import {
  checkDonorAadhar,
  fetchRetrievalConfig,
  saveRetrieval,
} from '@/lib/services/cycles';
import type {
  CycleCreationResult,
  DonorAadharCheck,
  RetrievalConfig,
  RetrievalData,
  RetrievalRow,
} from '@/lib/types/cycle';
import {
  CycleHistoryTab,
  CycleMonitoringTab,
  CycleOutcomeTab,
  CycleSurvivalTab,
} from '@/components/cycle-tabs';

const emptySelfRow = (): RetrievalRow => ({
  leftOvary: null,
  rightOvary: null,
  ivf: null,
  icsi: null,
  gift: null,
  zift: null,
  damaged: null,
  total: null,
});

const emptyRecipientRow = (): RetrievalRow => ({
  leftOvary: null,
  rightOvary: null,
  ivf: null,
  icsi: null,
  total: null,
  recipientPatientId: null,
  recipientCycleId: '',
});

interface CycleRetrievalFormProps {
  cycleId: string;
}

export function CycleRetrievalForm({ cycleId }: CycleRetrievalFormProps) {
  const router = useRouter();
  const { token } = useAuth();
  const { selectedPatient } = usePatient();

  const [config, setConfig] = useState<RetrievalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const [activeTab, setActiveTab] = useState('retrieval');

  const [selfToSelf, setSelfToSelf] = useState<RetrievalRow[]>([emptySelfRow()]);
  const [donorToRecipient, setDonorToRecipient] = useState<RetrievalRow[]>([emptyRecipientRow()]);
  const [rowAadharChecks, setRowAadharChecks] = useState<Record<number, DonorAadharCheck>>({});
  const [lockedRecipientId, setLockedRecipientId] = useState<number | null>(null);
  const [fzoCycleId, setFzoCycleId] = useState('');
  const [fzoRecipientId, setFzoRecipientId] = useState(0);
  const retrievalPayloadRef = useRef<RetrievalData>({});

  const tabs = [
    { id: 'history', label: 'History' },
    { id: 'survival', label: 'Survival Report' },
    { id: 'monitoring', label: 'Monitoring Chart' },
    { id: 'retrieval', label: 'Retrieval' },
    { id: 'outcome', label: 'Outcome' },
  ];

  useEffect(() => {
    if (!token || !cycleId) return;
    setLoading(true);
    setError(null);
    void fetchRetrievalConfig(token, cycleId)
      .then((data) => {
        setConfig(data);
        const locked = data.lockedRecipients?.[0];
        if (locked) {
          setLockedRecipientId(locked.recipientId);
          setDonorToRecipient([
            { ...emptyRecipientRow(), recipientPatientId: locked.recipientId },
          ]);
        }
        if (data.existingRetrieval) {
          if (data.sections.showSelfToSelf && data.existingRetrieval.selfToSelf?.length) {
            setSelfToSelf(data.existingRetrieval.selfToSelf);
          }
          if (data.sections.showDonorToRecipient && data.existingRetrieval.donorToRecipient?.length) {
            setDonorToRecipient(data.existingRetrieval.donorToRecipient);
          }
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load retrieval config.'))
      .finally(() => setLoading(false));
  }, [token, cycleId]);

  function updateSelfRow(index: number, key: keyof RetrievalRow, value: string) {
    setSelfToSelf((rows) =>
      rows.map((row, i) =>
        i === index
          ? { ...row, [key]: value === '' ? null : key === 'recipientCycleId' ? value : Number(value) }
          : row
      )
    );
  }

  function updateRecipientRow(index: number, key: keyof RetrievalRow, value: string) {
    setDonorToRecipient((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row;
        if (key === 'recipientCycleId') return { ...row, recipientCycleId: value };
        if (key === 'recipientPatientId') return { ...row, recipientPatientId: value ? Number(value) : null };
        return { ...row, [key]: value === '' ? null : Number(value) };
      })
    );
  }

  function isRecipientLocked(recipientId: number): boolean {
    return lockedRecipientId !== null && recipientId !== lockedRecipientId;
  }

  async function onRecipientChange(rowIndex: number, recipientId: number) {
    if (!token || !config) return;

    if (!recipientId) {
      setRowAadharChecks((prev) => {
        const next = { ...prev };
        delete next[rowIndex];
        return next;
      });
      return;
    }

    const donorPatId = config.cycle.patientId;

    if (lockedRecipientId && recipientId !== lockedRecipientId) {
      setRowAadharChecks((prev) => ({
        ...prev,
        [rowIndex]: {
          donorAadhar: config.donorAadhar,
          recipientAadhar: '',
          message: 'This donor is already mapped to another recipient. Only the same recipient is allowed.',
          isAllowed: false,
        },
      }));
      return;
    }

    try {
      const check = await checkDonorAadhar(token, donorPatId, recipientId, cycleId);
      setRowAadharChecks((prev) => ({ ...prev, [rowIndex]: check }));
    } catch (err) {
      const dbUnavailable = err instanceof ApiError && err.status === 503;
      setRowAadharChecks((prev) => ({
        ...prev,
        [rowIndex]: {
          donorAadhar: config.donorAadhar,
          recipientAadhar: '',
          message: dbUnavailable ? '' : 'Unable to validate donor Aadhaar mapping.',
          isAllowed: dbUnavailable,
        },
      }));
    }
  }

  async function save() {
    if (!token || !config) return;
    setValidationError('');
    setError(null);
    setSuccess(null);

    const sections = { ...retrievalPayloadRef.current };
    if (config.sections.showSelfToSelf && !sections.selfToSelf) {
      sections.selfToSelf = selfToSelf;
    }
    if (config.sections.showDonorToRecipient) {
      const rows = sections.donorToRecipient || donorToRecipient;
      const recipientIds = rows.map((row) => Number(row.recipientPatientId)).filter((id) => id > 0);
      const uniqueRecipients = [...new Set(recipientIds)];
      if (uniqueRecipients.length > 1) {
        setValidationError(
          'As per government norms, one oocyte donor can donate to only one recipient. Please select the same recipient in all rows.'
        );
        return;
      }

      const invalidRow = Object.values(rowAadharChecks).find((check) => !check.isAllowed);
      if (invalidRow) {
        setValidationError(invalidRow.message);
        return;
      }

      sections.donorToRecipient = rows;
    }

    setSaving(true);
    try {
      const saved = await saveRetrieval(token, cycleId, sections, {
        patientId: selectedPatient?.id || config.cycle.patientId,
        satelliteId: selectedPatient?.satelliteId || config.cycle.satelliteId,
        cycleType: config.cycle.cycleType || config.cycle.oocyteSource,
        donorName: selectedPatient?.name,
      });
      if (saved.freeze?.fzoCycleId) {
        setFzoCycleId(saved.freeze.fzoCycleId);
        setFzoRecipientId(saved.freeze.recipientPatientId || 0);
        setSuccess(`Freeze oocytes saved on FZO cycle ${saved.freeze.fzoCycleId}. Assign location on Frozen Oocytes.`);
      } else {
        setSuccess('Retrieval data saved successfully.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save retrieval.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading retrieval configuration…</p>;
  }

  if (!config) {
    return <p className="text-sm text-red-600">{error ?? 'Retrieval configuration not available.'}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-base sm:text-lg font-bold text-slate-800">Cycle Retrieval Screen</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
          <span>
            <strong>CycID:</strong> {config.cycle.cycleId}
          </span>
          <span>
            <strong>Type:</strong> {getCycleTypeLabel(config.cycle.cycleType || config.cycle.oocyteSource)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold ${
              activeTab === tab.id
                ? 'border border-b-0 border-slate-200 bg-white text-brand-green'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'history' && <CycleHistoryTab cycleId={cycleId} />}
      {activeTab === 'survival' && <CycleSurvivalTab cycleId={cycleId} />}
      {activeTab === 'monitoring' && <CycleMonitoringTab cycleId={cycleId} />}
      {activeTab === 'outcome' && <CycleOutcomeTab cycleId={cycleId} />}
      {activeTab === 'retrieval' && (
        <div className="space-y-6">
          <CycleRetrievalPanels
            cycleType={config.cycle.oocyteSource || config.cycle.cycleType || 'Fresh'}
            semenSource={config.cycle.semenSource}
            cycleId={config.cycle.cycleId}
            patient={selectedPatient}
            monitoringSheet={config.cycle.monitoringSheet || readCreationMonitoringSheet()}
            fzoCycleId={fzoCycleId}
            fzoRecipientId={fzoRecipientId}
            onChange={(data) => {
              retrievalPayloadRef.current = data;
            }}
          />

          {validationError && <Alert type="error" message={validationError} />}
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Retrieval'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/cycle/entry')}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back to Cycle Retrieval
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  const styles =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}

function readCreationMonitoringSheet() {
  if (typeof window === 'undefined') return '';
  try {
    const raw = sessionStorage.getItem(CYCLE_CREATION_STORAGE_KEY);
    if (!raw) return '';
    const created = JSON.parse(raw) as CycleCreationResult;
    return created.monitoringSheet || '';
  } catch {
    return '';
  }
}
