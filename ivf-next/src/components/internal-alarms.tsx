'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ALARM_MASTER } from '@/lib/communication/alarms-master';
import type { AlarmEvent } from '@/lib/communication/alarm-types';
import {
  acknowledgeAlarmEvent,
  fetchAlarmEvents,
  raiseAlarmEvent,
} from '@/lib/services/alarms';

type SeverityFilter = 'All' | 'Critical' | 'Warning' | 'Informational';

function severityClass(severity: AlarmEvent['severity']): string {
  if (severity === 'Critical') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (severity === 'Warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

export function InternalAlarms() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const [filter, setFilter] = useState<SeverityFilter>('All');
  const [selected, setSelected] = useState<AlarmEvent | null>(null);
  const [showMaster, setShowMaster] = useState(false);
  const [raising, setRaising] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [testEventId, setTestEventId] = useState('FT-E01');

  const loadEvents = useCallback(async () => {
    try {
      const rows = await fetchAlarmEvents(token);
      if (rows.length) setEvents(rows);
    } catch {
      // keep last known list
    }
  }, [token]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const visible = useMemo(
    () => (filter === 'All' ? events : events.filter((row) => row.severity === filter)),
    [events, filter]
  );

  const openCritical = events.filter((row) => row.severity === 'Critical' && row.status === 'Open').length;
  const openWarnings = events.filter((row) => row.severity === 'Warning' && row.status === 'Open').length;
  const queued = events.filter((row) => row.status === 'Queued' || row.smartForwardStatus === 'queued').length;

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAcknowledge(id: string) {
    try {
      const updated = await acknowledgeAlarmEvent(token, id);
      setEvents((prev) => prev.map((row) => (row.id === id ? updated : row)));
      if (selected?.id === id) setSelected(updated);
      flash(`Alarm ${id} acknowledged.`);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not acknowledge alarm.');
    }
  }

  async function handleRaiseTest() {
    setRaising(true);
    try {
      const created = await raiseAlarmEvent(token, {
        eventId: testEventId,
        source: 'Communication / Alarms',
        detail: `Manual test raise for ${testEventId} by ${user?.userName || 'operator'}.`,
        raisedBy: user?.userName || user?.userLoginName || 'Operator',
      });
      setEvents((prev) => [created, ...prev.filter((row) => row.id !== created.id)]);
      flash(`${created.eventId} logged and forwarded per alarm master.`);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not raise alarm.');
    } finally {
      setRaising(false);
    }
  }

  return (
    <div className="space-y-5 text-slate-800">
      {toast && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 uppercase">Internal Alarms</h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Fertitrace raises the event. SMART IVF applies SMS / WhatsApp / Email rules from the alarm master.
            External messages go only to the duty number, not the patient.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowMaster((v) => !v)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {showMaster ? 'Hide master' : 'View 50-event master'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-rose-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Open critical</div>
          <div className="mt-1 text-2xl font-bold text-rose-600">{openCritical}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Open warnings</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{openWarnings}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">SMART retry queue</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{queued}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-medium text-slate-600">
            Test raise
            <select
              value={testEventId}
              onChange={(e) => setTestEventId(e.target.value)}
              className="mt-1 block h-10 min-w-[280px] rounded-xl border border-slate-200 px-3 text-xs"
            >
              {ALARM_MASTER.map((row) => (
                <option key={row.eventId} value={row.eventId}>
                  {row.eventId} — {row.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={raising}
            onClick={() => void handleRaiseTest()}
            className="h-10 rounded-xl bg-[#e11d48] px-4 text-xs font-bold uppercase text-white disabled:opacity-60"
          >
            {raising ? 'Raising…' : 'Raise event'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['All', 'Critical', 'Warning', 'Informational'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === item ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Source / Sample</th>
              <th className="px-4 py-3">SMART</th>
              <th className="px-4 py-3">SMS / WA / Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 text-slate-600">{row.dateTime}</td>
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900">{row.eventId}</div>
                  <div className="text-slate-500">{row.title}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${severityClass(row.severity)}`}>
                    {row.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{row.source}</div>
                  <div className="font-mono text-[11px]">{row.sampleId || row.patientId || '—'}</div>
                </td>
                <td className="px-4 py-3 capitalize text-slate-700">{row.smartForwardStatus}</td>
                <td className="px-4 py-3 text-slate-600">
                  {row.externalSms ? 'SMS' : '—'} / {row.externalWhatsApp ? 'WA' : '—'} / {row.emailAudit ? 'Audit' : '—'}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">{row.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setSelected(row)} className="font-semibold text-[#6345A6]">
                      Details
                    </button>
                    {row.status !== 'Acknowledged' && (
                      <button type="button" onClick={() => void handleAcknowledge(row.id)} className="font-semibold text-slate-700">
                        Ack
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMaster && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Alarm</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">SMART</th>
                <th className="px-4 py-3">SMS</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Email / Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ALARM_MASTER.map((row) => (
                <tr key={row.eventId}>
                  <td className="px-4 py-2.5 font-mono font-bold">{row.eventId}</td>
                  <td className="px-4 py-2.5">{row.title}</td>
                  <td className="px-4 py-2.5">{row.severity}</td>
                  <td className="px-4 py-2.5">{row.forwardToSmart === 'retry_queue' ? 'Retry / queue' : 'Yes'}</td>
                  <td className="px-4 py-2.5">{row.externalSms ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2.5">{row.externalWhatsApp ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2.5">{row.emailAudit ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {selected.eventId} · {selected.id}
              </h3>
              <button type="button" onClick={() => setSelected(null)} className="text-slate-400">
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-700">
              <p>
                <strong>Title:</strong> {selected.title}
              </p>
              <p>
                <strong>Detail:</strong> {selected.detail}
              </p>
              <p>
                <strong>Source:</strong> {selected.source}
              </p>
              <p>
                <strong>Patient / sample:</strong> {selected.patientName || '—'} / {selected.sampleId || '—'}
              </p>
              <p>
                <strong>SMART forward:</strong> {selected.smartForwardStatus}
              </p>
              {selected.escalationNote && <p>{selected.escalationNote}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
